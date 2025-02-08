---
title: "Alman.ai is out of stealth"
date: 2025-02-07
layout: post
---

Alman.ai, the project where I attempt to formalize a simplified German dialect, is finally out of stealth. This must be my most autistic endeavor yet, and this comes from a person who tried to write a dictionary once.

I have been working on this on and off for about two years now, and I finally think that the idea is mature enough to start collecting feedback.

You can already read the full spec on this website. I will soon start sharing details on how I train an AI model to translate from Standard German into this simplified dialect.

I will use these blog posts to explain the thinking behind the project, because I can't do that in the formal spec.

## What is Alman?

Alman is the answer to the question: _"What if German was more like English?"_...at least in the way that English uses a single article **the** to refer to all nouns across all cases. And that nouns are not gendered randomly, like a bus being male (der Bus), a door being female (die Tür) and a girl being neither (das Mädchen).

This "random gender phenomenon" is called _grammatical gender_, as opposed to _natural gender_, which is when nouns are assigned a gender based on the actual gender of the object. It generally makes learning a language harder, and in German's case, significantly harder.

English---being a Germanic language---also had three grammatical genders, very similar to German. [But it lost them around 700 years ago](https://en.wikipedia.org/wiki/Gender_in_English#Decline_of_grammatical_gender). With Alman, I try to simulate how it would look like if the same thing happened to German.

## Why?

German is my third language. I started to learn it first in late 2002, when I was in 6th grade. Despite taking German classes for many years, I achieved confident fluency only in 2019 after living in a shared flat with Germans and being forced to speak it every day. Full immersion.

After achieving relative fluency, I realized something. Noun genders affected my fluency directly. Whenever I didn't know the gender of a noun, I had to take a detour from my thought process and speech to figure it out: _"Die Glas? Der Glas? Oh ist es das Glas? Echt?"_

Not to mention finding the right article for the correct case. For those who don't know, you have to learn the following 4x4 pattern by heart, in order to speak correct German:

| Case       | Masculine | Feminine | Neuter | Plural |
| ---------- | --------- | -------- | ------ | ------ |
| Nominative | der       | die      | das    | die    |
| Accusative | den       | die      | das    | die    |
| Dative     | dem       | der      | dem    | den    |
| Genitive   | des       | der      | des    | der    |

But even if you learn the articles for each case perfectly, you will still encounter a noun whose gender you will not be sure of, every once in a while.

Here is the bitter truth: **If German was not your native language or your primary foreign language since primary school, you will likely always have problems with der/die/das.**[^1] The problems might decrease, but they will always be there.[^2]

So eventually, you accept that you will never be perfect at noun genders. That will bring you to a second realization: when you don't know the gender of a noun, what will you do? You have to choose something, since there is no "I don't know" article.

Here is where everybody lands on something different. Some people will just guess randomly, according to what "feels right" at the moment. Some will come up with a rule, like choosing a fallback-gender (for example, *der*) when they are not sure. Yet others will make use of statistics, and fall back on *dem* for dative and *des* for genitive, because they would be correct approximately 55-60% of the time.

In practice, everybody develops their own heuristics independent of each other, because such rules are not part of the official curriculum. The official German curriculum, prepared by language institutes such as the Goethe Institut, cannot teach a student "half-measures". They need to be exemplary and teach 100% correct German. For that reason, simplification heuristics have an "illegal" feeling: you should not be doing it, but you have to do it to function in society.

These isolated heuristics are essentially [idiolects](https://en.wikipedia.org/wiki/Idiolect) of German---minor dialects of the language that are unique to the individual. This happens because when the brain encounters something too complex to process, it simplifies it in its own unique way, based on its past experiences.

After analyzing my own usage of German, I have realized that my fallback gender is *die*, maybe because it sounds similar to the English *the*. Or maybe my brain picked up the fact that it is the statistically most common article[^3]. I also had a tendency to use *dem* for dative, when using certain prepositions like "in dem" or "zu dem".

The realization of my own heuristics came together with the realization that almost every foreigner who speaks German is doing this, a pain point shared by millions of migrants.

After this realization, I immediately got to work by writing down the first set of rules. As of writing this, the spec is at version 0.4, meaning it is the fourth major iteration of the ruleset. In the last two years, I have run experiments, trained machine learning models, surveyed people and spent a lot of time thinking about this shared pain point.

Alman aims to address this pain point by, first of all, acknowledging this as a problem, unlike, say, the Goethe Institut. There have been attempts in the past to legitimize ethnolects, such as Feridun Zaimoglu's [Kanak Sprak](https://de.wikipedia.org/wiki/Kanak_Sprak_%E2%80%93_24_Mi%C3%9Ft%C3%B6ne_vom_Rande_der_Gesellschaft). But to my knowledge, nobody tried to legitimize a simplified dialect with a success and academic rigor that left people with no choice but to take it seriously.

Alman is not an ethnolect, nor it has been inspired by one. Its rules have been meticulously selected to minimize divergence from Standard High German, while still being super easy to learn. It does not impose a certain slang, argot or accent. It is ethnicity-less, race-less and class-less. Even native speakers are welcome to use it, though they might have a hard time overcoming the feeling of "being wrong".

I hope that Alman will save countless hours of confusion and show an alternative path to fluency for the millions that are learning German.

---

[^1]: I know this from testing various foreign speakers' Artikel knowledge at parties using an app. If this project ever takes off, I will conduct a more scientific study on this.
[^2]: Anyone who seems to violate this rule has likely spent an impractical amount of time trying to learn noun genders by heart, employing spaced repetition systems, flashcards, etc. To those people, I want to ask: *"Was it worth it? How many hours of your productive adult life and what opportunities did you sacrifice, in order to learn by heart something a native speaker just picks up while growing up?"*
[^3]: I have made a small study on this: [Frequencies of Definite Articles in Written vs Spoken German](https://solmaz.io/frequencies-german-definite-articles).