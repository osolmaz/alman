# Alman: A Simplified Dialect of the German Language

**Version**: 0.4.2  

**Last Updated**: 2026-07-08


## Introduction {#introduction}

The noun gender system of the German language, colloquially referred to as “der/die/das,” is notoriously difficult for those who learn German as an additional language (L2). We advocate that correct usage of noun genders is not crucial for most L2 learners in order to function in the German society. To this end, we construct a dialect, called **Alman**, that unifies the masculine, feminine, and neuter genders into a single category and eliminates gender- and case-specific inflections. The resulting gender loss is akin to that experienced by English during the Middle English period. We present a formal description of **Alman** grammar.

The idea of **Alman** came out of the recognition that language complexity—especially in morphological systems like noun gender—can slow down language learning and hinder a foreigner's integration into the society. We claim that higher grammatical complexity comes with real-world costs, including delayed workforce integration and diminished productivity for migrants. By removing the necessity to memorize or deploy multiple gender markers, **Alman** seeks to mitigate these challenges without compromising the fundamental structure of German syntax and vocabulary.

Beyond its practical benefits for newcomers, **Alman** remains mutually intelligible with **Standard German**. The dialect is designed to preserve essential word order (verb-second in main clauses and verb-final in subordinate clauses), retain well-known verb conjugations, and maintain overall lexical clarity. Rather than overhauling the entire grammar, it strategically reduces complexity where it matters most—namely in article usage, noun inflection, and adjective endings—allowing L2 learners to communicate more confidently at an earlier stage.

This specification provides a formal account of **Alman** grammar, detailing the rules for article simplification, noun morphology, adjectival endings, and other core linguistic elements. By illustrating these changes with numerous examples, we aim to offer both instructors and learners a clear roadmap for adopting this dialect. The goal is not to replace **Standard German** but to introduce an accessible version that addresses pain points for adult learners, ultimately fostering a more inclusive and efficient language learning.


## Table of Contents

<div class="toc-container" style="
        list-style: none;
        padding-left: 0;
        margin-left: 0;
    ">

<ul style="list-style: none; padding-left: 0; margin-left: 0;">

<li><a href="#introduction">Introduction</a>
</li>
<li><a href="#articles">Articles</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#definite-articles">§1 Definite Article Simplification</a></li>
<li><a href="#indefinite-articles">§2 Indefinite Article Simplification</a></li>
</ul>
</li>
<li><a href="#nouns">Nouns</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#noun-morphology">§3 Noun Morphology Simplification</a></li>
</ul>
</li>
<li><a href="#adjectives-and-adverbs">Adjectives and Adverbs</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#adjectives">§4 Adjectival Ending Regularization</a></li>
<li><a href="#adverbs">§5 Adverbs</a></li>
</ul>
</li>
<li><a href="#pronouns-and-determiners">Pronouns and Determiners</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#pronouns">§6 Pronouns</a></li>
<li><a href="#determiners">§7 Determiners and Demonstratives</a></li>
</ul>
</li>
<li><a href="#verbs-and-word-order">Verbs and Word Order</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#verbs">§8 Verb Conjugations and Forms</a></li>
<li><a href="#word-order">§9 Word Order and Syntax</a></li>
</ul>
</li>
<li><a href="#lexical-gender">Lexical Gender Simplifications</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#job-titles">§10 Uniformity of Occupational and Person-Denoting Nouns</a></li>
</ul>
</li>
</ul>

</div>


## Articles {#articles}

This section outlines the simplification of **Standard German** articles in **Alman**, eliminating grammatical gender and case distinctions. Definite articles use **die** for all non-genitive contexts and **der** for genitive, with **das** retained as a neutral demonstrative. Possession may alternatively use **von die** instead of genitive constructions. Indefinite articles adopt **ein** universally in non-genitive cases, while genitive employs **von ein** or retains **ein** with prepositions. Preposition-article contractions are resolved to full forms without exception (e.g., *vom* → *von die*), and nominalized articles preserve **ein** as standalone forms. The case distinction after two-way prepositions is abolished for noun phrases.


### §1. Definite Article Simplification {#definite-articles}

The **Alman** dialect systematically replaces the six case-inflected definite article forms of **Standard German** through morphological regularization, employing invariant forms for non-genitive and genitive cases while eliminating case-specific noun endings. All surface realizations of definite articles in non-genitive contexts (regardless of grammatical gender, number, or case) are replaced by **die**. Genitive contexts employ **der** by default, accompanied by elimination of genitive noun inflections.


#### §1a. Invariant 'die' for Non-Genitive Cases

All nominative, accusative, and dative definite articles (der/die/das/den/dem) are replaced by the invariant form 'die', neutralizing gender and case distinctions.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| der Mann (Nominative) | die Mann |
| den Mann (Accusative) | die Mann |
| dem Mann (Dative) | die Mann |
| die Frau (Nominative/Accusative) | die Frau |
| der Frau (Dative) | die Frau |
| das Kind (Nominative/Accusative) | die Kind |
| dem Kind (Dative) | die Kind |



#### §1b. Invariant 'der' for Genitive Case

All genitive definite articles (des/der) are replaced by 'der', accompanied by elimination of genitive noun inflections.

After genitive prepositions such as **wegen**, **trotz**, **statt**, **während**, and **innerhalb**, the genitive article **der** is preferred, but the invariant non-genitive **die** is also acceptable, mirroring colloquial usage. This parallels the treatment of indefinite articles after genitive prepositions.

The genitive **der** is the single case-marked article form that **Alman** retains. This is a deliberate exception to the otherwise complete elimination of case-specific inflection: it keeps adnominal genitive constructions (*die Haus der Mann*) recognizable and mutually intelligible with **Standard German**. Indefinite articles, possessive determiners, and **kein** instead eliminate genitive marking entirely through periphrasis, as described in their respective rules.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| des Mannes (Genitive) | der Mann |
| der Frau (Genitive) | der Frau |
| des Kindes (Genitive) | der Kind |
| wegen des Wetters | wegen der Wetter / wegen die Wetter |



#### §1c. Exception: Demonstrative Pronouns

The demonstrative pronoun 'das' retains its form in nominative, accusative, and dative contexts when functioning as a neutral demonstrative ('that'). In genitive constructions, the form 'dessen' is replaced by 'deren' while maintaining the invariant article system.

This exception is strictly positional: it applies only when 'das' stands alone, without a following noun. Directly before a noun, the article rules always apply and every definite article form becomes **die**, regardless of stress or demonstrative intent. Demonstrative force before a noun is expressed with **diese** or **jene** (see the section on determiners), mirroring English *this/that* + noun. Likewise, the **Standard German** demonstrative pronouns 'der', 'den', and 'dem' used standalone (*Der war's!*) are replaced by the invariant **die**, consistent with the treatment of relative pronouns.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| das ist gut (demonstrative) | das ist gut |
| dessen Haus | deren Haus |
| DAS Buch will ich! (stressed, attributive) | Diese Buch will ich! |
| Der war's! (standalone demonstrative) | Die war's! |



#### §1d. Optional Use of 'von die' for Possession

The prepositional construction 'von die' may substitute the genitive article 'der' to indicate possession, though 'der' remains preferable in most contexts. This periphrastic construction serves to: 
1. Resolve ambiguity in complex phrases
2. Provide phonological variety
3. Mirror colloquial speech patterns

While interchangeable, 'der' should be retained when translating original genitive constructions ('des/der') unless contextual factors favor 'von die'.

An apposition agrees in construction with its head noun phrase. When a genitive is rendered periphrastically with **von**, an apposition to it likewise takes the non-genitive form; when the genitive **der** is used, the apposition remains in the genitive. The same holds for appositions following a retained proper-name genitive (see the section on nouns). Note that possessive genitives (*seines Vaters*) have no **der** form and are always periphrastic (see the rule on possessive determiners in the section on determiners), so their appositions always take the non-genitive form.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| das Haus des Mannes | die Haus der Mann / die Haus von die Mann |  |
| die Farbe des Autos | die Farbe der Auto / die Farbe von die Auto |  |
| bei den Lehren seines Vaters, des Gelehrten | bei die Lehren von sein Vater, die Gelehrte | in the teachings of his father, the scholar |
| der Name Gotamas, des Buddha | die Name Gotamas, der Buddha / die Name von Gotama, die Buddha | the name of Gotama, the Buddha |



#### §1e. Contraction Resolution

Preposition-article contractions (e.g., vom, im, zur) must be resolved to their full form prior to applying article replacement rules. The uncontracted preposition and article are then processed according to standard **Alman** article rules.

This rule applies uniformly, including to contractions in fixed expressions such as **zum Beispiel** and **zum** + nominalized infinitive, sparing learners from memorizing a list of exempt expressions. The single exception is the adverbial superlative construction **am** + superlative (e.g., **am besten**, **am schnellsten**): it is not treated as a preposition-article contraction, but is instead replaced by the bare superlative stem, as described in the section on adjectives and adverbs.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| vom Mann (von + dem) | von die Mann |
| im Garten (in + dem) | in die Garten |
| fürs Kind (für + das) | für die Kind |
| zur Frau (zu + der) | zu die Frau |
| zum Beispiel (zu + dem) | zu die Beispiel |
| zum Lernen (zu + dem) | zu die Lernen |



#### §1f. Two-Way Prepositions

In **Standard German**, the two-way prepositions (**in, an, auf, über, unter, vor, hinter, neben, zwischen**) govern the accusative to express motion toward a goal and the dative to express static location. Since **Alman** collapses accusative and dative articles into the invariant **die**, this case-based distinction is abolished for noun phrases: *in die Kino* covers both "into the cinema" and "in the cinema."

Where the direction/location distinction is communicatively essential, it is expressed lexically, e.g., through directional adverbs (**hinein, hinaus, hin**) or locative adverbs (**drinnen, drin, dort**), or resolved by the semantics of the verb.

Note that personal pronouns retain case marking (see the section on pronouns), so the distinction remains available in pronominal constructions (*auf ihn* vs. *auf ihm*).


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Ich gehe ins Kino. (Accusative, motion) | Ich gehe in die Kino. | I go to the cinema. |
| Ich bin im Kino. (Dative, location) | Ich bin in die Kino. | I am at the cinema. |
| Er legt das Buch auf den Tisch. | Er legt die Buch auf die Tisch. | He puts the book on the table. |
| Das Buch liegt auf dem Tisch. | Die Buch liegt auf die Tisch. | The book lies on the table. |



### §2. Indefinite Article Simplification {#indefinite-articles}

The **Alman** dialect regularizes indefinite article usage through morphological simplification, eliminating case and gender distinctions present in **Standard German** while maintaining semantic clarity through prepositional constructions.


#### §2a. Unified 'ein' for Non-Genitive Cases

The invariant form **ein** replaces all nominative, accusative, and dative indefinite articles (ein/eine/einen/einem), neutralizing gender and case distinctions.

This rule applies to the indefinite article only. The homographic oblique forms of the indefinite pronoun **man** (*Das ärgert einen*) are pronouns, retain their case marking, and are described in the section on pronouns.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| ein Mann (Nominative) | ein Mann |
| eine Frau (Nominative) | ein Frau |
| einen Hund (Accusative) | ein Hund |
| einem Kind (Dative) | ein Kind |



#### §2b. Genitive Case

Indefinite genitive constructions employ either:
1. Prepositional phrase **von ein** + Noun
2. Only **ein**, depending on the context, e.g. when used with a genitive prepositions such as **wegen**, **trotz**, **statt**, **innerhalb** and so on.

The periphrastic **von ein** construction is preferred when maintaining indefiniteness is crucial.

This systematizes existing colloquial patterns that use prepositional phrases with dative forms, while replacing them with the invariant **ein**.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| das Buch eines Freundes | die Buch von ein Freund |
| wegen eines Problems | wegen ein Problem |



#### §2c. Nominalized Articles

The **ein** form persists in nominalized constructions where the article functions independently without a subsequent noun.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Diese Erfindung war eine der wichtigsten Leistungen des 20. Jahrhunderts. | Diese Erfindung war ein der wichtigste Leistungen der 20. Jahrhundert. |



## Nouns {#nouns}

This section details **Alman**'s elimination of grammatical gender and case inflections in nouns. All nouns adopt a single invariant form across nominative, accusative, and dative cases, with genitive contexts marked by **der** instead of case endings. The prenominal genitive -s of proper names (*Annas Buch*) is exempt and retained, mirroring the English possessive *'s*. Plural forms retain their standard nominative/accusative morphology in all cases, while an optional -s suffix resolves ambiguity for nouns with identical singular/plural forms. Weak noun declensions and archaic dative endings are abolished.


### §3. Noun Morphology Simplification {#noun-morphology}

The **Alman** dialect systematically eliminates grammatical gender distinctions and case-based noun inflections through morphological regularization. Nouns maintain a single invariant form across nominative, accusative, and dative cases, with genitive constructions employing a distinct analytical marker. Plural forms preserve their standard nominative/accusative morphology across all syntactic contexts.


#### §3a. Case Ending Elimination

All case-specific noun endings are removed, including:
- Genitive -s/-es markers on common nouns (des Mannes → der Mann); the prenominal genitive -s of proper names is exempt and retained (see the rule on the proper-name genitive)
- Dative plural -n suffixes (den Bränden → die Brände)
- Weak noun declensional patterns: the -n/-en endings that weak nouns such as **Kollege**, **Mensch**, **Student**, and **Junge** take in non-nominative singular cases are dropped, and the nominative singular serves as the invariant singular form (den Kollegen → die Kollege). The -n/-en plural of these nouns is unaffected and is retained as a plural marker (see the rule on invariant plural forms), so singular *die Kollege* remains distinct from plural *die Kollegen*.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| des Hundes (Genitive) | der Hund |
| den Frauen (Dative Plural) | die Frauen |
| dem Kinde (Dative, archaic) | die Kind |
| den Kollegen (Accusative, weak noun) | die Kollege |
| dem Studenten (Dative, weak noun) | die Student |
| im Menschen (Dative, weak noun) | in die Mensch |
| die Kollegen (Plural) | die Kollegen (-en retained as plural marker) |



#### §3b. Retention of the Proper-Name Genitive -s

The prenominal genitive -s of proper names is exempt from case ending elimination and is retained unchanged, mirroring the English possessive *'s* (*Annas Buch* "Anna's book"). Since proper names take no article, the analytical genitive marker **der** cannot apply to them; the name-final -s is therefore not part of the article-and-case system that **Alman** eliminates, and it carries no additional learning burden for speakers familiar with the English construction.

This applies to personal names as well as place names and other proper nouns used possessively. The **Standard German** orthographic convention for names ending in an s-sound — a bare apostrophe in place of -s (*Hans' Fahrrad*) — is likewise retained.

As with other possessive constructions, the periphrastic **von** construction remains available as an alternative (see the rule on the optional use of 'von die' for possession in the section on articles).


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Annas Buch | Annas Buch | Anna's book |
| Peters Auto | Peters Auto / die Auto von Peter | Peter's car |
| Hans' Fahrrad | Hans' Fahrrad | Hans's bicycle |
| Deutschlands Hauptstadt | Deutschlands Hauptstadt / die Hauptstadt von Deutschland | Germany's capital |



#### §3c. Invariant Plural Forms

Standard nominative/accusative plural forms serve as universal plural markers, remaining unchanged in dative and genitive contexts. This preserves recognizable plural morphology while eliminating case-based modifications.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| mit den Kindern (Dative Plural) | mit die Kinder |
| wegen der Brände (Genitive Plural) | wegen der Brände / wegen die Brände |



#### §3d. No Regularization of Plural Morphology

**Alman** preserves **Standard German** plural morphology without systematic regularization, maintaining existing plural forms in all non-conflicting contexts. The dialect only intervenes in plural formation when its grammatical simplifications create morphological ambiguity between singular and plural forms, as described in the next rule.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| die Blumen (plural) | die Blumen |
| die Hunde (plural) | die Hunde |
| die Bücher (plural) | die Bücher |
| die Autos (plural) | die Autos |



#### §3e. Optional Plural Disambiguation

To resolve potential ambiguity in nouns with identical singular/plural forms, **Alman** permits optional plural marking with the suffix **-s**, mirroring the English plural. When clarity requires explicit plurality indication, the -s suffix is appended to the invariant form.

The -s suffix is the sole disambiguation marker. The -n suffix is not used for this purpose: since case ending elimination abolishes the **Standard German** dative plural -n, reusing -n as a plural marker would give the same ending two different meanings across the two languages.

This disambiguation preserves simplified morphology while accommodating lexical items where number distinction proves pragmatically essential.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| die Computer (plural) | die Computers |
| der Sessel (singular)/die Sessel (plural) | die Sessel (singular)/die Sessels (plural) |
| die Mädchen (plural) | die Mädchens |



## Adjectives and Adverbs {#adjectives-and-adverbs}

This section details **Alman**'s single form-based principle for adjective and adverb morphology: every declensional adjective ending of **Standard German** is replaced by the invariant -e, and forms without declensional endings remain unchanged. The principle applies by surface form, not syntactic function — attributive adjectives (gute Mann), nominalized adjectives (die Gute), and fixed adverbial expressions (unter anderem → unter andere) all take -e, while predicative adjectives and adverbs stay as they are. The sole exception is the adverbial superlative, which replaces the **Standard German** **am** + superlative construction with the bare superlative stem (am besten → best).


### §4. Adjectival Ending Regularization {#adjectives}

The **Alman** dialect governs adjective morphology through a single form-based principle: every declensional adjective ending of **Standard German** is replaced by the invariant -e, and forms that carry no declensional ending remain unchanged. The learner never needs to classify an adjective by its syntactic function; the surface form alone determines the outcome.


#### §4a. Invariant -e for All Declensional Endings

Whenever an adjective carries a declensional ending in **Standard German** — an ending that marks case, gender, or number — that ending is replaced by the invariant **-e** in **Alman**. This applies uniformly regardless of the adjective's function or position: attributive adjectives before nouns, nominalized adjectives, adjectives nominalized after **etwas**, **nichts**, and **alles** (*etwas Gutes*, *nichts Neues*), and adjectives inside fixed adverbial expressions (**unter anderem**, **vor kurzem**, **seit langem**, **von neuem**, **bei weitem**, **ohne weiteres**) are all treated identically.

Adjectives that carry no declensional ending in **Standard German** — predicative adjectives and forms used adverbially — remain unchanged; no ending is added (see the section on adverbs).

Comparison suffixes (**-er**, **-st**) are word formation rather than declension and are preserved: *schneller laufen* remains *schneller laufen*. Likewise, lexicalized adverbs such as **anders** or **meistens** carry no declensional ending and remain unchanged.

The sole exception to this principle is the adverbial superlative **am** + superlative, which is replaced by the bare superlative stem (see the section on adverbs).


**Examples:**

| Standard German | Alman |
|------------------|-------|
| guter Mann (Masculine Nominative) | gute Mann |
| eine schöne Blume (Feminine Accusative) | ein schöne Blume |
| dem kleinen Kind (Neutral Dative) | die kleine Kind |
| die roten Schuhe (Plural) | die rote Schuhe |
| unter anderem (fixed expression) | unter andere |
| vor kurzem (fixed expression) | vor kurze |
| etwas Gutes | etwas Gute |
| nichts Neues | nichts Neue |
| alles Gute (already ends in -e) | alles Gute |
| Das Auto ist schnell. (predicative, no ending) | Die Auto ist schnell. |



#### §4b. Genitive Construction Handling

Genitive constructions retain the analytical 'der' article while maintaining invariant adjectival -e endings, preserving morphological regularity across all cases.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| des guten Mannes | der gute Mann |
| der intelligenten Schüler | der intelligente Schüler |



#### §4c. Nominalized Adjectives

Nominalized adjectives, when functioning as nouns, receive the invariant **-e** ending in the singular, irrespective of their syntactic role, thereby preserving uniformity with regular adjective forms.

In the plural, nominalized adjectives behave as nouns: consistent with the preservation of noun plural morphology described in the section on nouns, they retain the **-en** ending as a plural marker (not a case marker). This distinguishes *die Schöne* (singular) from *die Schönen* (plural).


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Das Gute im Menschen | Die Gute in die Mensch |
| An die Schönen (Dative, plural) | An die Schönen (-en retained as plural marker) |
| Wegen des Bekannten | Wegen der Bekannte / Wegen die Bekannte |
| unter anderem | unter andere |



### §5. Adverbs {#adverbs}

Adverbs carry no declensional endings in **Standard German** and therefore remain unchanged in **Alman**. This is a direct consequence of the form-based principle in the section on adjectives — endings become -e, ending-less forms stay as they are — rather than a separate mechanism. The one special construction is the adverbial superlative, where the case-marked construction **am** + superlative is replaced by the bare superlative stem.


#### §5a. Adverbs Stay the Same

Words functioning adverbially carry no declensional ending in **Standard German** and therefore remain unchanged in **Alman**. This follows directly from the form-based principle in the section on adjectives: only existing declensional endings are replaced by -e, and where there is no ending, nothing changes. This applies to:
- Adverbs modifying verbs
- Adjectives modifying other adjectives
- Phrasal modifiers not directly preceding a noun

Fixed adverbial expressions that do contain a declined adjective (**unter anderem**, **vor kurzem**, and similar) are not exempt: their endings become the invariant -e (unter andere, vor kurze) per the same principle.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| schnell laufen | schnell laufen |
| das Auto fährt schnell | die Auto fährt schnell |
| frisch kaltes Wasser | frisch kalte Wasser |



#### §5b. Bare-Stem Adverbial Superlatives

The **Standard German** adverbial superlative construction **am** + superlative (am besten, am schnellsten) is replaced by the bare superlative stem: **best**, **schnellst**, and so on. This mirrors the English adverbial superlative ("I swim best") and removes the case-marked contraction **am** (an + dem) from the construction entirely, consistent with the elimination of case-marked articles elsewhere in **Alman**.

The variant **an** + bare stem (e.g., **an best**) is also acceptable, preserving the prepositional rhythm of the **Standard German** construction for speakers who prefer it. The bare stem is the preferred form.

This rule takes precedence over the contraction resolution rule in the section on articles: **am** in adverbial superlatives is not expanded to **an die**. Attributive superlatives are unaffected and follow the regular invariant -e ending rule (die beste Schwimmer).


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Ich schwimme am besten. | Ich schwimme best. / Ich schwimme an best. | I swim best. |
| Er läuft am schnellsten. | Er läuft schnellst. / Er läuft an schnellst. | He runs fastest. |
| Am liebsten esse ich Pizza. | Liebst esse ich Pizza. / An liebst esse ich Pizza. | I like eating pizza most. |
| Dieses Auto gefällt mir am meisten. | Diese Auto gefällt mir meist. / Diese Auto gefällt mir an meist. | I like this car the most. |



## Pronouns and Determiners {#pronouns-and-determiners}

This section outlines modifications to **Standard German**'s pronominal system that prioritize natural gender attribution while maintaining case distinctions for referential clarity. Personal pronouns retain **Standard German** case forms but reference biological/social gender rather than grammatical gender; for persons of unknown or generic gender, the plural **sie** functions as a singular *they*, mirroring English. Relative pronouns collapse to the invariant **die** (genitive **deren**), following the article system. Determiners, possessive determiners, the negative article **kein**, and other **ein**-compounds undergo simplification through invariant forms in non-genitive contexts, with preserved case inflection only in personal pronouns.


### §6. Pronouns {#pronouns}

This paragraph outlines the retention of **Standard German** personal pronoun case forms while reorienting referential assignment to natural gender, rather than grammatical gender, preserving case distinctions for referential clarity.


#### §6a. Personal Pronouns: Natural Gender Attribution

Personal pronouns maintain their **Standard German** case forms but are interpreted through natural gender assignment (mirroring English conventions):
1. **er/ihn/ihm** → Refers exclusively to male persons or male-identifying entities
2. **sie/sie/ihr** → Refers exclusively to female persons or female-identifying entities
3. **es/es/ihm** → Refers to inanimate objects, abstract concepts, or other non-person entities without natural gender

Persons whose gender is unknown, unspecified, or generic are referred to with the plural **sie** used as a singular *they*, as described in the rule on gender-neutral referents.

Note that when the referent is described by an occupational title, the title itself follows the uniformity rules described in the section on lexical gender simplifications, while the pronoun follows natural gender.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Sie ist nett. (die Frau, f.) | Sie ist nett. | She is nice. |
| Er ist nett. (der Mann, m.) | Er ist nett. | He is nice. |
| Es ist klug. (das Mädchen, n.) | Sie ist klug. | She is clever. |
| Es ist neu. (das Buch, n.) | Es ist neu. | It is new. |



#### §6b. Case Inflection Retention

Personal pronouns retain full case inflection to preserve referential clarity and syntactic precision, particularly for animate entities. The case system is intentionally aligned with **Standard German** forms, in order to preserve mutual intelligibility.

| Person        | Nominative | Accusative | Dative |
|---------------|------------|------------|--------|
| 1st Singular  | ich        | mich       | mir    |
| 2nd Singular  | du         | dich       | dir    |
| 3rd Masc.     | er         | ihn        | ihm    |
| 3rd Fem.      | sie        | sie        | ihr    |
| 3rd Neut.     | es         | es         | ihm    |
| 1st Plural    | wir        | uns        | uns    |
| 2nd Plural    | ihr        | euch       | euch   |
| 3rd Plural    | sie        | sie        | ihnen  |
| Formal (2nd)  | Sie        | Sie        | Ihnen  |

The formal address pronoun **Sie** (with dative **Ihnen** and possessive **Ihr**) is retained exactly as in **Standard German**, including its capitalization.

The indefinite pronoun **man** likewise retains its full **Standard German** paradigm, including its oblique forms **einen** (accusative) and **einem** (dative). These are pronoun forms, not articles, and are therefore not affected by the indefinite article simplification described in the section on articles.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Ich sehe ihn. (den Mann) | Ich sehe ihn. | I see him. |
| Sie gibt ihr das Buch. | Sie gibt ihr die Buch. | She gives her the book. |
| Können Sie mir helfen? | Können Sie mir helfen? | Can you help me? (formal) |
| Ich danke Ihnen für das Geschenk. | Ich danke Ihnen für die Geschenk. | I thank you for the gift. (formal) |
| Das ärgert einen. | Das ärgert einen. | That annoys one. |
| Das hilft einem sehr. | Das hilft einem sehr. | That helps one a lot. |



#### §6c. Gender-Neutral Referents

For entities without natural gender (objects, abstract concepts, institutions):
- **es** serves as the default singular pronoun
- **Standard German** plural pronoun forms are retained (**sie** for plural referents, including groups of mixed or unspecified gender)

For **persons** whose gender is unknown, unspecified, or generic, the third-person plural **sie** is used with plural verb agreement, even when the referent is singular. This mirrors the English singular *they* ("Someone called. They were friendly.") and applies both to generic person-denoting expressions (*der Mensch*, *jeder*, *jemand*, *niemand*) and to specific persons of unknown gender. Accusative and dative follow the plural paradigm (**sie**/**ihnen**), and the corresponding possessive is **ihr**. Where the plural reading would genuinely mislead, speakers may rephrase, exactly as in English.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Der Computer? Er ist kaputt. | Die Computer? Es ist kaputt. | The computer? It is broken. |
| Die Universität? Sie ist groß. | Die Universität? Es ist groß. | The university? It is large. |
| Ich kaufe das Auto, weil es günstig ist. | Ich kaufe die Auto, weil es günstig ist. | I buy the car because it is affordable. |
| Die Leute sind hier. Sie sind müde. | Die Leute sind hier. Sie sind müde. | The people are here. They are tired. |
| Der Mensch? Er ist ein Rätsel. | Die Mensch? Sie sind ein Rätsel. | The human being? They are a riddle. |
| Jemand hat angerufen. Er war freundlich. | Jemand hat angerufen. Sie waren freundlich. | Someone called. They were friendly. |
| Jeder tut, was er kann. | Jede tut, was sie können. | Everyone does what they can. |



#### §6d. Reflexive Pronouns

Reflexive pronouns follow **Standard German** case forms (mich, dich, sich, uns, euch) while adhering to natural gender principles for third-person referents.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Er wäscht sich. | Er wäscht sich. | He washes himself. |
| Sie hilft sich. | Sie hilft sich. | She helps herself. |
| Es öffnet sich. | Es öffnet sich. | It opens itself. |



#### §6e. Possessive Pronouns

The choice among the possessive pronouns (**mein, dein, sein, ihr, unser, euer, Ihr**) follows natural gender attribution of the possessor. For possessors of unknown, unspecified, or generic gender, **ihr** is used, consistent with the singular *they* described in the rule on gender-neutral referents. Their endings follow the determiner rules: the invariant base form is used in all non-genitive contexts (see the section on determiners).


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Sein Buch (des Mannes) | Sein Buch | His book |
| Ihr Buch (der Frau) | Ihr Buch | Her book |
| Sein Buch (des Tisches) | Sein Buch | Its book |



#### §6f. Relative Pronouns

Relative pronouns follow the same simplification as definite articles. All non-genitive relative pronoun forms (der/die/das/den/dem) are replaced by the invariant form **die**, regardless of the gender, number, or case role of the referent within the relative clause. The genitive relative pronouns **dessen** and **deren** are both replaced by **deren**, consistent with the treatment of genitive demonstratives in the section on articles.

Since the invariant **die** no longer marks the case role of the relativized element, ambiguity between subject and object relative clauses is resolved by verb agreement and context; where genuine ambiguity arises, speakers may rephrase using a personal pronoun in the relative clause or a periphrastic construction.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| der Mann, der dort steht | die Mann, die dort steht | the man who is standing there |
| der Mann, den ich sehe | die Mann, die ich sehe | the man whom I see |
| der Mann, dem ich helfe | die Mann, die ich helfe | the man whom I help |
| das Kind, das spielt | die Kind, die spielt | the child who is playing |
| die Frau, deren Auto kaputt ist | die Frau, deren Auto kaputt ist | the woman whose car is broken |
| der Mann, dessen Haus groß ist | die Mann, deren Haus groß ist | the man whose house is large |



#### §6g. Retention of Standard Interrogative Pronouns

The interrogative pronouns **wer, was, wen, wem, wessen** are retained in their **Standard German** forms without modification. These pronouns function as in **Standard German** in all contexts.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Wer bist du? | Wer bist du? |
| Was möchtest du essen? | Was möchtest du essen? |
| Wen siehst du? | Wen siehst du? |



#### §6h. Prepositional Interrogative Constructions

In interrogative constructions involving prepositions, an uncontracted preposition preceding **was** may be used in place of the compound *wo-* forms: **zu was, von was, mit was, über was, durch was**, and similar variants. This mirrors the usage of preposition + *what* in English, like *to what*, *from what*, and so on.

The **Standard German** *wo-* compounds remain fully acceptable, as they carry no gender or case inflection and pose no additional learning burden. Both variants may be used interchangeably, exactly as with the pronominal *da-* compounds described in the following rule.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Womit hilfst du mir? | Mit was hilfst du mir? / Womit hilfst du mir? |
| Wovon träumst du? | Von was träumst du? / Wovon träumst du? |
| Worüber freust du dich? | Über was freust du dich? / Worüber freust du dich? |



#### §6i. Pronominal Adverbs (da- Compounds)

Parallel to the treatment of interrogative *wo-* forms, the pronominal adverbs formed with *da-* (**damit, davon, darüber, dafür, daran**, and similar variants) may be replaced by the uncontracted preposition followed by the demonstrative **das** (e.g., **mit das, von das, über das**), consistent with the retention of the neutral demonstrative described in the section on articles.

The **Standard German** *da-* compounds remain fully acceptable, as they carry no gender or case inflection and pose no additional learning burden. Both variants may be used interchangeably.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Ich bin damit einverstanden. | Ich bin mit das einverstanden. / Ich bin damit einverstanden. |
| Davon habe ich gehört. | Von das habe ich gehört. / Davon habe ich gehört. |
| Er freut sich darüber. | Er freut sich über das. / Er freut sich darüber. |



### §7. Determiners and Demonstratives {#determiners}

This paragraph describes the simplification of determiner and demonstrative forms in **Alman** through gender neutralization and case reduction, while maintaining clarity through context and word order.


#### §7a. Unified Forms for Non-Genitive Contexts

In non-genitive contexts, any determiner or pronoun that inflects for gender or case in **Standard German** adopts the invariant feminine "die..." form, i.e. the form ending in -e. This is a general principle covering the entire class: **diese, jene, jede, welche, manche, solche, diejenige, dieselbe**, and all analogous items are employed regardless of the gender or case of the referent. Determiners that already end in -e and do not inflect for gender in the relevant contexts (**beide, einige, mehrere**) remain unchanged.

This principle covers the der-type (strong-inflecting) determiners. Words built on **ein** — the negative article **kein**, the possessive determiners, and compounds such as **irgendein** — do not take the -e form; they follow the invariant base-form pattern described in the rule on possessive determiners and the negative article.

The paired quantifiers described in the rule on indefinite and negative quantifiers (**alle/alles, viel/viele, wenig/wenige, nicht/nichts**) are exempt and follow their own rule.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| dieser, diese, dieses, diesen, diesem (Nominativ, Akkusativ, Dativ) | diese |
| derjenige (Nominativ, Dativ), diejenige (Nominativ, Akkusativ), dasjenige (Nominativ), denjenigen (Akkusativ), demjenigen (Dativ) | diejenige |
| derselbe (Nominativ, Dativ), dieselbe (Nominativ, Akkusativ), dasselbe (Nominativ), denselben (Akkusativ), demselben (Dativ) | dieselbe |
| derjenige Mann, der kommt | diejenige Mann, die kommt |
| dieser Weg | diese Weg |
| jener Tag | jene Tag |
| jeder Tag, jeden Tag, jedem Tag | jede Tag |
| mancher Politiker | manche Politiker |
| solches Wetter | solche Wetter |
| welches Buch | welche Buch |
| demjenigen Weg | diejenige Weg |
| dasselbe Buch | dieselbe Buch |



#### §7b. Handling of Genitive Forms in Gendered Determiners

When a genitive construction is required, speakers of **Alman** may either adopt the corresponding "derjenige" form or rephrase the expression to avoid the genitive altogether by employing a periphrastic construction with **von jene**, **von dieselbe** and so on. In the latter case, the invariant non-genitive form is retained following the preposition. The genitive *derjenigen* and *desjenigen* can be substituted with either *von diejenige* or *von jene* for simplicity.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| derselben (Genitiv), desselben (Genitiv) | von dieselbe |
| dieser, dieses (Genitiv) | von diese |
| das Urteil desjenigen Mannes  | die Urteil von diejenige Mann / die Urteil von jene Mann / die Urteil derjenige Mann |
| die Meinung derselben Frau | die Meinung von dieselbe Frau |



#### §7c. Possessive Determiners and the Negative Article

Possessive determiners (**mein, dein, sein, ihr, unser, euer, Ihr**), the negative article **kein**, and all compounds of **ein** (such as **irgendein**, **so ein**, **was für ein**) follow the same pattern as the indefinite article **ein**: the invariant base form is used in all non-genitive contexts, eliminating the gender- and case-specific endings of **Standard German** (meine/meinen/meinem/meiner, keine/keinen/keinem/keiner, irgendeine/irgendeinen/irgendeinem/irgendeiner).

Genitive constructions employ either the periphrastic **von** + base form, or the bare base form after genitive prepositions such as **wegen**, **trotz**, and **statt**, paralleling the treatment of the indefinite article.

The choice among **mein, dein, sein, ihr**, etc. follows natural gender attribution of the possessor, as described in the section on pronouns.

The same invariant base form is used in pronominal (standalone) use, where **Standard German** employs inflected forms such as *meins*, *deiner*, *keins*, and *keiner*. This parallels the retention of bare **ein** in nominalized constructions, as described in the section on articles: *Das ist mein* ("That is mine"), *Kein hat es gesehen* ("None saw it").


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Ich sehe meinen Hund. | Ich sehe mein Hund. | I see my dog. |
| mit meiner Frau | mit mein Frau | with my wife |
| Ich habe keine Zeit. | Ich habe kein Zeit. | I have no time. |
| mit keinem Wort | mit kein Wort | with not a single word |
| mit irgendeiner Besorgung | mit irgendein Besorgung | with some errand |
| das Auto meines Vaters | die Auto von mein Vater | my father's car |
| wegen keines Geldes | wegen kein Geld | for lack of money |
| Das ist meins. | Das ist mein. | That is mine. |
| Keiner hat es gesehen. | Kein hat es gesehen. | None saw it. |
| Ich nehme deins. | Ich nehme dein. | I take yours. |



#### §7d. Exception for Certain Indefinite and Negative Quantifiers

While **Alman** consolidates and simplifies most determiners, some **indefinite** or **negative** quantifiers that appear as **paired words** in **Standard German** are **retained in their original forms**. In these cases, **alle** vs. **alles**, **viel** vs. **viele**, **wenig** vs. **wenige**, and **nicht** vs. **nichts**, among others, are **not** reanalyzed or merged into a single form. Instead, they follow **Standard German** usage:

1. **alle/alles**
   - **alle** → used for plural indefinite references ("all [people/things]").
   - **alles** → used for singular, abstract "everything."

2. **viel/viele**
   - **viel** → used with **uncountable** nouns or adverbially ("much," "a lot [of something uncountable]").
   - **viele** → used with **countable plural** nouns ("many").

3. **wenig/wenige**
   - **wenig** → used for **uncountable** references ("little [uncountable amount]").
   - **wenige** → used for **countable plural** references ("few").

4. **nicht/nichts**
   - **nicht** → the standard **negation** particle ("not").
   - **nichts** → the indefinite pronoun meaning "nothing."

Since **Standard German** treats these pairs as **separate lexical items** rather than mere inflectional variants, **Alman** preserves them **unchanged** for clarity and mutual intelligibility. Speakers should continue to employ each pair according to established **Standard German** conventions. This rule overrides other determiner simplifications described in other rules.

The case-inflected forms that these quantifiers take in **Standard German** (**vielen, vielem, vieler, allen, allem, aller, wenigen, wenigem**) are handled by dropping the case ending: the result is whichever member of the retained pair fits the context (uncountable or adverbial → **viel**, countable plural → **viele**, and so on). Thus *vielen Dank* becomes *viel Dank* and *in allen Fällen* becomes *in alle Fälle*, mirroring the invariant English quantifiers *much*, *many*, *all*, *little*, and *few*. Because the distinction within each pair is lexical rather than declensional, these quantifiers never take the invariant -e ending described in the section on adjectives.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| **Alle** Menschen sind eingeladen. | **Alle** Menschen sind eingeladen. |
| **Alles** hat seinen Preis. | **Alles** hat sein Preis. |
| **Viel** Wasser ist im Glas. | **Viel** Wasser ist in die Glas. |
| **Viele** Gäste kamen zur Feier. | **Viele** Gäste kamen zu die Feier. |
| **Wenig** Zeit bleibt übrig. | **Wenig** Zeit bleibt übrig. |
| **Wenige** verstehen diese Regel. | **Wenige** verstehen diese Regel. |
| Er sagt **nicht**, was er denkt. | Er sagt **nicht**, was er denkt. |
| Ich sehe **nichts**. | Ich sehe **nichts**. |
| **Vielen** Dank! | **Viel** Dank! |
| in **allen** Fällen | in **alle** Fälle |
| mit **wenigem** zufrieden | mit **wenig** zufrieden |



## Verbs and Word Order {#verbs-and-word-order}

This section describes the verbal system and syntactic structure of **Alman**, which maintains full fidelity to **Standard German** patterns. While other aspects of the grammar may be simplified, verb conjugations and word order rules remain unchanged to preserve the essential character of German syntax and ensure clear communication. One addition compensates for the loss of case marking: when both subject and object are full noun phrases, the subject must precede the object. In ditransitive constructions, the **Standard German** default of recipient before theme is retained as an interpretation convention, mirroring the English double-object construction.


### §8. Verb Conjugations and Forms {#verbs}

This paragraph details the retention of **Standard German** verb conjugation patterns in **Alman**, preserving both regular and irregular forms.


#### §8a. Verb Conjugations

The **Alman** dialect retains the full complexity of **Standard German** verb conjugations. Both regular and irregular verb forms remain unaltered, and no further simplification or regularization is introduced. All conjugated forms are used exactly as in **Standard German**.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| ich gehe, du gehst, er geht, wir gehen, ihr geht, sie gehen | ich gehe, du gehst, er geht, wir gehen, ihr geht, sie gehen |
| ich esse, du isst, er isst, wir essen, ihr esst, sie essen | ich esse, du isst, er isst, wir essen, ihr esst, sie essen |
| ich bin, du bist, er ist, wir sind, ihr seid, sie sind | ich bin, du bist, er ist, wir sind, ihr seid, sie sind |



#### §8b. Nominalized Verbs

In **Standard German**, nominalized verbs are assigned neuter gender. In **Alman**, however, nominalized verbs adhere to the same gender-collapsing principles applied to other nouns, and therefore use the invariant **die** form in non-genitive contexts. This change simplifies agreement by unifying the treatment of nominalized verbs with that of other nominal forms.

This rule ensures consistency in the treatment of nominalized forms throughout **Alman**, aligning them with the broader system of gender collapsing. Contractions involving nominalized verbs (e.g., *zum Lernen*) are resolved and simplified like any other contraction, per the contraction resolution rule in the section on articles.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Das Lernen fällt mir leicht. | Die Lernen fällt mir leicht. |
| Ich finde das Lernen spannend. | Ich finde die Lernen spannend. |
| Ich gehe in die Bibliothek zum Lernen. | Ich gehe in die Bibliothek zu die Lernen. |



### §9. Word Order and Syntax {#word-order}

This paragraph details the preservation of **Standard German** word order patterns in **Alman**, maintaining both V2 in main clauses and verb-final position in subordinate clauses. It also describes how constituent order conventions compensate for the loss of case marking in clauses with full-noun-phrase arguments.


#### §9a. Word Order

The syntactic structure of sentences in **Alman** adheres to the conventional word order of **Standard German**. In main clauses, the finite verb occupies the second position (V2 word order). In subordinate clauses, the finite verb is placed at the end of the clause (verb-final position).

Verb-first patterns are likewise retained exactly as in **Standard German**: yes/no questions (*Gehst du in die Kino?*), imperatives (*Gib mir die Buch!*), and conjunction-less conditionals (*Kommt er, so gehen wir*).

These rules ensure that while morphological aspects of nouns and determiners may be simplified, the verbal system and syntactic structure remain fully consistent with **Standard German**. Note that while word order patterns are preserved, the article and inflection rules of **Alman** still apply within these sentences.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Ich gehe heute ins Kino. | Ich gehe heute in die Kino. |
| Er hat gestern einen Brief geschrieben. | Er hat gestern ein Brief geschrieben. |
| weil ich heute ins Kino gehe | weil ich heute in die Kino gehe |
| dass er gestern einen Brief geschrieben hat | dass er gestern ein Brief geschrieben hat |
| Gehst du heute ins Kino? | Gehst du heute in die Kino? |
| Gib mir das Buch! | Gib mir die Buch! |



#### §9b. Subject-Before-Object Order for Full Noun Phrases

In **Standard German**, case marking on articles allows flexible constituent order: an object may be fronted (e.g., *Den Mann beißt der Hund*) because the accusative article identifies it unambiguously. Since **Alman** eliminates case marking on articles and nouns, this disambiguation is lost.

Therefore, when both the subject and the object of a clause are full noun phrases, the subject must precede the object. Object-fronting remains available when at least one argument is a personal pronoun (which retains case marking, see the section on pronouns) or when context makes the roles unambiguous.

This compensates for the loss of morphological case marking through fixed constituent order, paralleling the historical development of English.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Der Hund beißt den Mann. | Die Hund beißt die Mann. | The dog bites the man. |
| Den Mann beißt der Hund. | Die Hund beißt die Mann. (subject first, since object fronting would be ambiguous) | The dog bites the man. |
| Ihn beißt der Hund. | Ihn beißt die Hund. (allowed: pronoun case marks the object) | The dog bites him. |



#### §9c. Ditransitive Constructions

With ditransitive verbs such as **geben**, **zeigen**, and **schicken**, **Standard German** distinguishes the indirect object (dative) from the direct object (accusative) through case marking, while also placing the indirect object before the direct object by default when both are full noun phrases. **Alman** retains this default order, and the loss of case marking is accepted: in a sequence of two full-noun-phrase objects, the first is interpreted as the recipient and the second as the theme.

This mirrors the English double-object construction ("I give the woman the book"), which likewise functions without case marking. No strict rule is imposed; verb semantics and context resolve the roles in practice, and residual ambiguity is tolerated as it is in English.

Where explicit marking is desired, or when the theme is to precede the recipient, the recipient may instead be expressed with the preposition **an** (paralleling English "to"), and personal pronouns retain their case forms as usual (see the section on pronouns).


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Ich gebe der Frau das Buch. | Ich gebe die Frau die Buch. | I give the woman the book. |
| Er zeigt dem Kind die Stadt. | Er zeigt die Kind die Stadt. | He shows the child the city. |
| Ich gebe das Buch der Frau. | Ich gebe die Buch an die Frau. (theme first, recipient marked with 'an') | I give the book to the woman. |
| Ich gebe ihr das Buch. | Ich gebe ihr die Buch. (pronoun case marks the recipient) | I give her the book. |



## Lexical Gender Simplifications {#lexical-gender}

This section outlines the systematic elimination of gender-specific lexical forms in **Alman**, covering person-denoting nouns such as occupational titles, nationalities, and role descriptions. It describes how traditionally gendered word pairs are consolidated into a single form, using the historically masculine base form with the invariant article system to denote all referents regardless of gender.


### §10. Uniformity of Occupational and Person-Denoting Nouns {#job-titles}

This paragraph describes the elimination of gender-specific forms in occupational and person-denoting nouns, adopting a simplified system that uses the base form with the invariant article.

In **Standard German**, person-denoting nouns are frequently marked for gender with the suffix **-in**: occupations (*der Lehrer* versus *die Lehrerin*), nationalities and origins (*der Türke* versus *die Türkin*), and roles (*der Kollege* versus *die Kollegin*). In **Alman**, such distinctions are eliminated. All person-denoting nouns are rendered without gender-specific modifications; the feminine suffix is omitted, and the masculine base form is universally employed. Consequently, person-denoting nouns are treated analogously to other nouns by employing the invariant definite article **die** and the indefinite article **ein**.

Natural gender, where communicatively relevant, is conveyed by pronouns (see the section on pronouns) or by context. Relationship senses that **Standard German** carries through the suffix (*Freundin* "girlfriend") are expressed as in colloquial usage, e.g., **feste Freund**, with pronouns marking gender.

This rule ensures a uniform treatment of person-denoting nouns, reflecting the broader commitment within **Alman** to reduce gender differentiation in lexical items.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| der Lehrer / die Lehrerin | die Lehrer | teacher |
| der Bäcker / die Bäckerin | die Bäcker | baker |
| der Arzt / die Ärztin | die Arzt | doctor |
| der Türke / die Türkin | die Türke | Turk |
| der Kollege / die Kollegin | die Kollege | colleague |
| meine Freundin | mein feste Freund | my girlfriend |

