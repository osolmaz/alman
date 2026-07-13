"""Compliance checks for Alman-language site content.

Every page published in the Alman language version must itself be
well-formed Alman: the text is run through the same surface-form linter
used by the benchmark (alman.bench.scoring.lint). German-language pages
are exempt, since Standard German legitimately contains the forms the
linter forbids.

Convention for mentions: when an Alman page cites Standard German forms
as objects of discussion (article tables, quoted examples), they must be
marked up as code spans or *italics*. Those spans are mentions rather
than uses and are stripped before linting.
"""

import re
from pathlib import Path

import pytest

from alman.bench.scoring import lint

REPO_ROOT = Path(__file__).resolve().parent.parent

# Locale-named files (about/al.md) and suffixed translations (<slug>.al.md).
ALMAN_PAGES = sorted(
    set((REPO_ROOT / "src" / "content").glob("**/al.md"))
    | set((REPO_ROOT / "src" / "content").glob("**/*.al.md"))
)

_CODE_SPAN = re.compile(r"`[^`\n]*`")
_BOLD_MARKS = re.compile(r"\*\*")
_ITALIC_SPAN = re.compile(r"\*[^*\n]+\*|\b_[^_\n]+_\b")
_LINK_TARGET = re.compile(r"\]\([^)\s]*\)")


def strip_mentions(text: str) -> str:
    """Remove spans that are not running Alman text.

    Code spans and italics mark quoted Standard German (mentions rather
    than uses), and markdown link targets are URLs. Bold is emphasis on
    running Alman text, so only its markers are removed and its contents
    stay subject to linting.
    """
    text = _CODE_SPAN.sub(" ", text)
    text = _LINK_TARGET.sub("]", text)
    text = _BOLD_MARKS.sub("", text)
    return _ITALIC_SPAN.sub(" ", text)


def test_alman_pages_exist():
    assert ALMAN_PAGES, "expected at least one Alman-language content file"


@pytest.mark.parametrize(
    "path", ALMAN_PAGES, ids=lambda p: str(p.relative_to(REPO_ROOT))
)
def test_alman_page_is_compliant(path: Path):
    violations = lint(strip_mentions(path.read_text(encoding="utf-8")))
    assert not violations, f"{path.name} violates Alman surface forms: {violations}"
