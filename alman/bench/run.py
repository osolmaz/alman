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
    args = parser.parse_args()
    if args.limit is not None and args.limit < 1:
        parser.error("--limit must be a positive sample count")

    profile = load_profile(args.profile)
    os.environ.update(profile.resolved_env())

    date = datetime.now(timezone.utc).strftime("%Y%m%d")
    out_root = args.out or Path.home() / "scratch" / "almanbench-runs" / date
    out_dir = out_root / profile.name
    log_dir = out_dir / "logs"

    # Import inspect after the profile env is in place. Importing the task
    # module also registers the task so retries can resolve it.
    from inspect_ai import eval_retry
    from inspect_ai import eval as inspect_eval

    from alman.bench.task import alman_bench

    if args.retry:
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

    aggregate = export_log(Path(log.location), profile, out_dir)
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
