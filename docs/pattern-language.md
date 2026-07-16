# The acceptance-pattern language

Benchmark items score a model translation by exact match (after light
normalization) against an acceptance set, the list of every rendering the
spec licenses. Alman often licenses several renderings of one sentence, and
the choice points are independent: every adnominal genitive `der` may also
be rendered `von die`, every relativizer may be `das` or `die`, and so on.
Enumerating full strings is exponential in the number of choice points and
invites omissions, so hand-written acceptance sets are stored as a single
pattern instead. The expander lives in `alman/bench/pattern.py`
(`expand_pattern`), and this document is its reference.

## Where patterns are used

- Curated items (`alman/bench/curated/*.json`) may carry a `pattern` field
  instead of an `accepted` list. Exactly one of the two must be present.
  `load_curated_items` expands the pattern at load time; the first variant
  (all first branches) is the canonical rendering.
- The packaged almanbench tiers (`alman/bench/almanbench/*.jsonl`) do not
  use patterns. Their variants are generated mechanically by
  `alman-research/scripts/package_almanbench.py`, which detects choice
  sites in each reference and emits the cross-product of the licensed
  choices, and the packaged files store the enumerated `accepted` list.
  Never hand-edit those files; extend the generator and repackage.

## Syntax

A pattern is the canonical rendering with markup at each choice point.

### Alternation: `{a|b|c}`

Any one branch may appear. The first branch is the canonical rendering.

```
Die Buch {der|von die} Schüler liegt auf die Tisch.
```

expands to `Die Buch der Schüler ...` (canonical) and
`Die Buch von die Schüler ...`.

Every group multiplies the acceptance set independently. Two groups with
two branches each license four renderings, including the mixed ones. That
is deliberate: the spec licenses each choice on its own, so a rendering
that mixes `der` at one genitive and `von die` at another is correct.

### Linked groups: `{g:a|b}`

Groups sharing a name resolve to the same branch index, expressing
covariation. Use them when the spec ties two choices together, for example
an apposition that must agree with the construction chosen for its head:

```
die Name {g:Gotamas|von Gotama}, {g:der|die} Buddha
```

licenses `die Name Gotamas, der Buddha` and
`die Name von Gotama, die Buddha`, but not the mixed pairings. All groups
with the same name must have the same number of branches.

### Optional element: `[x]`

Shorthand for `{|x}`: the canonical rendering omits it.

```
die Sessel[s]
```

licenses `die Sessel` and `die Sessels` (the optional plural `-s`).

### Rule annotation: `{...}@1b`

Every alternation must name the spec rule that licenses it. The annotation
sits after the closing brace and is documentation only; expansion ignores
it.

```
wegen {der|die}@1b Wetter
```

Rule ids use the paragraph numbering of the spec (`1b`, `3c`, `6f`, ...).
If no rule licenses an alternative, the alternative does not go into the
pattern, however plausible it looks.

### Escapes

`\{`, `\}`, `\[`, `\]`, `\|`, `\@`, and `\\` produce the literal
character. Groups may nest (`{a {b|c}|d}` licenses `a b`, `a c`, `d`).

## Semantics

- Expansion returns every licensed variant, canonical first (all first
  branches), deduplicated.
- Expansion refuses to produce more than `MAX_VARIANTS` (10,000) variants;
  a pattern that large is a sign the item should be split.
- Malformed patterns (unclosed braces, stray `}`, `]` or `|`, dangling
  escapes, linked groups with mismatched branch counts, `@` without a rule
  id) raise `PatternError` at load time, so a bad pattern fails the test
  suite instead of silently narrowing or widening the acceptance set.

## Known choice-point families

These are the alternations the spec currently licenses and how they are
handled per tier. In curated items, write them as pattern groups with the
rule annotation. In the packaged tiers they are generated; never add them
by hand.

| Family | Choices | Spec rule |
| --- | --- | --- |
| Adnominal genitive | `der` / `von die` | 1d |
| Genitive after genitive prepositions | `der` / `die` | 1b |
| Relativizer | `das` / `die` | 6f |
| Standalone demonstrative (replacing der/den/dem) | `das` / `die` | 1c |
| Adverbial genitive of time | bare / `von ein` | 3c |
| Pronominal adverbs | `da`-compound / preposition + `das` | 6i |
| Prepositional interrogatives | `wo`-compound / preposition + `was` | 6h |
| Optional plural `-s` | bare / `-s` | 3f |

The listing in `docs/benchmark-plan.md` under "Acceptance-set maintenance"
is authoritative for the policy; this table is a quick index.
