---
layout: post
title: "Frequencies of Definite Articles in Written vs Spoken German"
date: 2024-07-06
---

Unlike a single **"the"** in the English language, the German language has **6 definite articles** that are used based on a noun's gender, case and number:

- 6 definite articles: der, die, das, den, dem, des
- 3 genders: masculine, feminine, neuter (corresponding to "he", "she", "it" in English)
- 4 cases: nominative, accusative, dative, genitive
- 2 numbers: singular, plural

The following table is used to teach when to use which definite article:


| Case       | Masculine | Feminine | Neuter | Plural |
| ---------- | --------- | -------- | ------ | ------ |
| Nominative | der       | die      | das    | die    |
| Accusative | den       | die      | das    | die    |
| Dative     | dem       | der      | dem    | den    |
| Genitive   | des       | der      | des    | der    |

<figure>
**Table 1:** Articles to use in German depending on the noun gender and case.
</figure>

Importantly, native speakers don't look at such tables while learning German as a child. They internalize the rules through exposure and practice.

If you are learning German as a second language, however, you will most likely spend time writing down these tables and memorizing them.

While learning, you will also memorize the genders of nouns. For example, "der Tisch" (the table) is masculine, "die Tür" (the door) is feminine, and "das Buch" (the book) is neuter. Whereas predicting the case and number is straightforward and can be deduced from the context of the sentence, predicting the gender can be much more difficult.

Without going into much detail, take my word for now that the genders are semi-random. Inanimate objects such as a bus can be a "he" or "she", whereas animate objects such as a "girl" can be a "it".

Because of all this, German learners fail to remember the correct gender at times and develop strategies, heuristics, to fall back to some default gender or article when they are unsure. For example, some learners use "der" as a default article when they are unsure, whereas others use "die" or "das".

I have taken many German courses since middle school. Most German courses teach you how to use German correctly, but very few of them teach you what to do when you don't know how to use German correctly, like when you don't know the gender of an article.

This is a precursor to a future post where I will write about those strategies. Any successful strategy must be informed by the frequencies and probability distribution of noun declensions. To that end, I performed Natural Language Processing on two corpuses of the German language:

- Transcriptions of over 140 hours of videos from the [Easy German YouTube channel](https://www.youtube.com/@EasyGerman), which contains lots of street interviews and other spoken examples.
- [10kGNAD: Ten Thousand German News Articles Dataset](https://tblock.github.io/10kGNAD/), which contains over 10,000 cleaned up news articles from an Austrian newspaper.

I will introduce some notation to represent these frequencies easier, which are going to be followed by the results of the analysis.

## Mapping the space of noun declensions

The goal of this article is to show the frequencies of definite articles alongside the declensions of the nouns they accompany. To be able to do that, we need a concise notation to represent the states a noun can be in.

To this end, we introduce the set of grammatical genders $G$,

$$
G = \{\text{Masculine}, \text{Feminine}, \text{Neuter}\}
$$

the set of grammatical cases $C$,

$$
C = \{\text{Nominative}, \text{Accusative}, \text{Dative}, \text{Genitive}\}
$$

and the set of grammatical numbers $N$,

$$
N = \{\text{Singular}, \text{Plural}\}
$$

The set of all possible grammatical states $S$ for a German noun is

$$
S = G \times C \times N
$$

whose number of elements is $\|S\| = 3 \times 4 \times 2 = 24$.

To represent the elements of this set better, we introduce the index notation

$$
S_{ijk} = (N_i, G_j, C_k)
$$

for $i=1,2$, $j=1,2,3$ and $k=1,2,3,4$ correspond to the elements in the order seen in the definitions above.

Elements of $S$ can be shown in a single table, like below:

<table border="1">
  <tr>
    <th rowspan="2">Case</th>
    <th colspan="3" style="text-align:center;">Singular</th>
    <th colspan="3" style="text-align:center;">Plural</th>
  </tr>
  <tr>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
  </tr>
  <tr>
    <td>Nominative</td>
    <td>$S_{111}$</td>
    <td>$S_{121}$</td>
    <td>$S_{131}$</td>
    <td>$S_{211}$</td>
    <td>$S_{221}$</td>
    <td>$S_{231}$</td>
  </tr>
  <tr>
    <td>Accusative</td>
    <td>$S_{112}$</td>
    <td>$S_{122}$</td>
    <td>$S_{132}$</td>
    <td>$S_{212}$</td>
    <td>$S_{222}$</td>
    <td>$S_{232}$</td>
  </tr>
  <tr>
    <td>Dative</td>
    <td>$S_{113}$</td>
    <td>$S_{123}$</td>
    <td>$S_{133}$</td>
    <td>$S_{213}$</td>
    <td>$S_{223}$</td>
    <td>$S_{233}$</td>
  </tr>
  <tr>
    <td>Genitive</td>
    <td>$S_{114}$</td>
    <td>$S_{124}$</td>
    <td>$S_{134}$</td>
    <td>$S_{214}$</td>
    <td>$S_{224}$</td>
    <td>$S_{234}$</td>
  </tr>
</table>

<figure>
**Table 2:** All possible grammatical states of a German noun in one picture.
</figure>

In practice, plural forms of articles and declensions for all genders are the same in each case, so they are shown next to the singular forms:

| Case       | Masculine | Feminine  | Neuter    | Plural                      |
| ---------- | --------- | --------- | --------- | --------------------------- |
| Nominative | $S_{111}$ | $S_{121}$ | $S_{131}$ | $S_{211}, S_{221}, S_{231}$ |
| Accusative | $S_{112}$ | $S_{122}$ | $S_{132}$ | $S_{212}, S_{222}, S_{232}$ |
| Dative     | $S_{113}$ | $S_{123}$ | $S_{133}$ | $S_{213}, S_{223}, S_{233}$ |
| Genitive   | $S_{114}$ | $S_{124}$ | $S_{134}$ | $S_{214}, S_{224}, S_{234}$ |

<figure>
**Table 3:** Plural states across genders are grouped together because they are declined in the same way. Their distinction is irrelevant for learning.
</figure>

which is the case in Table 1 above. You might say, "well, of course". In that case, I invite you to imagine a parallel universe where German grammar is even more complicated and plural forms have to be declined differently as well. Interestingly, you don't need to visit such a universe---you just need to go back in time, [because Old High German grammar was exactly like that](https://web.archive.org/web/20240404192545/https://en.wikipedia.org/wiki/Old_High_German_declension). Note that in that Wikipedia page, some tables has the same shape as Table 2.

*Why introduce such confusing looking notation?* It might look confusing to the untrained eye, but it is actually very useful for representing all possible combinations in a compact way. It also makes it easier to run a sanity check on the results of the analysis through the independence axiom, which we will introduce next.

### Relationships between probabilities

As a side note, the relationship between the probabilities of all grammatical states of a noun and the probabilities of each case is as below:

$$
\begin{aligned}
P(C_1 = \text{Nom}) &= \sum_{i=1}^{2} \sum_{j=1}^{3} P(S_{ij1}) \\
P(C_2 = \text{Acc}) &= \sum_{i=1}^{2} \sum_{j=1}^{3} P(S_{ij2}) \\
P(C_3 = \text{Dat}) &= \sum_{i=1}^{2} \sum_{j=1}^{3} P(S_{ij3}) \\
P(C_4 = \text{Gen}) &= \sum_{i=1}^{2} \sum_{j=1}^{3} P(S_{ij4})
\end{aligned}
$$

Similarly, for each gender:

$$
\begin{aligned}
P(G_1 = \text{Masc}) &= \sum_{i=1}^{2} \sum_{k=1}^{4} P(S_{i1k}) \\
P(G_2 = \text{Fem})  &= \sum_{i=1}^{2} \sum_{k=1}^{4} P(S_{i2k}) \\
P(G_3 = \text{Neut}) &= \sum_{i=1}^{2} \sum_{k=1}^{4} P(S_{i3k}) \\
\end{aligned}
$$

And for each number:

$$
\begin{aligned}
P(N_1 = \text{Sing}) &= \sum_{j=1}^{3} \sum_{k=1}^{4} P(S_{1jk}) \\
P(N_2 = \text{Plur}) &= \sum_{j=1}^{3} \sum_{k=1}^{4} P(S_{2jk}) \\
\end{aligned}
$$

This is useful for going from specific probabilities to general probabilities and vice versa.

### Independence Axiom

We introduce an axiom that will let us run a sanity check on the results of the analysis. At a high level, the axiom states that **the probability of a noun being in a certain case, a certain gender and a certain number are all independent of each other**. For example, the probability of a noun being in the nominative case is independent of the probability of it being masculine or feminine or neuter, and it is also independent of the probability of it being singular or plural. This should be common sense in any large enough corpus, so we just assume it to be true.

Formally, the axiom can be written as

$$
P(S_{ijk}) = P(G_i) P(C_j) P(N_k) \quad \text{for all } i,j,k
$$

where $P(G_i) P(C_j) P(N_k)$ is the joint probability of the noun being in the grammatical state $S_{ijk}$.

In any given corpus, it will be hard to get this equality to hold exactly. In reality, a given corpus or the NLP libraries used in the analysis might have a bias that might distort the equality above.

The idea is that the smaller the difference between the left-hand side and the right-hand side, the more the corpus and the NLP libraries are unbiased and adhere to common sense. As a corpus gets larger and more representative of the entire language, the following quantity should get smaller:

$$
\text{Bias} = \sum_{i=1}^{2} \sum_{j=1}^{3} \sum_{k=1}^{4} |\delta_{ijk}| \quad \text{where}\quad \delta_{ijk} = \hat{P}(S_{ijk}) - \hat{P}(G_i) \hat{P}(C_j) \hat{P}(N_k)
$$

We will calculate this quantity for the two corpuses we have and see how biased either they or the NLP libraries are.

Note that the notation $\hat{P}(S_{ijk})$ is used to denote the empirical probability of the noun being in the grammatical state $S_{ijk}$, which is calculated from the corpus as

$$
\hat{P}(S_{ijk}) = \frac{N_{ijk}}{\sum_{i=1}^{2} \sum_{j=1}^{3} \sum_{k=1}^{4} N_{ijk}}
$$

where $N_{ijk}$ is the count of the noun being in the grammatical state $S_{ijk}$. Similar notation is used for $\hat{P}(G_i)$, $\hat{P}(C_j)$ and $\hat{P}(N_k)$.

## The analysis

I outline step by step how I performed the analysis on the two corpuses.

### Constructing the spoken corpus

The [Easy German YouTube Channel](https://www.youtube.com/@EasyGerman) is a great resource for beginner German learners. It has lots of street interviews with random people on a wide range of topics.

To download the channel, I used [yt-dlp](https://github.com/yt-dlp/yt-dlp), a youtube-dl fork:

```bash
#!/bin/bash
mkdir data
cd data
yt-dlp -f 'ba' -x --audio-format mp3  https://www.youtube.com/@EasyGerman
```

This gave me 946 audio files with over 139 hours of recordings. Then I used [OpenAI's Whisper API](https://github.com/openai/whisper) to transcribe all the audio:

```python
import json
import os

import openai
from tqdm import tqdm

DATA_DIR = "data"
OUTPUT_DIR = "transcriptions"

# Get all mp3 files in the current directory
mp3_files = [
    f for f in os.listdir(DATA_DIR) if os.path.isfile(f) and f.endswith(".mp3")
]

mp3_files = sorted(mp3_files)

# Create the output directory if it doesn't exist
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

for file in tqdm(mp3_files):
    # Create json target file name in output directory
    json_file = os.path.join(OUTPUT_DIR, file.replace(".mp3", ".json"))

    # If the json file already exists, skip it
    if os.path.exists(json_file):
        print(f"Skipping {file} because {json_file} already exists")
        continue

    # Check if the file is greater than 25MB
    if os.path.getsize(file) > 25 * 1024 * 1024:
        print(f"Skipping {file} because it is greater than 25MB")
        continue

    print(f"Running {file}")
    try:
        output = openai.Audio.transcribe(
            model="whisper-1",
            file=open(file, "rb"),
            format="verbose_json",
        )
        output = output.to_dict()
        json.dump(output, open(json_file, "w"), indent=2)
    except openai.error.APIError:
        print(f"Skipping {file} because of API error")
        continue
```

This gave me a lot to work with, specifically a little bit over 1 million words of spoken German. As a reference, the content of the videos can fill roughly more than 10 novels, or alternatively, [400 Wikipedia articles](https://wikicount.net/). Note that I created this dataset around May 2023, so the dataset would be even bigger if I ran the script today. However, it still costs money to transcribe the audio, so I will stick with this dataset for now.

### Constructing the written corpus

The [10kGNAD: Ten Thousand German News Articles Dataset](https://tblock.github.io/10kGNAD/) contains over 10,000 cleaned up news articles from an Austrian newspaper. I downloaded the dataset and modified the [script they provided](https://github.com/tblock/10kGNAD/blob/master/code/extract_dataset_from_sqlite.py) to extract the articles from the database and write them to a text file:

```python
import re
import sqlite3

from tqdm import tqdm
from bs4 import BeautifulSoup


ARTICLE_QUERY = (
  "SELECT Path, Body FROM Articles "
  "WHERE PATH LIKE 'Newsroom/%' "
  "AND PATH NOT LIKE 'Newsroom/User%' "
  "ORDER BY Path"
)

conn = sqlite3.connect(PATH_TO_SQLITE_FILE)
cursor = conn.cursor()

corpus = open(TARGET_PATH, "w")

for row in tqdm(cursor.execute(ARTICLE_QUERY).fetchall(), unit_scale=True):
    path = row[0]
    body = row[1]
    text = ""
    description = ""

    soup = BeautifulSoup(body, "html.parser")

    # get description from subheadline
    description_obj = soup.find("h2", {"itemprop": "description"})
    if description_obj is not None:
        description = description_obj.text
        description = description.replace("\n", " ").replace("\t", " ").strip() + ". "

    # get text from paragraphs
    text_container = soup.find("div", {"class": "copytext"})
    if text_container is not None:
        for p in text_container.findAll("p"):
            text += (
                p.text.replace("\n", " ")
                .replace("\t", " ")
                .replace('"', "")
                .replace("'", "")
                + " "
            )
    text = text.strip()

    # remove article autors
    for author in re.findall(
        r"\.\ \(.+,.+2[0-9]+\)", text[-50:]
    ):  # some articles have a year of 21015..
        text = text.replace(author, ".")

    corpus.write(description + text + "\n\n")

conn.close()
```

This gave me 10277 articles with around 3.7 million words of written German. Note that this is over 3 times bigger than the spoken corpus.

### NLP and counting the frequencies

I used [spaCy](https://en.wikipedia.org/wiki/Part-of-speech_tagging) for Part-of-Speech Tagging. This basically assigns to each word whether it is a noun, pronoun, adjective, determiner etc. Definite articles will have the PoS tag `"DET"` in the output of spaCy.

spaCy is pretty useful. For any `token` in the output, `token.head` gives the syntactic parent, or "governor" of the `token`. For definite articles like "der", "die", "das", the head will be the noun they are referring to. If spaCy couldn't connect the article with a noun, any deduction of gender has a high likelihood of being wrong, so I skip those cases.

```python
import numpy as np
import spacy
from tqdm import tqdm

CORPUS = "corpus/easylang-de-corpus-2023-05.txt"
# CORPUS = "corpus/10kGNAD_single_file.txt"

ARTICLES = ["der", "die", "das", "den", "dem", "des"]
CASES = ["Nom", "Acc", "Dat", "Gen"]
GENDERS = ["Masc", "Fem", "Neut"]
NUMBERS = ["Sing", "Plur"]

CASE_IDX = {i: CASES.index(i) for i in CASES}
GENDER_IDX = {i: GENDERS.index(i) for i in GENDERS}
NUMBER_IDX = {i: NUMBERS.index(i) for i in NUMBERS}

# Create an array of the articles
ARTICLE_ijk = np.empty((2, 3, 4), dtype="<U32")

ARTICLE_ijk[0, 0, 0] = "der"
ARTICLE_ijk[0, 1, 0] = "die"
ARTICLE_ijk[0, 2, 0] = "das"
ARTICLE_ijk[0, 0, 1] = "den"
ARTICLE_ijk[0, 1, 1] = "die"
ARTICLE_ijk[0, 2, 1] = "das"
ARTICLE_ijk[0, 0, 2] = "dem"
ARTICLE_ijk[0, 1, 2] = "der"
ARTICLE_ijk[0, 2, 2] = "dem"
ARTICLE_ijk[0, 0, 3] = "des"
ARTICLE_ijk[0, 1, 3] = "der"
ARTICLE_ijk[0, 2, 3] = "des"
ARTICLE_ijk[1, :, 0] = "die"
ARTICLE_ijk[1, :, 1] = "die"
ARTICLE_ijk[1, :, 2] = "den"
ARTICLE_ijk[1, :, 3] = "der"

# Use the best transformer-based model from SpaCy
MODEL = "de_dep_news_trf"
nlp_spacy = spacy.load(MODEL)

# Initialize the count array. We will divide the elements by the
# total count of articles to get the probability of each S_ijk
N_ijk = np.zeros((len(NUMBERS), len(GENDERS), len(CASES)), dtype=int)

corpus = open(CORPUS).read()
texts = corpus.split("\n\n")

for text in tqdm(texts):
    # Parse the text
    doc = nlp_spacy(text)

    for token in doc:
        # Get token string
        token_str = token.text
        token_str_lower = token_str.lower()

        # Skip if token is not one of der, die, das, den, dem, des
        if token_str_lower not in ARTICLES:
            continue

        # Check if token is a determiner
        # Some of them can be pronouns, e.g. a large percentage of "das"
        if token.pos_ != "DET":
            continue

        # If SpaCy couldn't connect the article with a noun, skip
        head = token.head
        if head.pos_ not in ["PROPN", "NOUN"]:
            continue

        # Get the morphological features of the token
        article_ = token_str_lower
        token_morph = token.morph.to_dict()
        case_ = token_morph.get("Case")
        gender_ = token_morph.get("Gender")
        number_ = token_morph.get("Number")

        # Get the indices i, j, k
        gender_idx = GENDER_IDX.get(gender_)
        case_idx = CASE_IDX.get(case_)
        number_idx = NUMBER_IDX.get(number_)

        # If we could get all the indices by this point, try to get the
        # corresponding article from the array we defined above.
        # This is another sanity check
        if gender_idx is not None and case_idx is not None and number_idx is not None:
            article_check = ARTICLE_ijk[number_idx, gender_idx, case_idx]
        else:
            article_check = None

        # If the sanity check passes, increment the count of N_ijk
        if article_ == article_check:
            N_ijk[number_idx, gender_idx, case_idx] += 1
```

To calculate $\hat{P}(S_{ijk})$, we divide the counts by the total number of articles:

```python
P_S_ijk = N_ijk / np.sum(N_ijk)
```

Then we calculate the empirical probabilities of each gender, case and number:

```python
# Probabilities for each number
P_N = np.sum(P_S_ijk, axis=(1, 2))

# Probabilities for each gender
P_G = np.sum(P_S_ijk, axis=(0, 2))

# Probabilities for each case
P_C = np.sum(P_S_ijk, axis=(0, 1))
```
The joint probability $\hat{P}(G_i) \hat{P}(C_j) \hat{P}(N_k)$ is calculated as:

```python
joint_prob_ijk = np.zeros((2, 3, 4))

for i in range(2):
    for j in range(3):
        for k in range(4):
            joint_prob_ijk[i, j, k] = P_N[i] * P_G[j] * P_C[k]
```

Finally, we calculate the difference between the empirical probabilities and the joint probabilities:

```python
delta_ijk = 100 * (P_S_ijk - joint_prob_ijk)
```

This will serve as an error term to see how biased the corpus is. The bigger the error term, the higher the chance of something being wrong with the corpus or the NLP libraries used.

### High level results

I compare the following statistics between the spoken and written corpus:

- The frequencies of definite articles.
- The frequencies of genders.
- The frequencies of cases.
- The frequencies of numbers.

As I have already annotated in the code above, the analysis took into account the tokens that match the following criteria:

- Is one of "der", "die", "das", "den", "dem", "des",
- Has the PoS tag `DET`
- Is connected to a noun (`token.head.pos_` is either `PROPN` or `NOUN`)

This lets me count the frequencies of the definite articles alongside the declensions of the nouns they accompany. The results are as follows:

#### Frequencies of genders

The distribution of the genders of the corresponding nouns is as below:

| Gender | Spoken corpus      | Written corpus        |
|--------|--------------------|-----------------------|
| Masc   | 30.78 % (10579)    | 33.99 % (109906)      |
| Fem    | 44.83 % (15407)    | 47.77 % (154485)      |
| Neut   | 24.39 % (8381)     | 18.24 % (58998)       |

<figure>
![](/assets/images/frequencies-german-definite-articles/gender_distribution.svg)

**Table and Figure 4:** Each gender, their percentage and count for the spoken and written corpora.
</figure>

Observations:
- The written corpus contains ~6 percentage points less neuter nouns than the spoken corpus.
- This ~6 pp difference is distributed almost equally between the masculine and feminine nouns, with the written corpus containing ~3 pp more feminine nouns and ~3 pp more masculine nouns.

The difference is considerable and might point out to a bias in the way Whisper transcribed the speech or spaCy has parsed it. Both corpora are large enough to be representative, so this needs investigation in a future post.

#### Frequencies of cases

The distribution of the cases that the article-noun pairs are in is as below:

| Case | Spoken corpus       | Written corpus        |
|------|---------------------|-----------------------|
| Nom  | 35.96 % (12357)     | 34.82 % (112612)      |
| Acc  | 33.75 % (11598)     | 23.52 % (76062)       |
| Dat  | 25.98 % (8929)      | 23.59 % (76298)       |
| Gen  | 4.32 % (1483)       | 18.06 % (58417)       |

<figure>
![](/assets/images/frequencies-german-definite-articles/case_distribution.svg)

**Table and Figure 5:** Each case, their percentage and count for the spoken and written corpora.
</figure>

The spoken corpus has ~10 pp more accusative nouns, ~2 pp more dative nouns and ~13 pp less genitive nouns compared to the written corpus. The nominative case is more or less the same in both corpora.

This might be the analysis capturing the contemporary decline of the genitive case in the German language, as popularized by Bastian Sick with the phrase "Der Dativ ist dem Genitiv sein Tod" (The dative is the death of the genitive) [with his eponymous book](https://en.wikipedia.org/wiki/Der_Dativ_ist_dem_Genitiv_sein_Tod). However, the graph clearly shows a trend towards accusative, and much less towards dative.

Moreover, written language differs in tone and style from spoken language for many languages, including German. This might also explain the differences in the frequencies of the cases.

If this is not due to a bias, we might be onto something here. This also needs further investigation in a future post.

#### Frequencies of numbers

The distribution of the numbers of the corresponding nouns is as below:

| Number | Spoken corpus      | Written corpus        |
|--------|--------------------|-----------------------|
| Sing   | 81.10 % (27870)    | 79.18 % (256066)      |
| Plur   | 18.90 % (6497)     | 20.82 % (67323)       |

<figure>
![](/assets/images/frequencies-german-definite-articles/number_distribution.svg)

**Table and Figure 6:** Each number, their percentage and count for the spoken and written corpora.
</figure>

The ratio of singular to plural nouns is more or less the same in both corpora. I wonder whether this 80-20 ratio is "universal" in German or any other languages as well...

#### Frequencies of definite articles

The distribution of the definite articles in the spoken and written corpus is as below:

| Article | Spoken corpus | Written corpus  |
| ------- | ------------- | --------------- |
| der | 26.74 % (9190)  | 34.44 % (111378) |
| die | 36.47 % (12534) | 32.60 % (105416) |
| das | 15.80 % (5430)  | 8.81 % (28481)   |
| den | 12.22 % (4201)  | 11.50 % (37174)  |
| dem | 7.39 % (2539)   | 6.23 % (20135)   |
| des | 1.38 % (473)    | 6.43 % (20805)   |

<figure>
![](/assets/images/frequencies-german-definite-articles/article_distribution.svg)

**Table and Figure 7:** Each definite article, their percentage and count for the spoken and written corpora.
</figure>

Observations:

- `der` appears less frequently (~8 pp difference),
- `die` appears more frequently (~4 pp difference),
- `das` appears more frequently (~7 pp difference),
- `des` appears less frequently (~5 pp difference),

in the spoken corpus compared to the written corpus. `den` and `dem` are more or less the same in both corpora.

The ~7 pp difference in `das` is despite the fact that ~78% of the occurrence of the token `das` in the spoken corpus are **pronouns** (`PRON`, not `DET`) and hence excluded from the table above. See the [section below](#calculating-the-number-of-articles-used-as-determiners-versus-pronouns) for more details. Looking at the gender distribution above, the spoken corpus contains ~6 pp more neuter nouns than the written corpus, which might explain this discrepancy.

### Empirical probabilities for the spoken corpus

Empirical probabilities:

<table border="1">
  <tr>
    <th rowspan="2">Case</th>
    <th colspan="3" style="text-align:center;">Singular</th>
    <th colspan="3" style="text-align:center;">Plural</th>
  </tr>
  <tr>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
  </tr>
  <tr>
    <td>Nominative</td>
    <td>9.55 %</td>
    <td>11.16 %</td>
    <td>8.64 %</td>
    <td>3.61 %</td>
    <td>1.71 %</td>
    <td>1.28 %</td>
  </tr>
  <tr>
    <td>Accusative</td>
    <td>7.88 %</td>
    <td>11.96 %</td>
    <td>7.16 %</td>
    <td>2.83 %</td>
    <td>2.26 %</td>
    <td>1.66 %</td>
  </tr>
  <tr>
    <td>Dative</td>
    <td>3.84 %</td>
    <td>14.25 %</td>
    <td>3.55 %</td>
    <td>1.83 %</td>
    <td>1.36 %</td>
    <td>1.16 %</td>
  </tr>
  <tr>
    <td>Genitive</td>
    <td>0.71 %</td>
    <td>1.73 %</td>
    <td>0.67 %</td>
    <td>0.54 %</td>
    <td>0.40 %</td>
    <td>0.27 %</td>
  </tr>
</table>
<figure>
**Table 8:** $\hat{P}(S_{ijk})$ for the spoken corpus.
</figure>

Click below to see the joint probabilities and their differences as an error term:

<details>
Joint probabilities:

<table border="1">
  <tr>
    <th rowspan="2">Case</th>
    <th colspan="3" style="text-align:center;">Singular</th>
    <th colspan="3" style="text-align:center;">Plural</th>
  </tr>
  <tr>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
  </tr>
  <tr>
    <td>Nominative</td>
    <td>8.98 %</td>
    <td>13.07 %</td>
    <td>7.11 %</td>
    <td>2.09 %</td>
    <td>3.05 %</td>
    <td>1.66 %</td>
  </tr>
  <tr>
    <td>Accusative</td>
    <td>8.42 %</td>
    <td>12.27 %</td>
    <td>6.67 %</td>
    <td>1.96 %</td>
    <td>2.86 %</td>
    <td>1.56 %</td>
  </tr>
  <tr>
    <td>Dative</td>
    <td>6.49 %</td>
    <td>9.45 %</td>
    <td>5.14 %</td>
    <td>1.51 %</td>
    <td>2.20 %</td>
    <td>1.20 %</td>
  </tr>
  <tr>
    <td>Genitive</td>
    <td>1.08 %</td>
    <td>1.57 %</td>
    <td>0.85 %</td>
    <td>0.25 %</td>
    <td>0.37 %</td>
    <td>0.20 %</td>
  </tr>
</table>
<figure>
**Table 9:** $\hat{P}(G_i) \hat{P}(C_j) \hat{P}(N_k)$ for the spoken corpus.
</figure>

Their differences:
<table border="1">
  <tr>
    <th rowspan="2">Case</th>
    <th colspan="3" style="text-align:center;">Singular</th>
    <th colspan="3" style="text-align:center;">Plural</th>
  </tr>
  <tr>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
  </tr>
  <tr>
    <td>Nominative</td>
    <td>0.58 %</td>
    <td>-1.91 %</td>
    <td>1.53 %</td>
    <td>1.52 %</td>
    <td>-1.33 %</td>
    <td>-0.38 %</td>
  </tr>
  <tr>
    <td>Accusative</td>
    <td>-0.54 %</td>
    <td>-0.31 %</td>
    <td>0.49 %</td>
    <td>0.86 %</td>
    <td>-0.60 %</td>
    <td>0.10 %</td>
  </tr>
  <tr>
    <td>Dative</td>
    <td>-2.65 %</td>
    <td>4.80 %</td>
    <td>-1.59 %</td>
    <td>0.32 %</td>
    <td>-0.85 %</td>
    <td>-0.04 %</td>
  </tr>
  <tr>
    <td>Genitive</td>
    <td>-0.37 %</td>
    <td>0.16 %</td>
    <td>-0.18 %</td>
    <td>0.29 %</td>
    <td>0.03 %</td>
    <td>0.07 %</td>
  </tr>
</table>
<figure>
**Table 10:** $\delta_{ijk}$ for the spoken corpus.
</figure>
</details>

Observations:

For most elements, the differences are less than 1-2%, which is a good sign. However, significant bias shows for some cases:

- 4.80 % (der, feminine, dative, singular)
- -2.65 % (dem, masculine, dative, singular)
- -1.91 % (die, feminine, nominative, singular)
- -1.33 % (die, feminine, nominative, plural)
- and so on...

I add more comments following the results for the written corpus below.

### Empirical probabilities for the written corpus

<table border="1">
  <tr>
    <th rowspan="2">Case</th>
    <th colspan="3" style="text-align:center;">Singular</th>
    <th colspan="3" style="text-align:center;">Plural</th>
  </tr>
  <tr>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
  </tr>
  <tr>
    <td>Nominative</td>
    <td>10.63 %</td>
    <td>12.24 %</td>
    <td>5.14 %</td>
    <td>3.64 %</td>
    <td>2.11 %</td>
    <td>1.06 %</td>
  </tr>
  <tr>
    <td>Accusative</td>
    <td>6.31 %</td>
    <td>9.26 %</td>
    <td>3.67 %</td>
    <td>1.73 %</td>
    <td>1.63 %</td>
    <td>0.92 %</td>
  </tr>
  <tr>
    <td>Dative</td>
    <td>3.82 %</td>
    <td>12.18 %</td>
    <td>2.41 %</td>
    <td>2.06 %</td>
    <td>1.80 %</td>
    <td>1.32 %</td>
  </tr>
  <tr>
    <td>Genitive</td>
    <td>3.61 %</td>
    <td>7.09 %</td>
    <td>2.82 %</td>
    <td>2.19 %</td>
    <td>1.45 %</td>
    <td>0.90 %</td>
  </tr>
</table>
<figure>
**Table 11:** $\hat{P}(S_{ijk})$ for the written corpus.
</figure>

Click below to see the joint probabilities and their differences as an error term:

<details>
Joint probabilities:

<table border="1">
  <tr>
    <th rowspan="2">Case</th>
    <th colspan="3" style="text-align:center;">Singular</th>
    <th colspan="3" style="text-align:center;">Plural</th>
  </tr>
  <tr>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
  </tr>
  <tr>
    <td>Nominative</td>
    <td>9.37 %</td>
    <td>13.17 %</td>
    <td>5.03 %</td>
    <td>2.46 %</td>
    <td>3.46 %</td>
    <td>1.32 %</td>
  </tr>
  <tr>
    <td>Accusative</td>
    <td>6.33 %</td>
    <td>8.90 %</td>
    <td>3.40 %</td>
    <td>1.66 %</td>
    <td>2.34 %</td>
    <td>0.89 %</td>
  </tr>
  <tr>
    <td>Dative</td>
    <td>6.35 %</td>
    <td>8.92 %</td>
    <td>3.41 %</td>
    <td>1.67 %</td>
    <td>2.35 %</td>
    <td>0.90 %</td>
  </tr>
  <tr>
    <td>Genitive</td>
    <td>4.86 %</td>
    <td>6.83 %</td>
    <td>2.61 %</td>
    <td>1.28 %</td>
    <td>1.80 %</td>
    <td>0.69 %</td>
  </tr>
</table>
<figure>
**Table 12:** $\hat{P}(G_i) \hat{P}(C_j) \hat{P}(N_k)$ for the written corpus.
</figure>

Their differences:
<table border="1">
  <tr>
    <th rowspan="2">Case</th>
    <th colspan="3" style="text-align:center;">Singular</th>
    <th colspan="3" style="text-align:center;">Plural</th>
  </tr>
  <tr>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
    <th>Masculine</th>
    <th>Feminine</th>
    <th>Neuter</th>
  </tr>
  <tr>
    <td>Nominative</td>
    <td>1.26 %</td>
    <td>-0.93 %</td>
    <td>0.11 %</td>
    <td>1.17 %</td>
    <td>-1.35 %</td>
    <td>-0.26 %</td>
  </tr>
  <tr>
    <td>Accusative</td>
    <td>-0.02 %</td>
    <td>0.37 %</td>
    <td>0.27 %</td>
    <td>0.06 %</td>
    <td>-0.71 %</td>
    <td>0.03 %</td>
  </tr>
  <tr>
    <td>Dative</td>
    <td>-2.53 %</td>
    <td>3.26 %</td>
    <td>-1.00 %</td>
    <td>0.39 %</td>
    <td>-0.54 %</td>
    <td>0.43 %</td>
  </tr>
  <tr>
    <td>Genitive</td>
    <td>-1.25 %</td>
    <td>0.26 %</td>
    <td>0.21 %</td>
    <td>0.92 %</td>
    <td>-0.35 %</td>
    <td>0.21 %</td>
  </tr>
</table>
<figure>
**Table 13:** $\delta_{ijk}$ for the written corpus.
</figure>
</details>

Observations:

The difference terms follow a similar pattern to the spoken corpus in the extreme cases:

- 3.26 % (der, feminine, dative, singular)
- -2.53 % (dem, masculine, dative, singular)
- -1.35 % (die, feminine, nominative, plural)

Since the bias is most extreme in many common cells, this leads me to believe that there is a bias in spaCy's `de_dep_news_trf` model that confuses the case or gender in some cases. This hypothesis can be tested by using a different model and library, and calculating the differences again. I'm leaving that as future work.

### Calculating the number of articles used as determiners versus pronouns

Another comparison of interest is whether one of the "der", "die", "das", "den", "dem", "des" is used more as a pronoun than as a determiner. To give an example, "das" can be used as a pronoun in the sentence *"Das ist ein Buch"* (That is a book) or as a determiner in the sentence *"Das Buch ist interessant"* (The book is interesting).

We can calculate this by storing the PoS tags of tokens that match "der", "die", "das", "den", "dem", "des" and dividing the numbers by the occurrence of each article.

```python
import spacy
from tqdm import tqdm

CORPUS = "corpus/easylang-de-corpus-2023-05.txt"
# CORPUS = "corpus/10kGNAD_single_file.txt"

ARTICLES = ["der", "die", "das", "den", "dem", "des"]

MODEL = "de_dep_news_trf"
nlp_spacy = spacy.load(MODEL)

# This array will store the count of each POS tag for each article
POS_COUNT_DICT = {i: {} for i in ARTICLES}

corpus = open(CORPUS).read()
texts = corpus.split("\n\n")

for text in tqdm(texts):
    doc = nlp_spacy(text)

    for token in doc:
        success = True

        # Get token string
        token_str = token.text
        token_str_lower = token_str.lower()

        if token_str_lower not in ARTICLES:
            continue

        if token.pos_ not in POS_COUNT_DICT[token_str_lower]:
            POS_COUNT_DICT[token_str_lower][token.pos_] = 0

        POS_COUNT_DICT[token_str_lower][token.pos_] += 1

print(POS_COUNT_DICT)
```

For both corpora, the >99% of the PoS tags are either `DET` or `PRON`. I have ignored the rest of the tags for simplicity.

| Article | Pronoun % in spoken corpus | Pronoun % in written corpus |
|-----|-----------------------------|------------------------------|
| der | 15.4 % (1734 out of 11242)  | 5.8 %  (7125 out of 123442)  |
| die | 29.3 % (6024 out of 20557)  | 11.6 % (14696 out of 126783) |
| das | **78.6 %** (20941 out of 26638) | 33.1 % (14439 out of 43673)  |
| den | 11.3 % (602 out of 5332)    | 2.0 %  (836 out of 41393)    |
| dem | 12.2 % (360 out of 2962)    | 8.9 %  (2060 out of 23060)   |
| des | 0.6 %  (3 out of 493)       | 0.0 %  (8 out of 21548)      |

<figure>
![](/assets/images/frequencies-german-definite-articles/pronoun_det_distribution.svg)

**Table and Figure 14:** Percentage of usage of "der", "die", "das", "den", "dem", "des" as pronouns versus determiners in the spoken and written corpora.
</figure>

Observations:

The spoken corpus overall uses more pronouns than the written corpus. The most striking difference is in the usage of "das" as a pronoun, with the spoken corpus using it as a pronoun in ~45 pp more cases than the written corpus. This might be due to a bias at any point in the analysis pipeline, or it might be due to the nature of spoken versus written language.

### Conclusion

I have already commented a great deal below each result above. I don't want to speak in absolutes at this point, because the analysis might be biased due to the following factors:

- Corpus bias: Easy German is a YouTube channel for German learning, and despite having a diverse set of street interviews, there is also a lot of accompanying content that might skew the results. Similarly, the 10kGNAD dataset is a collection of news articles from an Austrian newspaper, which might also skew the results. There might be differences between Austrian German and German German. To overcome any corpus related biases, this work should be repeated with even more data.
- Transcription bias: I used OpenAI's Whisper V2 in May 2023 to transcribe the spoken corpus. There might be a bias in Whisper that might show up in the results. Whisper is currently among state-of-the-art speech-to-text models. We will most likely get better, faster and cheaper models in the upcoming years, and we can then repeat this analysis with them.
- NLP bias: I used spaCy's `de_dep_news_trf` model for Part-of-Speech Tagging. There might be a bias in this model that might show up in the results. I might use another library in spaCy, or a different NLP library altogether, to see if the results change.

That being said, if I were to draw any conclusions from the results above, those would be:

#### Most frequent articles

For spoken German, the most frequently used definite articles (excluding pronouns) are in the order: `die` > `der` > `das` > `den` > `dem` > `des`.

For written German, the order is: `der` > `die` > `den` > `das` > `des` > `dem`.

`die` is statistically the most used definite article with close to 40% usage in spoken German Moreover, `der`, `die` and `das` collectively make up ~80% of the definite articles used in spoken German. So if you never learn the rest, you would be speaking German correctly 80% of the time, assuming that you are using the cases correctly.

#### Using das as pronoun in spoken German

`das` is used as a pronoun much more frequently in spoken German than in written German.

#### Most frequent genders

The most frequently used genders are in the order: feminine > masculine > neuter. This is widely known and has been recorded by many other studies as well.

#### Genitive on the fall, accusative (more so) and dative (less so) on the rise

Germans use genitive much less when speaking compared to writing. Surprisingly, this reflects in an increase **more in the accusative** case than in the dative case. This might point out to a trend where **dative is falling out of favor as well**. This is not to imply that accusative phrasing can be a substitute for genitive, like using "von" (of, which is dative) instead of the genitive case.

All of this point out to a trend of simplification in declension patterns of spoken German. Considering Old High German---the language German once---was even more complicated in that regard, the findings above don't surprise me.

> I might update this post with more findings or refutations of above conclusions later on, if future data shows that they are false.

---

Originally posted at [solmaz.io](https://solmaz.io/frequencies-german-definite-articles).