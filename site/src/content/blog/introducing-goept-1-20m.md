---
title: "Introducing GoePT-1-20M"
date: 2026-09-11
description: "A 20-million-parameter German-to-Alman model that scored above DeepSeek-V4-Pro on AlmanBench and runs in the browser."
paper: true
abstract: >-
  GoePT-1-20M is a 20-million-parameter model that translates Standard German
  into [Alman, a simplified German dialect](https://alman.ai/). It scored above models such as
  DeepSeek-V4-Pro, Claude Sonnet 5, and Qwen3.8-27B on AlmanBench, with about
  80 thousand times fewer parameters than DeepSeek-V4-Pro. The model was trained
  on Hugging Face infrastructure with ten million teacher-generated
  sentence pairs mixed with reviewed translations. [ML Claw](https://github.com/huggingface/mlclaw), an OpenClaw
  deployment on Hugging Face, made it possible to train the model end to end
  entirely on Hugging Face infrastructure, including an autoresearch loop, while
  the author drove the agent through the messaging app Telegram. GoePT runs
  entirely in the browser and powers Almanpedia, a Wikipedia reader intended
  to make German more approachable for second-language learners.
---

[GoePT-1-20M](https://huggingface.co/osolmaz/GoePT-1-20M) is a 20-million-parameter model for translating Standard German into [Alman](/), a simplified German dialect. Alman keeps German vocabulary and much of its sentence structure while removing grammatical gender and most case inflection. The model runs entirely in the browser, keeps the text on the reader's device, and needs no GPU or model API.

The intended use is a reading aid for people learning German as an additional language. [Almanpedia](https://almanpedia.org), the main application, uses GoePT to translate German Wikipedia and lets readers compare the result with the original. A [standalone translator](/translate/) accepts other texts.

GoePT scored **86.9% on [AlmanBench](/almanbench/)**, a benchmark that checks translations against Alman's rules. This puts it just above DeepSeek-V4-Pro's **85.3%**, with about **80 thousand times fewer parameters**.

The training work ran on Hugging Face infrastructure, using ten million teacher-generated sentence pairs mixed with reviewed translations. [ML Claw](https://github.com/huggingface/mlclaw), an OpenClaw deployment on Hugging Face, provided a Telegram interface for discussing experiments and checking progress.

## Alman and Almanpedia

The [Alman specification](/#spec) gives speakers and translation models a consistent set of rules to apply. Some of these rules formalize shortcuts I use myself as a non-native German speaker, as described in [the first Alman announcement](/blog/out-of-stealth/).

A learner can read familiar subject matter with fewer inflected forms to resolve, then compare it with the German original.

[Economic Burden of Language Complexity](/blog/economic-burden-of-language-complexity/) discussed how the time adults spend learning a language affects their work and participation in society. The [article-frequency study](/blog/frequencies-german-definite-articles/) examined how German articles occur in written and spoken material. These posts explain the motivation for the project. Alman is also a linguistic hobby, with a specification and regression checks.

### Reading Wikipedia

[Almanpedia](https://almanpedia.org) is the main application. It loads articles from German Wikipedia and translates their prose locally with GoePT-1-20M. Readers can switch between the original and the Alman rendering, or inspect the changes. The article's links and citations remain usable.

Replace `de.wikipedia.org` with `almanpedia.org` in an article's address, or search from the Almanpedia homepage. For example, [the article on the German language](https://almanpedia.org/wiki/Deutsche_Sprache) is a suitable place to begin.

The browser downloads the model once and keeps it in its model cache. Loading Wikipedia articles and downloading the model require network access, but translation requests stay on the reader's device. The application keeps the original German available when a block cannot be translated safely.

Reading full articles exposes errors that short benchmark sentences can miss, including awkward sentence boundaries and changes around links. Almanpedia makes it easy to compare the model's output with the text it was meant to preserve.

## Results

We measured translation quality and browser performance separately. AlmanBench checks whether an output matches a rendering licensed by the specification. Two additional eval sets use exact matches to their reference translations.

### AlmanBench

GoePT passed **894 of 1,029 cases**. DeepSeek-V4-Pro, the closest lower-scoring model on the [leaderboard](/almanbench/), passed **878**. The difference is **16 cases, or 1.6 percentage points**. The [recorded DeepSeek run](https://huggingface.co/datasets/osolmaz/almanbench-results) used Novita with default reasoning settings. Figure 1 places GoePT among the nearest scores on either side, using the same source sentences and acceptance sets.

<figure id="figure-adjacent-scores">

[![AlmanBench acceptance for GPT-5.6 Terra xhigh at 87.7%, Kimi K2.7 Code at 87.0%, GoePT-1-20M at 86.9%, DeepSeek V4 Pro at 85.3%, and Claude Sonnet 5 xhigh at 83.4%.](/assets/images/introducing-goept-1-20m/adjacent-model-scores.svg)](/assets/images/introducing-goept-1-20m/adjacent-model-scores.svg "Open figure 1 at full size")

<figcaption>Figure 1. The two nearest scores above and below GoePT on the same 1,029 AlmanBench cases. Red marks GoePT, and the counts inside each bar show accepted cases. These are single-run results.</figcaption>

</figure>

[DeepSeek reports](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro) 1.6 trillion total parameters, about 80,000 times GoePT's 19.94 million. Its mixture-of-experts architecture activates 49 billion per token, still about 2,460 times GoePT's total.

The score difference is small. GoePT passed 95 cases that DeepSeek missed, while DeepSeek passed 79 that GoePT missed. We treat this as a practical tie from one run per model. GoePT reaches that score in a browser-sized model trained specifically for this task.

GoePT also scored above Claude Sonnet 5 at **858/1,029 (83.4%)** and Qwen3.8-27B at **857/1,029 (83.3%)**. Their recorded runs used xhigh and medium reasoning, respectively.

### Browser performance

The browser release uses int8 ONNX weights and single-threaded ONNX Runtime WebAssembly. The complete package is **58.14 MB**, including the runtime, with about **33 MB** of model weights. In the recorded Chromium check, a 2,018-word page completed in **6.43 seconds**. That is a measurement of one fixed page, not a speed promise for every reader's device.

We checked the browser export against the native model on all three eval sets.

| Eval | Native | Browser int8 |
| --- | --- | --- |
| AlmanBench acceptance | 894/1,029 · 86.88% | 894/1,029 · 86.88% |
| 3,512-row eval, exact match | 2,829/3,512 · 80.55% | 2,819/3,512 · 80.27% |
| 3,204-row held-out eval, exact match | 2,538/3,204 · 79.21% | 2,540/3,204 · 79.28% |

Quantization changed some outputs. It cost ten exact matches on the 3,512-row eval and gained two on the 3,204-row eval. That does not establish a quality advantage for either runtime. Native and browser inference accepted the same 894 AlmanBench cases.

### Reading quality

In informal use of Almanpedia, most translations look correct. The most noticeable weakness is overcorrection around proper names and foreign words. GoePT also shows a strong preference for *von die* where retaining *der* would preserve the original construction and read more naturally.

The opening of the [Odysseus article](https://almanpedia.org/wiki/Odysseus) provides an example. This sentence appears in the [German original](https://de.wikipedia.org/wiki/Odysseus).

<blockquote lang="de">
<p>Er war der Sohn des Laërtes (in weniger verbreiteten Versionen des Sisyphos) und der Antikleia sowie der Bruder der Ktimene.</p>
</blockquote>

The observed Alman output was:

<blockquote lang="de-AL">
<p>Er war die Sohn von die Laërt (in weniger verbreitete Versionen von die Sisyphos) und die Antikleia sowie die Bruder von die Ktimene</p>
</blockquote>

*Laërtes* becomes *Laërt*, removing part of the name. The final *-es* belongs to the name and should remain. The repeated *von die* is a separate issue. Both genitive constructions are allowed by the [specification](/#spec), which prefers retaining *der* when translating an existing genitive. Here, forms such as *die Sohn der Laërtes* and *die Bruder der Ktimene* would preserve that construction.

The working hypothesis is that the synthetic training pairs overrepresent *von die* and teach the student to remove endings too freely. This still needs a corpus audit. A goal for the next iteration is to correct that distribution and add targeted checks for proper names and foreign words, so that simplification removes grammatical endings without damaging the words themselves.

## Limitations

GoePT was trained for German-to-Alman translation under a written specification. Its score does not establish a general capability advantage over larger models, and the leading models on AlmanBench still score higher. Benchmark acceptance and reference exact match also measure different things. Neither is a direct percentage of fluent or useful sentences.

The proposed learning benefit remains untested. Whether reading Alman helps people learn German faster requires a study with learners. Translation scores cannot answer that question. Almanpedia keeps the original text available so readers can compare the two.

## Training on Hugging Face

The GPU work ran as Hugging Face Jobs, with datasets and checkpoints kept in Hub repositories and Storage Buckets. The project used [ML Claw](https://github.com/huggingface/mlclaw), an OpenClaw deployment on Hugging Face, with Telegram as a conversational interface for discussing experiments and checking progress away from the terminal.

The final selected run was executed from a maintainer session. Recovery and release work also required direct inspection.

The training times below come from Hugging Face job records. They include setup, evals, and checkpoint uploads, but exclude queue time and gaps between jobs.

The training method was sequence-level distillation. A larger **teacher** produced translations, and a smaller **student** learned to reproduce them. The student became the model shipped to readers.

### Reference data

We began with 66,000 German–Alman sentence pairs in the corrected v0.3 dataset. Sources include literature and everyday sentences, with modern material from Wikipedia and other openly licensed collections. There are also informal and rule-targeted examples. The translations underwent three review passes against the Alman specification.

The references and their review used LLM assistance. They were not 66,000 independently human-translated sentences. The review records preserve corrections and unresolved defects in the German sources.

We reserved separate eval sets of 3,512 and 3,204 rows and excluded 262 training rows that overlapped AlmanBench. That left 59,022 approved pairs. Of these, 2,953 were set aside for checkpoint selection, leaving 56,069 for teacher search and student training.

### Teacher and generated pairs

We fine-tuned pretrained ByT5-Base, approximately 582 million parameters, on the reviewed pairs. The duration search selected six epochs. A fresh fine-tune then used all 59,022 approved pairs for that duration to produce the teacher.

Both teacher jobs used one **NVIDIA H200 with 141 GB of GPU memory**. AdamW used a batch size of eight and a peak learning rate of 0.0001. Weights and optimizer state stayed in FP32, with BF16 computation. The duration search ran for **8 hours 51 minutes**. The final six-epoch fine-tune ran for **2 hours 34 minutes**.

The teacher translated 9,999,555 German sentences from `coral-nlp/german-commons`. The source mix covers Wikipedia and discussion pages, newspaper comments, legal documents, public tenders, news, and political speeches. Overlaps with the protected eval sources were removed before generation.

Eight H200 workers generated the translations with greedy decoding and a batch size of 1,024. They saved 204 output chunks to Hugging Face Storage Buckets. A merge checked row ordering and source alignment as well as the checksums. Generation produced about 6.47 GB of paired text. From the first worker's start to the last worker's finish, it took **2 hours 32 minutes**. The eight workers used **19.54 H200-hours** in total. A 20,000-row synthetic holdout left 9,979,555 generated pairs for training.

### Student

GoePT-1-20M is a Marian encoder–decoder trained from random weights. It has six encoder layers and one decoder layer, model width 384, eight attention heads, and feed-forward width 1,536. The 16,000-token SentencePiece tokenizer includes byte fallback. The model supports source and target sequences up to 1,024 tokens.

The training stream alternated one generated pair with one reviewed pair. This gave both sources equal weight even though the generated corpus was much larger. The 56,069 reviewed pairs repeated throughout the run.

| Training setting | Value |
| --- | --- |
| Hardware | One NVIDIA H200, 141 GB GPU memory |
| Optimizer | AdamW |
| Peak learning rate | 0.0003 |
| Batch size | 256 |
| Weight decay | 0.01 |
| Label smoothing | 0.1 |
| Dropout | 0.1 |
| Gradient norm limit | 1.0 |
| Schedule | 5% linear warmup, then cosine decay |
| Precision | FP32 weights and optimizer state, BF16 computation |

The completed recovery job ran for **4 hours 28 minutes**. Including the earlier failed attempt of 55 minutes, the two main student jobs used **5 hours 23 minutes** of running time on one H200 at a time. This covers the full two-pass search, which continued beyond the checkpoint selected for release.

### Checkpoint selection

The run completed two passes through the generated training data. With the repeated reference pairs, that amounted to 39,918,220 example presentations. We saved checkpoints and checked the 2,953 selection cases after every quarter pass.

The selected checkpoint was step 136,444, after 1.75 passes and 34,928,442 presentations. The final checkpoint gained eleven exact matches on the selection set. That was below the registered fifteen-case threshold for choosing a later checkpoint, so we kept the earlier one. The student was not refitted afterward.

<figure id="figure-checkpoint-selection">

[![Eight checkpoint scores rise from 67.7% exact match at 0.25 passes to 76.4% at two passes. The selected checkpoint at 1.75 passes scores 76.0%.](/assets/images/introducing-goept-1-20m/checkpoint-selection.svg)](/assets/images/introducing-goept-1-20m/checkpoint-selection.svg "Open figure 2 at full size")

<figcaption>Figure 2. Exact match on 2,953 checkpoint-selection pairs, measured every quarter pass. Red marks the selected checkpoint. The final checkpoint added eleven matches, below the fifteen-case threshold for replacing it.</figcaption>

</figure>

The 2,953 checkpoint-selection pairs were excluded from student gradients, but the teacher refit had seen them. The separate eval sets stayed out of both models' training. We opened the 3,204-row held-out eval after fixing the browser candidate and did not use its result to select another model.

### Cost and recovery

The final student phase cost about **USD 29.04** in recorded compute. That includes preparation and short hardware profiles, recovery checks, failed work, the completed run, and export. Teacher work and target generation were separate upstream costs. The recorded program subtotal was about **USD 363.22**, including failed attempts. The subtotal is estimated. Earlier research and LLM-assisted data work are outside that accounting.

The first student attempt failed because the scorer returned a field name that the runner did not expect. We corrected the adapter and restored the saved model and optimizer state, together with the random state and data position. The recovery resumed at step 9,746 instead of starting again.

German-to-Alman translation is a toy problem with unusually explicit rules. It still required decisions about data quality, checkpoint selection, and recovery from failed jobs. Hugging Face supplied the GPU jobs and durable storage. [ML Claw](https://github.com/huggingface/mlclaw) made those tools accessible through conversation, while the specification gave the work a result that could be checked.

The same setup can support other small ML applications with clear requirements. Here it produced a local reading tool for people learning German.

## Availability

Open [Almanpedia](https://almanpedia.org) to read an article, or paste a sentence into the [translator](/translate/). The [GoePT-1-20M repository](https://huggingface.co/osolmaz/GoePT-1-20M) contains the browser package. Its [release manifest](https://huggingface.co/osolmaz/GoePT-1-20M/blob/main/browser.json) records the file checksums and browser checks.

If a translation looks wrong, compare it with the [Alman specification](/#spec) and [send an example](https://github.com/osolmaz/alman/issues). A short source sentence and the model's output are enough to begin.
