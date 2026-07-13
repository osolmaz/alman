# Alman: Ein vereinfachte Dialekt der deutsche Sprache

**Version**: 0.4.2  

**Stand**: 2026-07-08


## Einleitung {#introduction}

Die Genussystem der deutsche Sprache, umgangssprachlich als „der/die/das“ bezeichnet, ist für diejenigen, das Deutsch als zusätzliche Sprache (L2) lernen, notorisch schwierig. Wir vertreten die Auffassung, dass die korrekte Verwendung der Genera für die meiste L2-Lernenden nicht entscheidend ist, um in die deutsche Gesellschaft zu funktionieren. Zu diese Zweck konstruieren wir ein Dialekt namens **Alman**, das die Genera Maskulinum, Femininum und Neutrum zu ein einzige Kategorie vereinigt und genus- und kasusspezifische Flexionen beseitigt. Die daraus resultierende Genusverlust ähnelt diejenige, das die Englische während der mittelenglische Periode erfahren hat. Wir legen ein formale Beschreibung der **Alman**-Grammatik vor.

Die Idee zu **Alman** entstand aus die Erkenntnis, dass Sprachkomplexität – insbesondere in morphologische Systeme wie die Genus – die Sprachenlernen verlangsamen und die Integration von Zugewanderten in die Gesellschaft behindern kann. Wir vertreten die These, dass höhere grammatische Komplexität reale Kosten verursacht, darunter ein verzögerte Integration in die Arbeitsmarkt und ein verringerte Produktivität von Migranten. Indem **Alman** die Notwendigkeit beseitigt, mehrere Genusmarker zu memorieren und anzuwenden, will es diese Herausforderungen mildern, ohne die grundlegende Struktur der deutsche Syntax und der Wortschatz zu beeinträchtigen.

Über die praktische Nutzen für Neuankömmlinge hinaus bleibt **Alman** mit **Standarddeutsch** gegenseitig verständlich. Die Dialekt ist darauf ausgelegt, die wesentliche Wortstellung zu bewahren (Verbzweitstellung in Hauptsätze und Verbendstellung in Nebensätze), die vertraute Verbkonjugationen beizubehalten und die lexikalische Klarheit insgesamt zu erhalten. Statt die gesamte Grammatik umzubauen, reduziert es die Komplexität gezielt dort, wo sie meist in die Gewicht fällt – nämlich bei die Artikelgebrauch, bei die Substantivflexion und bei die Adjektivendungen – und erlaubt es L2-Lernenden so, schon früher selbstbewusster zu kommunizieren.

Diese Spezifikation liefert ein formale Darstellung der **Alman**-Grammatik und beschreibt in die Einzelne die Regeln für die Artikelvereinfachung, die Substantivmorphologie, die Adjektivendungen und weitere zentrale sprachliche Elemente. Indem wir diese Änderungen mit zahlreiche Beispiele veranschaulichen, wollen wir Lehrenden wie Lernenden ein klare Fahrplan für die Übernahme von diese Dialekt bieten. Ziel ist nicht, **Standarddeutsch** zu ersetzen, sondern ein zugängliche Variante einzuführen, das die Schwierigkeiten von erwachsene Lernenden adressiert und letztlich ein inklusivere und effizientere Sprachenlernen fördert.


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
<li><a href="#definite-articles">§1 Vereinfachung der bestimmte Artikel</a></li>
<li><a href="#indefinite-articles">§2 Vereinfachung der unbestimmte Artikel</a></li>
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
<li><a href="#job-titles">§10 Einheitlichkeit von Berufs- und personenbezeichnende Substantive</a></li>
</ul>
</li>
</ul>

</div>


## Artikel {#articles}

Diese Abschnitt beschreibt die Vereinfachung der **Standarddeutsch**-Artikel in **Alman**, bei die Genus- und Kasusunterscheidungen beseitigt werden. Bestimmte Artikel verwenden **die** für alle nicht-genitivische Kontexte und **der** für die Genitiv, wobei **das** als neutrale Demonstrativum erhalten bleibt und als invariante Relativierer dient (siehe die Abschnitt über Pronomen). Besitz kann alternativ mit **von die** statt mit Genitivkonstruktionen ausgedrückt werden. Unbestimmte Artikel übernehmen in nicht-genitivische Fälle durchgängig **ein**, während die Genitiv **von ein** verwendet oder **ein** nach Präpositionen beibehält. Präposition-Artikel-Verschmelzungen werden ausnahmslos zu ihre volle Formen aufgelöst (z. B. *vom* → *von die*), und nominalisierte Artikel bewahren **ein** als eigenständige Form. Die Kasusunterscheidung nach Wechselpräpositionen wird für Nominalphrasen abgeschafft.


### §1. Vereinfachung der bestimmte Artikel {#definite-articles}

Die **Alman**-Dialekt ersetzt die sechs kasusflektierte Formen der bestimmte Artikel in die **Standarddeutsch** systematisch durch morphologische Regularisierung: Es verwendet invariante Formen für nicht-genitivische und genitivische Kasus und beseitigt zugleich kasusspezifische Substantivendungen. Alle Oberflächenrealisierungen von bestimmte Artikel in nicht-genitivische Kontexte (unabhängig von Genus, Numerus oder Kasus) werden durch **die** ersetzt. Genitivische Kontexte verwenden standardmäßig **der**, begleitet von die Beseitigung von genitivische Substantivflexionen.


#### §1a. Invariante 'die' für nicht-genitivische Kasus

Alle bestimmte Artikel in die Nominativ, Akkusativ und Dativ (der/die/das/den/dem) werden durch die invariante Form 'die' ersetzt; Genus- und Kasusunterscheidungen werden damit neutralisiert.


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



#### §1b. Invariante 'der' für die Genitiv

Alle genitivische bestimmte Artikel (des/der) werden durch 'der' ersetzt, begleitet von die Beseitigung von genitivische Substantivflexionen.

Nach genitivische Präpositionen wie **wegen**, **trotz**, **statt**, **während** und **innerhalb** wird die genitivische Artikel **der** bevorzugt, doch ist auch die invariante nicht-genitivische **die** akzeptabel, in Anlehnung an die umgangssprachliche Gebrauch. Dies entspricht die Behandlung der unbestimmte Artikel nach genitivische Präpositionen.

Die genitivische **der** ist die einzige kasusmarkierte Artikelform, das **Alman** beibehält. Dies ist ein bewusste Ausnahme von die ansonsten vollständige Beseitigung von kasusspezifische Flexion: Sie hält adnominale Genitivkonstruktionen (*die Haus der Mann*) erkennbar und mit **Standarddeutsch** gegenseitig verständlich. Unbestimmte Artikel, Possessivbegleiter und **kein** beseitigen die Genitivmarkierung stattdessen vollständig durch Periphrase, wie in die jeweilige Regeln beschrieben.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| des Mannes (Genitive) | der Mann |
| der Frau (Genitive) | der Frau |
| des Kindes (Genitive) | der Kind |
| wegen des Wetters | wegen der Wetter / wegen die Wetter |



#### §1c. Ausnahme: Demonstrativpronomen

Die Demonstrativpronomen 'das' behält sein Form in nominativische, akkusativische und dativische Kontexte, wenn es als neutrale Demonstrativum ('that') fungiert. In Genitivkonstruktionen wird die Form 'dessen' durch 'deren' ersetzt, unter Beibehaltung der invariante Artikelsystem.

Diese Ausnahme ist strikt positional: Sie gilt nur, wenn 'das' allein steht, ohne nachfolgende Substantiv. Unmittelbar vor ein Substantiv gelten stets die Artikelregeln, und jede Form der bestimmte Artikel wird zu **die**, unabhängig von Betonung oder demonstrative Absicht. Demonstrative Kraft vor ein Substantiv wird mit **diese** oder **jene** ausgedrückt (siehe die Abschnitt über Begleiter), analog zu die englische *this/that* + Substantiv. Ebenso werden die alleinstehend gebrauchte **Standarddeutsch**-Demonstrativpronomen 'der', 'den' und 'dem' (*Der war's!*) durch die neutrale **das** ersetzt (*Das war's!*); die artikelgleiche **die** ist als Variante zugelassen, in die Einklang mit die Behandlung der Relativpronomen.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| das ist gut (demonstrative) | das ist gut |
| dessen Haus | deren Haus |
| DAS Buch will ich! (stressed, attributive) | Diese Buch will ich! |
| Der war's! (standalone demonstrative) | Das war's! / Die war's! |



#### §1d. Fakultative 'von die' für Besitz

Die präpositionale Konstruktion 'von die' kann die genitivische Artikel 'der' ersetzen, um Besitz anzuzeigen, wobei 'der' in die meiste Kontexte vorzuziehen bleibt. Diese periphrastische Konstruktion dient dazu:
1. Mehrdeutigkeit in komplexe Phrasen aufzulösen
2. Phonologische Abwechslung zu bieten
3. Umgangssprachliche Sprechmuster abzubilden

Obwohl austauschbar, sollte 'der' beibehalten werden, wenn ursprüngliche Genitivkonstruktionen ('des/der') übersetzt werden, sofern nicht kontextuelle Faktoren 'von die' begünstigen.

Ein Apposition stimmt in die Konstruktion mit ihr Bezugsnominalphrase überein. Wird ein Genitiv periphrastisch mit **von** wiedergegeben, nimmt auch ein Apposition dazu die nicht-genitivische Form an; wird die Genitiv **der** verwendet, bleibt die Apposition in die Genitiv. Dieselbe gilt für Appositionen nach ein beibehaltene Eigennamen-Genitiv (siehe die Abschnitt über Substantive). Possessive Genitive (*seines Vaters*) haben kein **der**-Form und sind stets periphrastisch (siehe die Regel zu Possessivbegleiter in die Abschnitt über Begleiter); ihr Appositionen nehmen daher immer die nicht-genitivische Form an.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| das Haus des Mannes | die Haus der Mann / die Haus von die Mann |  |
| die Farbe des Autos | die Farbe der Auto / die Farbe von die Auto |  |
| bei den Lehren seines Vaters, des Gelehrten | bei die Lehren von sein Vater, die Gelehrte | in the teachings of his father, the scholar |
| die Werke Goethes, des Dichters | die Werke Goethes, der Dichter / die Werke von Goethe, die Dichter | the works of Goethe, the poet |



#### §1e. Auflösung von Verschmelzungen

Präposition-Artikel-Verschmelzungen (z. B. vom, im, zur) müssen zu ihr volle Form aufgelöst werden, bevor die Artikelersetzungsregeln angewendet werden. Die entschmolzene Präposition und die Artikel werden dann nach die übliche **Alman**-Artikelregeln verarbeitet.

Diese Regel gilt einheitlich, auch für Verschmelzungen in feste Wendungen wie **zum Beispiel** und **zum** + nominalisierte Infinitiv; Lernenden bleibt so die Auswendiglernen von ein Liste von ausgenommene Ausdrücke erspart. Die einzige Ausnahme ist die adverbiale Superlativkonstruktion **am** + Superlativ (z. B. **am besten**, **am schnellsten**): Sie wird nicht als Präposition-Artikel-Verschmelzung behandelt, sondern durch die bloße Superlativstamm ersetzt, wie in die Abschnitt über Adjektive und Adverbien beschrieben.


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

In die **Standarddeutsch** regieren die Wechselpräpositionen (**in, an, auf, über, unter, vor, hinter, neben, zwischen**) die Akkusativ, um Bewegung auf ein Ziel hin auszudrücken, und die Dativ, um statische Lage auszudrücken. Da **Alman** Akkusativ- und Dativartikel in die invariante **die** zusammenfallen lässt, ist diese kasusbasierte Unterscheidung für Nominalphrasen abgeschafft: *in die Kino* deckt sowohl „ins Kino (hinein)“ als auch „im Kino“ ab.

Wo die Unterscheidung zwischen Richtung und Lage kommunikativ wesentlich ist, wird sie lexikalisch ausgedrückt, z. B. durch Richtungsadverbien (**hinein, hinaus, hin**) oder Ortsadverbien (**drinnen, drin, dort**), oder durch die Semantik der Verb aufgelöst.

Man beachte, dass Personalpronomen die Kasusmarkierung behalten (siehe die Abschnitt über Pronomen); die Unterscheidung bleibt daher in pronominale Konstruktionen verfügbar (*auf ihn* vs. *auf ihm*).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Ich gehe ins Kino. (Accusative, motion) | Ich gehe in die Kino. | I go to the cinema. |
| Ich bin im Kino. (Dative, location) | Ich bin in die Kino. | I am at the cinema. |
| Er legt das Buch auf den Tisch. | Er legt die Buch auf die Tisch. | He puts the book on the table. |
| Das Buch liegt auf dem Tisch. | Die Buch liegt auf die Tisch. | The book lies on the table. |



### §2. Vereinfachung der unbestimmte Artikel {#indefinite-articles}

Die **Alman**-Dialekt regularisiert die Gebrauch der unbestimmte Artikel durch morphologische Vereinfachung: Die in die **Standarddeutsch** vorhandene Kasus- und Genusunterscheidungen werden beseitigt, während die semantische Klarheit durch präpositionale Konstruktionen erhalten bleibt.


#### §2a. Einheitliche 'ein' für nicht-genitivische Kasus

Die invariante Form **ein** ersetzt alle unbestimmte Artikel in die Nominativ, Akkusativ und Dativ (ein/eine/einen/einem); Genus- und Kasusunterscheidungen werden damit neutralisiert.

Diese Regel gilt nur für die unbestimmte Artikel. Die homographe oblique Formen der Indefinitpronomen **man** (*Das ärgert einen*) sind Pronomen, behalten ihr Kasusmarkierung und werden in die Abschnitt über Pronomen beschrieben.


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
2. nur **ein**, je nach Kontext, z. B. nach genitivische Präpositionen wie **wegen**, **trotz**, **statt**, **innerhalb** und so weiter.

Die periphrastische **von ein**-Konstruktion wird bevorzugt, wenn die Wahrung der Unbestimmtheit entscheidend ist.

Dies systematisiert bestehende umgangssprachliche Muster, das Präpositionalphrasen mit Dativformen verwenden, und ersetzt diese durch die invariante **ein**.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| das Buch eines Freundes | die Buch von ein Freund |
| wegen eines Problems | wegen ein Problem |



#### §2c. Nominalisierte Artikel

Die Form **ein** bleibt in nominalisierte Konstruktionen erhalten, in die die Artikel eigenständig ohne nachfolgende Substantiv fungiert.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Diese Erfindung war eine der wichtigsten Leistungen des 20. Jahrhunderts. | Diese Erfindung war ein der wichtigste Leistungen der 20. Jahrhundert. |



## Substantive {#nouns}

Diese Abschnitt beschreibt in die Einzelne, wie **Alman** grammatische Genus und Kasusflexion bei Substantive beseitigt. Alle Substantive nehmen ein einzige invariante Form über Nominativ, Akkusativ und Dativ hinweg an; genitivische Kontexte werden durch **der** statt durch Kasusendungen markiert. Die pränominale Genitiv-s von Eigennamen (*Annas Buch*) ist ausgenommen und bleibt erhalten, analog zu die englische Possessiv *'s*. Pluralformen behalten in alle Kasus ihr standardsprachliche Nominativ-/Akkusativmorphologie, während ein fakultative -s-Suffix Mehrdeutigkeit bei Substantive mit identische Singular- und Pluralformen auflöst. Schwache Substantivdeklinationen und archaische Dativendungen werden abgeschafft.


### §3. Vereinfachung der Substantivmorphologie {#noun-morphology}

Die **Alman**-Dialekt beseitigt systematisch Genusunterscheidungen und kasusbasierte Substantivflexionen durch morphologische Regularisierung. Substantive behalten ein einzige invariante Form über Nominativ, Akkusativ und Dativ hinweg; Genitivkonstruktionen verwenden ein eigene analytische Marker. Pluralformen bewahren ihr standardsprachliche Nominativ-/Akkusativmorphologie in alle syntaktische Kontexte.


#### §3a. Beseitigung der Kasusendungen

Alle kasusspezifische Substantivendungen werden entfernt, darunter:
- Genitiv-Marker -s/-es an Gattungsnamen (des Mannes → der Mann); die pränominale Genitiv-s von Eigennamen ist ausgenommen und bleibt erhalten (siehe die Regel zu die Eigennamen-Genitiv)
- Dativ-Plural-Suffixe -n (den Bränden → die Brände)
- Schwache Deklinationsmuster: Die -n/-en-Endungen, das schwache Substantive wie **Kollege**, **Mensch**, **Student** und **Junge** in nicht-nominativische Singularkasus annehmen, entfallen; die Nominativ Singular dient als invariante Singularform (den Kollegen → die Kollege). Die -n/-en-Plural von diese Substantive ist davon unberührt und bleibt als Pluralmarker erhalten (siehe die Regel zu invariante Pluralformen), sodass die Singular *die Kollege* von die Plural *die Kollegen* unterschieden bleibt.


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



#### §3b. Beibehaltung der Eigennamen-Genitiv -s

Die pränominale Genitiv-s von Eigennamen ist von die Beseitigung der Kasusendungen ausgenommen und bleibt unverändert erhalten, analog zu die englische Possessiv *'s* (*Annas Buch* „Anna's book“). Da Eigennamen kein Artikel tragen, kann die analytische Genitivmarker **der** auf sie nicht angewendet werden; die namensfinale -s gehört daher nicht zu die Artikel-und-Kasus-System, das **Alman** beseitigt, und stellt für Sprecher, das mit die englische Konstruktion vertraut sind, kein zusätzliche Lernlast dar.

Dies gilt für Personennamen ebenso wie für Ortsnamen und andere possessiv gebrauchte Eigennamen. Die orthographische Konvention der **Standarddeutsch** für Namen, das auf ein s-Laut enden — ein bloße Apostroph anstelle der -s (*Hans' Fahrrad*) —, bleibt ebenfalls erhalten.

Wie bei andere Possessivkonstruktionen bleibt die periphrastische **von**-Konstruktion als Alternative verfügbar (siehe die Regel zu die fakultative 'von die' für Besitz in die Abschnitt über Artikel).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Annas Buch | Annas Buch | Anna's book |
| Peters Auto | Peters Auto / die Auto von Peter | Peter's car |
| Hans' Fahrrad | Hans' Fahrrad | Hans's bicycle |
| Deutschlands Hauptstadt | Deutschlands Hauptstadt / die Hauptstadt von Deutschland | Germany's capital |



#### §3c. Invariante Pluralformen

Die standardsprachliche Nominativ-/Akkusativ-Pluralformen dienen als universelle Pluralmarker und bleiben in dativische und genitivische Kontexte unverändert. Dies bewahrt ein wiedererkennbare Pluralmorphologie und beseitigt zugleich kasusbedingte Veränderungen.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| mit den Kindern (Dative Plural) | mit die Kinder |
| wegen der Brände (Genitive Plural) | wegen der Brände / wegen die Brände |



#### §3d. Keine Regularisierung der Pluralmorphologie

**Alman** bewahrt die Pluralmorphologie der **Standarddeutsch** ohne systematische Regularisierung und behält bestehende Pluralformen in alle konfliktfreie Kontexte bei. Die Dialekt greift nur dann in die Pluralbildung ein, wenn sein grammatische Vereinfachungen morphologische Mehrdeutigkeit zwischen Singular- und Pluralformen erzeugen, wie in die nächste Regel beschrieben.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| die Blumen (plural) | die Blumen |
| die Hunde (plural) | die Hunde |
| die Bücher (plural) | die Bücher |
| die Autos (plural) | die Autos |



#### §3e. Fakultative Pluraldisambiguierung

Um mögliche Mehrdeutigkeit bei Substantive mit identische Singular- und Pluralformen aufzulösen, erlaubt **Alman** ein fakultative Pluralmarkierung mit die Suffix **-s**, analog zu die englische Plural. Wenn die Klarheit ein explizite Pluralkennzeichnung erfordert, wird die -s-Suffix an die invariante Form angehängt.

Die -s-Suffix ist die einzige Disambiguierungsmarker. Die -n-Suffix wird für diese Zweck nicht verwendet: Da die Beseitigung der Kasusendungen die Dativ-Plural-n der **Standarddeutsch** abschafft, würde die Wiederverwendung von -n als Pluralmarker dieselbe Endung in die beide Sprachen zwei verschiedene Bedeutungen geben.

Diese Disambiguierung bewahrt die vereinfachte Morphologie und trägt zugleich lexikalische Einheiten Rechnung, bei die die Numerusunterscheidung pragmatisch wesentlich ist.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| die Computer (plural) | die Computers |
| der Sessel (singular)/die Sessel (plural) | die Sessel (singular)/die Sessels (plural) |
| die Mädchen (plural) | die Mädchens |



## Adjektive und Adverbien {#adjectives-and-adverbs}

Diese Abschnitt beschreibt die einheitliche formbasierte Prinzip von **Alman** für die Adjektiv- und Adverbmorphologie: Jede deklinierte Adjektivendung der **Standarddeutsch** wird durch die invariante -e ersetzt, und Formen ohne Deklinationsendung bleiben unverändert. Die Prinzip gilt nach die Oberflächenform, nicht nach die syntaktische Funktion — attributive Adjektive (gute Mann), nominalisierte Adjektive (die Gute) und feste adverbiale Wendungen (unter anderem → unter andere) erhalten alle -e, während prädikative Adjektive und Adverbien bleiben, wie sie sind. Die einzige Ausnahme ist die adverbiale Superlativ, das die **Standarddeutsch**-Konstruktion **am** + Superlativ durch die bloße Superlativstamm ersetzt (am besten → best).


### §4. Regularisierung der Adjektivendungen {#adjectives}

Die **Alman**-Dialekt regelt die Adjektivmorphologie über ein einzige formbasierte Prinzip: Jede deklinierte Adjektivendung der **Standarddeutsch** wird durch die invariante -e ersetzt, und Formen ohne Deklinationsendung bleiben unverändert. Lernende müssen ein Adjektiv nie nach sein syntaktische Funktion klassifizieren; die Oberflächenform allein bestimmt die Ergebnis.


#### §4a. Invariante -e für alle Deklinationsendungen

Wann immer ein Adjektiv in die **Standarddeutsch** ein Deklinationsendung trägt — ein Endung, das Kasus, Genus oder Numerus markiert —, wird diese Endung in **Alman** durch die invariante **-e** ersetzt. Dies gilt einheitlich, unabhängig von Funktion oder Position der Adjektiv: Attributive Adjektive vor Substantive, nominalisierte Adjektive, nach **etwas**, **nichts** und **alles** nominalisierte Adjektive (*etwas Gutes*, *nichts Neues*) sowie Adjektive in feste adverbiale Wendungen (**unter anderem**, **vor kurzem**, **seit langem**, **von neuem**, **bei weitem**, **ohne weiteres**) werden alle gleich behandelt.

Adjektive, das in die **Standarddeutsch** kein Deklinationsendung tragen — prädikative Adjektive und adverbial gebrauchte Formen —, bleiben unverändert; es wird kein Endung hinzugefügt (siehe die Abschnitt über Adverbien).

Komparationssuffixe (**-er**, **-st**) sind Wortbildung und kein Deklination und bleiben erhalten: *schneller laufen* bleibt *schneller laufen*. Ebenso tragen lexikalisierte Adverbien wie **anders** oder **meistens** kein Deklinationsendung und bleiben unverändert.

Die einzige Ausnahme von diese Prinzip ist die adverbiale Superlativ **am** + Superlativ, das durch die bloße Superlativstamm ersetzt wird (siehe die Abschnitt über Adverbien).


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

Genitivkonstruktionen behalten die analytische Artikel 'der' bei und bewahren zugleich die invariante adjektivische -e-Endungen; die morphologische Regelmäßigkeit bleibt so über alle Kasus hinweg erhalten.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| des guten Mannes | der gute Mann |
| der intelligenten Schüler | der intelligente Schüler |



#### §4c. Nominalisierte Adjektive

Nominalisierte Adjektive erhalten, wenn sie als Substantive fungieren, in die Singular die invariante Endung **-e**, unabhängig von ihr syntaktische Rolle; die Einheitlichkeit mit reguläre Adjektivformen bleibt so gewahrt.

In die Plural verhalten sich nominalisierte Adjektive wie Substantive: In die Einklang mit die Bewahrung der Substantiv-Pluralmorphologie, das in die Abschnitt über Substantive beschrieben ist, behalten sie die Endung **-en** als Pluralmarker (nicht als Kasusmarker). Dies unterscheidet *die Schöne* (Singular) von *die Schönen* (Plural).


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Das Gute im Menschen | Die Gute in die Mensch |
| An die Schönen (Dative, plural) | An die Schönen (-en retained as plural marker) |
| Wegen des Bekannten | Wegen der Bekannte / Wegen die Bekannte |
| unter anderem | unter andere |



### §5. Adverbien {#adverbs}

Adverbien tragen in die **Standarddeutsch** kein Deklinationsendungen und bleiben daher in **Alman** unverändert. Dies ist ein direkte Folge der formbasierte Prinzip in die Abschnitt über Adjektive — Endungen werden zu -e, endungslose Formen bleiben, wie sie sind — und kein eigene Mechanismus. Die eine Sonderkonstruktion ist die adverbiale Superlativ, bei die die kasusmarkierte Konstruktion **am** + Superlativ durch die bloße Superlativstamm ersetzt wird.


#### §5a. Adverbien bleiben unverändert

Adverbial gebrauchte Wörter tragen in die **Standarddeutsch** kein Deklinationsendung und bleiben daher in **Alman** unverändert. Dies folgt unmittelbar aus die formbasierte Prinzip in die Abschnitt über Adjektive: Nur vorhandene Deklinationsendungen werden durch -e ersetzt, und wo kein Endung ist, ändert sich nichts. Dies gilt für:
- Adverbien, das Verben modifizieren
- Adjektive, das andere Adjektive modifizieren
- Phrasale Modifikatoren, das nicht unmittelbar vor ein Substantiv stehen

Feste adverbiale Wendungen, das ein dekliniertes Adjektiv enthalten (**unter anderem**, **vor kurzem** und ähnliche), sind nicht ausgenommen: Ihr Endungen werden nach dieselbe Prinzip zu die invariante -e (unter andere, vor kurze).


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| schnell laufen | schnell laufen |
| das Auto fährt schnell | die Auto fährt schnell |
| frisch kaltes Wasser | frisch kalte Wasser |



#### §5b. Adverbiale Superlative mit bloße Stamm

Die adverbiale Superlativkonstruktion der **Standarddeutsch** **am** + Superlativ (am besten, am schnellsten) wird durch die bloße Superlativstamm ersetzt: **best**, **schnellst** und so weiter. Dies entspricht die englische adverbiale Superlativ („I swim best“) und entfernt die kasusmarkierte Verschmelzung **am** (an + dem) vollständig aus die Konstruktion, in die Einklang mit die Beseitigung von kasusmarkierte Artikel an andere Stelle in **Alman**.

Die Variante **an** + bloße Stamm (z. B. **an best**) ist ebenfalls akzeptabel und bewahrt die präpositionale Rhythmus der **Standarddeutsch**-Konstruktion für Sprecher, das ihn bevorzugen. Die bloße Stamm ist die bevorzugte Form.

Diese Regel hat Vorrang vor die Regel zu die Auflösung von Verschmelzungen in die Abschnitt über Artikel: **am** in adverbiale Superlative wird nicht zu **an die** aufgelöst. Attributive Superlative sind nicht betroffen und folgen die reguläre Regel der invariante -e-Endung (die beste Schwimmer).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Ich schwimme am besten. | Ich schwimme best. / Ich schwimme an best. | I swim best. |
| Er läuft am schnellsten. | Er läuft schnellst. / Er läuft an schnellst. | He runs fastest. |
| Am liebsten esse ich Pizza. | Liebst esse ich Pizza. / An liebst esse ich Pizza. | I like eating pizza most. |
| Dieses Auto gefällt mir am meisten. | Diese Auto gefällt mir meist. / Diese Auto gefällt mir an meist. | I like this car the most. |



## Pronomen und Begleiter {#pronouns-and-determiners}

Diese Abschnitt beschreibt Änderungen an die Pronominalsystem der **Standarddeutsch**, das die Zuweisung nach natürliche Geschlecht Vorrang geben und zugleich Kasusunterscheidungen für referentielle Klarheit bewahren. Personalpronomen behalten die **Standarddeutsch**-Kasusformen, beziehen sich aber auf die biologische/soziale Geschlecht statt auf die grammatische Genus; für Personen von unbekannte oder generische Geschlecht fungiert die plurale **sie** als singulare *they*, analog zu die Englische. Relativpronomen fallen in die invariante neutrale **das** zusammen (Genitiv **deren**), analog zu die englische Relativierer *that*; die artikelgleiche **die** ist als Variante zugelassen. Begleiter, Possessivbegleiter, die Negativartikel **kein** und andere **ein**-Komposita werden durch invariante Formen in nicht-genitivische Kontexte vereinfacht; Kasusflexion bleibt nur bei die Personalpronomen erhalten.


### §6. Pronomen {#pronouns}

Diese Paragraph beschreibt die Beibehaltung der **Standarddeutsch**-Kasusformen der Personalpronomen bei gleichzeitige Neuausrichtung der referentielle Zuweisung auf die natürliche Geschlecht statt auf die grammatische Genus; Kasusunterscheidungen bleiben für referentielle Klarheit erhalten.


#### §6a. Personalpronomen: Zuweisung nach natürliche Geschlecht

Personalpronomen behalten ihr **Standarddeutsch**-Kasusformen, werden aber nach natürliche Geschlecht interpretiert (analog zu die englische Konventionen):
1. **er/ihn/ihm** → bezieht sich ausschließlich auf männliche Personen oder sich männlich identifizierende Wesen
2. **sie/sie/ihr** → bezieht sich ausschließlich auf weibliche Personen oder sich weiblich identifizierende Wesen
3. **es/es/ihm** → bezieht sich auf unbelebte Gegenstände, abstrakte Konzepte oder andere Nicht-Personen ohne natürliche Geschlecht

Personen, deren Geschlecht unbekannt, unbestimmt oder generisch ist, werden mit die plurale **sie** als singulare *they* bezeichnet, wie in die Regel zu geschlechtsneutrale Referenten beschrieben.

Man beachte: Wird die Referent durch ein Berufsbezeichnung beschrieben, folgt die Bezeichnung selbst die Einheitlichkeitsregeln in die Abschnitt über lexikalische Genus-Vereinfachungen, während die Pronomen die natürliche Geschlecht folgt.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Sie ist nett. (die Frau, f.) | Sie ist nett. | She is nice. |
| Er ist nett. (der Mann, m.) | Er ist nett. | He is nice. |
| Es ist klug. (das Mädchen, n.) | Sie ist klug. | She is clever. |
| Es ist neu. (das Buch, n.) | Es ist neu. | It is new. |



#### §6b. Beibehaltung der Kasusflexion

Personalpronomen behalten die vollständige Kasusflexion, um referentielle Klarheit und syntaktische Präzision zu bewahren, insbesondere bei belebte Wesen. Die Kasussystem ist bewusst an die **Standarddeutsch**-Formen ausgerichtet, um die gegenseitige Verständlichkeit zu erhalten.

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

Die Anredepronomen **Sie** (mit Dativ **Ihnen** und Possessiv **Ihr**) bleibt genau wie in die **Standarddeutsch** erhalten, einschließlich sein Großschreibung.

Die Indefinitpronomen **man** behält ebenfalls sein vollständige **Standarddeutsch**-Paradigma, einschließlich sein oblique Formen **einen** (Akkusativ) und **einem** (Dativ). Dies sind Pronomenformen, kein Artikel, und sie sind daher von die Vereinfachung der unbestimmte Artikel in die Abschnitt über Artikel nicht betroffen.


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

Für Wesen ohne natürliche Geschlecht (Gegenstände, abstrakte Konzepte, Institutionen):
- **es** dient als Standard-Singularpronomen
- die **Standarddeutsch**-Pluralpronomen bleiben erhalten (**sie** für plurale Referenten, einschließlich Gruppen von gemischte oder unbestimmte Geschlecht)

Für **Personen**, deren Geschlecht unbekannt, unbestimmt oder generisch ist, wird die dritte Person Plural **sie** mit plurale Verbkongruenz verwendet, auch wenn die Referent singularisch ist. Dies entspricht die englische singulare *they* („Someone called. They were friendly.“) und gilt sowohl für generische personenbezeichnende Ausdrücke (*der Mensch*, *jeder*, *jemand*, *niemand*) als auch für bestimmte Personen von unbekannte Geschlecht. Akkusativ und Dativ folgen die Pluralparadigma (**sie**/**ihnen**), und die zugehörige Possessiv ist **ihr**. Wo die plurale Lesart tatsächlich irreführen würde, können Sprecher umformulieren, genau wie in die Englische.


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

Reflexivpronomen folgen die **Standarddeutsch**-Kasusformen (mich, dich, sich, uns, euch) und richten sich bei Referenten in die dritte Person nach die Prinzipien der natürliche Geschlecht.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Er wäscht sich. | Er wäscht sich. | He washes himself. |
| Sie hilft sich. | Sie hilft sich. | She helps herself. |
| Es öffnet sich. | Es öffnet sich. | It opens itself. |



#### §6e. Possessivpronomen

Die Wahl unter die Possessivpronomen (**mein, dein, sein, ihr, unser, euer, Ihr**) folgt die Zuweisung nach die natürliche Geschlecht der Besitzer. Für Besitzer von unbekannte, unbestimmte oder generische Geschlecht wird **ihr** verwendet, in die Einklang mit die singulare *they* aus die Regel zu geschlechtsneutrale Referenten. Ihr Endungen folgen die Begleiterregeln: In alle nicht-genitivische Kontexte wird die invariante Grundform verwendet (siehe die Abschnitt über Begleiter).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Sein Buch (des Mannes) | Sein Buch | His book |
| Ihr Buch (der Frau) | Ihr Buch | Her book |
| Sein Buch (des Tisches) | Sein Buch | Its book |



#### §6f. Relativpronomen

Relativpronomen werden zu ein einzige invariante Relativierer vereinfacht: die neutrale Form **das**, das unabhängig von Genus, Numerus oder Kasusrolle der Referent in die Relativsatz verwendet wird. Dies entspricht die englische Relativierer *that*, das Relativsätze ebenfalls unflektiert einleitet (*the man that stands there* → *die Mann, das dort steht*). Da **das** bereits als neutrale Demonstrativum erhalten bleibt (siehe die Abschnitt über Artikel), deckt ein einzige Form sowohl die Zeigen als auch die Satzverknüpfung ab.

Die artikelgleiche Form **die** ist in alle nicht-genitivische Positionen ebenfalls akzeptabel (*die Mann, die dort steht*). **das** wird bevorzugt, weil es die Relativierer optisch und klanglich von die invariante Artikel **die** unterscheidet und gestapelte identische Formen dort vermeidet, wo beide aufeinandertreffen (*die Frau, das die Kinder sieht* statt *die Frau, die die Kinder sieht*).

Die genitivische Relativpronomen **dessen** und **deren** werden beide durch **deren** ersetzt, in die Einklang mit die Behandlung der genitivische Demonstrativa in die Abschnitt über Artikel.

Da die invariante Relativierer die Kasusrolle der relativierte Element nicht mehr markiert, wird Mehrdeutigkeit zwischen Subjekt- und Objektrelativsätze durch Verbkongruenz und Kontext aufgelöst; bei echte Mehrdeutigkeit können Sprecher mit ein Personalpronomen in die Relativsatz oder ein periphrastische Konstruktion umformulieren.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| der Mann, der dort steht | die Mann, das dort steht / die Mann, die dort steht | the man that is standing there |
| der Mann, den ich sehe | die Mann, das ich sehe / die Mann, die ich sehe | the man that I see |
| der Mann, dem ich helfe | die Mann, das ich helfe / die Mann, die ich helfe | the man that I help |
| das Kind, das spielt | die Kind, das spielt / die Kind, die spielt | the child that is playing |
| die Frau, die die Kinder sieht | die Frau, das die Kinder sieht / die Frau, die die Kinder sieht | the woman that sees the children |
| die Frau, deren Auto kaputt ist | die Frau, deren Auto kaputt ist | the woman whose car is broken |
| der Mann, dessen Haus groß ist | die Mann, deren Haus groß ist | the man whose house is large |



#### §6g. Beibehaltung der standardsprachliche Interrogativpronomen

Die Interrogativpronomen **wer, was, wen, wem, wessen** bleiben in ihr **Standarddeutsch**-Formen unverändert erhalten. Diese Pronomen funktionieren in alle Kontexte wie in die **Standarddeutsch**.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Wer bist du? | Wer bist du? |
| Was möchtest du essen? | Was möchtest du essen? |
| Wen siehst du? | Wen siehst du? |



#### §6h. Präpositionale Interrogativkonstruktionen

In Interrogativkonstruktionen mit Präpositionen kann anstelle der zusammengesetzte *wo-*Formen ein unverschmolzene Präposition vor **was** verwendet werden: **zu was, von was, mit was, über was, durch was** und ähnliche Varianten. Dies entspricht die Gebrauch von Präposition + *what* in die Englische, etwa *to what*, *from what* und so weiter.

Die *wo-*Komposita der **Standarddeutsch** bleiben voll akzeptabel, da sie kein Genus- oder Kasusflexion tragen und kein zusätzliche Lernlast darstellen. Beide Varianten sind frei austauschbar, genau wie bei die pronominale *da-*Komposita in die folgende Regel.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Womit hilfst du mir? | Mit was hilfst du mir? / Womit hilfst du mir? |
| Wovon träumst du? | Von was träumst du? / Wovon träumst du? |
| Worüber freust du dich? | Über was freust du dich? / Worüber freust du dich? |



#### §6i. Pronominaladverbien (da-Komposita)

Parallel zu die Behandlung der interrogative *wo-*Formen können die mit *da-* gebildete Pronominaladverbien (**damit, davon, darüber, dafür, daran** und ähnliche Varianten) durch die unverschmolzene Präposition gefolgt von die Demonstrativum **das** ersetzt werden (z. B. **mit das, von das, über das**), in die Einklang mit die Beibehaltung der neutrale Demonstrativum in die Abschnitt über Artikel.

Die *da-*Komposita der **Standarddeutsch** bleiben voll akzeptabel, da sie kein Genus- oder Kasusflexion tragen und kein zusätzliche Lernlast darstellen. Beide Varianten sind frei austauschbar.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Ich bin damit einverstanden. | Ich bin mit das einverstanden. / Ich bin damit einverstanden. |
| Davon habe ich gehört. | Von das habe ich gehört. / Davon habe ich gehört. |
| Er freut sich darüber. | Er freut sich über das. / Er freut sich darüber. |



### §7. Begleiter und Demonstrativa {#determiners}

Diese Paragraph beschreibt die Vereinfachung der Begleiter- und Demonstrativformen in **Alman** durch Genusneutralisierung und Kasusreduktion, wobei die Klarheit durch Kontext und Wortstellung gewahrt bleibt.


#### §7a. Einheitliche Formen für nicht-genitivische Kontexte

In nicht-genitivische Kontexte nimmt jede Begleiter und jede Pronomen, das in die **Standarddeutsch** nach Genus oder Kasus flektiert, die invariante feminine „die…“-Form an, d. h. die auf -e endende Form. Dies ist ein allgemeine Prinzip, das die gesamte Klasse abdeckt: **diese, jene, jede, welche, manche, solche, diejenige, dieselbe** und alle analoge Elemente werden unabhängig von Genus oder Kasus der Referent verwendet. Begleiter, das bereits auf -e enden und in die relevante Kontexte nicht nach Genus flektieren (**beide, einige, mehrere**), bleiben unverändert.

Diese Prinzip erfasst die Begleiter der der-Typ (stark flektierend). Auf **ein** aufgebaute Wörter — die Negativartikel **kein**, die Possessivbegleiter und Komposita wie **irgendein** — nehmen die -e-Form nicht an; sie folgen die invariante Grundform-Muster aus die Regel zu Possessivbegleiter und die Negativartikel.

Die gepaarte Quantoren aus die Regel zu indefinite und negative Quantoren (**alle/alles, viel/viele, wenig/wenige, nicht/nichts**) sind ausgenommen und folgen ihr eigene Regel.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| dieser, diese, dieses, diesen, diesem (Nominativ, Akkusativ, Dativ) | diese |
| derjenige (Nominativ, Dativ), diejenige (Nominativ, Akkusativ), dasjenige (Nominativ), denjenigen (Akkusativ), demjenigen (Dativ) | diejenige |
| derselbe (Nominativ, Dativ), dieselbe (Nominativ, Akkusativ), dasselbe (Nominativ), denselben (Akkusativ), demselben (Dativ) | dieselbe |
| derjenige Mann, der kommt | diejenige Mann, das kommt / diejenige Mann, die kommt |
| dieser Weg | diese Weg |
| jener Tag | jene Tag |
| jeder Tag, jeden Tag, jedem Tag | jede Tag |
| mancher Politiker | manche Politiker |
| solches Wetter | solche Wetter |
| welches Buch | welche Buch |
| demjenigen Weg | diejenige Weg |
| dasselbe Buch | dieselbe Buch |



#### §7b. Behandlung von genitivische Formen bei genusflektierende Begleiter

Wenn ein Genitivkonstruktion erforderlich ist, können Sprecher von **Alman** entweder die entsprechende „derjenige“-Form übernehmen oder die Ausdruck so umformulieren, dass die Genitiv ganz vermieden wird, indem sie ein periphrastische Konstruktion mit **von jene**, **von dieselbe** und so weiter verwenden. In die letztere Fall bleibt die invariante nicht-genitivische Form nach die Präposition erhalten. Die Genitive *derjenigen* und *desjenigen* können der Einfachheit halber durch *von diejenige* oder *von jene* ersetzt werden.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| derselben (Genitiv), desselben (Genitiv) | von dieselbe |
| dieser, dieses (Genitiv) | von diese |
| das Urteil desjenigen Mannes  | die Urteil von diejenige Mann / die Urteil von jene Mann / die Urteil derjenige Mann |
| die Meinung derselben Frau | die Meinung von dieselbe Frau |



#### §7c. Possessivbegleiter und die Negativartikel

Possessivbegleiter (**mein, dein, sein, ihr, unser, euer, Ihr**), die Negativartikel **kein** und alle Komposita von **ein** (etwa **irgendein**, **so ein**, **was für ein**) folgen dieselbe Muster wie die unbestimmte Artikel **ein**: In alle nicht-genitivische Kontexte wird die invariante Grundform verwendet; die genus- und kasusspezifische Endungen der **Standarddeutsch** (meine/meinen/meinem/meiner, keine/keinen/keinem/keiner, irgendeine/irgendeinen/irgendeinem/irgendeiner) entfallen.

Genitivkonstruktionen verwenden entweder die periphrastische **von** + Grundform oder die bloße Grundform nach genitivische Präpositionen wie **wegen**, **trotz** und **statt**, parallel zu die Behandlung der unbestimmte Artikel.

Die Wahl unter **mein, dein, sein, ihr** usw. folgt die Zuweisung nach die natürliche Geschlecht der Besitzer, wie in die Abschnitt über Pronomen beschrieben.

Dieselbe invariante Grundform wird in die pronominale (alleinstehende) Gebrauch verwendet, wo die **Standarddeutsch** flektierte Formen wie *meins*, *deiner*, *keins* und *keiner* einsetzt. Dies entspricht die Beibehaltung der bloße **ein** in nominalisierte Konstruktionen, wie in die Abschnitt über Artikel beschrieben: *Das ist mein* („That is mine“), *Kein hat es gesehen* („None saw it“).


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

Während **Alman** die meiste Begleiter zusammenführt und vereinfacht, werden einige **indefinite** oder **negative** Quantoren, das in die **Standarddeutsch** als **Wortpaare** auftreten, **in ihr ursprüngliche Formen beibehalten**. In diese Fälle werden **alle** vs. **alles**, **viel** vs. **viele**, **wenig** vs. **wenige** und **nicht** vs. **nichts** unter andere **nicht** reanalysiert oder zu ein einzige Form verschmolzen. Sie folgen stattdessen die **Standarddeutsch**-Gebrauch:

1. **alle/alles**
   - **alle** → für plurale indefinite Referenzen („all [people/things]“).
   - **alles** → für die singularische, abstrakte „everything“.

2. **viel/viele**
   - **viel** → mit **nicht zählbare** Substantive oder adverbial („much“, „a lot“).
   - **viele** → mit **zählbare plurale** Substantive („many“).

3. **wenig/wenige**
   - **wenig** → für **nicht zählbare** Referenzen („little“).
   - **wenige** → für **zählbare plurale** Referenzen („few“).

4. **nicht/nichts**
   - **nicht** → die übliche **Negationspartikel** („not“).
   - **nichts** → die Indefinitpronomen mit die Bedeutung „nothing“.

Da die **Standarddeutsch** diese Paare als **eigenständige lexikalische Einheiten** und nicht als bloße Flexionsvarianten behandelt, bewahrt **Alman** sie **unverändert** für Klarheit und gegenseitige Verständlichkeit. Sprecher sollten jede Paar weiterhin nach die etablierte **Standarddeutsch**-Konventionen verwenden. Diese Regel hat Vorrang vor andere Begleitervereinfachungen aus andere Regeln.

Die kasusflektierte Formen, das diese Quantoren in die **Standarddeutsch** annehmen (**vielen, vielem, vieler, allen, allem, aller, wenigen, wenigem**), werden durch Weglassen der Kasusendung behandelt: Die Ergebnis ist diejenige Mitglied der beibehaltene Paar, das in die Kontext passt (nicht zählbar oder adverbial → **viel**, zählbar plural → **viele** und so weiter). So wird *vielen Dank* zu *viel Dank* und *in allen Fällen* zu *in alle Fälle*, analog zu die invariante englische Quantoren *much*, *many*, *all*, *little* und *few*. Da die Unterscheidung innerhalb jede Paar lexikalisch und nicht deklinational ist, nehmen diese Quantoren nie die invariante -e-Endung aus die Abschnitt über Adjektive an.


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

Diese Abschnitt beschreibt die Verbalsystem und die syntaktische Struktur von **Alman**, das die **Standarddeutsch**-Muster vollständig treu bleiben. Während andere Aspekte der Grammatik vereinfacht werden, bleiben Verbkonjugationen und Wortstellungsregeln unverändert, um die wesentliche Charakter der deutsche Syntax zu bewahren und klare Kommunikation zu gewährleisten. Ein Ergänzung kompensiert die Verlust der Kasusmarkierung: Wenn Subjekt und Objekt beide volle Nominalphrasen sind, muss die Subjekt die Objekt vorangehen. In ditransitive Konstruktionen wird die **Standarddeutsch**-Grundabfolge Empfänger vor Thema als Interpretationskonvention beibehalten, analog zu die englische Doppelobjekt-Konstruktion.


### §8. Verbkonjugationen und -formen {#verbs}

Diese Paragraph beschreibt die Beibehaltung der **Standarddeutsch**-Konjugationsmuster in **Alman**, unter Bewahrung von sowohl regelmäßige als auch unregelmäßige Formen.


#### §8a. Verbkonjugationen

Die **Alman**-Dialekt behält die volle Komplexität der **Standarddeutsch**-Verbkonjugationen bei. Sowohl regelmäßige als auch unregelmäßige Verbformen bleiben unverändert, und es wird kein weitere Vereinfachung oder Regularisierung eingeführt. Alle konjugierte Formen werden genau wie in die **Standarddeutsch** verwendet.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| ich gehe, du gehst, er geht, wir gehen, ihr geht, sie gehen | ich gehe, du gehst, er geht, wir gehen, ihr geht, sie gehen |
| ich esse, du isst, er isst, wir essen, ihr esst, sie essen | ich esse, du isst, er isst, wir essen, ihr esst, sie essen |
| ich bin, du bist, er ist, wir sind, ihr seid, sie sind | ich bin, du bist, er ist, wir sind, ihr seid, sie sind |



#### §8b. Nominalisierte Verben

In die **Standarddeutsch** erhalten nominalisierte Verben die neutrale Genus. In **Alman** folgen nominalisierte Verben dagegen dieselbe Genus-Vereinheitlichungsprinzipien wie andere Substantive und verwenden daher in nicht-genitivische Kontexte die invariante **die**-Form. Diese Änderung vereinfacht die Kongruenz, indem sie die Behandlung von nominalisierte Verben mit die von andere nominale Formen vereinheitlicht.

Diese Regel gewährleistet Konsistenz in die Behandlung von nominalisierte Formen in ganz **Alman** und richtet sie an die umfassendere System der Genus-Vereinheitlichung aus. Verschmelzungen mit nominalisierte Verben (z. B. *zum Lernen*) werden wie jede andere Verschmelzung aufgelöst und vereinfacht, gemäß die Regel zu die Auflösung von Verschmelzungen in die Abschnitt über Artikel.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Das Lernen fällt mir leicht. | Die Lernen fällt mir leicht. |
| Ich finde das Lernen spannend. | Ich finde die Lernen spannend. |
| Ich gehe in die Bibliothek zum Lernen. | Ich gehe in die Bibliothek zu die Lernen. |



### §9. Wortstellung und Syntax {#word-order}

Diese Paragraph beschreibt die Bewahrung der **Standarddeutsch**-Wortstellungsmuster in **Alman**, sowohl der Verbzweitstellung in Hauptsätze als auch der Verbendstellung in Nebensätze. Es beschreibt außerdem, wie Konventionen der Konstituentenfolge die Verlust der Kasusmarkierung in Sätze mit volle Nominalphrasen als Argumente kompensieren.


#### §9a. Wortstellung

Die syntaktische Struktur der Sätze in **Alman** folgt die herkömmliche Wortstellung der **Standarddeutsch**. In Hauptsätze steht die finite Verb an zweite Position (V2-Stellung). In Nebensätze steht die finite Verb an die Ende der Satz (Verbendstellung).

Verberststellungen bleiben ebenfalls genau wie in die **Standarddeutsch** erhalten: Ja/Nein-Fragen (*Gehst du in die Kino?*), Imperative (*Gib mir die Buch!*) und konjunktionslose Konditionalsätze (*Kommt er, so gehen wir*).

Diese Regeln stellen sicher, dass die Verbalsystem und die syntaktische Struktur vollständig mit die **Standarddeutsch** übereinstimmen, auch wenn morphologische Aspekte von Substantive und Begleiter vereinfacht werden. Man beachte, dass zwar die Wortstellungsmuster bewahrt werden, die Artikel- und Flexionsregeln von **Alman** innerhalb diese Sätze aber weiterhin gelten.


**Beispiele:**

| Standarddeutsch | Alman |
|------------------|-------|
| Ich gehe heute ins Kino. | Ich gehe heute in die Kino. |
| Er hat gestern einen Brief geschrieben. | Er hat gestern ein Brief geschrieben. |
| weil ich heute ins Kino gehe | weil ich heute in die Kino gehe |
| dass er gestern einen Brief geschrieben hat | dass er gestern ein Brief geschrieben hat |
| Gehst du heute ins Kino? | Gehst du heute in die Kino? |
| Gib mir das Buch! | Gib mir die Buch! |



#### §9b. Subjekt-vor-Objekt-Stellung bei volle Nominalphrasen

In die **Standarddeutsch** erlaubt die Kasusmarkierung an die Artikel ein flexible Konstituentenfolge: Ein Objekt kann vorangestellt werden (z. B. *Den Mann beißt der Hund*), weil die Akkusativartikel es eindeutig ausweist. Da **Alman** die Kasusmarkierung an Artikel und Substantive beseitigt, geht diese Disambiguierung verloren.

Wenn daher Subjekt und Objekt von ein Satz beide volle Nominalphrasen sind, muss die Subjekt die Objekt vorangehen. Die Objektvoranstellung bleibt möglich, wenn mindestens ein Argument ein Personalpronomen ist (die die Kasusmarkierung behält, siehe die Abschnitt über Pronomen) oder wenn die Kontext die Rollen eindeutig macht.

Dies kompensiert die Verlust der morphologische Kasusmarkierung durch ein feste Konstituentenfolge, parallel zu die historische Entwicklung der Englische.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Der Hund beißt den Mann. | Die Hund beißt die Mann. | The dog bites the man. |
| Den Mann beißt der Hund. | Die Hund beißt die Mann. (subject first, since object fronting would be ambiguous) | The dog bites the man. |
| Ihn beißt der Hund. | Ihn beißt die Hund. (allowed: pronoun case marks the object) | The dog bites him. |



#### §9c. Ditransitive Konstruktionen

Bei ditransitive Verben wie **geben**, **zeigen** und **schicken** unterscheidet die **Standarddeutsch** die indirekte Objekt (Dativ) von die direkte Objekt (Akkusativ) durch Kasusmarkierung und stellt zugleich die indirekte Objekt standardmäßig vor die direkte, wenn beide volle Nominalphrasen sind. **Alman** behält diese Grundabfolge bei, und die Verlust der Kasusmarkierung wird akzeptiert: In ein Folge von zwei volle Nominalphrasen-Objekte wird die erste als Empfänger und die zweite als Thema interpretiert.

Dies entspricht die englische Doppelobjekt-Konstruktion („I give the woman the book“), das ebenfalls ohne Kasusmarkierung funktioniert. Es wird kein strikte Regel auferlegt; Verbsemantik und Kontext klären die Rollen in die Praxis, und verbleibende Mehrdeutigkeit wird toleriert, wie in die Englische.

Wo ein explizite Markierung gewünscht ist oder die Thema die Empfänger vorangehen soll, kann die Empfänger stattdessen mit die Präposition **an** ausgedrückt werden (parallel zu die englische „to“), und Personalpronomen behalten wie üblich ihr Kasusformen (siehe die Abschnitt über Pronomen).


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| Ich gebe der Frau das Buch. | Ich gebe die Frau die Buch. | I give the woman the book. |
| Er zeigt dem Kind die Stadt. | Er zeigt die Kind die Stadt. | He shows the child the city. |
| Ich gebe das Buch der Frau. | Ich gebe die Buch an die Frau. (theme first, recipient marked with 'an') | I give the book to the woman. |
| Ich gebe ihr das Buch. | Ich gebe ihr die Buch. (pronoun case marks the recipient) | I give her the book. |



## Lexikalische Genus-Vereinfachungen {#lexical-gender}

Diese Abschnitt beschreibt die systematische Beseitigung von geschlechtsspezifische lexikalische Formen in **Alman** und erfasst personenbezeichnende Substantive wie Berufsbezeichnungen, Nationalitäten und Rollenbeschreibungen. Es beschreibt, wie traditionell nach Geschlecht unterschiedene Wortpaare zu ein einzige Form zusammengeführt werden, wobei die historisch maskuline Grundform mit die invariante Artikelsystem alle Referenten unabhängig von die Geschlecht bezeichnet.


### §10. Einheitlichkeit von Berufs- und personenbezeichnende Substantive {#job-titles}

Diese Paragraph beschreibt die Beseitigung von geschlechtsspezifische Formen bei Berufs- und personenbezeichnende Substantive zugunsten von ein vereinfachte System, das die Grundform mit die invariante Artikel verwendet.

In die **Standarddeutsch** werden personenbezeichnende Substantive häufig mit die Suffix **-in** nach Geschlecht markiert: Berufe (*der Lehrer* gegenüber *die Lehrerin*), Nationalitäten und Herkünfte (*der Türke* gegenüber *die Türkin*) und Rollen (*der Kollege* gegenüber *die Kollegin*). In **Alman** werden solche Unterscheidungen beseitigt. Alle personenbezeichnende Substantive werden ohne geschlechtsspezifische Veränderungen wiedergegeben; die feminine Suffix entfällt, und die maskuline Grundform wird durchgängig verwendet. Folglich werden personenbezeichnende Substantive analog zu andere Substantive behandelt, mit die invariante bestimmte Artikel **die** und die unbestimmte Artikel **ein**.

Die natürliche Geschlecht wird, wo kommunikativ relevant, durch Pronomen (siehe die Abschnitt über Pronomen) oder durch die Kontext vermittelt. Beziehungsbedeutungen, das die **Standarddeutsch** über die Suffix transportiert (*Freundin* „girlfriend“), werden wie in die umgangssprachliche Gebrauch ausgedrückt, z. B. **feste Freund**, wobei Pronomen die Geschlecht markieren.

Diese Regel gewährleistet ein einheitliche Behandlung von personenbezeichnende Substantive und spiegelt die umfassendere Bestreben von **Alman** wider, die Geschlechterdifferenzierung in lexikalische Einheiten zu reduzieren.


**Beispiele:**

| Standarddeutsch | Alman | Englisch |
|------------------|--------|---------|
| der Lehrer / die Lehrerin | die Lehrer | teacher |
| der Bäcker / die Bäckerin | die Bäcker | baker |
| der Arzt / die Ärztin | die Arzt | doctor |
| der Türke / die Türkin | die Türke | Turk |
| der Kollege / die Kollegin | die Kollege | colleague |
| meine Freundin | mein feste Freund | my girlfriend |

