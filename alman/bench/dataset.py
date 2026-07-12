"""Extraction of benchmark items from the spec JSON files.

Each spec rule carries an ``examples`` array of ``{standard, alman}`` pairs.
These are authored for human readers, so a little parsing is needed to turn
them into scoreable items:

- Alternative renderings are separated by ``/`` at parenthesis depth zero
  (e.g. ``wegen der Wetter / wegen die Wetter``). On the Alman side these
  form the acceptance set; on the Standard German side each alternative
  becomes its own item.
- When both sides list the same number of alternatives they are paired by
  position (e.g. ``der Sessel (singular)/die Sessel (plural)`` maps to
  ``die Sessel (singular)/die Sessels (plural)``).
- Trailing parentheticals are annotations, not text. On the source side they
  are kept in the prompt as disambiguating context (``der Frau (Dative)``);
  on the target side they are stripped before comparison.

``overrides.json`` patches individual items where the spec's presentation
does not translate mechanically (e.g. paradigm listings such as
``dieser, diese, dieses, ... -> diese``).

Besides the spec-derived items there is a second, hand-curated tier under
``curated/``: full sentences (mostly literary German from Kafka and Hesse)
whose targets were re-derived under the current spec from the seed data in
the ``alman-research`` repo. These exercise many rules at once and carry
acceptance sets inline, so no override machinery is needed. An item states
its acceptance set either as an explicit ``accepted`` list or as a compact
``pattern`` (see :mod:`alman.bench.pattern`) that is expanded at load time;
in both representations the first/canonical rendering comes first.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from pydantic import BaseModel

from alman.bench.pattern import PatternError, expand_pattern

REPO_ROOT = Path(__file__).resolve().parents[2]
SPEC_DIR = REPO_ROOT / "spec"
OVERRIDES_PATH = Path(__file__).with_name("overrides.json")
CURATED_DIR = Path(__file__).with_name("curated")

_TRAILING_NOTE_RE = re.compile(r"\s*\(([^()]*)\)\s*$")


class BenchItem(BaseModel):
    """One scoreable translation item."""

    id: str
    source: str
    """Standard German input shown to the model (may include a parenthetical
    annotation that disambiguates case/number)."""
    accepted: list[str]
    """All Alman renderings that count as correct."""
    section: str
    paragraph: str
    rule: str
    note: str | None = None
    english: str | None = None
    provenance: str | None = None
    """Where the item came from, for curated (non-spec) items."""
    pattern: str | None = None
    """The compact pattern the acceptance set was expanded from, if any."""


def _split_variants(text: str) -> list[str]:
    """Split on ``/`` at parenthesis depth zero."""
    parts: list[str] = []
    current: list[str] = []
    depth = 0
    for ch in text:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == "/" and depth == 0:
            parts.append("".join(current))
            current = []
        else:
            current.append(ch)
    parts.append("".join(current))
    return [part.strip() for part in parts if part.strip()]


def _extract_trailing_note(text: str) -> tuple[str, str | None]:
    match = _TRAILING_NOTE_RE.search(text)
    if match and match.start() > 0:
        return text[: match.start()].strip(), match.group(1).strip()
    return text.strip(), None


def _load_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _example_to_items(
    example: dict, base_id: str, section: str, paragraph: str, rule: str
) -> list[BenchItem]:
    standard = example["standard"].replace("**", "").strip()
    alman = example["alman"].replace("**", "").strip()

    source_variants = _split_variants(standard)
    target_variants = [_extract_trailing_note(v)[0] for v in _split_variants(alman)]

    if len(source_variants) == 1:
        pairs = [(source_variants[0], target_variants)]
    elif len(target_variants) == 1:
        pairs = [(source, target_variants) for source in source_variants]
    elif len(source_variants) == len(target_variants):
        pairs = [
            (source, [target])
            for source, target in zip(source_variants, target_variants)
        ]
    else:
        raise ValueError(
            f"{base_id}: cannot align {len(source_variants)} source variants "
            f"with {len(target_variants)} target variants"
        )

    items = []
    for k, (source, accepted) in enumerate(pairs):
        item_id = base_id if len(pairs) == 1 else f"{base_id}.{k}"
        _, note = _extract_trailing_note(source)
        items.append(
            BenchItem(
                id=item_id,
                source=source,
                accepted=list(accepted),
                section=section,
                paragraph=paragraph,
                rule=rule,
                note=note,
                english=example.get("english"),
            )
        )
    return items


def _apply_overrides(items: list[BenchItem]) -> list[BenchItem]:
    overrides = _load_json(OVERRIDES_PATH) if OVERRIDES_PATH.exists() else {}
    unknown = set(overrides) - {item.id for item in items}
    if unknown:
        raise ValueError(
            f"overrides.json references unknown item ids: {sorted(unknown)}"
        )

    result = []
    for item in items:
        override = overrides.get(item.id, {})
        if override.get("skip"):
            continue
        item.accepted = item.accepted + [
            a for a in override.get("accept_also", []) if a not in item.accepted
        ]
        result.append(item)
    return result


def load_items(spec_dir: Path = SPEC_DIR) -> list[BenchItem]:
    """Load all spec-example fixtures in document order."""
    main = _load_json(spec_dir / "main.json")
    items: list[BenchItem] = []

    for section_ref in main["sections"]:
        section_id = section_ref["id"]
        section = _load_json(spec_dir / "sections" / section_id / "section.json")
        for para_ref in section.get("paragraphs", []):
            para_id = para_ref["id"]
            paragraph = _load_json(
                spec_dir
                / "sections"
                / section_id
                / "paragraphs"
                / para_id
                / "paragraph.json"
            )
            for rule in paragraph.get("rules", []):
                for index, example in enumerate(rule.get("examples", [])):
                    base_id = f"{section_id}/{para_id}/{rule['id']}/{index}"
                    items.extend(
                        _example_to_items(
                            example, base_id, section_id, para_id, rule["id"]
                        )
                    )

    return _apply_overrides(items)


def find_spec_example_overlaps(
    items: list[BenchItem], spec_dir: Path = SPEC_DIR
) -> list[BenchItem]:
    """Return curated items whose source/answer pair occurs in the specification."""
    spec_pairs = {
        (item.source, accepted)
        for item in load_items(spec_dir)
        for accepted in item.accepted
    }
    return [
        item
        for item in items
        if any((item.source, accepted) in spec_pairs for accepted in item.accepted)
    ]


def load_curated_items(
    curated_dir: Path = CURATED_DIR,
    *,
    exclude_spec_examples: bool = True,
    spec_dir: Path = SPEC_DIR,
) -> list[BenchItem]:
    """Load the hand-curated sentence-level items (tier 2 of the benchmark)."""
    items: list[BenchItem] = []
    for path in sorted(curated_dir.glob("*.json")):
        data = _load_json(path)
        collection = data["collection"]
        for index, entry in enumerate(data["items"]):
            item_id = f"curated/{collection}/{index}"
            if ("pattern" in entry) == ("accepted" in entry):
                raise ValueError(
                    f"{item_id}: provide exactly one of 'pattern' or 'accepted'"
                )
            if "pattern" in entry:
                try:
                    accepted = expand_pattern(entry["pattern"])
                except PatternError as err:
                    raise ValueError(f"{item_id}: {err}") from err
            else:
                accepted = list(entry["accepted"])
            items.append(
                BenchItem(
                    id=item_id,
                    source=entry["source"],
                    accepted=accepted,
                    section="curated",
                    paragraph=collection,
                    rule=entry.get("rule", "mixed"),
                    note=entry.get("note"),
                    provenance=data.get("provenance"),
                    pattern=entry.get("pattern"),
                )
            )
    if not exclude_spec_examples:
        return items
    overlaps = {item.id for item in find_spec_example_overlaps(items, spec_dir)}
    return [item for item in items if item.id not in overlaps]
