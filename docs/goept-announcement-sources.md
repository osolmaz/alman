# GoePT announcement sources

The post is dated 11 September 2026. It introduces the existing July model without changing the model, benchmark references, or production package.

## Evidence

The main training record is `alman-research/docs/2026-07-26-base-student-final-record.md`. The native student report is `osolmaz/alman-student-spm16k-base-10m-h50@7b6c88e728fb679696857f0ca3733d763619304c/run.json`. The selected checkpoint is step 136444 from logical run `202607260328-mint-walrus`.

The teacher refit report is `osolmaz/alman-byt5-base-teacher@33277762ccbf14a858e301d862a16193f3a58239/refit.json`. The target corpus report is `osolmaz/alman-research-data@977fc0780fa829a5ad3d04c2fa37b2b5e9677edf/distillation/byt5-base-v1/run.json`. The final release report at the same revision is `programs/ALMAN-TS-20260723-01/base-only/release/10m-h50/release.json`.

On 11 September, the bucket inventory contained all 204 consecutive chunks under `osolmaz/jobs-artifacts/202607250833-edge-duck/outputs/`. Their combined size was 6471392748 bytes, matching the corpus report. The downloaded final chunk contained 21699 rows. Its SHA-256 matched `cf3662c8d0d6389b99b05d591ebbad3830dfda432fd63e4a1dc931d20976b905`. This was a sample verification, not a new audit of every corpus row.

The public browser package remains `osolmaz/GoePT-1-20M@5f8145012d666bc68b48bd0d89d47847fc950d90`. The browser package's `browser.json` records its file sizes and browser qualification. Its README incorrectly labels the 79.28% result as native. The final release report records native 2538/3204 and browser 2540/3204. The article follows the report.

## Training hardware and time

Read-only Hugging Face job history and individual job records were checked on 13 September 2026. The `h200` hardware option lists one NVIDIA H200 with 141 GB of GPU memory. All teacher and student training jobs below used that option. The eight generation workers were separate single-GPU jobs.

| Stage | Job | Running seconds | Rounded time in the article |
| --- | --- | ---: | --- |
| Teacher duration search | [6a631c9a7ef3c08464967217](https://huggingface.co/jobs/osolmaz/6a631c9a7ef3c08464967217) | 31,868 | 8 hours 51 minutes |
| Final six-epoch teacher fine-tune | [6a63a9d77ef3c08464967b0d](https://huggingface.co/jobs/osolmaz/6a63a9d77ef3c08464967b0d) | 9,264 | 2 hours 34 minutes |
| Failed student attempt | [6a64e7577ef3c0846496879d](https://huggingface.co/jobs/osolmaz/6a64e7577ef3c0846496879d) | 3,311 | 55 minutes |
| Completed student recovery job | [6a657edddb23d7a7ec1cd99f](https://huggingface.co/jobs/osolmaz/6a657edddb23d7a7ec1cd99f) | 16,078 | 4 hours 28 minutes |

The two main student jobs total 19,389 running seconds, or 5 hours 23 minutes. This includes the failed attempt and the full two-pass search through step 155,936. It is not a measured time to the selected step-136,444 checkpoint. Preparation and recovery canaries are separate jobs. The overnight gap between the failed attempt and recovery is excluded.

The completed generation fleet contains these eight jobs, all with `h200` hardware and the `COMPLETED` state.

| Generation job | Running seconds |
| --- | ---: |
| `6a64766bdb23d7a7ec1cbd38` | 9,135 |
| `6a647680db23d7a7ec1cbd3c` | 8,888 |
| `6a6476957ef3c0846496834b` | 8,912 |
| `6a6476abdb23d7a7ec1cbd3f` | 8,604 |
| `6a6476c07ef3c0846496834f` | 8,764 |
| `6a6476d5db23d7a7ec1cbd45` | 8,768 |
| `6a6476eadb23d7a7ec1cbd47` | 8,589 |
| `6a6477007ef3c08464968357` | 8,674 |

The fleet ran from 25 July 2026 at 08:40:18.795 UTC to 11:12:34.555 UTC, a span of 9,135.760 seconds, rounded to 2 hours 32 minutes. Summed running time is 70,334 seconds, or 19.5372 H200-hours. This agrees with the final research record's 19.537 H200-hours. The article separates elapsed fleet time from total GPU-hours.

The teacher fine-tune is logical run `202607241758-river-mink`. Its `refit.json` at model revision `33277762ccbf14a858e301d862a16193f3a58239` records batch size 8, peak learning rate 0.0001, six epochs, and 44,268 steps. It also records FP32 parameters and optimizer state with BF16 computation. Its worker timer is 9,141.8278 seconds, shorter than the provider's 9,264 running seconds. The article uses the provider's job-duration measure consistently.

The saved `teacher/run.json` belongs to the earlier three-epoch diagnostic `teacher-base-full-v1`, whose worker timer is 4,262.7228 seconds. That is a different checkpoint and duration, so it is not used as the production teacher's training time. The article also excludes short hardware profiles from full-run timing claims. Those profiles use different workloads and omit checkpoint and full-set scoring overhead.

The job API's whole-second running counters differ from timestamp subtraction by less than one second per job. No material mismatch was found with the final student record. The local filtered evidence is `/home/onur/scratch/goept-announcement/hardware-job-history.json`; it omits job commands, environment variables, and credentials.

## Publication boundaries

The release report records 893/1029. On 12 September, a read-only comparison applied the current acceptance sets to the stored browser and native predictions. Both score 894/1029 and accept the same cases. The draft uses 894 consistently. No model was rerun or changed.

The current site leaderboard does not include a unified GoePT entry. Before publishing this article, add that entry. Align the public model card and result dataset with the verified current score, and show the same score on the site. Keep this PR in draft until those publication changes are ready. The existing 893 release report remains historical evidence, not the source for current model-to-model margins. No public dataset or model repository was changed during this article edit.

The article now focuses on DeepSeek-V4-Pro, the closest lower-scoring model on the current AlmanBench leaderboard. It makes no overall state-of-the-art claim. The leading larger models score higher, and the parameter counts of the closed models are not public.

The reviewed references contain LLM-generated translations. The third review pass used `gpt-5.6-luna` at `xhigh`. Do not call this entirely human-authored data. The 2953 selection rows were excluded from student gradients but included in the teacher refit.

The author describes working through Telegram with ML Claw. The final training record says the selected run was executed directly from the maintainer session and that the ML Claw bundle was an archive copy. The draft distinguishes the conversational project workflow from final-run execution. Confirm that distinction with the author before publication.

The proposed learning benefit is untested. AlmanBench measures translation behavior, not learner outcomes. The article links the author's earlier arguments without treating them as a learner study.

The $29.04 student phase and $363.22 program subtotal are recorded compute estimates. The subtotal is not an audited lifetime cost for the project. Canceled-job charges and earlier data work prevent that claim.

## Closest-score comparison

The article was shortened at the author's request to use one comparator. DeepSeek-V4-Pro has the closest score below GoePT among current leaderboard entries. Its `v0.1/deepseek-v4-pro/results.jsonl` and manifest are in the same result-dataset revision recorded below. All 1029 IDs, source texts, and acceptance sets match the verified comparison. The repository's `alman.bench.scoring.is_accepted` reproduces all 878 DeepSeek successes and GoePT's 894. This includes the scorer's standard typography and whitespace normalization while preserving case.

GoePT alone passes 95 cases and DeepSeek alone passes 79. The net difference is 16/1029, or 1.55491 percentage points. This is a small observed lead, treated as a practical tie rather than a stable quality advantage. The abstract says that GoePT scored above DeepSeek, and the results section explains this distinction. No production selection follows from the score.

The recorded DeepSeek run used Novita with default reasoning settings. This does not establish a result against DeepSeek at maximum reasoning effort. DeepSeek's official model card at https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro reports 1.6 trillion total parameters and 49 billion active per token. Dividing by GoePT's 19943808 gives ratios of 80225.40 and 2456.90, rounded to about 80000 and 2460. The abstract uses the total-parameter ratio; the results section explains the active count.

## Article structure

The structure follows the official [SmolLM2-135M-Instruct model card](https://huggingface.co/HuggingFaceTB/SmolLM2-135M-Instruct), inspected on 12 September. Its substantive order is model summary and usage, eval results, limitations, training details, then license and citation. The usage section includes browser inference through Transformers.js. The article uses that section order rather than the card's header artwork.

The [Distil-Whisper distil-large-v3 card](https://huggingface.co/distil-whisper/distil-large-v3) was a second reference for a compact task-specific distilled model. It separates usage and integrations from model details, then describes its evals and intended use before the data and training method. It closes with results and reproduction instructions.

The announcement adapts these structures into an introduction, Alman and Almanpedia, results, limitations, training on Hugging Face, and availability. The score chart follows the benchmark definition and comparison inside Results. The checkpoint curve follows the selection method inside Training. The learning application is explained before either figure. All recorded model and training facts are retained, while export details remain outside the abstract.

## Figures

The article includes a vertical bar chart of adjacent model scores and a curve of the eight recorded checkpoint-selection scores. Both use white backgrounds to match the paper view. SVG files and PNG copies live under `site/public/assets/images/introducing-goept-1-20m/`. They were rendered with Matplotlib 3.10.8. The local renderer is `/home/onur/scratch/goept-announcement/render_figures.py`.

Figure 1 selects the two leaderboard entries immediately above GoePT and the two immediately below it. The values are GPT-5.6 Terra xhigh 902, Kimi K2.7 Code 895, GoePT 894, DeepSeek V4 Pro 878, and Claude Sonnet 5 xhigh 858, all out of 1029. The axis starts at zero and ends at 100%. GoePT's red bar is an identity highlight, not a claim to the highest score. There are no error bars because these records do not establish repeat-run variability.

The added comparator files are `v0.1/gpt-5.6-terra-xhigh/results.jsonl`, `v0.1/kimi-k2.7-code/results.jsonl`, and `v0.1/claude-sonnet-5-xhigh/results.jsonl` in `osolmaz/almanbench-results@decbac3dc6ef3437a775157610b30ef0fe4b612e`. Their 1029 source texts, IDs, and acceptance sets match the verified comparison. `alman.bench.scoring.is_accepted` reproduces every stored verdict.

Figure 2 uses the `history` field of the native `run.json` cited above. It plots exact match on the 2953 checkpoint-selection pairs, not training loss or AlmanBench acceptance. The checked report provides eight observations; the old physical Job log returned no usable loss series. Lines connect observed points without smoothing or invented intermediate measurements. The line chart's vertical axis spans 60% to 80% so the later changes remain visible.

| Passes | Step | Exact matches out of 2953 |
| --- | --- | --- |
| 0.25 | 19492 | 1999 |
| 0.50 | 38984 | 2089 |
| 0.75 | 58476 | 2143 |
| 1.00 | 77968 | 2170 |
| 1.25 | 97460 | 2207 |
| 1.50 | 116952 | 2226 |
| 1.75 | 136444 | 2244 |
| 2.00 | 155936 | 2255 |

The selected marker is fixed to the recorded step 136444. It is not recomputed from the highest chart value. The final checkpoint's eleven extra exact matches remain below the registered fifteen-case replacement threshold.

## Other checked models

The comparisons below were verified during drafting. They are no longer included in the article, which now uses the closest lower-scoring model.

The browser outputs come from `osolmaz/alman-student-spm16k-base-10m-h50-onnx@c0bef56c31411c98a200906f934bcccd6a0ea857/evaluation/almanbench-browser.jsonl`. The file SHA-256 is `4eddbed0a81c89cf39a0ef42a43a27665efbd84c78a9b59382bb321c91c2c16f`. Native outputs come from `osolmaz/alman-student-spm16k-base-10m-h50@bcee1d732feb89667d6678814f71773c43b5fb89/evaluation/almanbench-predictions.jsonl`.

Comparator outputs are `v0.1/qwen3.6-27b/results.jsonl` and `v0.1/gpt-oss-120b-high/results.jsonl` in `osolmaz/almanbench-results@decbac3dc6ef3437a775157610b30ef0fe4b612e`. All 1029 IDs and source texts match GoePT's stored rows. The acceptance sets match the current research export row for row. The case-set identity reconstructed from the comparator IDs, source texts, acceptance sets, and collection fields is `sha256:9024c3088a8321d7e621d30bee8ccd8401dd4a2655bcdd66f5ad1b448576ebc4`, matching the current leaderboard. Direct case-sensitive membership reproduces every comparator verdict, including all 842 Qwen and 709 GPT-OSS successes.

Nine reference sets differ from those bundled with GoePT's release predictions. Three browser verdicts change under the current references. `almanbench/canonical/02622` becomes a miss, while `almanbench/canonical/04025` and `almanbench/modern-wikipedia/pub-043` become accepted. This accounts for the net change from 893 to 894. The sources did not change.

The comparison gives GoePT 52 more accepted cases than Qwen, or 5.05345 percentage points. GoePT alone passes 126 cases, while Qwen alone passes 74. Against GPT-OSS, GoePT gains 185 cases, or 17.97862 points. GoePT alone passes 238, while GPT-OSS alone passes 53. These are descriptive paired results from one run per model. They do not establish repeat-run stability or a general capability lead. No new selection threshold, model promotion, or paid work follows from this comparison.

Qwen used thinking mode through DeepInfra, whose manifest reports FP8. GPT-OSS used high reasoning effort through Cerebras, with MXFP4 listed for the Hub weights. Both manifests say the served revision was not pinned. The recorded Hub revisions are `Qwen/Qwen3.6-27B@6a9e13bd6fc8f0983b9b99948120bc37f49c13e9` and `openai/gpt-oss-120b@b5c939de8f754692c1647ca79fbf85e8c1e70f8a`. The article does not assert unobserved kernels or compare inference speed.

The official model cards report 27 billion Qwen language-model parameters and 117 billion total GPT-OSS parameters, with 5.1 billion active per token for GPT-OSS. Relative to GoePT's 19943808 parameters, the ratios are 1353.80, 5866.48, and 255.72. The prose rounds these to about 1350, 5900, and 256. The ratios concern parameter counts rather than download size or execution speed. The official sources are https://huggingface.co/Qwen/Qwen3.6-27B and https://huggingface.co/openai/gpt-oss-120b.
