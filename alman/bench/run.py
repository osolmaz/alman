"""Run almanbench for a registry profile and export the standard artifacts.

The runner is deliberately thin: the registry (``models.yaml``) owns model
identity, Inspect owns execution (routing, concurrency, retries, logging),
and the exporter owns the stable artifact schema. Typical usage:

    uv run bench-run deepseek-v4-flash
    uv run bench-run kimi-k2.7-code --limit 3        # smoke test
    uv run bench-run glm-5.2 --tiers guards,curated  # tier subset

Artifacts land in ``<out>/<profile>/`` (default
``~/scratch/almanbench-runs/<date>/<profile>/``), Inspect logs in a ``logs``
subdirectory. If a run fails partway, resume it with::

    uv run bench-run <profile> --retry <log>.eval

which reloads the profile environment, re-registers the task, and retries
only the unfinished samples before exporting.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from alman.bench.registry import load_profile


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("profile", help="profile name from models.yaml")
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="output root (default ~/scratch/almanbench-runs/<date>)",
    )
    parser.add_argument("--limit", type=int, help="run only the first N samples")
    parser.add_argument("--tiers", help="comma-separated tier subset")
    parser.add_argument(
        "--retry",
        type=Path,
        help="resume a failed run from its .eval log (ignores --limit/--tiers)",
    )
    parser.add_argument(
        "--max-connections", type=int, help="override the profile's concurrency"
    )
    parser.add_argument(
        "--no-export",
        action="store_true",
        help="stop after the Inspect run (no artifacts)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="overwrite artifacts already present in the output directory",
    )
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be a positive sample count")

    profile = load_profile(args.profile)
    os.environ.update(profile.resolved_env())

    if not args.no_export:
        # Fail before any model call, not after a paid 1,025-sample run:
        # the exporter refuses dirty trees.
        from alman.bench.export import _scoring_revision

        _, dirty = _scoring_revision()
        if dirty:
            raise SystemExit(
                "the alman working tree is dirty; commit or stash before an "
                "official run (or pass --no-export)"
            )

    date = datetime.now(timezone.utc).strftime("%Y%m%d")
    out_root = args.out or Path.home() / "scratch" / "almanbench-runs" / date
    out_dir = out_root / profile.name
    log_dir = out_dir / "logs"
    samples_path = out_dir / f"{profile.name}.samples.jsonl"
    if samples_path.exists() and not args.force and not args.no_export:
        raise SystemExit(
            f"{samples_path} already exists; pass --force to overwrite or "
            "choose a different --out"
        )

    # Import inspect after the profile env is in place. Importing the task
    # and provider modules also registers them so fresh runs and retries can
    # resolve the benchmark's dependency-free HTTP adapters.
    from inspect_ai import eval_retry
    from inspect_ai import eval as inspect_eval

    import alman.bench.providers  # noqa: F401
    from alman.bench.task import alman_bench

    execution_ids: dict[str, str] = {}
    if args.retry:
        from inspect_ai.log import read_eval_log

        prior = read_eval_log(str(args.retry))
        if prior.eval.model != profile.model:
            raise SystemExit(
                f"log was run with model {prior.eval.model!r}, but profile "
                f"{profile.name!r} declares {profile.model!r}"
            )
        if not args.no_export:
            # The exporter will reject these conditions anyway; check them
            # before paying for the remaining samples.
            task_args = prior.eval.task_args
            if task_args.get("dataset") != "almanbench":
                raise SystemExit("retry log is not a dataset='almanbench' run")
            if task_args.get("bench_dir") is not None:
                raise SystemExit("retry log is a private-set run; no export")
            if task_args.get("include_spec", True) is not True:
                raise SystemExit("retry log was run without the spec")
            prior_config = prior.eval.model_generate_config
            for key, value in profile.generate.items():
                if getattr(prior_config, key, None) != value:
                    raise SystemExit(
                        f"retry log was generated with different {key}; "
                        f"profile {profile.name!r} declares {value!r}"
                    )
        # Samples completed in the prior attempt are carried over by
        # eval_retry; record which execution actually produced them.
        execution_ids = {
            str(sample.id): prior.eval.run_id
            for sample in prior.samples or []
            if sample.error is None and sample.output is not None
        }
        logs = eval_retry(
            str(args.retry),
            log_dir=str(log_dir),
            max_connections=args.max_connections or profile.max_connections,
        )
    else:
        task = alman_bench(dataset="almanbench", include_spec=True, tiers=args.tiers)
        logs = inspect_eval(
            task,
            model=profile.model,
            log_dir=str(log_dir),
            limit=args.limit,
            max_connections=args.max_connections or profile.max_connections,
            retry_on_error=3,
            **profile.generate,
        )
    log = logs[0]
    if log.status != "success":
        raise SystemExit(
            f"run ended with status {log.status!r}; resume with: "
            f"uv run bench-run {profile.name} --retry {log.location}"
        )
    if args.no_export:
        print(f"log: {log.location}")
        return

    from alman.bench.export import export_log

    aggregate = export_log(
        Path(log.location), profile, out_dir, execution_ids=execution_ids
    )
    print(
        json.dumps(
            {
                "model": aggregate["model"]["id"],
                "acceptance": aggregate["results"]["acceptance"],
                "compliance": aggregate["results"]["compliance"],
                "estimated_cost_usd": aggregate["results"]["estimated_cost_usd"],
            },
            indent=2,
        )
    )
    print(f"artifacts: {out_dir}")


if __name__ == "__main__":
    main()
