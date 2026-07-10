"""Framework-independent scoring for Alman translations.

Two instruments, kept separate on purpose:

- :func:`is_accepted` checks a model output against an item's acceptance set
  (all renderings the spec permits) after light normalization.
- :func:`lint` flags Standard German surface forms that can never appear in
  well-formed Alman, regardless of the source sentence. It is intentionally
  conservative: only tokens that are unambiguously eliminated by the spec are
  listed, so a clean result is necessary but not sufficient for correctness.
  Notably ``einen``/``einem`` are *not* flagged (retained as oblique forms of
  the pronoun *man*, spec section on pronouns) and neither is ``derjenige``
  (retained as a genitive form, spec rule on genitive handling).
"""

from __future__ import annotations

import re
import unicodedata

_APOSTROPHES = str.maketrans({"\u2019": "'", "\u2018": "'", "\u02bc": "'"})
_WRAPPING_QUOTES = ('"', "\u201c", "\u201d", "\u201e", "`")


def normalize(text: str) -> str:
    """Normalize a translation for comparison.

    Handles unicode forms, typographic apostrophes, wrapping quotes,
    markdown emphasis, whitespace, and an optional trailing period.
    Case is preserved: it is meaningful in German (Sie/sie).
    """
    text = unicodedata.normalize("NFC", text).translate(_APOSTROPHES)
    text = text.replace("**", "").strip()
    while (
        len(text) > 1 and text[0] in _WRAPPING_QUOTES and text[-1] in _WRAPPING_QUOTES
    ):
        text = text[1:-1].strip()
    text = re.sub(r"\s+", " ", text)
    if text.endswith(".") and not text.endswith(".."):
        text = text[:-1]
    return text.strip()


def is_accepted(output: str, accepted: list[str]) -> bool:
    """True if the output matches any accepted rendering."""
    normalized = normalize(output)
    return any(normalized == normalize(a) for a in accepted)


def is_canonical(output: str, accepted: list[str]) -> bool:
    """True if the output matches the canonical (spec-preferred) rendering.

    The first entry of an item's acceptance set is always the rendering the
    spec lists first, which is its preferred form.
    """
    return normalize(output) == normalize(accepted[0])


_FORBIDDEN: dict[str, str] = {}

for _token in (
    "am im ins vom zum zur beim ans aufs fürs übers unters unterm überm "
    "vorm vors hinterm hinters durchs"
).split():
    _FORBIDDEN[_token] = "unresolved preposition-article contraction"

for _token in "den dem des dessen".split():
    _FORBIDDEN[_token] = "case-inflected definite article/demonstrative"

for _token in "eine einer eines".split():
    _FORBIDDEN[_token] = "inflected indefinite article"

for _token in "keine keinen keinem keiner keins keines".split():
    _FORBIDDEN[_token] = "inflected negative article"

# "meinen" is deliberately absent: it collides with the verb "meinen".
for _token in (
    "meine meinem meiner meines meins "
    "deine deinen deinem deiner deines deins "
    "seine seinen seinem seiner seines seins "
    "ihre ihren ihrem ihrer ihres "
    "unsere unseren unserem unserer unseres "
    "eure euren eurem eurer eures"
).split():
    _FORBIDDEN[_token] = "inflected possessive determiner"

for _token in (
    "dieser dieses diesen diesem "
    "jener jenes jenen jenem "
    "jeder jedes jeden jedem "
    "welcher welches welchen welchem "
    "mancher manches manchen manchem "
    "solcher solches solchen solchem "
    "derselbe dasselbe denselben demselben derselben desselben "
    "dasjenige denjenigen demjenigen derjenigen desjenigen"
).split():
    _FORBIDDEN[_token] = "case- or gender-inflected determiner"

_TOKEN_RE = re.compile(r"[A-Za-zÄÖÜäöüß]+")


def lint(text: str) -> list[str]:
    """Return violations of Alman surface-form invariants found in ``text``."""
    violations = []
    for match in _TOKEN_RE.finditer(text):
        token = match.group(0)
        reason = _FORBIDDEN.get(token.lower())
        if reason:
            violations.append(f"'{token}': {reason}")
    return violations
