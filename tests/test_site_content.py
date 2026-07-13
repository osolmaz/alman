"""Compliance checks for Alman-language site content.

Every page published in the Alman language version must itself be
well-formed Alman: the text is run through the same surface-form linter
used by the benchmark (alman.bench.scoring.lint). German-language pages
are exempt, since Standard German legitimately contains the forms the
linter forbids.
"""

from pathlib import Path

import pytest

from alman.bench.scoring import lint

REPO_ROOT = Path(__file__).resolve().parent.parent

ALMAN_PAGES = sorted((REPO_ROOT / "src" / "content").glob("**/alman.md"))


def test_alman_pages_exist():
    assert ALMAN_PAGES, "expected at least one Alman-language content file"


@pytest.mark.parametrize(
    "path", ALMAN_PAGES, ids=lambda p: str(p.relative_to(REPO_ROOT))
)
def test_alman_page_is_compliant(path: Path):
    violations = lint(path.read_text(encoding="utf-8"))
    assert not violations, f"{path.name} violates Alman surface forms: {violations}"
