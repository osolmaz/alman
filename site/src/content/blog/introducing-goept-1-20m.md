---
title: "Introducing GoePT-1-20M"
date: 2026-09-11
description: "A 20-million-parameter German-to-Alman translator that runs in your browser, trained on Hugging Face and used in Almanpedia."
paper: true
abstract: >-
  GoePT-1-20M is a 19.94-million-parameter model that translates Standard German
  into Alman, a simplified German dialect. We trained a ByT5-Base teacher on
  reviewed parallel sentences, used it to translate nearly ten million German
  sentences, and trained a compact Marian student on those translations mixed
  with the reviewed data. The int8 browser model accepts 893 of 1,029 AlmanBench
  cases and runs locally through WebAssembly. Its main application is
  Almanpedia, a Wikipedia reader intended to make German more approachable for
  second-language learners. The experiment also documents a small, complete ML
  project built with Hugging Face training and storage infrastructure.
---

Today I am introducing [GoePT-1-20M](https://huggingface.co/osolmaz/GoePT-1-20M), a language model with 20 million parameters and a rather specific concern about German grammar. It translates Standard German into [Alman](/), the simplified dialect I have been developing on this site.

The model runs in the browser. Its quantized weights take about 33 MB, it needs no GPU, and the text being translated stays on the reader's device. It scored **893 out of 1,029 cases, or 86.8%, on AlmanBench**. You can use it now in [Almanpedia](https://almanpedia.org), our reader for German Wikipedia, or try the [standalone translator](/translate/).

I have wanted to make a model announcement for a language I speak when I cannot remember a noun's gender. This is that announcement.

## A dialect for the gaps in my German

German is my third language. I can follow a conversation and still hesitate over the gender of a noun I have used for years. The hesitation spreads into the article and adjective endings that depend on it. I described this experience in [the first Alman announcement](/blog/out-of-stealth/).

Alman formalizes the shortcuts I use when that knowledge runs out. It keeps German vocabulary and much of its sentence structure while removing grammatical gender and most case inflection. The rules are written down so that another speaker, or a translation model, can apply the same shortcuts consistently.

In [Economic Burden of Language Complexity](/blog/economic-burden-of-language-complexity/), I argued that the time adults spend learning a language has consequences for their work and participation in society. The [article-frequency study](/blog/frequencies-german-definite-articles/) examined how German articles occur in written and spoken material. These posts explain the motivation for the project. They do not establish that learning Alman improves someone's German.

The proposed use is a reading aid for L2 learners, people learning German as an additional language. A learner could read familiar subject matter with fewer inflected forms to resolve, then compare it with the German original. Whether that helps people learn faster is a question for a study with learners. The model's translation score cannot answer it.

Alman is also a linguistic hobby that I take seriously enough to give it a specification and regression checks. Its first speaker already had plenty of opportunities to produce training examples by accident.

## Almanpedia

[Almanpedia](https://almanpedia.org) is the main application. It loads articles from German Wikipedia and translates their prose locally with GoePT-1-20M. Readers can switch between the original and the Alman rendering, or inspect the changes. The article's links and citations remain usable.

You can start with an article you know. Replace `de.wikipedia.org` with `almanpedia.org` in its address, or search from the Almanpedia homepage. For example, [the article on the German language](https://almanpedia.org/wiki/Deutsche_Sprache) is a suitable place to begin.

The browser downloads the model once and keeps it in its model cache. Translation requests do not go to a model server. Loading a Wikipedia article and downloading the model still require network access, but inference runs on the reader's device. The application keeps the original German available when a block cannot be translated safely.

This gives the experiment a concrete job. I wanted to read real pages with the dialect's rules applied to them. Almanpedia exposes errors that a list of short benchmark sentences can miss, including awkward sentence boundaries and changes around links. It also makes it easy to compare the model's output with the text it was meant to preserve.

## Training on Hugging Face

The project used [ML Claw](https://github.com/osolmaz/mlclaw), an OpenClaw deployment for Hugging Face, with Telegram as a conversational interface. Telegram let me discuss the next experiment with the agent and check on work away from the terminal. The GPU work ran as Hugging Face Jobs, with datasets and checkpoints kept in Hub repositories and Storage Buckets.

The final selected run's execution record attributes that run to the maintainer session. Recovery and release work also required direct inspection. Telegram was a useful way to work on the project, but I would not describe the process as unattended from the first dataset row to the published model.

There are two models in the training procedure. A larger **teacher** produces translations. A smaller **student** learns to reproduce those translations and becomes the model shipped to readers. This is sequence-level distillation. The student learns to predict the teacher's output text.

### Reviewed reference data

We began with 66,000 German–Alman sentence pairs in the corrected v0.3 dataset. Sources include literature and everyday sentences, with modern material from Wikipedia and other openly licensed collections. There are also informal and rule-targeted examples. The translations underwent three review passes against the Alman specification.

The references were made with LLM assistance and reviewed with LLM assistance. They should not be described as 66,000 independently human-translated sentences. The review records preserve corrections and unresolved defects in the German sources.

We excluded 262 training rows that overlapped AlmanBench. From the remaining 59,022 pairs, we set aside 2,953 for checkpoint selection. That left 56,069 pairs for teacher search and student training. Separate eval sets contained 3,512 and 3,204 rows.

### Teacher and generated pairs

We fine-tuned pretrained ByT5-Base, approximately 582 million parameters, on the reviewed pairs. The duration search selected six epochs. A fresh fine-tune then used all 59,022 approved pairs for that duration to produce the teacher.

The teacher translated 9,999,555 German sentences from `coral-nlp/german-commons`. The source mix covers Wikipedia and discussion pages, newspaper comments, legal documents, public tenders, news, and political speeches. Overlaps with the protected eval sources were removed before generation.

Eight H200 workers generated the translations with greedy decoding and a batch size of 1,024. They saved 204 output chunks to Hugging Face Storage Buckets. A merge checked the row ordering and source alignment as well as the checksums. Generation produced about 6.47 GB of paired text. A 20,000-row synthetic holdout left 9,979,555 generated pairs for training.

### Student

GoePT-1-20M is a Marian encoder–decoder trained from random weights. It has six encoder layers and one decoder layer, model width 384, eight attention heads, and feed-forward width 1,536. The 16,000-token SentencePiece tokenizer includes byte fallback. The model supports source and target sequences up to 1,024 tokens.

The training stream alternated one generated pair with one reviewed pair. This gave both sources equal weight in the training stream even though the generated corpus was much larger. The 56,069 reviewed pairs repeated throughout the run.

| Training setting | Value |
| --- | --- |
| Optimizer | AdamW |
| Peak learning rate | 0.0003 |
| Batch size | 256 |
| Weight decay | 0.01 |
| Label smoothing | 0.1 |
| Dropout | 0.1 |
| Gradient norm limit | 1.0 |
| Schedule | 5% linear warmup, then cosine decay |
| Precision | FP32 weights and optimizer state, BF16 computation |

The run completed two passes through the generated training data. With the repeated reference pairs, that amounted to 39,918,220 example presentations. We saved checkpoints and checked the 2,953 selection cases after every quarter pass.

The selected checkpoint was step 136,444, after 1.75 passes and 34,928,442 presentations. The final checkpoint gained eleven exact matches on the selection set. That was below the registered fifteen-case threshold for choosing a later checkpoint, so we kept the earlier one. The student was not refitted afterward.

## Results and browser export

We converted the selected checkpoint to int8 ONNX and ran it in Chromium through single-threaded ONNX Runtime WebAssembly. The published package contains the model and tokenizer, with the JavaScript and WASM files needed to run it.

| Release eval | Native | Browser int8 |
| --- | --- | --- |
| AlmanBench acceptance | 893/1,029 · 86.78% | 893/1,029 · 86.78% |
| 3,512-row eval, exact match | 2,829/3,512 · 80.55% | 2,819/3,512 · 80.27% |
| 3,204-row held-out eval, exact match | 2,538/3,204 · 79.21% | 2,540/3,204 · 79.28% |

AlmanBench acceptance checks an output against the renderings licensed by the specification. The other two rows use exact matches to their reference translations. These measures should not be read as interchangeable percentages of fluent or useful sentences.

Quantization changed some outputs. It cost ten exact matches on the 3,512-row eval and gained two on the 3,204-row eval. That does not establish a quality advantage for either runtime. Native and browser inference accepted the same 893 AlmanBench cases.

The complete qualified browser package is 58.14 MB, including its WASM runtime. The ONNX weights account for about 33 MB. In the recorded browser check, a 2,018-word page completed in 6.43 seconds. That is a measurement of one fixed page in Chromium, not a speed promise for every reader's device.

Larger models score higher on the [AlmanBench leaderboard](/almanbench/). This release puts a useful amount of task-specific behavior into a model that a web page can download and run without a model API. A claim to the best language model in the world will have to wait for a different blog post.

## Cost and recovery

The final student phase cost about **USD 29.04** in recorded compute. That includes preparation and short hardware profiles, recovery checks, failed work, the completed run, and export. Teacher work and target generation were separate upstream costs. The recorded program subtotal was about **USD 363.22**, including failed attempts. The subtotal is estimated. Earlier research and LLM-assisted data work are outside that accounting.

Saving partial work mattered. The first student attempt failed because the scorer returned a field name that the runner did not expect. We corrected the adapter and restored the saved model and optimizer state, together with the random state and data position. The recovery resumed at step 9,746 instead of starting again.

The 2,953 checkpoint-selection pairs were excluded from student gradients, but the teacher refit had seen them. The separate eval sets stayed out of both models' training. We opened the 3,204-row held-out eval after fixing the browser candidate and did not use its result to select another model.

For ML engineering, German-to-Alman translation is a toy problem with unusually explicit rules. It still required decisions about data quality, checkpoint selection, and how to recover from a failed job. Hugging Face provided a place to run the GPU work and keep the resulting files. An agent made those tools convenient to use, while the experiment still needed a specification and someone to decide what counted as a correct result.

The same setup can support other small applications whose requirements are clear enough to check. This one happens to serve people who would like to read German with fewer article endings to worry about. I am among them.

## Try it

Open [Almanpedia](https://almanpedia.org) to read an article, or paste a sentence into the [translator](/translate/). The [GoePT-1-20M repository](https://huggingface.co/osolmaz/GoePT-1-20M) contains the browser package. Its [release manifest](https://huggingface.co/osolmaz/GoePT-1-20M/blob/main/browser.json) records the file checksums and browser checks.

If a translation looks wrong, compare it with the [Alman specification](/#spec) and [send an example](https://github.com/osolmaz/alman/issues). A short source sentence and the model's output are enough to begin.
