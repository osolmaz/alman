"""Alman translation benchmark.

Evaluates models on curated sentences that do not appear in the spec and
scores output against per-item acceptance sets plus a compliance linter. The
package also extracts spec example pairs as fixtures for validation and
no-spec diagnostics; those pairs are not evaluated with the spec in context.

The Inspect AI task lives in :mod:`alman.bench.task`; the extraction and
scoring logic is framework-independent so it can be reused for training-data
filtering and regression tests.
"""

from alman.bench.dataset import BenchItem, load_curated_items, load_items
from alman.bench.pattern import PatternError, expand_pattern
from alman.bench.scoring import is_accepted, lint, normalize

__all__ = [
    "BenchItem",
    "load_items",
    "load_curated_items",
    "expand_pattern",
    "PatternError",
    "is_accepted",
    "lint",
    "normalize",
]
