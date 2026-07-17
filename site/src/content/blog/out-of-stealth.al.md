---
title: "Alman.ai verlässt die Stealth-Modus"
date: 2025-02-07
---

Alman.ai, die Projekt, in das ich versuche, ein vereinfachte deutsche Dialekt zu formalisieren, verlässt endlich die Stealth-Modus. Das dürfte mein bisher autistischste Unterfangen sein, und das sagt jemand, das einmal versucht hat, ein Wörterbuch zu schreiben.

Ich arbeite seit etwa zwei Jahre immer wieder daran, und ich glaube inzwischen, dass die Idee reif genug ist, um Feedback einzusammeln.

Die vollständige Spezifikation können Sie bereits auf diese Website lesen. Demnächst werde ich Details dazu teilen, wie ich ein KI-Modell trainiere, das von die Standarddeutsche in diese vereinfachte Dialekt übersetzt.

Ich werde diese Blogbeiträge nutzen, um die Überlegungen hinter die Projekt zu erklären, denn in die formale Spezifikation kann ich das nicht.

## Was ist Alman?

Alman ist die Antwort auf die Frage: _„Was wäre, wenn Deutsch mehr wie Englisch wäre?“_ ... zumindest in die Hinsicht, dass Englisch ein einzige Artikel **the** für alle Substantive in alle Kasus verwendet. Und dass Substantive nicht zufällig gegendert sind, so wie ein Bus männlich ist (der Bus), ein Tür weiblich (die Tür) und ein Mädchen kein von beide (das Mädchen).

Diese „Zufallsgender-Phänomen“ heißt _grammatische Geschlecht_, in die Gegensatz zu die _natürliche Geschlecht_, bei das Substantive ihr Geschlecht nach die tatsächliche Geschlecht der Objekt erhalten. Es macht die Erlernen von ein Sprache generell schwerer, und in die Fall der Deutsche deutlich schwerer.

Englisch, selbst ein germanische Sprache, hatte ebenfalls drei grammatische Geschlechter, ganz ähnlich wie Deutsch. [Es hat sie aber vor rund 700 Jahre verloren](https://en.wikipedia.org/wiki/Gender_in_English#Decline_of_grammatical_gender). Mit Alman versuche ich zu simulieren, wie es aussähe, wenn die Deutsche dieselbe passierte.

## Warum?

Deutsch ist mein dritte Sprache. Ich habe Ende 2002 angefangen, es zu lernen, in die sechste Klasse. Obwohl ich viele Jahre Deutschunterricht hatte, habe ich erst 2019 ein selbstbewusste Sprachfertigkeit erreicht, nachdem ich in ein WG mit Deutschen gezogen war und es jede Tag sprechen musste. Vollimmersion.

Nachdem ich relative Sprachfertigkeit erreicht hatte, fiel mir etwas auf. Substantivgeschlechter beeinflussten mein Redefluss direkt. Immer wenn ich die Geschlecht von ein Substantiv nicht kannte, musste ich ein Umweg von mein Gedankengang und mein Sprechen nehmen, um es herauszufinden: _„Die Glas? Der Glas? Oh, ist es das Glas? Echt?“_

Ganz zu schweigen davon, die richtige Artikel für die richtige Kasus zu finden. Für alle, das es nicht wissen: Um korrekte Deutsch zu sprechen, muss man die folgende 4x4-Muster auswendig lernen:

| Kasus      | Maskulinum | Femininum | Neutrum | Plural |
| ---------- | ---------- | --------- | ------- | ------ |
| Nominativ  | *der*      | *die*     | *das*   | *die*  |
| Akkusativ  | *den*      | *die*     | *das*   | *die*  |
| Dativ      | *dem*      | *der*     | *dem*   | *den*  |
| Genitiv    | *des*      | *der*     | *des*   | *der*  |

Aber selbst wenn man die Artikel für jede Kasus perfekt lernt, wird man hin und wieder auf ein Substantiv stoßen, bei deren Geschlecht man sich nicht sicher ist.

Hier ist die bittere Wahrheit: **Wenn Deutsch nicht Ihr Muttersprache oder seit die Grundschule Ihr primäre Fremdsprache war, werden Sie sehr wahrscheinlich immer Probleme mit der/die/das haben.**[^1] Die Probleme werden vielleicht weniger, aber sie werden immer da sein.[^2]

Irgendwann akzeptiert man also, dass man bei Substantivgeschlechter nie perfekt sein wird. Das führt zu ein zweite Erkenntnis: Was macht man, wenn man die Geschlecht von ein Substantiv nicht kennt? Man muss sich für irgendetwas entscheiden, denn ein „Ich weiß es nicht“-Artikel gibt es nicht.

An diese Stelle landet jede woanders. Manche raten einfach, je nachdem, was sich in die Moment „richtig anfühlt“. Manche legen sich ein Regel zurecht, etwa ein Fallback-Geschlecht (zu die Beispiel *der*), wenn sie sich nicht sicher sind. Wieder andere nutzen Statistik und greifen in die Dativ auf *dem* und in die Genitiv auf *des* zurück, weil sie damit in etwa 55 bis 60 Prozent der Fälle richtig lägen.

In die Praxis entwickelt jede ihr eigene Heuristiken, unabhängig voneinander, weil solche Regeln nicht Teil der offizielle Lehrplan sind. Die offizielle Deutschlehrplan, erstellt von Sprachinstitute wie die Goethe-Institut, kann Lernenden kein „halbe Sachen“ beibringen. Sie müssen vorbildlich sein und hundertprozentig korrekte Deutsch lehren. Deshalb haftet Vereinfachungsheuristiken etwas „Illegale“ an: Man sollte es nicht tun, aber man muss es tun, um in die Gesellschaft zu funktionieren.

Diese isolierte Heuristiken sind in die Grunde [Idiolekte](https://de.wikipedia.org/wiki/Idiolekt) der Deutsche, kleine Dialekte der Sprache, das für die einzelne Person einzigartig sind. Das passiert, weil die Gehirn etwas, das zu komplex zu die Verarbeiten ist, auf sein eigene Weise vereinfacht, geprägt von sein bisherige Erfahrungen.

Nachdem ich mein eigene Umgang mit die Deutsche analysiert hatte, stellte ich fest, dass mein Fallback-Geschlecht *die* ist, vielleicht weil es die englische *the* ähnlich klingt. Oder vielleicht hat mein Gehirn aufgeschnappt, dass es die statistisch häufigste Artikel ist[^3]. Ich hatte außerdem die Tendenz, in die Dativ *dem* zu verwenden, bei bestimmte Präpositionen wie *in dem* oder *zu dem*.

Die Erkenntnis über mein eigene Heuristiken kam zusammen mit die Erkenntnis, dass fast alle Ausländer, das Deutsch sprechen, genau das tun, ein Schmerzpunkt, das Millionen von Migranten teilen. Deutsch wollte einfacher sein, es könnte einfacher sein. Aber niemand hatte es zuvor ernsthaft versucht, jedenfalls nicht erfolgreich genug, dass sich irgendjemand daran erinnert.

Nach diese Erkenntnis machte ich mich sofort an die Arbeit und schrieb die erste Satz von Regeln nieder. Während ich das hier schreibe, steht die Spezifikation bei Version 0.4, es ist also die vierte große Iteration der Regelwerk. In die letzte zwei Jahre habe ich Experimente durchgeführt, Machine-Learning-Modelle trainiert, Leute befragt und viel Zeit damit verbracht, über diese geteilte Schmerzpunkt nachzudenken.

Alman will diese Schmerzpunkt angehen, indem es das zuallererst als Problem anerkennt, anders als, sagen wir, die Goethe-Institut. Es gab in die Vergangenheit Versuche, Ethnolekte zu legitimieren, etwa Feridun Zaimoglus [Kanak Sprak](https://de.wikipedia.org/wiki/Kanak_Sprak_%E2%80%93_24_Mi%C3%9Ft%C3%B6ne_vom_Rande_der_Gesellschaft). Aber soweit ich weiß, hat niemand versucht, ein vereinfachte Dialekt zu legitimieren, mit ein Erfolg und ein akademische Strenge, das die Leute kein andere Wahl lassen, als es ernst zu nehmen.

Alman ist kein Ethnolekt und wurde auch nicht von ein inspiriert. Sein Regeln wurden sorgfältig ausgewählt, um die Abweichung von die Standardhochdeutsche zu minimieren und trotzdem extrem leicht zu lernen zu sein. Es schreibt kein bestimmte Slang, kein Argot und kein Akzent vor. Es ist frei von Ethnie, Herkunft und Klasse. Auch Muttersprachler dürfen es gerne verwenden, auch wenn es ihnen schwerfallen dürfte, die Gefühl zu überwinden, „falsch zu liegen“.

Ich hoffe, dass Alman unzählige Stunden der Verwirrung ersparen und die Millionen, das Deutsch lernen, ein alternative Weg zu die Sprachfertigkeit zeigen wird.

---

[^1]: Ich weiß das, weil ich auf Partys mit ein App die Artikelwissen von verschiedene nicht-muttersprachliche Sprecher getestet habe. Wenn diese Projekt jemals abhebt, werde ich dazu ein wissenschaftlichere Studie durchführen.
[^2]: Wer diese Regel zu verletzen scheint, hat sehr wahrscheinlich unpraktisch viel Zeit damit verbracht, Substantivgeschlechter auswendig zu lernen, mit Spaced-Repetition-Systeme, Karteikarten und so weiter. Diese Leute möchte ich fragen: *„War es das wert? Wie viele Stunden von Ihr produktive Erwachsenenleben und welche Chancen haben Sie geopfert, um etwas auswendig zu lernen, das ein Muttersprachler einfach bei die Aufwachsen mitnimmt?“*
[^3]: Ich habe dazu ein kleine Untersuchung gemacht: [Frequencies of Definite Articles in Written vs Spoken German](https://solmaz.io/frequencies-german-definite-articles).
