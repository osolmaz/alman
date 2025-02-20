# Alman: A Simplified Dialect of the German Language

**Version**: 0.4.1  

**Last Updated**: 2025-02-08


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
<li><a href="#job-titles">§10 Uniformity of Occupational Titles</a></li>
</ul>
</li>
</ul>

</div>


## Articles {#articles}

This section outlines the simplification of **Standard German** articles in **Alman**, eliminating grammatical gender and case distinctions. Definite articles use **die** for all non-genitive contexts and **der** for genitive, with **das** retained as a neutral demonstrative. Possession may alternatively use **von die** instead of genitive constructions. Indefinite articles adopt **ein** universally in non-genitive cases, while genitive employs **von ein** or retains **ein** with prepositions. Preposition-article contractions are resolved to full forms (e.g., *vom* → *von die*), and nominalized articles preserve **ein** as standalone forms.


### §1. Definite Article Simplification {#definite-articles}

The **Alman** dialect systematically replaces the six case-inflected definite article forms of **Standard German** through morphological regularization, employing invariant forms for non-genitive and genitive cases while eliminating case-specific noun endings. All surface realizations of definite articles in non-genitive contexts (regardless of grammatical gender, number, or case) are replaced by **die**. Genitive contexts exclusively employ **der**, accompanied by elimination of genitive noun inflections.


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


**Examples:**

| Standard German | Alman |
|------------------|-------|
| des Mannes (Genitive) | der Mann |
| der Frau (Genitive) | der Frau |
| des Kindes (Genitive) | der Kind |



#### §1c. Exception: Demonstrative Pronouns

The demonstrative pronoun 'das' retains its form in nominative, accusative, and dative contexts when functioning as a neutral demonstrative ('that'). In genitive constructions, the form 'dessen' is replaced by 'deren' while maintaining the invariant article system.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| das ist gut (demonstrative) | das ist gut |
| dessen Haus | deren Haus |



#### §1d. Optional Use of 'von die' for Possession

The prepositional construction 'von die' may substitute the genitive article 'der' to indicate possession, though 'der' remains preferable in most contexts. This periphrastic construction serves to: 
1. Resolve ambiguity in complex phrases
2. Provide phonological variety
3. Mirror colloquial speech patterns

While interchangeable, 'der' should be retained when translating original genitive constructions ('des/der') unless contextual factors favor 'von die'.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| das Haus des Mannes | die Haus der Mann / die Haus von die Mann |
| die Farbe des Autos | die Farbe der Auto / die Farbe von die Auto |
| wegen des Wetters | wegen der Wetter / wegen die Wetter |



#### §1e. Contraction Resolution

Preposition-article contractions (e.g., vom, im, zur) must be resolved to their full form prior to applying article replacement rules. The uncontracted preposition and article are then processed according to standard **Alman** article rules.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| vom Mann (von + dem) | von die Mann |
| im Garten (in + dem) | in die Garten |
| fürs Kind (für + das) | für die Kind |
| zur Frau (zu + der) | zu die Frau |



### §2. Indefinite Article Simplification {#indefinite-articles}

The **Alman** dialect regularizes indefinite article usage through morphological simplification, eliminating case and gender distinctions present in **Standard German** while maintaining semantic clarity through prepositional constructions.


#### §2a. Unified 'ein' for Non-Genitive Cases

The invariant form **ein** replaces all nominative, accusative, and dative indefinite articles (ein/eine/einen/einem), neutralizing gender and case distinctions.


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
| Diese Erfindung war eine der wichtigsten Leistungen des 20. Jahrhunderts. | Diese Erfindung war ein der wichtigsten Leistungen der 20. Jahrhundert. |



## Nouns {#nouns}

This section details **Alman**'s elimination of grammatical gender and case inflections in nouns. All nouns adopt a single invariant form across nominative, accusative, and dative cases, with genitive contexts marked by **der** instead of case endings. Plural forms retain their standard nominative/accusative morphology in all cases, while optional suffixes (-n/-s) resolve ambiguity for nouns with identical singular/plural forms. Weak noun declensions and archaic dative endings are abolished.


### §3. Noun Morphology Simplification {#noun-morphology}

The **Alman** dialect systematically eliminates grammatical gender distinctions and case-based noun inflections through morphological regularization. Nouns maintain a single invariant form across nominative, accusative, and dative cases, with genitive constructions employing a distinct analytical marker. Plural forms preserve their standard nominative/accusative morphology across all syntactic contexts.


#### §3a. Case Ending Elimination

All case-specific noun endings are removed, including:
- Genitive -s/-es markers (des Mannes → der Mann)
- Dative plural -n suffixes (den Bränden → die Brände)
- Weak noun declensional patterns


**Examples:**

| Standard German | Alman |
|------------------|-------|
| des Hundes (Genitive) | der Hund |
| den Frauen (Dative Plural) | die Frauen |
| dem Kinde (Dative, archaic) | die Kind |



#### §3b. Invariant Plural Forms

Standard nominative/accusative plural forms serve as universal plural markers, remaining unchanged in dative and genitive contexts. This preserves recognizable plural morphology while eliminating case-based modifications.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| mit den Kindern (Dative Plural) | mit die Kinder |
| wegen der Brände (Genitive Plural) | wegen der Brände / wegen die Brände |



#### §3c. No Regularization of Plural Morphology

**Alman** preserves **Standard German** plural morphology without systematic regularization, maintaining existing plural forms in all non-conflicting contexts. The dialect only intervenes in plural formation when its grammatical simplifications create morphological ambiguity between singular and plural forms, as described in the next rule.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| die Blumen (plural) | die Blumen |
| die Hunde (plural) | die Hunde |
| die Bücher (plural) | die Bücher |
| die Autos (plural) | die Autos |



#### §3d. Optional Plural Disambiguation

To resolve potential ambiguity in nouns with identical singular/plural forms, **Alman** permits optional plural marking through suffixation. When clarity requires explicit plurality indication, speakers may employ either:
- The native German -n plural suffix
- The international -s suffix

This disambiguation preserves simplified morphology while accommodating lexical items where number distinction proves pragmatically essential. Suffix choice follows speaker preference and lexical convention.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| die Computer (plural) | die Computers/die Computern |
| der Sessel (singular)/die Sessel (plural) | die Sessel (singular)/die Sesseln/die Sessels (plural) |
| die Mädchen (plural) | die Mädchens |



## Adjectives and Adverbs {#adjectives-and-adverbs}

This section details **Alman**'s regularization of adjective endings and preservation of adverbial forms. Attributive adjectives uniformly adopt an -e ending regardless of gender, number, or case, eliminating traditional declensional patterns. Adverbs and non-attributive adjectives retain their base form without inflection.


### §4. Adjectival Ending Regularization {#adjectives}

The **Alman** dialect mandates uniform morphological patterns for attributive adjectives, systematically eliminating case- and gender-based declensional variation while maintaining syntactic agreement through invariant forms.


#### §4a. Invariant -e Ending

All attributive adjectives preceding nouns receive an -e ending, regardless of:
- Grammatical gender (masculine/feminine/neuter)
- Number (singular/plural)
- Case (nominative/accusative/dative)

This replaces **Standard German**'s case-specific endings (-r/-s/-m/-n) with a single invariant form.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| guter Mann (Masculine Nominative) | gute Mann |
| eine schöne Blume (Feminine Accusative) | ein schöne Blume |
| dem kleinen Kind (Neutral Dative) | die kleine Kind |
| die roten Schuhe (Plural) | die rote Schuhe |



#### §4b. Genitive Construction Handling

Genitive constructions retain the analytical 'der' article while maintaining invariant adjectival -e endings, preserving morphological regularity across all cases.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| des guten Mannes | der gute Mann |
| der intelligenten Schüler | der intelligente Schüler |



#### §4c. Nominalized Adjectives

Nominalized adjectives, when functioning as nouns, are to be modified in the same manner as attributive adjectives. They receive the invariant **-e** ending irrespective of their syntactic role, thereby preserving uniformity with regular adjective forms. 

This rule ensures that nominalized adjectives are treated uniformly with attributive adjectives, thereby simplifying the overall adjectival system in **Alman**.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Das Gute im Menschen | Die Gute in die Menschen |
| An die Schönen (Dative, plural) | An die Schönen (-n ending kept to keep plural meaning) |
| Wegen des Bekanntes | Wegen der Bekannte / Wegen die Bekannte |
| unter anderem | unter andere |



### §5. Adverbs {#adverbs}

The **Alman** dialect maintains **Standard German**'s lack of adjectival inflection in adverbial usage, preserving unmodified forms for words functioning as verb or adjective modifiers rather than direct noun descriptors.


#### Adverbs Stay the Same

Words functioning adverbially retain their base form without receiving the -e ending required for attributive adjectives. This applies to:
- Adverbs modifying verbs
- Adjectives modifying other adjectives
- Phrasal modifiers not directly preceding a noun


**Examples:**

| Standard German | Alman |
|------------------|-------|
| schnell laufen | schnell laufen |
| das Auto fährt schnell | die Auto fährt schnell |
| frisch kaltes Wasser | frisch kalte Wasser |



## Pronouns and Determiners {#pronouns-and-determiners}

This section outlines modifications to **Standard German**'s pronominal system that prioritize natural gender attribution while maintaining case distinctions for referential clarity. Personal pronouns retain **Standard German** case forms but reference biological/social gender rather than grammatical gender. Determiners undergo simplification through gender-neutral forms in non-genitive contexts, with preserved case inflection only in personal pronouns.


### §6. Pronouns {#pronouns}

This paragraph outlines the retention of **Standard German** personal pronoun case forms while reorienting referential assignment to natural gender, rather than grammatical gender, preserving case distinctions for referential clarity.


#### §6a. Personal Pronouns: Natural Gender Attribution

Personal pronouns maintain their **Standard German** case forms but are interpreted through natural gender assignment (mirroring English conventions):
1. **er/ihn/ihm** → Refers exclusively to male persons or male-identifying entities
2. **sie/sie/ihr** → Refers exclusively to female persons or female-identifying entities
3. **es/es/ihm** → Refers to inanimate objects, abstract concepts, or entities without natural gender


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Sie ist Ärztin. (die Frau, f.) | Sie ist Ärztin. | She is a doctor. |
| Er ist Lehrer. (der Mann, m.) | Er ist Lehrer. | He is a teacher. |
| Es ist klug. (das Mädchen, n.) | Sie ist klug. | She is clever. |
| Es ist neu. (das Buch, n.) | Es ist neu. | It is new. |



#### §6b. Case Inflection Retention

Personal pronouns retain full case inflection to preserve referential clarity and syntactic precision, particularly for animate entities. The case system is intentionally aligned with **Standard German** forms, in order to preserve mutual intelligibility.

| Person       | Nominative | Accusative | Dative |
|--------------|------------|------------|--------|
| 1st Singular | ich        | mich       | mir    |
| 2nd Singular | du         | dich       | dir    |
| 3rd Masc.    | er         | ihn        | ihm    |
| 3rd Fem.     | sie        | sie        | ihr    |
| 3rd Neut.    | es         | es         | ihm    |
| 1st Plural   | wir        | uns        | uns    |
| 2nd Plural   | ihr        | euch       | euch   |
| 3rd Plural   | sie        | sie        | ihnen  |


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Ich sehe ihn. (den Mann) | Ich sehe ihn. | I see him. |
| Sie gibt ihr das Buch. | Sie gibt ihr das Buch. | She gives her the book. |



#### §6c. Gender-Neutral Referents

For entities without natural gender (objects, abstract concepts, collectives):
- **es** serves as the default singular pronoun
- **sie** (3rd plural) for mixed/unspecified gender referents
- Retains **Standard German** plural pronoun forms


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Der Computer? Er ist kaputt. | Die Computer? Es ist kaputt. | The computer? It is broken. |
| Die Universität? Sie ist groß. | Die Universität? Es ist groß. | The university? It is large. |
| Ich kaufe das Auto, weil es günstig ist. | Ich kaufe die Auto, weil es günstig ist. | I buy the car because it is affordable. |
| Die Leute sind hier. Sie sind müde. | Die Leute sind hier. Sie sind müde. | The people are here. They are tired. |



#### §6d. Reflexive Pronouns

Reflexive pronouns follow **Standard German** case forms (mich, dich, sich, uns, euch) while adhering to natural gender principles for third-person referents.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Er wäscht sich. | Er wäscht sich. | He washes himself. |
| Sie hilft sich. | Sie hilft sich. | She helps herself. |
| Es öffnet sich. | Es öffnet sich. | It opens itself. |



#### §6e. Possessive Pronouns

Possessive pronouns retain their case forms but align with natural gender attribution of their referents.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| Sein Buch (des Mannes) | Sein Buch | His book |
| Ihr Buch (der Frau) | Ihr Buch | Her book |
| Sein Buch (des Tisches) | Sein Buch | Its book |



#### §6f. Retention of Standard Interrogative Pronouns

The interrogative pronouns **wer, was, wen, wem, wessen** are retained in their **Standard German** forms without modification. These pronouns function as in **Standard German** in all contexts.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Wer bist du? | Wer bist du? |
| Was möchtest du essen? | Was möchtest du essen? |
| Wen siehst du? | Wen siehst du? |



#### §6g. Preferred Use of Prepositional Interrogative Constructions

In interrogative constructions involving prepositions, the **Alman** dialect favors the use of an uncontracted preposition preceding **was** rather than employing the compound forms. Thus, constructions such as **zu was, von was, mit was, über was, durch was**, and similar variants, are preferred over the corresponding *wo-* forms. This mirrors the usage of preposition + *what* in in English, like *to what*, *from what*, and so on.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Womit hilfst du mir? | Mit was hilfst du mir? |
| Wovon träumst du? | Von was träumst du? |
| Worüber freust du dich? | Über was freust du dich? |



### §7. Determiners and Demonstratives {#determiners}

This paragraph describes the simplification of determiner and demonstrative forms in **Alman** through gender neutralization and case reduction, while maintaining clarity through context and word order.


#### §7a. Unified Forms for Non-Genitive Contexts

In non-genitive contexts, determiners and pronouns that vary by gender and case in **Standard German** are unified by adopting the invariant feminine "die..." form. Thus, forms such as **diejenige, diese, jene, welche** (and analogous variants) are employed regardless of the gender or case of the referent.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| dieser, diese, dieses, diesen, diesem (Nominativ, Akkusativ, Dativ) | diese |
| derjenige (Nominativ, Dativ), diejenige (Nominativ, Akkusativ), dasjenige (Nominativ), denjenigen (Akkusativ), demjenigen (Dativ) | diejenige |
| derselbe (Nominativ, Dativ), dieselbe (Nominativ, Akkusativ), dasselbe (Nominativ), denselben (Akkusativ), demselben (Dativ) | dieselbe |
| derjenige Mann, der kommt | diejenige Mann, die kommt |
| dieser Weg | diese Weg |
| jener Tag | jene Tag |
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



#### §7c. Exception for Certain Indefinite and Negative Quantifiers

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



## Verbs and Word Order {#verbs-and-word-order}

This section describes the verbal system and syntactic structure of **Alman**, which maintains full fidelity to **Standard German** patterns. While other aspects of the grammar may be simplified, verb conjugations and word order rules remain unchanged to preserve the essential character of German syntax and ensure clear communication.


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

This rule ensures consistency in the treatment of nominalized forms throughout **Alman**, aligning them with the broader system of gender collapsing.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Das Lernen fällt mir leicht. | Die Lernen fällt mir leicht. |
| Ich finde das Lernen spannend. | Ich finde die Lernen spannend. |
| Ich gehe in die Bibliothek zum Lernen. | Ich gehe in die Bibliothek zum Lernen. |



### §9. Word Order and Syntax {#word-order}

This paragraph details the preservation of **Standard German** word order patterns in **Alman**, maintaining both V2 in main clauses and verb-final position in subordinate clauses.


#### Word Order

The syntactic structure of sentences in **Alman** adheres to the conventional word order of **Standard German**. In main clauses, the finite verb occupies the second position (V2 word order). In subordinate clauses, the finite verb is placed at the end of the clause (verb-final position).

These rules ensure that while morphological aspects of nouns and determiners may be simplified, the verbal system and syntactic structure remain fully consistent with **Standard German**.


**Examples:**

| Standard German | Alman |
|------------------|-------|
| Ich gehe heute ins Kino. | Ich gehe heute ins Kino. |
| Er hat gestern einen Brief geschrieben. | Er hat gestern einen Brief geschrieben. |
| weil ich heute ins Kino gehe | weil ich heute ins Kino gehe |
| dass er gestern einen Brief geschrieben hat | dass er gestern einen Brief geschrieben hat |



## Lexical Gender Simplifications {#lexical-gender}

This section outlines the systematic elimination of gender-specific lexical forms in **Alman**, particularly focusing on occupational titles and similar role descriptions. It describes how traditionally gendered word pairs are consolidated into a single form, using the historically masculine base form with the invariant article system to denote all referents regardless of gender.


### §10. Uniformity of Occupational Titles {#job-titles}

This paragraph describes the elimination of gender-specific forms in occupational titles, adopting a simplified system that uses the base form with the invariant article.

In **Standard German**, occupational titles are frequently marked for gender (e.g., *der Lehrer* versus *die Lehrerin*). In **Alman**, such distinctions are eliminated. All job or occupation titles are rendered without gender-specific modifications; the feminine suffix is omitted, and the masculine form is universally employed. Consequently, occupational titles are treated analogously to other nouns by employing the invariant definite article **die** and the indefinite article **ein**.

This rule ensures a uniform treatment of occupational titles, reflecting the broader commitment within **Alman** to reduce gender differentiation in lexical items.


**Examples:**

| Standard German | Alman | English |
|------------------|--------|---------|
| der Lehrer / die Lehrerin | die Lehrer | teacher |
| der Bäcker / die Bäckerin | die Bäcker | baker |
| der Arzt / die Ärztin | die Arzt | doctor |

