# Language design notes

Internal rationale for Alman's design decisions. These notes are for
maintainers and agents working on the spec; they are not published on the
site and are deliberately more speculative in tone than the specification
itself. The heuristic developed here is applied case by case in
`docs/adjudication-casebook.md`, which records every contentious grammar
and benchmark decision with its resolution.

## English as the evolutionary precedent

The core design heuristic behind Alman: **English is the experiment that
already ran.** English is a Germanic language that actually went through
the change Alman prescribes — Old English had three grammatical genders,
four cases, and fully inflected articles and demonstratives, and lost
nearly all of it during the Middle English period. The specification's
introduction already cites this; these notes make the stronger, internal
version of the argument explicit:

1. The way English collapsed its article and demonstrative system is not
   merely *a* precedent. It demonstrates the **path of least resistance**
   for a Germanic language shedding gender and case: which distinctions get
   abandoned first, which forms survive, and what the survivors get
   repurposed for.
2. English is the most widely learned second language in the world. Its
   patterns are already in the heads of the very learners Alman targets —
   and of German native speakers themselves. If German were ever to tip
   into the same simplification, the English pattern is the attractor that
   would determine *which way* it tips.

Practical consequence for rule design: when a question has several
defensible answers, prefer the one that matches the English outcome,
cognate-for-cognate where possible. Existing rules that follow this
heuristic:

- invariant article **die** ↔ *the*
- neutral demonstrative **das** ↔ *that*
- invariant relativizer **das** ↔ *that* (see below)
- singular **sie** with plural agreement ↔ singular *they*
- possessive *-s* on proper names ↔ the English Saxon genitive
- uninflected adverbs/predicative adjectives ↔ English flat adverbs

## Case study: the invariant relativizer das (§6f)

The rule making **das** the canonical relativizer (with **die** as an
accepted variant) is a direct application of the heuristic above.

The English history, cognate by cognate: the Old English demonstrative
paradigm *se / sēo / þæt* collapsed during Middle English. The neuter
form **þæt** survived and became the universal relativizer and standalone
demonstrative *that*, used for all genders, numbers, and case roles ("the
man that I saw"). The article function consolidated separately on the
invariant **the**. German's *das* is the direct cognate of *that*, and its
d-article series is cognate with *the* — so Alman's split (**die** =
article, **das** = relativizer/demonstrative) mirrors the English endpoint
exactly.

German already half-owns this pattern through the complementizer:
**dass** and **das** are phonetically identical — the same word, with the
distinction existing only in orthography and syntactic context. Standard
German therefore already uses "that" as a subordinator (*Ich weiß, dass er
kommt* ↔ "I know that he came"). Extending *das* to relative clauses
closes the loop: one neutral pointing word covers demonstrative,
complementizer, and relativizer duty, exactly as *that* does in English.

A secondary, internal motivation: the earlier rule (relativizer = invariant
**die**, the pure article-collapse outcome) produced stacked identical
forms wherever the relativizer met the invariant article — *die Frau, die
die Kinder sieht*. With *das* as the relativizer the clause boundary is
audible again: *die Frau, das die Kinder sieht*. **die** remains accepted
because it is what the article-collapse logic yields and is equally
transparent to Standard German speakers; canonical status simply goes to
the form English proved out.
