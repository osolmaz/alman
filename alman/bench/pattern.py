"""Compact pattern language for acceptance sets.

Benchmark targets often vary at independent points: every adnominal genitive
``der`` may also be rendered ``von die`` (spec rule on 'von die' for
possession), the adverbial superlative has a bare and an ``an`` variant, and
so on. Enumerating full target strings is exponential in the number of choice
points, so acceptance sets can instead be written as a single pattern:

    Die Buch {der|von die} Schüler liegt auf die Tisch.

Constructs:

- ``{a|b|c}`` -- alternation. The first branch is the canonical rendering.
- ``{g:a|b}`` -- named (linked) alternation. All groups sharing a name must
  resolve to the same branch index, expressing covariation, e.g. an
  apposition that must agree with the construction chosen for its head:
  ``die Name {g:Gotamas|von Gotama}, {g:der|die} Buddha``.
- ``[x]`` -- optional element; the canonical rendering omits it.
- ``{...}@1b`` -- rule annotation naming the spec rule that licenses the
  alternation. Documentation only; ignored during expansion.
- ``\\x`` -- escape a literal ``{``, ``}``, ``[``, ``]``, ``|``, ``@`` or
  backslash.

Groups may nest. ``expand_pattern`` returns every licensed variant,
canonical first (all first branches), deduplicated.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Iterator, Union

_NAME_RE = re.compile(r"([A-Za-z0-9_]+):")
_RULE_RE = re.compile(r"[A-Za-z0-9_]+")

MAX_VARIANTS = 10_000


class PatternError(ValueError):
    """Raised for malformed patterns or runaway expansions."""


@dataclass
class _Literal:
    text: str


@dataclass
class _Group:
    branches: list[list["_Node"]]
    name: str | None = None
    rule: str | None = None


_Node = Union[_Literal, _Group]


def _parse_seq(pattern: str, pos: int, terminators: str) -> tuple[list[_Node], int]:
    nodes: list[_Node] = []
    buf: list[str] = []

    def flush() -> None:
        if buf:
            nodes.append(_Literal("".join(buf)))
            buf.clear()

    while pos < len(pattern):
        ch = pattern[pos]
        if ch == "\\":
            if pos + 1 >= len(pattern):
                raise PatternError("dangling escape at end of pattern")
            buf.append(pattern[pos + 1])
            pos += 2
        elif ch in terminators:
            break
        elif ch == "{":
            flush()
            group, pos = _parse_group(pattern, pos)
            nodes.append(group)
        elif ch == "[":
            flush()
            inner, pos = _parse_seq(pattern, pos + 1, "]")
            if pos >= len(pattern):
                raise PatternError("unclosed '['")
            pos += 1
            nodes.append(_Group(branches=[[], inner]))
        elif ch in "}]|":
            raise PatternError(
                f"unexpected {ch!r} at position {pos}; escape it with a backslash"
            )
        else:
            buf.append(ch)
            pos += 1
    flush()
    return nodes, pos


def _parse_group(pattern: str, pos: int) -> tuple[_Group, int]:
    pos += 1  # consume "{"
    name = None
    match = _NAME_RE.match(pattern, pos)
    if match:
        name = match.group(1)
        pos = match.end()

    branches: list[list[_Node]] = []
    while True:
        seq, pos = _parse_seq(pattern, pos, "|}")
        branches.append(seq)
        if pos >= len(pattern):
            raise PatternError("unclosed '{'")
        if pattern[pos] == "|":
            pos += 1
        else:
            pos += 1  # consume "}"
            break

    rule = None
    if pos < len(pattern) and pattern[pos] == "@":
        match = _RULE_RE.match(pattern, pos + 1)
        if not match:
            raise PatternError(f"'@' at position {pos} must be followed by a rule id")
        rule = match.group(0)
        pos = match.end()

    return _Group(branches=branches, name=name, rule=rule), pos


def _check_linked_names(nodes: list[_Node], counts: dict[str, int]) -> None:
    for node in nodes:
        if isinstance(node, _Group):
            if node.name is not None:
                expected = counts.setdefault(node.name, len(node.branches))
                if expected != len(node.branches):
                    raise PatternError(
                        f"linked group {node.name!r} has {len(node.branches)} "
                        f"branches here but {expected} elsewhere"
                    )
            for branch in node.branches:
                _check_linked_names(branch, counts)


def _parse(pattern: str) -> list[_Node]:
    nodes, _ = _parse_seq(pattern, 0, "")
    _check_linked_names(nodes, {})
    return nodes


def _expand(
    nodes: list[_Node], assignment: dict[str, int]
) -> Iterator[tuple[str, dict[str, int]]]:
    """Yield (text, assignment) pairs, threading linked-group choices."""
    if not nodes:
        yield "", assignment
        return
    head, rest = nodes[0], nodes[1:]
    if isinstance(head, _Literal):
        for tail, final in _expand(rest, assignment):
            yield head.text + tail, final
        return

    if head.name is not None and head.name in assignment:
        indices = [assignment[head.name]]
    else:
        indices = list(range(len(head.branches)))
    for index in indices:
        bound = (
            {**assignment, head.name: index} if head.name is not None else assignment
        )
        for prefix, mid in _expand(head.branches[index], bound):
            for tail, final in _expand(rest, mid):
                yield prefix + tail, final


def expand_pattern(pattern: str, max_variants: int = MAX_VARIANTS) -> list[str]:
    """All variants the pattern licenses, canonical first, deduplicated."""
    nodes = _parse(pattern)
    variants: list[str] = []
    seen: set[str] = set()
    for text, _ in _expand(nodes, {}):
        if text in seen:
            continue
        seen.add(text)
        variants.append(text)
        if len(variants) > max_variants:
            raise PatternError(f"pattern expands to more than {max_variants} variants")
    return variants
