---
layout: post
title: Economic Burden of Language Complexity
date: 2024-05-04
---

Some languages are harder to learn compared to others. Difficulty can show up in different places. For example, English has a relatively easy grammar, but [writing it](https://en.wikipedia.org/wiki/English_orthography) can be challenging. Remember the first time you learned to write *thorough*, *through*, *though*, *thought* and *tough*.

Then take Chinese as an example. Its grammar is more simple than English---no verb conjugations, no tenses, no plurals, no articles. Its [sounds and intonation](https://en.wikipedia.org/wiki/Standard_Chinese_phonology) are unusual for a westerner, but arguably not *that* difficult. The most difficult part might be the [writing system](https://en.wikipedia.org/wiki/Written_Chinese), with thousands of characters that must be memorized before one can read and write fluently. A 7-year old primary schooler can learn to read and write English in 2 years, whereas for Chinese it takes at least 4 years. This is despite [multiple simplifications in the Chinese writing system](https://en.wikipedia.org/wiki/Simplified_Chinese_characters) in the 20th century.

Now compare two adult workers of equal skill: a native Chinese emigrating to the US and learning English, versus a native American emigrating to China and learning Chinese. Which one will be able to **start working and contributing to the economy faster**? Extrapolating from the primary school example, the US adult could take at least twice as long to learn Chinese compared to their Chinese counterpart learning English---at least for reading and writing.

Time is money. It takes time to learn a language, and it takes more time to learn a "harder" one. Therefore, learning a complicated language has a cost. The cost of language complexity applies not only to native speakers, but also to foreign learners, which are the focus of this post:

> The more complex the language of a country, the less attractive it is to foreign workers, skilled or otherwise.

This is because any worker who decides to move to a country with a more complex language will **take longer** to start contributing to the economy. This can be measured directly in terms of lost wages, taxes, and productivity.

Any such worker will also find it more difficult to integrate into the society, which can create indirect costs that are harder to measure, but are a burden nonetheless. For example, it could result in reduced upward mobility, decreased purchasing power, increased reliance on social services, and so on.

Here, I will focus on a cost that is one of the most tangible and easiest to quantify: wages that are lost due to language complexity. Doing that is relatively easy and gets my point across. I will then apply my calculation to a specific language, German, as a case study.

## Wages lost while learning the local language

I will attempt a back-of-the-envelope calculation to estimate the total value of lost wages per year for all foreign workers in a country, while they are learning the local language. "Lost wages" mean the money that workers would have earned if they were working instead of learning the language, and the economic value that is not created as a result.

This is going to be a simplified model with many assumptions. For example, I assume that foreign workers do not know the local language when they arrive and spend a fixed amount of time per week learning the local language.

In the model, a given country receives $R$ foreign workers per year through migration. Each foreign worker takes $T$ years to learn the local language. Assuming that the rate of immigration $R$ stays constant (steady state), the number $N$ of foreign workers learning the local language at any given time is given by:

$$
N = R \times T
$$

The average foreign worker dedicates $F$ hours per week to learning the local language. Most likely, only a percentage $D$ of $F$ will block actual work hours, for example in the form of an intensive language course, and the rest of the learning will take place during free time. If the average foreign worker works $W$ weeks per year, then the total number of hours per year that they spend learning the local language, **that would otherwise be spent working**, is given by:

$$
L = D \times F \times W
$$

Assuming that the average foreign worker earns $S$ [units of currency](https://en.wikipedia.org/wiki/Num%C3%A9raire) per hour, the total value $C$ of lost wages per year and per foreign worker is given by:

$$
C = S \times L
$$

We assume that for the given language, it takes $P$ hours of study to reach a certain level of proficiency necessary to communicate effectively in the workplace, say [B2](https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages). Then we can calculate the number of years $T$ it takes to reach that level as:

$$
T = \frac{P}{F \times W}
$$

Finally, the total value of lost wages per year for all foreign workers in a country is given by:

$$
\begin{aligned}
C_{\text{total}} &= C \times N \\
&= (S \times L) \times (R \times T) \\
&= S \times (D \times F \times W) \times R \times \left(\frac{P}{F \times W}\right) \\
&= S \times D \times R \times P \\
\end{aligned}
$$

Put into words, the total value of lost wages per year for all foreign workers in a country is equal to the multiplication of the average hourly wage $S$, the percentage of time spent learning the language that displaces work $D$, the number of people immigrating per year $R$, and the number of hours of study required to reach a certain level of proficiency $P$.

If you could measure all these values accurately, you would have a good minimum estimate, a lower bound of the economic burden of teaching a language to foreign workers. The burden of *complexity* for any given language would then only be calculated by comparing its $P$ value to that of other languages.

Take Germany as an example. Given the values of $S$, $D$, $R$ for Germany, and the $P$ values for both German and English, you could calculate the money that the German economy is losing per year by German not being as easy to learn as English:

$$
C_{\text{complexity}} = S \times D \times R \times (P_{\text{German}} - P_{\text{English}})
$$

I attempt to calculate this below, with values I could find on the internet.

## Case study: German

I live in Germany and I wrote this post with the German language in mind. Compared to other European languages like English or Spanish, German has certain features that makes it harder to learn. For example, it has a noun gender system where each noun can be one of three genders and each gender has to be inflected differently. These genders are random enough to cost a significant amount time while learning it as a second language.

Unfortunately, I haven't found any authoritative data on how much harder German exactly is to learn, compared to other languages. It is not possible to exactly quantify language difficulty, because it not only depends on the language itself but also on the native language of the learner, their age, their motivation, and so on. Any data I present below are anecdotal and should be taken with a grain of salt.

That being said, the fact that German is harder to learn as a second language compared to, say, English, is self-evident to most people who have tried to learn both from the beginner level. So the data below is still useful, because it visually represents this difference in difficulty.

### Hours required to reach B2 level

To begin with, [Goethe Institut](https://en.wikipedia.org/wiki/Goethe-Institut) has put up the following values for German on the FAQ section of their website[^1]:

> As a rough guideline, we estimate it will take the following amount of instruction to complete each language level:
>
> - A1 : approx. 60-150 hours (80-200 TU*)
> - A2 : approx. 150-260 hours (200-350 TU*)
> - B1 : approx. 260-490 hours (350-650 TU*)
> - B2 : approx. 450-600 hours (600-800 TU*)
> - C1 : approx. 600-750 hours (800-1000 TU*)
> - C2 : approx. 750+ hours (1000+ TU*)
>
> *TU = Teaching Unit; a teaching unit consists of 45 minutes of instruction.

The Goethe Institut website does not cite the study where these numbers come from. My guess is that they just published the number of hours spent for each level from their official curriculum.

Another low-reliability source that I found is the Babbel for Business Blog[^2]. They have published the following values for German, English, Spanish, and French:

|        | A1        | A2          | B1        | B2         | C1        | C2         |
|--------|-----------|-------------|-----------|------------|-----------|------------|
| German | 60-150 h  | 150-262 h   | 262-487 h | 487-600 h  | 600-750 h | 750-1050 h |
| English| 60-135 h  | 135-150 h   | 262-300 h | 375-450 h  | 525-750 h | 750-900 h  |
| Spanish| 60-75 h   | 75-150 h    | 150-300 h | 300-413 h  | 413-675 h | 675-825 h  |
| French | 60-135 h  | 135-263 h   | 263-368 h | 368-548 h  | 548-788 h | 788-1088 h |

Note that the values for German are very close to those on the Goethe Institut website, so they were either taken from the same source, or the Babbel blog borrowed them from Goethe Institut. I could not trace a source for the values for English, Spanish, and French.

Plotting the lower bounds of the hours required to reach each CEFR level for German, English, Spanish, and French gives the following graph:

![Hours to reach CEFR levels for German, English, Spanish, French](/assets/images/economic-burden-of-language-complexity/plot1.svg)

This picture intuitively makes sense. Spanish and English are easier compared to German and French, though I doubt Spanish is that much easier than the rest.

I then plot the lower-upper bound range of hours only for German and English, to make the difference more visible:

![Hour ranges to reach CEFR levels for German, English](/assets/images/economic-burden-of-language-complexity/plot2.svg)

If we were to trust the blog post, we would have the following $P$ values for German and English:

| | $P_{\text{German}}$ | $P_{\text{English}}$
|--|--|--|
| Lower bound | 487 | 375 |
| Upper bound | 600 | 450 |
| Average | 543.5 | 412.5 |

I personally don't trust these values, because they don't come from any cited sources. However, I will use them simply because they reaffirm a well known fact, which I don't have the resources to prove scientifically:

$$
P_{\text{German}} > P_{\text{English}}
$$

### Average salary

German Federal Statistical Office (Destatis) publishes the average gross salary in Germany every year. The data from 2022[^3] cites the average hourly wage in Germany as 24.77 euros, which I will round up to $S \approx 25$ euros for simplicity. The average immigrant skilled worker most likely earns more than the average, but I will use this value as a lower bound.

### Migration rate

Destatis also published a press release in 2023[^4] that cites a sharp rise in labour migration in 2022. The number of foreign workers in Germany increased by 56,000 in 2022. I will round this up to $R \approx 60,000$ foreign workers per year, since the trend is upwards.

### Percentage of time spent learning the language

I could not find any data on this, so the best I can do is to assume a value that feels conservative enough not to be higher than the real value. I will assume that a quarter of the time spent learning the local language displaces work hours, i.e. $D \approx 0.25$.

### Final calculation

To summarize, we have the following values:

- It takes around $P \approx 544$ hours of study on average to reach B2 level in German, whereas it takes $P \approx 413$ hours for English.
- The average foreign worker earns $S \approx 25$ euros per hour.
- We assume that $D \approx 0.25$, i.e. quarter of the time spent learning the local language displaces work hours.
- The rate of immigration $R \approx 60,000$ foreign workers per year.

Plugging these values into our formula, we calculate the total value of wages lost per year to language learning for all foreign workers in Germany:

$$
C_{\text{total}} = 25 \times 0.25 \times 60,000 \times 544 = 204,000,000\;\text{euros}
$$

That is, over 200 million euros worth of wages are lost to---or in another perspective, spent on---language education of foreign workers, every year in Germany.

We can then calculate the total value of wages lost per year due to the difference in language complexity between German and English, using the formula we derived earlier:

$$
C_{\text{complexity}} = 25 \times 0.25 \times 60,000 \times (544 - 413) = 49,125,000\;\text{euros}
$$

In other words, the German economy loses at least 49 million euros per year, just because German is harder to learn compared to English.

## Conclusion

A lot of the assumptions I made in this case study are conservative:

- I assumed that the rate of immigration to Germany stays constant, whereas it is increasing year by year.
- I assumed that the average migrating skilled worker earns 25 euros per hour, whereas they most likely earn much more.
- I assumed that by the time you finish your B2 course, your German is good enough to start working, whereas it takes much longer to feel confident using the language in a professional setting.

The model further ignores the indirect costs of language complexity, such as not being able to integrate into the society, or even people not moving to Germany in the first place because of the language barrier. Considering those factors, how much higher would you expect the burden of language complexity to be? 100 million euros? 1 billion euros?

What is the cost of not being able to:

- communicate effectively with your colleagues, your boss, your customers?
- read the news, the laws, the contracts?
- understand the culture, the jokes, the idioms?
- express yourself, your ideas, your feelings?

But above all, what does it cost a country if it is unable to teach its language effectively or spread its culture?

*Immeasurable.*

Should an immigrant take a language curriculum at face value, if the majority of the people who take it after a certain age can never speak as perfect as native level, and end up speaking some simplified grammar at best?

*No.*

### References

[^1]: [How long does it take to learn German?](https://web.archive.org/web/20231030173211/https://www.goethe.de/ins/gb/en/sta/lon/kur/faq.html#accordion_toggle_6206750_2), FAQ Page, Goethe Institut
[^2]: [How Long Does It Take to Learn a Language?](https://web.archive.org/web/20231201001021/https://www.babbelforbusiness.com/us/blog/how-long-does-it-take-to-learn-a-language/), Anika Wegner, Babbel for Business Blog, 2023-09-01
[^3]: [Earnings by economic branch and occupation](https://web.archive.org/web/20230621075721/https://www.destatis.de/EN/Themes/Labour/Earnings/Branch-Occupation/_node.html), German Federal Statistical Office (Destatis), 2023-06-21
[^4]: [Sharp rise in labour migration in 2022](https://web.archive.org/web/20240221153647/https://www.destatis.de/EN/Press/2023/04/PE23_165_125.html), German Federal Statistical Office (Destatis), 2023-04-27