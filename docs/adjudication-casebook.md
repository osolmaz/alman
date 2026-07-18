# Adjudication casebook

This casebook records the contentious cases that came up while building and
maintaining the spec and Almanbench, together with how each one was decided
and why. It is internal maintainer material, like everything under `docs/`.
When a model output gets rejected but looks right, or two gold renderings
seem to contradict each other, check here first, because most disputes are
re-runs of a case that has already been decided. The maintenance procedure
itself (who fixes what, in which order, with which audits) lives in
`docs/benchmark-plan.md` under "Acceptance-set maintenance". The design
philosophy behind the tie-breaks is in `docs/language-design-notes.md`.

Two principles decide almost every case in this file.

First, the spec is the only authority. A rendering enters an acceptance set
when a spec rule licenses it and is removed when no rule does, regardless of
how many strong models produce it or how natural it sounds. When the spec is
genuinely silent, the spec gets extended, and the extension is recorded here.

Second, when a design question has several defensible answers, Alman prefers
the one that matches the English outcome, cognate-for-cognate where
possible. English is a Germanic language that actually lost gender and case,
so its endpoint shows the path of least resistance, and as the world's most
common second language it is the attractor that would shape German if German
ever tipped the same way. The full argument is in
`docs/language-design-notes.md`, and the cases below apply it repeatedly.

## Relativizer: das canonical, die accepted (§6f)

The founding contentious case. The pure article-collapse logic says the
relativizer should be invariant **die**, matching the article. That was the
original rule, and it produced stacked identical forms wherever the
relativizer met the article: *die Frau, die die Kinder sieht*. The rule was
changed to make **das** canonical because English ran exactly this
experiment. Old English *þæt*, the neuter demonstrative and direct cognate
of *das*, became the universal relativizer *that* for all genders and
numbers, while the article function consolidated separately on *the*.
German already half-owns the pattern through the complementizer *dass*,
which is phonetically the same word. **die** remains accepted because the
article-collapse derivation is legitimate, while canonical status goes to the
form English proved out.

Before: *die Frau, die die Kinder sieht* (canonical)
After: *die Frau, das die Kinder sieht* (canonical), *die* accepted

## Stacked die die: dispreferred, never banned

After the relativizer change, many older canonical renderings still read
*die, die* at clause boundaries. Model outputs using *das* there were
correct but non-matching, and the reverse also occurred. The decision was to
flip the canonical rendering of every *die die* stack to *das die* and to
keep the *die* variant accepted. An outright ban was considered and
rejected. *die die* is grammatical Standard German, English tolerates the
analogous *that that* ("I know that that hurts"), and banning it would have
made the relativizer choice context-dependent, which defeats the point of
an invariant form.

Before: *Es sind die, die am lautesten schreien.* → *Es sind die, die am
lauteste schreien.* (canonical)
After: canonical *Es sind die, das am lauteste schreien.*, with the *die*
rendering still accepted

## Relative wo-compounds: retained after any antecedent (§6f)

A model rendered *das Werkzeug, womit er arbeitet* and was initially
suspected of an error on the theory that *womit* should be reserved for
clause antecedents. Review of the gold corpus showed wo-compounds retained
after plain noun antecedents in more than twenty items, and Standard German
allows both. The spec was clarified to retain relative wo-compounds and
treat them as interchangeable with preposition plus *das*/*die*, and the one
gold item that contradicted this (01006) was fixed. The packager now
generates both directions mechanically, and it deliberately does not emit
interrogative-style preposition plus *was* for relative clauses, because no
rule licenses that.

Before: only *das Werkzeug, mit das er arbeitet* accepted
After: *womit* / *mit das* / *mit die* all accepted, source form canonical

## welche as relativizer: retained where the source uses it (§6f)

Historical sources use *welcher/welche/welches* as relative pronouns. Since
Alman levels welch- forms to invariant *welche* anyway (§7a), a model that
keeps the source's *welche* instead of substituting *das* is applying the
spec faithfully. The packager adds *welche* as an alternative at relativizer
sites whenever the source uses a welch- form. The substitution *das* remains
canonical and a leveled *welche* is accepted, but introducing *welche* where
the source did not have it is not licensed.

Before: *der Brief, welcher ankam* → only *die Brief, das ankam*
After: *die Brief, das ankam* (canonical) / *die Brief, welche ankam*

## Genitives: retained der and periphrastic von die (§1d)

Every adnominal genitive admits two renderings, the retained analytical
*der* and the periphrastic *von die*, and acceptance sets carry both,
generated mechanically. Two sub-cases were contentious.

Prenominal name genitives like *Gretchens Schuhe* are retained unchanged,
mirroring the English Saxon genitive ("Gretchen's shoes"). The generator
initially missed sources where the head noun appears in dative plural
(*Gretchens Schuhen*), which made it emit no variants at all. It now
matches the dative form and emits both the prenominal and the postnominal
renderings.

Postnominal name genitives like *der Segen Gottes* keep *Gottes* or take
*von Gott*. Both are licensed, and gold items that carried only one were
extended rather than treating the other as a model error.

## Genitive objects of verbs: plain form, no von (§6j)

Verbs governing the genitive (*gedenken*, *bedürfen*, *warten* in its
archaic use) take a plain object in Alman: *Wir gedenken der Opfer* becomes
*Wir gedenken die Opfer*. A gold item (06098) rendered one such object with
*von* while rejecting a model that used *von* on the neighboring object of
the same verb. The *von* rendering is not licensed by any rule, so the gold
was wrong on both counts: the canonical was fixed to the plain form and the
*von* variant removed, even though removing it risked flipping stored
passes. English is no help here (it has no genitive objects), so the rule
stands on internal consistency alone.

Before (gold): *warten und pflegen wie von ein neugeborne Kindlein*
After: *warten und pflegen wie ein neugeborne Kindlein*

## Apposition: plain form canonical, matching marking accepted (§1e)

*Wilhelm dachte an den Marquis von Steyne, einen alten Bekannten* puts the
appositive in the accusative to agree with its head. Alman has no case
marking to agree with, and English drops agreement in exactly this position
("the Marquis of Steyne, an old acquaintance"). The rule added in round two
makes the plain form canonical (*ein alte Bekannte*) and accepts marking
that matches the head's rendering (*von ein alte Bekannte* after a
von-genitive head) as a variant.

## Standalone demonstratives: das canonical, die accepted, symmetric (§1c)

Standard German uses stressed articles as standalone demonstratives: *Der
war's!*, *die hab ich gefunden*, *das glaube ich nicht*. Alman replaces all
of them with neutral **das**, the cognate of English *that*, and accepts the
article-aligned **die** as a variant, exactly parallel to the relativizer
rule. Round three settled two loose ends. The feminine *die* is covered like
the masculine forms (a gold item, 02696, only accepted the retained *die*),
and the alignment is symmetric, so a retained neutral *das* may also surface
as *die*. Directly before a noun none of this applies, since the article
rules win and demonstrative force is carried by *diese* or *jene*.

Before: *die hab ich gefunden* → only *die hab ich gefunden*
After: *das hab ich gefunden* (canonical) / *die hab ich gefunden*

## diejenigen: number-invariant like all der-type determiners (§7a)

A model rendered *Diejenigen, die den Kurs bestanden haben* with retained
plural *Diejenigen* and was rejected. The plural marker argument (§4c
retains plural -en on nominalized adjectives) cuts one way, and English cuts
the other way with *those who*. The deciding precedent is internal: Alman's
der-type determiners are invariant across number already, since *diese*
covers both English *this* and *these*. *derjenige* is a determiner, not a
nominalized adjective, so it levels to *diejenige* in the plural too. The
spec now says this explicitly, and the model rejection stands.

Before (ambiguous): *diejenigen, das bestanden haben* plausible under §4c
After: *diejenige, das bestanden haben*, plural -en not accepted here

## Plural nominalized adjectives: -en retained as canonical, leveled -e accepted (§4c)

*die anderen* meaning "the others" kept its -en in some gold items and
leveled to *die andere* in others. Both readings of the surface form are
coherent. The -en is a plural marker under §4c, which Alman retains, and
English marks the same split (*the other* vs *the others*). But under the
form-based §4a principle the same -en looks like a declensional ending,
which levels. Round three settled it: the plural-marked form is canonical,
because number is real information and English keeps it, and the leveled
form is accepted as a variant because the form-based reading is legitimate.
The same holds for *die meisten*, *die übrigen*, nominalized possessives
like *die Ihren*, and *sein Gleichen*.

Before: golds split between *die anderen* and *die andere* with no policy
After: *die anderen* canonical, *die andere* accepted, everywhere

## Standalone pronominal -es: leveled canonical, retained accepted (§4a)

*niemand anderes*, *jemand anderes*, *folgendes*, and *etwas andres* carry
the declensional -es that §4a levels, so the textbook outcome is *niemand
andere* and *folgende*. Several golds retained the -es because the Standard
German forms are so entrenched that leveling them reads as an error to
native speakers. Round three settled this as the mirror image of the plural
case: the leveled form is canonical, because §4a is form-based and admits
no function-based exception, and the retained -es is accepted as a variant
in standalone pronominal uses only. Attributive adjectives get no such
tolerance. *ein verlegenes Betragen* levels to *ein verlegene Betragen*
with no accepted alternative, and a gold that retained the attributive -es
(07699) was simply wrong.

Before: golds split, e.g. *niemand anderes* required in one item
After: *niemand andere* canonical, *niemand anderes* accepted; attributive
forms always level

## alles vs alle: paired quantifiers, not adjective endings (§12)

*alles* survives only as the standalone neuter quantifier ("everything")
and in the fixed pattern with nominalized adjectives (*alles Gute*).
Attributively before a noun the form is *alle*. A gold item (03347) carried
attributive *alles Witz*, which no rule licenses. It was corrected to *alle
Witz* and the unlicensed rendering removed. The parallel to English is
*everything* versus *all*, which are likewise separate words rather than
inflections of each other.

## Natural gender: er and sie extended to personified abstracts (§5)

Alman assigns *er*/*sie* by natural gender and uses *es* for inanimates.
Literary sources personify abstracts (*der Geist der Modernität ... er*),
and forcing *es* there flattens deliberate rhetoric. The rule was extended
in round two so personified abstracts may keep the personal pronoun, with
*es* remaining the canonical inanimate choice. English does the same when
it personifies ("Liberty ... she").

## Singular sie for generic persons (§5)

Generic singular persons (*der Leser*, *jemand*, *man*-adjacent contexts)
take **sie** with plural agreement, on the model of English singular
*they*. This one was designed in from the start rather than litigated, but
it belongs in the casebook because reviewers repeatedly flag it as an
agreement error. It is the point of the rule.

## Weak-noun base forms: Technolog and Technologe both accepted

Stripping the weak-noun oblique -en from *dem Technologen* needs a base
form, and the historical source uses nominative *Technolog* while modern
German uses *Technologe*. Both restorations are defensible readings of the
same rule, so both are accepted (03122). This is a narrow tolerance for
weak nouns whose nominative wavers between -e and zero across periods, and
it does not license lexical modernization in general.

## Optional plural -s: only with proof of plurality (§3)

Zero-plural nouns like *Mädchen* may optionally take -s in the plural
(*die Mädchens*), the most English-like of Alman's noun rules. The
generator emits the -s variant only when the Standard German source proves
the noun is plural, through a dative -n form or a determiner that cannot
precede a singular. Round three extended the proof patterns (plural
possessives, *die*/*den* before zero-plural nouns in unambiguous contexts)
after models produced correct -s renderings the references missed, such as
*die Kuchens*. Guessing plurality without proof stays out of the
generator because a false positive would license a wrong rendering.

## Surface fidelity: no modernization, no paraphrase, case-sensitive

A recurring family of near-miss rejections comes from models improving the
text: modernizing *Thür* to *Tür*, *daß* to *dass*, or *grade* to *gerade*,
expanding *bzw.*, or fixing archaic word order. All of it stays rejected.
Alman is defined as a set of grammatical transformations over a Standard
German source, and everything the spec does not transform must be
reproduced exactly, or scores stop measuring rule application and start
measuring paraphrasing habits. The archaic dative -e is not part of this
family: the spec's case-ending elimination explicitly drops it (*dem
Kinde* → *die Kind*, *zu Hause* → *zu Haus*, *zu Pferde* → *zu Pferd*),
so keeping *Hause* in running text is a model error, not fidelity. An
earlier revision of this entry claimed the opposite and misstated the
spec; the spec rule on archaic dative endings decides it. Scoring is
case-sensitive throughout, since German capitalization is grammatical.

## Elided schwa: the stem stays as written, only the ending is replaced (§4a)

Historical and poetic sources elide schwas freely, and the elision can sit
in the stem (*geschriebnen* = *geschriebn* + *-en*) or in the ending
(*größern* = *größer* + *-n*). The July 2026 round-4 adjudication found
the golds split on this: *geschriebnen* was correctly leveled to
*geschriebne*, but *größern* became *größre* (inventing a stem elision the
source does not have), and *andrer* became *andere* in one item while
*andres* became *andre* in another. The decision is mechanical: keep the
stem exactly as the source spells it and replace only the declensional
ending. So *größern* → *größere*, *innern* → *innere*, *andern* →
*andere*, but *geschriebnen* → *geschriebne* and *andres* → *andre*.
Shifting the elision or restoring the full form are both modernizations
and stay rejected. The convention is enforced corpus-wide by the
schwa-shift check in `alman-research/scripts/reference_checks.py`, which
found five gold violations on the day it was written, including one
(*saubre*) no model had tripped over yet.

## Printer artifacts: read charitably, accept the verbatim surface too

One source prints *ihn wie der abzuholen*, a split *wieder* from the
original typesetting. The gold read the stray *der* as a standalone
demonstrative and converted it (*wie die*), with the repaired *wieder* as
a variant. Fable reproduced the source verbatim (*wie der*), which is
neither reading, and the round-4 decision accepts it as a third variant:
under the fidelity principle the artifact is spelling, and a verbatim
spelling of untransformed material is never wrong. All three renderings
are licensed; none is added to the spec, since this is a property of one
damaged source rather than of the grammar.

## Ditransitives: bare theme-first order is licensed, an-marking optional (§9c)

The spec says the recipient "may" take **an** when the theme comes first,
imposes no strict rule, and tolerates residual ambiguity the way English
does. A curated gold nevertheless required *an* (*schenkte sein Gewand an
ein arme Brahmane*) and rejected the bare source-order rendering, while a
naturalistic gold for the same construction (*alle Kummer die Lüfte der
Himmel geben*) kept the bare form canonical. Round 4 aligned them: the
bare theme-first rendering is accepted wherever verb semantics resolve the
roles, and the an-marked form stays available. English tolerates the same
ambiguity in its double-object construction, which is the §9c rationale.

## Quoted Standard German: mentions are exempt

Guard items quote Standard German forms inside Alman sentences (a spec
discussion citing *der/die/das*, dialogue quoting a book title). Quoted
material is mention rather than use and must stay untranslated. Models
that translate inside quotes fail the item, and that is intended. The
same exemption is what keeps the Alman spec text itself lintable.

## Adding a case

A new entry belongs here when an adjudication either extended the spec,
established a tolerance (an accepted variant without canonical status), or
rejected a plausible-looking rendering on grounds that will recur. Record
the competing readings, the decision, the rule that carries it, and the
English parallel if one exists. Then follow the maintenance procedure in
`docs/benchmark-plan.md`: fix the generator before fixing items by hand,
cite the licensing rule at every alternation, rerun the composition audit
and the test suites, and rescore stored runs to confirm only the intended
rows moved.
