"""Alman translation benchmark.

Extracts the curated example pairs from the spec (the source of truth under
``spec/``) into benchmark items and scores model output against per-item
acceptance sets plus a spec-compliance linter.

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
