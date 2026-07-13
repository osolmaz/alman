---
title: "Alman.ai verlässt den Stealth-Modus"
date: 2025-02-07
---

Alman.ai, das Projekt, in dem ich versuche, einen vereinfachten deutschen Dialekt zu formalisieren, verlässt endlich den Stealth-Modus. Das dürfte mein bisher autistischstes Unterfangen sein, und das sagt jemand, der einmal versucht hat, ein Wörterbuch zu schreiben.

Ich arbeite seit etwa zwei Jahren immer wieder daran, und ich glaube inzwischen, dass die Idee reif genug ist, um Feedback einzusammeln.

Die vollständige Spezifikation können Sie bereits auf dieser Website lesen. Demnächst werde ich Details dazu teilen, wie ich ein KI-Modell trainiere, das vom Standarddeutschen in diesen vereinfachten Dialekt übersetzt.

Ich werde diese Blogbeiträge nutzen, um die Überlegungen hinter dem Projekt zu erklären, denn in der formalen Spezifikation kann ich das nicht.

## Was ist Alman?

Alman ist die Antwort auf die Frage: _„Was wäre, wenn Deutsch mehr wie Englisch wäre?“_ ... zumindest in der Hinsicht, dass Englisch einen einzigen Artikel **the** für alle Substantive in allen Kasus verwendet. Und dass Substantive nicht zufällig gegendert sind, so wie ein Bus männlich ist (der Bus), eine Tür weiblich (die Tür) und ein Mädchen keins von beidem (das Mädchen).

Dieses „Zufallsgender-Phänomen“ heißt _grammatisches Geschlecht_, im Gegensatz zum _natürlichen Geschlecht_, bei dem Substantive ihr Geschlecht nach dem tatsächlichen Geschlecht des Objekts erhalten. Es macht das Erlernen einer Sprache generell schwerer, und im Fall des Deutschen deutlich schwerer.

Englisch, selbst eine germanische Sprache, hatte ebenfalls drei grammatische Geschlechter, ganz ähnlich wie Deutsch. [Es hat sie aber vor rund 700 Jahren verloren](https://en.wikipedia.org/wiki/Gender_in_English#Decline_of_grammatical_gender). Mit Alman versuche ich zu simulieren, wie es aussähe, wenn dem Deutschen dasselbe passierte.

## Warum?

Deutsch ist meine dritte Sprache. Ich habe Ende 2002 angefangen, es zu lernen, in der sechsten Klasse. Obwohl ich viele Jahre Deutschunterricht hatte, habe ich erst 2019 eine selbstbewusste Sprachfertigkeit erreicht, nachdem ich in eine WG mit Deutschen gezogen war und es jeden Tag sprechen musste. Vollimmersion.

Nachdem ich relative Sprachfertigkeit erreicht hatte, fiel mir etwas auf. Substantivgeschlechter beeinflussten meinen Redefluss direkt. Immer wenn ich das Geschlecht eines Substantivs nicht kannte, musste ich einen Umweg von meinem Gedankengang und meinem Sprechen nehmen, um es herauszufinden: _„Die Glas? Der Glas? Oh, ist es das Glas? Echt?“_

Ganz zu schweigen davon, den richtigen Artikel für den richtigen Kasus zu finden. Für alle, die es nicht wissen: Um korrektes Deutsch zu sprechen, muss man das folgende 4x4-Muster auswendig lernen:

| Kasus      | Maskulinum | Femininum | Neutrum | Plural |
| ---------- | ---------- | --------- | ------- | ------ |
| Nominativ  | *der*      | *die*     | *das*   | *die*  |
| Akkusativ  | *den*      | *die*     | *das*   | *die*  |
| Dativ      | *dem*      | *der*     | *dem*   | *den*  |
| Genitiv    | *des*      | *der*     | *des*   | *der*  |

Aber selbst wenn man die Artikel für jeden Kasus perfekt lernt, wird man hin und wieder auf ein Substantiv stoßen, bei dessen Geschlecht man sich nicht sicher ist.

Hier ist die bittere Wahrheit: **Wenn Deutsch nicht Ihre Muttersprache oder seit der Grundschule Ihre primäre Fremdsprache war, werden Sie sehr wahrscheinlich immer Probleme mit der/die/das haben.**[^1] Die Probleme werden vielleicht weniger, aber sie werden immer da sein.[^2]

Irgendwann akzeptiert man also, dass man bei Substantivgeschlechtern nie perfekt sein wird. Das führt zu einer zweiten Erkenntnis: Was macht man, wenn man das Geschlecht eines Substantivs nicht kennt? Man muss sich für irgendetwas entscheiden, denn einen „Ich weiß es nicht“-Artikel gibt es nicht.

An dieser Stelle landet jeder woanders. Manche raten einfach, je nachdem, was sich im Moment „richtig anfühlt“. Manche legen sich eine Regel zurecht, etwa ein Fallback-Geschlecht (zum Beispiel *der*), wenn sie sich nicht sicher sind. Wieder andere nutzen Statistik und greifen im Dativ auf *dem* und im Genitiv auf *des* zurück, weil sie damit in etwa 55 bis 60 Prozent der Fälle richtig lägen.

In der Praxis entwickelt jeder seine eigenen Heuristiken, unabhängig voneinander, weil solche Regeln nicht Teil des offiziellen Lehrplans sind. Der offizielle Deutschlehrplan, erstellt von Sprachinstituten wie dem Goethe-Institut, kann Lernenden keine „halben Sachen“ beibringen. Sie müssen vorbildlich sein und hundertprozentig korrektes Deutsch lehren. Deshalb haftet Vereinfachungsheuristiken etwas „Illegales“ an: Man sollte es nicht tun, aber man muss es tun, um in der Gesellschaft zu funktionieren.

Diese isolierten Heuristiken sind im Grunde [Idiolekte](https://de.wikipedia.org/wiki/Idiolekt) des Deutschen, kleine Dialekte der Sprache, die für die einzelne Person einzigartig sind. Das passiert, weil das Gehirn etwas, das zu komplex zum Verarbeiten ist, auf seine eigene Weise vereinfacht, geprägt von seinen bisherigen Erfahrungen.

Nachdem ich meinen eigenen Umgang mit dem Deutschen analysiert hatte, stellte ich fest, dass mein Fallback-Geschlecht *die* ist, vielleicht weil es dem englischen *the* ähnlich klingt. Oder vielleicht hat mein Gehirn aufgeschnappt, dass es der statistisch häufigste Artikel ist[^3]. Ich hatte außerdem die Tendenz, im Dativ *dem* zu verwenden, bei bestimmten Präpositionen wie *in dem* oder *zu dem*.

Die Erkenntnis über meine eigenen Heuristiken kam zusammen mit der Erkenntnis, dass fast alle Ausländer, die Deutsch sprechen, genau das tun, ein Schmerzpunkt, den Millionen von Migranten teilen. Deutsch wollte einfacher sein, es könnte einfacher sein. Aber niemand hatte es zuvor ernsthaft versucht, jedenfalls nicht erfolgreich genug, dass sich irgendjemand daran erinnert.

Nach dieser Erkenntnis machte ich mich sofort an die Arbeit und schrieb den ersten Satz von Regeln nieder. Während ich das hier schreibe, steht die Spezifikation bei Version 0.4, es ist also die vierte große Iteration des Regelwerks. In den letzten zwei Jahren habe ich Experimente durchgeführt, Machine-Learning-Modelle trainiert, Leute befragt und viel Zeit damit verbracht, über diesen geteilten Schmerzpunkt nachzudenken.

Alman will diesen Schmerzpunkt angehen, indem es ihn zuallererst als Problem anerkennt, anders als, sagen wir, das Goethe-Institut. Es gab in der Vergangenheit Versuche, Ethnolekte zu legitimieren, etwa Feridun Zaimoglus [Kanak Sprak](https://de.wikipedia.org/wiki/Kanak_Sprak_%E2%80%93_24_Mi%C3%9Ft%C3%B6ne_vom_Rande_der_Gesellschaft). Aber meines Wissens hat niemand versucht, einen vereinfachten Dialekt zu legitimieren, mit einem Erfolg und einer akademischen Strenge, die den Leuten keine andere Wahl lassen, als ihn ernst zu nehmen.

Alman ist kein Ethnolekt und wurde auch nicht von einem inspiriert. Seine Regeln wurden sorgfältig ausgewählt, um die Abweichung vom Standardhochdeutschen zu minimieren und trotzdem extrem leicht zu lernen zu sein. Es schreibt keinen bestimmten Slang, kein Argot und keinen Akzent vor. Es ist frei von Ethnie, Herkunft und Klasse. Auch Muttersprachler dürfen es gerne verwenden, auch wenn es ihnen schwerfallen dürfte, das Gefühl zu überwinden, „falsch zu liegen“.

Ich hoffe, dass Alman unzählige Stunden der Verwirrung ersparen und den Millionen, die Deutsch lernen, einen alternativen Weg zur Sprachfertigkeit zeigen wird.

---

[^1]: Ich weiß das, weil ich auf Partys mit einer App das Artikelwissen verschiedener nicht-muttersprachlicher Sprecher getestet habe. Wenn dieses Projekt jemals abhebt, werde ich dazu eine wissenschaftlichere Studie durchführen.
[^2]: Wer diese Regel zu verletzen scheint, hat sehr wahrscheinlich unpraktisch viel Zeit damit verbracht, Substantivgeschlechter auswendig zu lernen, mit Spaced-Repetition-Systemen, Karteikarten und so weiter. Diese Leute möchte ich fragen: *„War es das wert? Wie viele Stunden Ihres produktiven Erwachsenenlebens und welche Chancen haben Sie geopfert, um etwas auswendig zu lernen, das ein Muttersprachler einfach beim Aufwachsen mitnimmt?“*
[^3]: Ich habe dazu eine kleine Untersuchung gemacht: [Frequencies of Definite Articles in Written vs Spoken German](https://solmaz.io/frequencies-german-definite-articles).
