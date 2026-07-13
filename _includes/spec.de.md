# Alman: Ein vereinfachter Dialekt der deutschen Sprache

**Version**: 0.4.2  

**Stand**: 2026-07-08


## Einleitung {#introduction}

Das Genussystem der deutschen Sprache, umgangssprachlich als „der/die/das“ bezeichnet, ist für diejenigen, die Deutsch als zusätzliche Sprache (L2) lernen, notorisch schwierig. Wir vertreten die Auffassung, dass die korrekte Verwendung der Genera für die meisten L2-Lernenden nicht entscheidend ist, um in der deutschen Gesellschaft zu funktionieren. Zu diesem Zweck konstruieren wir einen Dialekt namens **Alman**, der die Genera Maskulinum, Femininum und Neutrum zu einer einzigen Kategorie vereinigt und genus- und kasusspezifische Flexionen beseitigt. Der daraus resultierende Genusverlust ähnelt demjenigen, den das Englische während der mittelenglischen Periode erfahren hat. Wir legen eine formale Beschreibung der **Alman**-Grammatik vor.

Die Idee zu **Alman** entstand aus der Erkenntnis, dass Sprachkomplexität – insbesondere in morphologischen Systemen wie dem Genus – das Sprachenlernen verlangsamen und die Integration von Zugewanderten in die Gesellschaft behindern kann. Wir vertreten die These, dass höhere grammatische Komplexität reale Kosten verursacht, darunter eine verzögerte Integration in den Arbeitsmarkt und eine verringerte Produktivität von Migranten. Indem **Alman** die Notwendigkeit beseitigt, mehrere Genusmarker zu memorieren und anzuwenden, will es diese Herausforderungen mildern, ohne die grundlegende Struktur der deutschen Syntax und des Wortschatzes zu beeinträchtigen.

Über den praktischen Nutzen für Neuankömmlinge hinaus bleibt **Alman** mit **Standarddeutsch** gegenseitig verständlich. Der Dialekt ist darauf ausgelegt, die wesentliche Wortstellung zu bewahren (Verbzweitstellung in Hauptsätzen und Verbendstellung in Nebensätzen), die vertrauten Verbkonjugationen beizubehalten und die lexikalische Klarheit insgesamt zu erhalten. Statt die gesamte Grammatik umzubauen, reduziert er die Komplexität gezielt dort, wo sie am meisten ins Gewicht fällt – nämlich beim Artikelgebrauch, bei der Substantivflexion und bei den Adjektivendungen – und erlaubt es L2-Lernenden so, schon früher selbstbewusster zu kommunizieren.

Diese Spezifikation liefert eine formale Darstellung der **Alman**-Grammatik und beschreibt im Einzelnen die Regeln für die Artikelvereinfachung, die Substantivmorphologie, die Adjektivendungen und weitere zentrale sprachliche Elemente. Indem wir diese Änderungen mit zahlreichen Beispielen veranschaulichen, wollen wir Lehrenden wie Lernenden einen klaren Fahrplan für die Übernahme dieses Dialekts bieten. Ziel ist nicht, **Standarddeutsch** zu ersetzen, sondern eine zugängliche Variante einzuführen, die die Schwierigkeiten erwachsener Lernender adressiert und letztlich ein inklusiveres und effizienteres Sprachenlernen fördert.


## Inhaltsverzeichnis

<div class="toc-container" style="
        list-style: none;
        padding-left: 0;
        margin-left: 0;
    ">

<ul style="list-style: none; padding-left: 0; margin-left: 0;">

<li><a href="#introduction">Einleitung</a>
</li>
<li><a href="#articles">Artikel</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#definite-articles">§1 Vereinfachung des bestimmten Artikels</a></li>
<li><a href="#indefinite-articles">§2 Vereinfachung des unbestimmten Artikels</a></li>
</ul>
</li>
<li><a href="#nouns">Substantive</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#noun-morphology">§3 Vereinfachung der Substantivmorphologie</a></li>
</ul>
</li>
<li><a href="#adjectives-and-adverbs">Adjektive und Adverbien</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#adjectives">§4 Regularisierung der Adjektivendungen</a></li>
<li><a href="#adverbs">§5 Adverbien</a></li>
</ul>
</li>
<li><a href="#pronouns-and-determiners">Pronomen und Begleiter</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#pronouns">§6 Pronomen</a></li>
<li><a href="#determiners">§7 Begleiter und Demonstrativa</a></li>
</ul>
</li>
<li><a href="#verbs-and-word-order">Verben und Wortstellung</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#verbs">§8 Verbkonjugationen und -formen</a></li>
<li><a href="#word-order">§9 Wortstellung und Syntax</a></li>
</ul>
</li>
<li><a href="#lexical-gender">Lexikalische Genus-Vereinfachungen</a>
<ul style="list-style: none; padding-left: 20px; margin-left: 0;">
<li><a href="#job-titles">§10 Einheitlichkeit von Berufs- und personenbezeichnenden Substantiven</a></li>
</ul>
</li>
</ul>

</div>


## Artikel {#articles}

Dieser Abschnitt beschreibt die Vereinfachung der **Standarddeutsch**-Artikel in **Alman**, bei der Genus- und Kasusunterscheidungen beseitigt werden. Bestimmte Artikel verwenden **die** für alle nicht-genitivischen Kontexte und **der** für den Genitiv, wobei **das** als neutrales Demonstrativum erhalten bleibt. Besitz kann alternativ mit **von die** statt mit Genitivkonstruktionen ausgedrückt werden. Unbestimmte Artikel übernehmen in nicht-genitivischen Fällen durchgängig **ein**, während der Genitiv **von ein** verwendet oder **ein** nach Präpositionen beibehält. Präposition-Artikel-Verschmelzungen werden ausnahmslos zu ihren vollen Formen aufgelöst (z. B. *vom* → *von die*), und nominalisierte Artikel bewahren **ein** als eigenständige Form. Die Kasusunterscheidung nach Wechselpräpositionen wird für Nominalphrasen abgeschafft.


### §1. Vereinfachung des bestimmten Artikels {#definite-articles}

Der **Alman**-Dialekt ersetzt die sechs kasusflektierten Formen des bestimmten Artikels im **Standarddeutsch** systematisch durch morphologische Regularisierung: Er verwendet invariante Formen für nicht-genitivische und genitivische Kasus und beseitigt zugleich kasusspezifische Substantivendungen. Alle Oberflächenrealisierungen bestimmter Artikel in nicht-genitivischen Kontexten (unabhängig von Genus, Numerus oder Kasus) werden durch **die** ersetzt. Genitivische Kontexte verwenden standardmäßig **der**, begleitet von der Beseitigung genitivischer Substantivflexionen.


#### §1a. Invariantes 'die' für nicht-genitivische Kasus

Alle bestimmten Artikel im Nominativ, Akkusativ und Dativ (der/die/das/den/dem) werden durch die invariante Form 'die' ersetzt; Genus- und Kasusunterscheidungen werden damit neutralisiert.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| der Mann (Nominative) | die Mann |
| den Mann (Accusative) | die Mann |
| dem Mann (Dative) | die Mann |
| die Frau (Nominative/Accusative) | die Frau |
| der Frau (Dative) | die Frau |
| das Kind (Nominative/Accusative) | die Kind |
| dem Kind (Dative) | die Kind |



#### §1b. Invariantes 'der' für den Genitiv

Alle genitivischen bestimmten Artikel (des/der) werden durch 'der' ersetzt, begleitet von der Beseitigung genitivischer Substantivflexionen.

Nach genitivischen Präpositionen wie **wegen**, **trotz**, **statt**, **während** und **innerhalb** wird der genitivische Artikel **der** bevorzugt, doch ist auch das invariante nicht-genitivische **die** akzeptabel, in Anlehnung an den umgangssprachlichen Gebrauch. Dies entspricht der Behandlung der unbestimmten Artikel nach genitivischen Präpositionen.

Das genitivische **der** ist die einzige kasusmarkierte Artikelform, die **Alman** beibehält. Dies ist eine bewusste Ausnahme von der ansonsten vollständigen Beseitigung kasusspezifischer Flexion: Sie hält adnominale Genitivkonstruktionen (*die Haus der Mann*) erkennbar und mit **Standarddeutsch** gegenseitig verständlich. Unbestimmte Artikel, Possessivbegleiter und **kein** beseitigen die Genitivmarkierung stattdessen vollständig durch Periphrase, wie in den jeweiligen Regeln beschrieben.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| des Mannes (Genitive) | der Mann |
| der Frau (Genitive) | der Frau |
| des Kindes (Genitive) | der Kind |
| wegen des Wetters | wegen der Wetter / wegen die Wetter |



#### §1c. Ausnahme: Demonstrativpronomen

Das Demonstrativpronomen 'das' behält seine Form in nominativischen, akkusativischen und dativischen Kontexten, wenn es als neutrales Demonstrativum ('that') fungiert. In Genitivkonstruktionen wird die Form 'dessen' durch 'deren' ersetzt, unter Beibehaltung des invarianten Artikelsystems.

Diese Ausnahme ist strikt positional: Sie gilt nur, wenn 'das' allein steht, ohne nachfolgendes Substantiv. Unmittelbar vor einem Substantiv gelten stets die Artikelregeln, und jede Form des bestimmten Artikels wird zu **die**, unabhängig von Betonung oder demonstrativer Absicht. Demonstrative Kraft vor einem Substantiv wird mit **diese** oder **jene** ausgedrückt (siehe den Abschnitt über Begleiter), analog zum englischen *this/that* + Substantiv. Ebenso werden die alleinstehend gebrauchten **Standarddeutsch**-Demonstrativpronomen 'der', 'den' und 'dem' (*Der war's!*) durch das invariante **die** ersetzt, im Einklang mit der Behandlung der Relativpronomen.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| das ist gut (demonstrative) | das ist gut |
| dessen Haus | deren Haus |
| DAS Buch will ich! (stressed, attributive) | Diese Buch will ich! |
| Der war's! (standalone demonstrative) | Die war's! |



#### §1d. Fakultatives 'von die' für Besitz

Die präpositionale Konstruktion 'von die' kann den genitivischen Artikel 'der' ersetzen, um Besitz anzuzeigen, wobei 'der' in den meisten Kontexten vorzuziehen bleibt. Diese periphrastische Konstruktion dient dazu:
1. Mehrdeutigkeit in komplexen Phrasen aufzulösen
2. Phonologische Abwechslung zu bieten
3. Umgangssprachliche Sprechmuster abzubilden

Obwohl austauschbar, sollte 'der' beibehalten werden, wenn ursprüngliche Genitivkonstruktionen ('des/der') übersetzt werden, sofern nicht kontextuelle Faktoren 'von die' begünstigen.

Eine Apposition stimmt in der Konstruktion mit ihrer Bezugsnominalphrase überein. Wird ein Genitiv periphrastisch mit **von** wiedergegeben, nimmt auch eine Apposition dazu die nicht-genitivische Form an; wird der Genitiv **der** verwendet, bleibt die Apposition im Genitiv. Dasselbe gilt für Appositionen nach einem beibehaltenen Eigennamen-Genitiv (siehe den Abschnitt über Substantive). Possessive Genitive (*seines Vaters*) haben keine **der**-Form und sind stets periphrastisch (siehe die Regel zu Possessivbegleitern im Abschnitt über Begleiter); ihre Appositionen nehmen daher immer die nicht-genitivische Form an.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| das Haus des Mannes | die Haus der Mann / die Haus von die Mann |  |
| die Farbe des Autos | die Farbe der Auto / die Farbe von die Auto |  |
| bei den Lehren seines Vaters, des Gelehrten | bei die Lehren von sein Vater, die Gelehrte | in the teachings of his father, the scholar |
| die Werke Goethes, des Dichters | die Werke Goethes, der Dichter / die Werke von Goethe, die Dichter | the works of Goethe, the poet |



#### §1e. Auflösung von Verschmelzungen

Präposition-Artikel-Verschmelzungen (z. B. vom, im, zur) müssen zu ihrer vollen Form aufgelöst werden, bevor die Artikelersetzungsregeln angewendet werden. Die entschmolzene Präposition und der Artikel werden dann nach den üblichen **Alman**-Artikelregeln verarbeitet.

Diese Regel gilt einheitlich, auch für Verschmelzungen in festen Wendungen wie **zum Beispiel** und **zum** + nominalisierter Infinitiv; Lernenden bleibt so das Auswendiglernen einer Liste ausgenommener Ausdrücke erspart. Die einzige Ausnahme ist die adverbiale Superlativkonstruktion **am** + Superlativ (z. B. **am besten**, **am schnellsten**): Sie wird nicht als Präposition-Artikel-Verschmelzung behandelt, sondern durch den bloßen Superlativstamm ersetzt, wie im Abschnitt über Adjektive und Adverbien beschrieben.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| vom Mann (von + dem) | von die Mann |
| im Garten (in + dem) | in die Garten |
| fürs Kind (für + das) | für die Kind |
| zur Frau (zu + der) | zu die Frau |
| zum Beispiel (zu + dem) | zu die Beispiel |
| zum Lernen (zu + dem) | zu die Lernen |



#### §1f. Wechselpräpositionen

Im **Standarddeutsch** regieren die Wechselpräpositionen (**in, an, auf, über, unter, vor, hinter, neben, zwischen**) den Akkusativ, um Bewegung auf ein Ziel hin auszudrücken, und den Dativ, um statische Lage auszudrücken. Da **Alman** Akkusativ- und Dativartikel im invarianten **die** zusammenfallen lässt, ist diese kasusbasierte Unterscheidung für Nominalphrasen abgeschafft: *in die Kino* deckt sowohl „ins Kino (hinein)“ als auch „im Kino“ ab.

Wo die Unterscheidung zwischen Richtung und Lage kommunikativ wesentlich ist, wird sie lexikalisch ausgedrückt, z. B. durch Richtungsadverbien (**hinein, hinaus, hin**) oder Ortsadverbien (**drinnen, drin, dort**), oder durch die Semantik des Verbs aufgelöst.

Man beachte, dass Personalpronomen die Kasusmarkierung behalten (siehe den Abschnitt über Pronomen); die Unterscheidung bleibt daher in pronominalen Konstruktionen verfügbar (*auf ihn* vs. *auf ihm*).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Ich gehe ins Kino. (Accusative, motion) | Ich gehe in die Kino. | I go to the cinema. |
| Ich bin im Kino. (Dative, location) | Ich bin in die Kino. | I am at the cinema. |
| Er legt das Buch auf den Tisch. | Er legt die Buch auf die Tisch. | He puts the book on the table. |
| Das Buch liegt auf dem Tisch. | Die Buch liegt auf die Tisch. | The book lies on the table. |



### §2. Vereinfachung des unbestimmten Artikels {#indefinite-articles}

Der **Alman**-Dialekt regularisiert den Gebrauch des unbestimmten Artikels durch morphologische Vereinfachung: Die im **Standarddeutsch** vorhandenen Kasus- und Genusunterscheidungen werden beseitigt, während die semantische Klarheit durch präpositionale Konstruktionen erhalten bleibt.


#### §2a. Einheitliches 'ein' für nicht-genitivische Kasus

Die invariante Form **ein** ersetzt alle unbestimmten Artikel im Nominativ, Akkusativ und Dativ (ein/eine/einen/einem); Genus- und Kasusunterscheidungen werden damit neutralisiert.

Diese Regel gilt nur für den unbestimmten Artikel. Die homographen obliquen Formen des Indefinitpronomens **man** (*Das ärgert einen*) sind Pronomen, behalten ihre Kasusmarkierung und werden im Abschnitt über Pronomen beschrieben.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| ein Mann (Nominative) | ein Mann |
| eine Frau (Nominative) | ein Frau |
| einen Hund (Accusative) | ein Hund |
| einem Kind (Dative) | ein Kind |



#### §2b. Genitiv

Unbestimmte Genitivkonstruktionen verwenden entweder:
1. die Präpositionalphrase **von ein** + Substantiv
2. nur **ein**, je nach Kontext, z. B. nach genitivischen Präpositionen wie **wegen**, **trotz**, **statt**, **innerhalb** und so weiter.

Die periphrastische **von ein**-Konstruktion wird bevorzugt, wenn die Wahrung der Unbestimmtheit entscheidend ist.

Dies systematisiert bestehende umgangssprachliche Muster, die Präpositionalphrasen mit Dativformen verwenden, und ersetzt diese durch das invariante **ein**.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| das Buch eines Freundes | die Buch von ein Freund |
| wegen eines Problems | wegen ein Problem |



#### §2c. Nominalisierte Artikel

Die Form **ein** bleibt in nominalisierten Konstruktionen erhalten, in denen der Artikel eigenständig ohne nachfolgendes Substantiv fungiert.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Diese Erfindung war eine der wichtigsten Leistungen des 20. Jahrhunderts. | Diese Erfindung war ein der wichtigste Leistungen der 20. Jahrhundert. |



## Substantive {#nouns}

Dieser Abschnitt beschreibt im Einzelnen, wie **Alman** grammatisches Genus und Kasusflexion bei Substantiven beseitigt. Alle Substantive nehmen eine einzige invariante Form über Nominativ, Akkusativ und Dativ hinweg an; genitivische Kontexte werden durch **der** statt durch Kasusendungen markiert. Das pränominale Genitiv-s von Eigennamen (*Annas Buch*) ist ausgenommen und bleibt erhalten, analog zum englischen Possessiv *'s*. Pluralformen behalten in allen Kasus ihre standardsprachliche Nominativ-/Akkusativmorphologie, während ein fakultatives -s-Suffix Mehrdeutigkeit bei Substantiven mit identischen Singular- und Pluralformen auflöst. Schwache Substantivdeklinationen und archaische Dativendungen werden abgeschafft.


### §3. Vereinfachung der Substantivmorphologie {#noun-morphology}

Der **Alman**-Dialekt beseitigt systematisch Genusunterscheidungen und kasusbasierte Substantivflexionen durch morphologische Regularisierung. Substantive behalten eine einzige invariante Form über Nominativ, Akkusativ und Dativ hinweg; Genitivkonstruktionen verwenden einen eigenen analytischen Marker. Pluralformen bewahren ihre standardsprachliche Nominativ-/Akkusativmorphologie in allen syntaktischen Kontexten.


#### §3a. Beseitigung der Kasusendungen

Alle kasusspezifischen Substantivendungen werden entfernt, darunter:
- Genitiv-Marker -s/-es an Gattungsnamen (des Mannes → der Mann); das pränominale Genitiv-s von Eigennamen ist ausgenommen und bleibt erhalten (siehe die Regel zum Eigennamen-Genitiv)
- Dativ-Plural-Suffixe -n (den Bränden → die Brände)
- Schwache Deklinationsmuster: Die -n/-en-Endungen, die schwache Substantive wie **Kollege**, **Mensch**, **Student** und **Junge** in nicht-nominativischen Singularkasus annehmen, entfallen; der Nominativ Singular dient als invariante Singularform (den Kollegen → die Kollege). Der -n/-en-Plural dieser Substantive ist davon unberührt und bleibt als Pluralmarker erhalten (siehe die Regel zu invarianten Pluralformen), sodass der Singular *die Kollege* vom Plural *die Kollegen* unterschieden bleibt.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| des Hundes (Genitive) | der Hund |
| den Frauen (Dative Plural) | die Frauen |
| dem Kinde (Dative, archaic) | die Kind |
| den Kollegen (Accusative, weak noun) | die Kollege |
| dem Studenten (Dative, weak noun) | die Student |
| im Menschen (Dative, weak noun) | in die Mensch |
| die Kollegen (Plural) | die Kollegen (-en retained as plural marker) |



#### §3b. Beibehaltung des Eigennamen-Genitivs -s

Das pränominale Genitiv-s von Eigennamen ist von der Beseitigung der Kasusendungen ausgenommen und bleibt unverändert erhalten, analog zum englischen Possessiv *'s* (*Annas Buch* „Anna's book“). Da Eigennamen keinen Artikel tragen, kann der analytische Genitivmarker **der** auf sie nicht angewendet werden; das namensfinale -s gehört daher nicht zu dem Artikel-und-Kasus-System, das **Alman** beseitigt, und stellt für Sprecher, die mit der englischen Konstruktion vertraut sind, keine zusätzliche Lernlast dar.

Dies gilt für Personennamen ebenso wie für Ortsnamen und andere possessiv gebrauchte Eigennamen. Die orthographische Konvention des **Standarddeutsch** für Namen, die auf einen s-Laut enden — ein bloßer Apostroph anstelle des -s (*Hans' Fahrrad*) —, bleibt ebenfalls erhalten.

Wie bei anderen Possessivkonstruktionen bleibt die periphrastische **von**-Konstruktion als Alternative verfügbar (siehe die Regel zum fakultativen 'von die' für Besitz im Abschnitt über Artikel).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Annas Buch | Annas Buch | Anna's book |
| Peters Auto | Peters Auto / die Auto von Peter | Peter's car |
| Hans' Fahrrad | Hans' Fahrrad | Hans's bicycle |
| Deutschlands Hauptstadt | Deutschlands Hauptstadt / die Hauptstadt von Deutschland | Germany's capital |



#### §3c. Invariante Pluralformen

Die standardsprachlichen Nominativ-/Akkusativ-Pluralformen dienen als universelle Pluralmarker und bleiben in dativischen und genitivischen Kontexten unverändert. Dies bewahrt eine wiedererkennbare Pluralmorphologie und beseitigt zugleich kasusbedingte Veränderungen.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| mit den Kindern (Dative Plural) | mit die Kinder |
| wegen der Brände (Genitive Plural) | wegen der Brände / wegen die Brände |



#### §3d. Keine Regularisierung der Pluralmorphologie

**Alman** bewahrt die Pluralmorphologie des **Standarddeutsch** ohne systematische Regularisierung und behält bestehende Pluralformen in allen konfliktfreien Kontexten bei. Der Dialekt greift nur dann in die Pluralbildung ein, wenn seine grammatischen Vereinfachungen morphologische Mehrdeutigkeit zwischen Singular- und Pluralformen erzeugen, wie in der nächsten Regel beschrieben.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| die Blumen (plural) | die Blumen |
| die Hunde (plural) | die Hunde |
| die Bücher (plural) | die Bücher |
| die Autos (plural) | die Autos |



#### §3e. Fakultative Pluraldisambiguierung

Um mögliche Mehrdeutigkeit bei Substantiven mit identischen Singular- und Pluralformen aufzulösen, erlaubt **Alman** eine fakultative Pluralmarkierung mit dem Suffix **-s**, analog zum englischen Plural. Wenn die Klarheit eine explizite Pluralkennzeichnung erfordert, wird das -s-Suffix an die invariante Form angehängt.

Das -s-Suffix ist der einzige Disambiguierungsmarker. Das -n-Suffix wird für diesen Zweck nicht verwendet: Da die Beseitigung der Kasusendungen das Dativ-Plural-n des **Standarddeutsch** abschafft, würde die Wiederverwendung von -n als Pluralmarker derselben Endung in den beiden Sprachen zwei verschiedene Bedeutungen geben.

Diese Disambiguierung bewahrt die vereinfachte Morphologie und trägt zugleich lexikalischen Einheiten Rechnung, bei denen die Numerusunterscheidung pragmatisch wesentlich ist.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| die Computer (plural) | die Computers |
| der Sessel (singular)/die Sessel (plural) | die Sessel (singular)/die Sessels (plural) |
| die Mädchen (plural) | die Mädchens |



## Adjektive und Adverbien {#adjectives-and-adverbs}

Dieser Abschnitt beschreibt das einheitliche formbasierte Prinzip von **Alman** für die Adjektiv- und Adverbmorphologie: Jede deklinierte Adjektivendung des **Standarddeutsch** wird durch das invariante -e ersetzt, und Formen ohne Deklinationsendung bleiben unverändert. Das Prinzip gilt nach der Oberflächenform, nicht nach der syntaktischen Funktion — attributive Adjektive (gute Mann), nominalisierte Adjektive (die Gute) und feste adverbiale Wendungen (unter anderem → unter andere) erhalten alle -e, während prädikative Adjektive und Adverbien bleiben, wie sie sind. Die einzige Ausnahme ist der adverbiale Superlativ, der die **Standarddeutsch**-Konstruktion **am** + Superlativ durch den bloßen Superlativstamm ersetzt (am besten → best).


### §4. Regularisierung der Adjektivendungen {#adjectives}

Der **Alman**-Dialekt regelt die Adjektivmorphologie über ein einziges formbasiertes Prinzip: Jede deklinierte Adjektivendung des **Standarddeutsch** wird durch das invariante -e ersetzt, und Formen ohne Deklinationsendung bleiben unverändert. Lernende müssen ein Adjektiv nie nach seiner syntaktischen Funktion klassifizieren; die Oberflächenform allein bestimmt das Ergebnis.


#### §4a. Invariantes -e für alle Deklinationsendungen

Wann immer ein Adjektiv im **Standarddeutsch** eine Deklinationsendung trägt — eine Endung, die Kasus, Genus oder Numerus markiert —, wird diese Endung in **Alman** durch das invariante **-e** ersetzt. Dies gilt einheitlich, unabhängig von Funktion oder Position des Adjektivs: Attributive Adjektive vor Substantiven, nominalisierte Adjektive, nach **etwas**, **nichts** und **alles** nominalisierte Adjektive (*etwas Gutes*, *nichts Neues*) sowie Adjektive in festen adverbialen Wendungen (**unter anderem**, **vor kurzem**, **seit langem**, **von neuem**, **bei weitem**, **ohne weiteres**) werden alle gleich behandelt.

Adjektive, die im **Standarddeutsch** keine Deklinationsendung tragen — prädikative Adjektive und adverbial gebrauchte Formen —, bleiben unverändert; es wird keine Endung hinzugefügt (siehe den Abschnitt über Adverbien).

Komparationssuffixe (**-er**, **-st**) sind Wortbildung und keine Deklination und bleiben erhalten: *schneller laufen* bleibt *schneller laufen*. Ebenso tragen lexikalisierte Adverbien wie **anders** oder **meistens** keine Deklinationsendung und bleiben unverändert.

Die einzige Ausnahme von diesem Prinzip ist der adverbiale Superlativ **am** + Superlativ, der durch den bloßen Superlativstamm ersetzt wird (siehe den Abschnitt über Adverbien).


**Beispiele:**

| Standarddeutsch | Alman |
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



#### §4b. Behandlung von Genitivkonstruktionen

Genitivkonstruktionen behalten den analytischen Artikel 'der' bei und bewahren zugleich die invarianten adjektivischen -e-Endungen; die morphologische Regelmäßigkeit bleibt so über alle Kasus hinweg erhalten.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| des guten Mannes | der gute Mann |
| der intelligenten Schüler | der intelligente Schüler |



#### §4c. Nominalisierte Adjektive

Nominalisierte Adjektive erhalten, wenn sie als Substantive fungieren, im Singular die invariante Endung **-e**, unabhängig von ihrer syntaktischen Rolle; die Einheitlichkeit mit regulären Adjektivformen bleibt so gewahrt.

Im Plural verhalten sich nominalisierte Adjektive wie Substantive: Im Einklang mit der Bewahrung der Substantiv-Pluralmorphologie, die im Abschnitt über Substantive beschrieben ist, behalten sie die Endung **-en** als Pluralmarker (nicht als Kasusmarker). Dies unterscheidet *die Schöne* (Singular) von *die Schönen* (Plural).


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Das Gute im Menschen | Die Gute in die Mensch |
| An die Schönen (Dative, plural) | An die Schönen (-en retained as plural marker) |
| Wegen des Bekannten | Wegen der Bekannte / Wegen die Bekannte |
| unter anderem | unter andere |



### §5. Adverbien {#adverbs}

Adverbien tragen im **Standarddeutsch** keine Deklinationsendungen und bleiben daher in **Alman** unverändert. Dies ist eine direkte Folge des formbasierten Prinzips im Abschnitt über Adjektive — Endungen werden zu -e, endungslose Formen bleiben, wie sie sind — und kein eigener Mechanismus. Die eine Sonderkonstruktion ist der adverbiale Superlativ, bei dem die kasusmarkierte Konstruktion **am** + Superlativ durch den bloßen Superlativstamm ersetzt wird.


#### §5a. Adverbien bleiben unverändert

Adverbial gebrauchte Wörter tragen im **Standarddeutsch** keine Deklinationsendung und bleiben daher in **Alman** unverändert. Dies folgt unmittelbar aus dem formbasierten Prinzip im Abschnitt über Adjektive: Nur vorhandene Deklinationsendungen werden durch -e ersetzt, und wo keine Endung ist, ändert sich nichts. Dies gilt für:
- Adverbien, die Verben modifizieren
- Adjektive, die andere Adjektive modifizieren
- Phrasale Modifikatoren, die nicht unmittelbar vor einem Substantiv stehen

Feste adverbiale Wendungen, die ein dekliniertes Adjektiv enthalten (**unter anderem**, **vor kurzem** und ähnliche), sind nicht ausgenommen: Ihre Endungen werden nach demselben Prinzip zum invarianten -e (unter andere, vor kurze).


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| schnell laufen | schnell laufen |
| das Auto fährt schnell | die Auto fährt schnell |
| frisch kaltes Wasser | frisch kalte Wasser |



#### §5b. Adverbiale Superlative mit bloßem Stamm

Die adverbiale Superlativkonstruktion des **Standarddeutsch** **am** + Superlativ (am besten, am schnellsten) wird durch den bloßen Superlativstamm ersetzt: **best**, **schnellst** und so weiter. Dies entspricht dem englischen adverbialen Superlativ („I swim best“) und entfernt die kasusmarkierte Verschmelzung **am** (an + dem) vollständig aus der Konstruktion, im Einklang mit der Beseitigung kasusmarkierter Artikel an anderer Stelle in **Alman**.

Die Variante **an** + bloßer Stamm (z. B. **an best**) ist ebenfalls akzeptabel und bewahrt den präpositionalen Rhythmus der **Standarddeutsch**-Konstruktion für Sprecher, die ihn bevorzugen. Der bloße Stamm ist die bevorzugte Form.

Diese Regel hat Vorrang vor der Regel zur Auflösung von Verschmelzungen im Abschnitt über Artikel: **am** in adverbialen Superlativen wird nicht zu **an die** aufgelöst. Attributive Superlative sind nicht betroffen und folgen der regulären Regel der invarianten -e-Endung (die beste Schwimmer).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Ich schwimme am besten. | Ich schwimme best. / Ich schwimme an best. | I swim best. |
| Er läuft am schnellsten. | Er läuft schnellst. / Er läuft an schnellst. | He runs fastest. |
| Am liebsten esse ich Pizza. | Liebst esse ich Pizza. / An liebst esse ich Pizza. | I like eating pizza most. |
| Dieses Auto gefällt mir am meisten. | Diese Auto gefällt mir meist. / Diese Auto gefällt mir an meist. | I like this car the most. |



## Pronomen und Begleiter {#pronouns-and-determiners}

Dieser Abschnitt beschreibt Änderungen am Pronominalsystem des **Standarddeutsch**, die der Zuweisung nach natürlichem Geschlecht Vorrang geben und zugleich Kasusunterscheidungen für referentielle Klarheit bewahren. Personalpronomen behalten die **Standarddeutsch**-Kasusformen, beziehen sich aber auf das biologische/soziale Geschlecht statt auf das grammatische Genus; für Personen unbekannten oder generischen Geschlechts fungiert das plurale **sie** als singulares *they*, analog zum Englischen. Relativpronomen fallen im invarianten **die** zusammen (Genitiv **deren**) und folgen damit dem Artikelsystem. Begleiter, Possessivbegleiter, der Negativartikel **kein** und andere **ein**-Komposita werden durch invariante Formen in nicht-genitivischen Kontexten vereinfacht; Kasusflexion bleibt nur bei den Personalpronomen erhalten.


### §6. Pronomen {#pronouns}

Dieser Paragraph beschreibt die Beibehaltung der **Standarddeutsch**-Kasusformen der Personalpronomen bei gleichzeitiger Neuausrichtung der referentiellen Zuweisung auf das natürliche Geschlecht statt auf das grammatische Genus; Kasusunterscheidungen bleiben für referentielle Klarheit erhalten.


#### §6a. Personalpronomen: Zuweisung nach natürlichem Geschlecht

Personalpronomen behalten ihre **Standarddeutsch**-Kasusformen, werden aber nach natürlichem Geschlecht interpretiert (analog zu den englischen Konventionen):
1. **er/ihn/ihm** → bezieht sich ausschließlich auf männliche Personen oder sich männlich identifizierende Wesen
2. **sie/sie/ihr** → bezieht sich ausschließlich auf weibliche Personen oder sich weiblich identifizierende Wesen
3. **es/es/ihm** → bezieht sich auf unbelebte Gegenstände, abstrakte Konzepte oder andere Nicht-Personen ohne natürliches Geschlecht

Personen, deren Geschlecht unbekannt, unbestimmt oder generisch ist, werden mit dem pluralen **sie** als singularem *they* bezeichnet, wie in der Regel zu geschlechtsneutralen Referenten beschrieben.

Man beachte: Wird der Referent durch eine Berufsbezeichnung beschrieben, folgt die Bezeichnung selbst den Einheitlichkeitsregeln im Abschnitt über lexikalische Genus-Vereinfachungen, während das Pronomen dem natürlichen Geschlecht folgt.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Sie ist nett. (die Frau, f.) | Sie ist nett. | She is nice. |
| Er ist nett. (der Mann, m.) | Er ist nett. | He is nice. |
| Es ist klug. (das Mädchen, n.) | Sie ist klug. | She is clever. |
| Es ist neu. (das Buch, n.) | Es ist neu. | It is new. |



#### §6b. Beibehaltung der Kasusflexion

Personalpronomen behalten die vollständige Kasusflexion, um referentielle Klarheit und syntaktische Präzision zu bewahren, insbesondere bei belebten Wesen. Das Kasussystem ist bewusst an den **Standarddeutsch**-Formen ausgerichtet, um die gegenseitige Verständlichkeit zu erhalten.

| Person        | Nominativ | Akkusativ | Dativ |
|---------------|------------|------------|--------|
| 1. Singular  | ich        | mich       | mir    |
| 2. Singular  | du         | dich       | dir    |
| 3. Mask.     | er         | ihn        | ihm    |
| 3. Fem.      | sie        | sie        | ihr    |
| 3. Neut.     | es         | es         | ihm    |
| 1. Plural    | wir        | uns        | uns    |
| 2. Plural    | ihr        | euch       | euch   |
| 3. Plural    | sie        | sie        | ihnen  |
| Höflichkeitsform (2.)  | Sie        | Sie        | Ihnen  |

Das Anredepronomen **Sie** (mit Dativ **Ihnen** und Possessiv **Ihr**) bleibt genau wie im **Standarddeutsch** erhalten, einschließlich seiner Großschreibung.

Das Indefinitpronomen **man** behält ebenfalls sein vollständiges **Standarddeutsch**-Paradigma, einschließlich seiner obliquen Formen **einen** (Akkusativ) und **einem** (Dativ). Dies sind Pronomenformen, keine Artikel, und sie sind daher von der Vereinfachung des unbestimmten Artikels im Abschnitt über Artikel nicht betroffen.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Ich sehe ihn. (den Mann) | Ich sehe ihn. | I see him. |
| Sie gibt ihr das Buch. | Sie gibt ihr die Buch. | She gives her the book. |
| Können Sie mir helfen? | Können Sie mir helfen? | Can you help me? (formal) |
| Ich danke Ihnen für das Geschenk. | Ich danke Ihnen für die Geschenk. | I thank you for the gift. (formal) |
| Das ärgert einen. | Das ärgert einen. | That annoys one. |
| Das hilft einem sehr. | Das hilft einem sehr. | That helps one a lot. |



#### §6c. Geschlechtsneutrale Referenten

Für Wesen ohne natürliches Geschlecht (Gegenstände, abstrakte Konzepte, Institutionen):
- **es** dient als Standard-Singularpronomen
- die **Standarddeutsch**-Pluralpronomen bleiben erhalten (**sie** für plurale Referenten, einschließlich Gruppen gemischten oder unbestimmten Geschlechts)

Für **Personen**, deren Geschlecht unbekannt, unbestimmt oder generisch ist, wird die dritte Person Plural **sie** mit pluraler Verbkongruenz verwendet, auch wenn der Referent singularisch ist. Dies entspricht dem englischen singularen *they* („Someone called. They were friendly.“) und gilt sowohl für generische personenbezeichnende Ausdrücke (*der Mensch*, *jeder*, *jemand*, *niemand*) als auch für bestimmte Personen unbekannten Geschlechts. Akkusativ und Dativ folgen dem Pluralparadigma (**sie**/**ihnen**), und das zugehörige Possessiv ist **ihr**. Wo die plurale Lesart tatsächlich irreführen würde, können Sprecher umformulieren, genau wie im Englischen.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Der Computer? Er ist kaputt. | Die Computer? Es ist kaputt. | The computer? It is broken. |
| Die Universität? Sie ist groß. | Die Universität? Es ist groß. | The university? It is large. |
| Ich kaufe das Auto, weil es günstig ist. | Ich kaufe die Auto, weil es günstig ist. | I buy the car because it is affordable. |
| Die Leute sind hier. Sie sind müde. | Die Leute sind hier. Sie sind müde. | The people are here. They are tired. |
| Der Mensch? Er ist ein Rätsel. | Die Mensch? Sie sind ein Rätsel. | The human being? They are a riddle. |
| Jemand hat angerufen. Er war freundlich. | Jemand hat angerufen. Sie waren freundlich. | Someone called. They were friendly. |
| Jeder tut, was er kann. | Jede tut, was sie können. | Everyone does what they can. |



#### §6d. Reflexivpronomen

Reflexivpronomen folgen den **Standarddeutsch**-Kasusformen (mich, dich, sich, uns, euch) und richten sich bei Referenten in der dritten Person nach den Prinzipien des natürlichen Geschlechts.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Er wäscht sich. | Er wäscht sich. | He washes himself. |
| Sie hilft sich. | Sie hilft sich. | She helps herself. |
| Es öffnet sich. | Es öffnet sich. | It opens itself. |



#### §6e. Possessivpronomen

Die Wahl unter den Possessivpronomen (**mein, dein, sein, ihr, unser, euer, Ihr**) folgt der Zuweisung nach dem natürlichen Geschlecht des Besitzers. Für Besitzer unbekannten, unbestimmten oder generischen Geschlechts wird **ihr** verwendet, im Einklang mit dem singularen *they* aus der Regel zu geschlechtsneutralen Referenten. Ihre Endungen folgen den Begleiterregeln: In allen nicht-genitivischen Kontexten wird die invariante Grundform verwendet (siehe den Abschnitt über Begleiter).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Sein Buch (des Mannes) | Sein Buch | His book |
| Ihr Buch (der Frau) | Ihr Buch | Her book |
| Sein Buch (des Tisches) | Sein Buch | Its book |



#### §6f. Relativpronomen

Relativpronomen folgen derselben Vereinfachung wie die bestimmten Artikel. Alle nicht-genitivischen Relativpronomenformen (der/die/das/den/dem) werden durch die invariante Form **die** ersetzt, unabhängig von Genus, Numerus oder Kasusrolle des Referenten im Relativsatz. Die genitivischen Relativpronomen **dessen** und **deren** werden beide durch **deren** ersetzt, im Einklang mit der Behandlung der genitivischen Demonstrativa im Abschnitt über Artikel.

Da das invariante **die** die Kasusrolle des relativierten Elements nicht mehr markiert, wird Mehrdeutigkeit zwischen Subjekt- und Objektrelativsätzen durch Verbkongruenz und Kontext aufgelöst; bei echter Mehrdeutigkeit können Sprecher mit einem Personalpronomen im Relativsatz oder einer periphrastischen Konstruktion umformulieren.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| der Mann, der dort steht | die Mann, die dort steht | the man who is standing there |
| der Mann, den ich sehe | die Mann, die ich sehe | the man whom I see |
| der Mann, dem ich helfe | die Mann, die ich helfe | the man whom I help |
| das Kind, das spielt | die Kind, die spielt | the child who is playing |
| die Frau, deren Auto kaputt ist | die Frau, deren Auto kaputt ist | the woman whose car is broken |
| der Mann, dessen Haus groß ist | die Mann, deren Haus groß ist | the man whose house is large |



#### §6g. Beibehaltung der standardsprachlichen Interrogativpronomen

Die Interrogativpronomen **wer, was, wen, wem, wessen** bleiben in ihren **Standarddeutsch**-Formen unverändert erhalten. Diese Pronomen funktionieren in allen Kontexten wie im **Standarddeutsch**.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Wer bist du? | Wer bist du? |
| Was möchtest du essen? | Was möchtest du essen? |
| Wen siehst du? | Wen siehst du? |



#### §6h. Präpositionale Interrogativkonstruktionen

In Interrogativkonstruktionen mit Präpositionen kann anstelle der zusammengesetzten *wo-*Formen eine unverschmolzene Präposition vor **was** verwendet werden: **zu was, von was, mit was, über was, durch was** und ähnliche Varianten. Dies entspricht dem Gebrauch von Präposition + *what* im Englischen, etwa *to what*, *from what* und so weiter.

Die *wo-*Komposita des **Standarddeutsch** bleiben voll akzeptabel, da sie keine Genus- oder Kasusflexion tragen und keine zusätzliche Lernlast darstellen. Beide Varianten sind frei austauschbar, genau wie bei den pronominalen *da-*Komposita in der folgenden Regel.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Womit hilfst du mir? | Mit was hilfst du mir? / Womit hilfst du mir? |
| Wovon träumst du? | Von was träumst du? / Wovon träumst du? |
| Worüber freust du dich? | Über was freust du dich? / Worüber freust du dich? |



#### §6i. Pronominaladverbien (da-Komposita)

Parallel zur Behandlung der interrogativen *wo-*Formen können die mit *da-* gebildeten Pronominaladverbien (**damit, davon, darüber, dafür, daran** und ähnliche Varianten) durch die unverschmolzene Präposition gefolgt vom Demonstrativum **das** ersetzt werden (z. B. **mit das, von das, über das**), im Einklang mit der Beibehaltung des neutralen Demonstrativums im Abschnitt über Artikel.

Die *da-*Komposita des **Standarddeutsch** bleiben voll akzeptabel, da sie keine Genus- oder Kasusflexion tragen und keine zusätzliche Lernlast darstellen. Beide Varianten sind frei austauschbar.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Ich bin damit einverstanden. | Ich bin mit das einverstanden. / Ich bin damit einverstanden. |
| Davon habe ich gehört. | Von das habe ich gehört. / Davon habe ich gehört. |
| Er freut sich darüber. | Er freut sich über das. / Er freut sich darüber. |



### §7. Begleiter und Demonstrativa {#determiners}

Dieser Paragraph beschreibt die Vereinfachung der Begleiter- und Demonstrativformen in **Alman** durch Genusneutralisierung und Kasusreduktion, wobei die Klarheit durch Kontext und Wortstellung gewahrt bleibt.


#### §7a. Einheitliche Formen für nicht-genitivische Kontexte

In nicht-genitivischen Kontexten nimmt jeder Begleiter und jedes Pronomen, das im **Standarddeutsch** nach Genus oder Kasus flektiert, die invariante feminine „die…“-Form an, d. h. die auf -e endende Form. Dies ist ein allgemeines Prinzip, das die gesamte Klasse abdeckt: **diese, jene, jede, welche, manche, solche, diejenige, dieselbe** und alle analogen Elemente werden unabhängig von Genus oder Kasus des Referenten verwendet. Begleiter, die bereits auf -e enden und in den relevanten Kontexten nicht nach Genus flektieren (**beide, einige, mehrere**), bleiben unverändert.

Dieses Prinzip erfasst die Begleiter des der-Typs (stark flektierend). Auf **ein** aufgebaute Wörter — der Negativartikel **kein**, die Possessivbegleiter und Komposita wie **irgendein** — nehmen die -e-Form nicht an; sie folgen dem invarianten Grundform-Muster aus der Regel zu Possessivbegleitern und dem Negativartikel.

Die gepaarten Quantoren aus der Regel zu indefiniten und negativen Quantoren (**alle/alles, viel/viele, wenig/wenige, nicht/nichts**) sind ausgenommen und folgen ihrer eigenen Regel.


**Beispiele:**

| Standarddeutsch | Alman |
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



#### §7b. Behandlung genitivischer Formen bei genusflektierenden Begleitern

Wenn eine Genitivkonstruktion erforderlich ist, können Sprecher von **Alman** entweder die entsprechende „derjenige“-Form übernehmen oder den Ausdruck so umformulieren, dass der Genitiv ganz vermieden wird, indem sie eine periphrastische Konstruktion mit **von jene**, **von dieselbe** und so weiter verwenden. Im letzteren Fall bleibt die invariante nicht-genitivische Form nach der Präposition erhalten. Die Genitive *derjenigen* und *desjenigen* können der Einfachheit halber durch *von diejenige* oder *von jene* ersetzt werden.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| derselben (Genitiv), desselben (Genitiv) | von dieselbe |
| dieser, dieses (Genitiv) | von diese |
| das Urteil desjenigen Mannes  | die Urteil von diejenige Mann / die Urteil von jene Mann / die Urteil derjenige Mann |
| die Meinung derselben Frau | die Meinung von dieselbe Frau |



#### §7c. Possessivbegleiter und der Negativartikel

Possessivbegleiter (**mein, dein, sein, ihr, unser, euer, Ihr**), der Negativartikel **kein** und alle Komposita von **ein** (etwa **irgendein**, **so ein**, **was für ein**) folgen demselben Muster wie der unbestimmte Artikel **ein**: In allen nicht-genitivischen Kontexten wird die invariante Grundform verwendet; die genus- und kasusspezifischen Endungen des **Standarddeutsch** (meine/meinen/meinem/meiner, keine/keinen/keinem/keiner, irgendeine/irgendeinen/irgendeinem/irgendeiner) entfallen.

Genitivkonstruktionen verwenden entweder das periphrastische **von** + Grundform oder die bloße Grundform nach genitivischen Präpositionen wie **wegen**, **trotz** und **statt**, parallel zur Behandlung des unbestimmten Artikels.

Die Wahl unter **mein, dein, sein, ihr** usw. folgt der Zuweisung nach dem natürlichen Geschlecht des Besitzers, wie im Abschnitt über Pronomen beschrieben.

Dieselbe invariante Grundform wird im pronominalen (alleinstehenden) Gebrauch verwendet, wo das **Standarddeutsch** flektierte Formen wie *meins*, *deiner*, *keins* und *keiner* einsetzt. Dies entspricht der Beibehaltung des bloßen **ein** in nominalisierten Konstruktionen, wie im Abschnitt über Artikel beschrieben: *Das ist mein* („That is mine“), *Kein hat es gesehen* („None saw it“).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
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



#### §7d. Ausnahme für bestimmte indefinite und negative Quantoren

Während **Alman** die meisten Begleiter zusammenführt und vereinfacht, werden einige **indefinite** oder **negative** Quantoren, die im **Standarddeutsch** als **Wortpaare** auftreten, **in ihren ursprünglichen Formen beibehalten**. In diesen Fällen werden **alle** vs. **alles**, **viel** vs. **viele**, **wenig** vs. **wenige** und **nicht** vs. **nichts** unter anderem **nicht** reanalysiert oder zu einer einzigen Form verschmolzen. Sie folgen stattdessen dem **Standarddeutsch**-Gebrauch:

1. **alle/alles**
   - **alle** → für plurale indefinite Referenzen („all [people/things]“).
   - **alles** → für das singularische, abstrakte „everything“.

2. **viel/viele**
   - **viel** → mit **nicht zählbaren** Substantiven oder adverbial („much“, „a lot“).
   - **viele** → mit **zählbaren pluralen** Substantiven („many“).

3. **wenig/wenige**
   - **wenig** → für **nicht zählbare** Referenzen („little“).
   - **wenige** → für **zählbare plurale** Referenzen („few“).

4. **nicht/nichts**
   - **nicht** → die übliche **Negationspartikel** („not“).
   - **nichts** → das Indefinitpronomen mit der Bedeutung „nothing“.

Da das **Standarddeutsch** diese Paare als **eigenständige lexikalische Einheiten** und nicht als bloße Flexionsvarianten behandelt, bewahrt **Alman** sie **unverändert** für Klarheit und gegenseitige Verständlichkeit. Sprecher sollten jedes Paar weiterhin nach den etablierten **Standarddeutsch**-Konventionen verwenden. Diese Regel hat Vorrang vor anderen Begleitervereinfachungen aus anderen Regeln.

Die kasusflektierten Formen, die diese Quantoren im **Standarddeutsch** annehmen (**vielen, vielem, vieler, allen, allem, aller, wenigen, wenigem**), werden durch Weglassen der Kasusendung behandelt: Das Ergebnis ist dasjenige Mitglied des beibehaltenen Paares, das in den Kontext passt (nicht zählbar oder adverbial → **viel**, zählbar plural → **viele** und so weiter). So wird *vielen Dank* zu *viel Dank* und *in allen Fällen* zu *in alle Fälle*, analog zu den invarianten englischen Quantoren *much*, *many*, *all*, *little* und *few*. Da die Unterscheidung innerhalb jedes Paares lexikalisch und nicht deklinational ist, nehmen diese Quantoren nie die invariante -e-Endung aus dem Abschnitt über Adjektive an.


**Beispiele:**

| Standarddeutsch | Alman |
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



## Verben und Wortstellung {#verbs-and-word-order}

Dieser Abschnitt beschreibt das Verbalsystem und die syntaktische Struktur von **Alman**, die den **Standarddeutsch**-Mustern vollständig treu bleiben. Während andere Aspekte der Grammatik vereinfacht werden, bleiben Verbkonjugationen und Wortstellungsregeln unverändert, um den wesentlichen Charakter der deutschen Syntax zu bewahren und klare Kommunikation zu gewährleisten. Eine Ergänzung kompensiert den Verlust der Kasusmarkierung: Wenn Subjekt und Objekt beide volle Nominalphrasen sind, muss das Subjekt dem Objekt vorangehen. In ditransitiven Konstruktionen wird die **Standarddeutsch**-Grundabfolge Empfänger vor Thema als Interpretationskonvention beibehalten, analog zur englischen Doppelobjekt-Konstruktion.


### §8. Verbkonjugationen und -formen {#verbs}

Dieser Paragraph beschreibt die Beibehaltung der **Standarddeutsch**-Konjugationsmuster in **Alman**, unter Bewahrung sowohl regelmäßiger als auch unregelmäßiger Formen.


#### §8a. Verbkonjugationen

Der **Alman**-Dialekt behält die volle Komplexität der **Standarddeutsch**-Verbkonjugationen bei. Sowohl regelmäßige als auch unregelmäßige Verbformen bleiben unverändert, und es wird keine weitere Vereinfachung oder Regularisierung eingeführt. Alle konjugierten Formen werden genau wie im **Standarddeutsch** verwendet.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| ich gehe, du gehst, er geht, wir gehen, ihr geht, sie gehen | ich gehe, du gehst, er geht, wir gehen, ihr geht, sie gehen |
| ich esse, du isst, er isst, wir essen, ihr esst, sie essen | ich esse, du isst, er isst, wir essen, ihr esst, sie essen |
| ich bin, du bist, er ist, wir sind, ihr seid, sie sind | ich bin, du bist, er ist, wir sind, ihr seid, sie sind |



#### §8b. Nominalisierte Verben

Im **Standarddeutsch** erhalten nominalisierte Verben das neutrale Genus. In **Alman** folgen nominalisierte Verben dagegen denselben Genus-Vereinheitlichungsprinzipien wie andere Substantive und verwenden daher in nicht-genitivischen Kontexten die invariante **die**-Form. Diese Änderung vereinfacht die Kongruenz, indem sie die Behandlung nominalisierter Verben mit der anderer nominaler Formen vereinheitlicht.

Diese Regel gewährleistet Konsistenz in der Behandlung nominalisierter Formen in ganz **Alman** und richtet sie am umfassenderen System der Genus-Vereinheitlichung aus. Verschmelzungen mit nominalisierten Verben (z. B. *zum Lernen*) werden wie jede andere Verschmelzung aufgelöst und vereinfacht, gemäß der Regel zur Auflösung von Verschmelzungen im Abschnitt über Artikel.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Das Lernen fällt mir leicht. | Die Lernen fällt mir leicht. |
| Ich finde das Lernen spannend. | Ich finde die Lernen spannend. |
| Ich gehe in die Bibliothek zum Lernen. | Ich gehe in die Bibliothek zu die Lernen. |



### §9. Wortstellung und Syntax {#word-order}

Dieser Paragraph beschreibt die Bewahrung der **Standarddeutsch**-Wortstellungsmuster in **Alman**, sowohl der Verbzweitstellung in Hauptsätzen als auch der Verbendstellung in Nebensätzen. Er beschreibt außerdem, wie Konventionen der Konstituentenfolge den Verlust der Kasusmarkierung in Sätzen mit vollen Nominalphrasen als Argumenten kompensieren.


#### §9a. Wortstellung

Die syntaktische Struktur der Sätze in **Alman** folgt der herkömmlichen Wortstellung des **Standarddeutsch**. In Hauptsätzen steht das finite Verb an zweiter Position (V2-Stellung). In Nebensätzen steht das finite Verb am Ende des Satzes (Verbendstellung).

Verberststellungen bleiben ebenfalls genau wie im **Standarddeutsch** erhalten: Ja/Nein-Fragen (*Gehst du in die Kino?*), Imperative (*Gib mir die Buch!*) und konjunktionslose Konditionalsätze (*Kommt er, so gehen wir*).

Diese Regeln stellen sicher, dass das Verbalsystem und die syntaktische Struktur vollständig mit dem **Standarddeutsch** übereinstimmen, auch wenn morphologische Aspekte von Substantiven und Begleitern vereinfacht werden. Man beachte, dass zwar die Wortstellungsmuster bewahrt werden, die Artikel- und Flexionsregeln von **Alman** innerhalb dieser Sätze aber weiterhin gelten.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Ich gehe heute ins Kino. | Ich gehe heute in die Kino. |
| Er hat gestern einen Brief geschrieben. | Er hat gestern ein Brief geschrieben. |
| weil ich heute ins Kino gehe | weil ich heute in die Kino gehe |
| dass er gestern einen Brief geschrieben hat | dass er gestern ein Brief geschrieben hat |
| Gehst du heute ins Kino? | Gehst du heute in die Kino? |
| Gib mir das Buch! | Gib mir die Buch! |



#### §9b. Subjekt-vor-Objekt-Stellung bei vollen Nominalphrasen

Im **Standarddeutsch** erlaubt die Kasusmarkierung an den Artikeln eine flexible Konstituentenfolge: Ein Objekt kann vorangestellt werden (z. B. *Den Mann beißt der Hund*), weil der Akkusativartikel es eindeutig ausweist. Da **Alman** die Kasusmarkierung an Artikeln und Substantiven beseitigt, geht diese Disambiguierung verloren.

Wenn daher Subjekt und Objekt eines Satzes beide volle Nominalphrasen sind, muss das Subjekt dem Objekt vorangehen. Die Objektvoranstellung bleibt möglich, wenn mindestens ein Argument ein Personalpronomen ist (das die Kasusmarkierung behält, siehe den Abschnitt über Pronomen) oder wenn der Kontext die Rollen eindeutig macht.

Dies kompensiert den Verlust der morphologischen Kasusmarkierung durch eine feste Konstituentenfolge, parallel zur historischen Entwicklung des Englischen.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Der Hund beißt den Mann. | Die Hund beißt die Mann. | The dog bites the man. |
| Den Mann beißt der Hund. | Die Hund beißt die Mann. (subject first, since object fronting would be ambiguous) | The dog bites the man. |
| Ihn beißt der Hund. | Ihn beißt die Hund. (allowed: pronoun case marks the object) | The dog bites him. |



#### §9c. Ditransitive Konstruktionen

Bei ditransitiven Verben wie **geben**, **zeigen** und **schicken** unterscheidet das **Standarddeutsch** das indirekte Objekt (Dativ) vom direkten Objekt (Akkusativ) durch Kasusmarkierung und stellt zugleich das indirekte Objekt standardmäßig vor das direkte, wenn beide volle Nominalphrasen sind. **Alman** behält diese Grundabfolge bei, und der Verlust der Kasusmarkierung wird akzeptiert: In einer Folge von zwei vollen Nominalphrasen-Objekten wird das erste als Empfänger und das zweite als Thema interpretiert.

Dies entspricht der englischen Doppelobjekt-Konstruktion („I give the woman the book“), die ebenfalls ohne Kasusmarkierung funktioniert. Es wird keine strikte Regel auferlegt; Verbsemantik und Kontext klären die Rollen in der Praxis, und verbleibende Mehrdeutigkeit wird toleriert, wie im Englischen.

Wo eine explizite Markierung gewünscht ist oder das Thema dem Empfänger vorangehen soll, kann der Empfänger stattdessen mit der Präposition **an** ausgedrückt werden (parallel zum englischen „to“), und Personalpronomen behalten wie üblich ihre Kasusformen (siehe den Abschnitt über Pronomen).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Ich gebe der Frau das Buch. | Ich gebe die Frau die Buch. | I give the woman the book. |
| Er zeigt dem Kind die Stadt. | Er zeigt die Kind die Stadt. | He shows the child the city. |
| Ich gebe das Buch der Frau. | Ich gebe die Buch an die Frau. (theme first, recipient marked with 'an') | I give the book to the woman. |
| Ich gebe ihr das Buch. | Ich gebe ihr die Buch. (pronoun case marks the recipient) | I give her the book. |



## Lexikalische Genus-Vereinfachungen {#lexical-gender}

Dieser Abschnitt beschreibt die systematische Beseitigung geschlechtsspezifischer lexikalischer Formen in **Alman** und erfasst personenbezeichnende Substantive wie Berufsbezeichnungen, Nationalitäten und Rollenbeschreibungen. Er beschreibt, wie traditionell nach Geschlecht unterschiedene Wortpaare zu einer einzigen Form zusammengeführt werden, wobei die historisch maskuline Grundform mit dem invarianten Artikelsystem alle Referenten unabhängig vom Geschlecht bezeichnet.


### §10. Einheitlichkeit von Berufs- und personenbezeichnenden Substantiven {#job-titles}

Dieser Paragraph beschreibt die Beseitigung geschlechtsspezifischer Formen bei Berufs- und personenbezeichnenden Substantiven zugunsten eines vereinfachten Systems, das die Grundform mit dem invarianten Artikel verwendet.

Im **Standarddeutsch** werden personenbezeichnende Substantive häufig mit dem Suffix **-in** nach Geschlecht markiert: Berufe (*der Lehrer* gegenüber *die Lehrerin*), Nationalitäten und Herkünfte (*der Türke* gegenüber *die Türkin*) und Rollen (*der Kollege* gegenüber *die Kollegin*). In **Alman** werden solche Unterscheidungen beseitigt. Alle personenbezeichnenden Substantive werden ohne geschlechtsspezifische Veränderungen wiedergegeben; das feminine Suffix entfällt, und die maskuline Grundform wird durchgängig verwendet. Folglich werden personenbezeichnende Substantive analog zu anderen Substantiven behandelt, mit dem invarianten bestimmten Artikel **die** und dem unbestimmten Artikel **ein**.

Das natürliche Geschlecht wird, wo kommunikativ relevant, durch Pronomen (siehe den Abschnitt über Pronomen) oder durch den Kontext vermittelt. Beziehungsbedeutungen, die das **Standarddeutsch** über das Suffix transportiert (*Freundin* „girlfriend“), werden wie im umgangssprachlichen Gebrauch ausgedrückt, z. B. **feste Freund**, wobei Pronomen das Geschlecht markieren.

Diese Regel gewährleistet eine einheitliche Behandlung personenbezeichnender Substantive und spiegelt das umfassendere Bestreben von **Alman** wider, die Geschlechterdifferenzierung in lexikalischen Einheiten zu reduzieren.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| der Lehrer / die Lehrerin | die Lehrer | teacher |
| der Bäcker / die Bäckerin | die Bäcker | baker |
| der Arzt / die Ärztin | die Arzt | doctor |
| der Türke / die Türkin | die Türke | Turk |
| der Kollege / die Kollegin | die Kollege | colleague |
| meine Freundin | mein feste Freund | my girlfriend |

