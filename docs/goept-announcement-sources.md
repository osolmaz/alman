# GoePT announcement sources

The post is dated 11 September 2026. It introduces the existing July model without changing the model, benchmark references, or production package.

## Evidence

The main training record is `alman-research/docs/2026-07-26-base-student-final-record.md`. The native student report is `osolmaz/alman-student-spm16k-base-10m-h50@7b6c88e728fb679696857f0ca3733d763619304c/run.json`. The selected checkpoint is step 136444 from logical run `202607260328-mint-walrus`.

The teacher refit report is `osolmaz/alman-byt5-base-teacher@33277762ccbf14a858e301d862a16193f3a58239/refit.json`. The target corpus report is `osolmaz/alman-research-data@977fc0780fa829a5ad3d04c2fa37b2b5e9677edf/distillation/byt5-base-v1/run.json`. The final release report at the same revision is `programs/ALMAN-TS-20260723-01/base-only/release/10m-h50/release.json`.

On 11 September, the bucket inventory contained all 204 consecutive chunks under `osolmaz/jobs-artifacts/202607250833-edge-duck/outputs/`. Their combined size was 6471392748 bytes, matching the corpus report. The downloaded final chunk contained 21699 rows. Its SHA-256 matched `cf3662c8d0d6389b99b05d591ebbad3830dfda432fd63e4a1dc931d20976b905`. This was a sample verification, not a new audit of every corpus row.

The public browser package remains `osolmaz/GoePT-1-20M@5f8145012d666bc68b48bd0d89d47847fc950d90`. The browser package's `browser.json` records its file sizes and browser qualification. Its README incorrectly labels the 79.28% result as native. The final release report records native 2538/3204 and browser 2540/3204. The article follows the report.

## Publication boundaries

The release report records 893/1029. On 12 September, a read-only comparison applied the current acceptance sets to the stored browser and native predictions. Both score 894/1029 and accept the same cases. The draft uses 894 consistently. No model was rerun or changed.

The current site leaderboard does not include a unified GoePT entry. Before publishing this article, add that entry and align the public model card, result dataset, and site with the verified current score. Keep this PR in draft until those publication changes are ready. The existing 893 release report remains historical evidence, not the source for current model-to-model margins. No public dataset or model repository was changed during this article edit.

The article compares named models on AlmanBench. It makes no overall state-of-the-art claim. The leading larger models score higher, and the parameter counts of the closed models are not public.

The reviewed references contain LLM-generated translations. The third review pass used `gpt-5.6-luna` at `xhigh`. Do not call this entirely human-authored data. The 2953 selection rows were excluded from student gradients but included in the teacher refit.

The author describes working through Telegram with ML Claw. The final training record says the selected run was executed directly from the maintainer session and that the ML Claw bundle was an archive copy. The draft distinguishes the conversational project workflow from final-run execution. Confirm that distinction with the author before publication.

The proposed learning benefit is untested. AlmanBench measures translation behavior, not learner outcomes. The article links the author's earlier arguments without treating them as a learner study.

The $29.04 student phase and $363.22 program subtotal are recorded compute estimates. The subtotal is not an audited lifetime cost for the project. Canceled-job charges and earlier data work prevent that claim.

## Larger-model comparison

The browser outputs come from `osolmaz/alman-student-spm16k-base-10m-h50-onnx@c0bef56c31411c98a200906f934bcccd6a0ea857/evaluation/almanbench-browser.jsonl`. The file SHA-256 is `4eddbed0a81c89cf39a0ef42a43a27665efbd84c78a9b59382bb321c91c2c16f`. Native outputs come from `osolmaz/alman-student-spm16k-base-10m-h50@bcee1d732feb89667d6678814f71773c43b5fb89/evaluation/almanbench-predictions.jsonl`.

Comparator outputs are `v0.1/qwen3.6-27b/results.jsonl` and `v0.1/gpt-oss-120b-high/results.jsonl` in `osolmaz/almanbench-results@decbac3dc6ef3437a775157610b30ef0fe4b612e`. All 1029 IDs and source texts match GoePT's stored rows. The acceptance sets match the current research export row for row. The case-set identity reconstructed from the comparator IDs, source texts, acceptance sets, and collection fields is `sha256:9024c3088a8321d7e621d30bee8ccd8401dd4a2655bcdd66f5ad1b448576ebc4`, matching the current leaderboard. Direct case-sensitive membership reproduces every comparator verdict, including all 842 Qwen and 709 GPT-OSS successes.

Nine reference sets differ from those bundled with GoePT's release predictions. Three browser verdicts change under the current references. `almanbench/canonical/02622` becomes a miss, while `almanbench/canonical/04025` and `almanbench/modern-wikipedia/pub-043` become accepted. This accounts for the net change from 893 to 894. The sources did not change.

The comparison gives GoePT 52 more accepted cases than Qwen, or 5.05345 percentage points. GoePT alone passes 126 cases, while Qwen alone passes 74. Against GPT-OSS, GoePT gains 185 cases, or 17.97862 points. GoePT alone passes 238, while GPT-OSS alone passes 53. These are descriptive paired results from one run per model. They do not establish repeat-run stability or a general capability lead. No new selection threshold, model promotion, or paid work follows from this comparison.

Qwen used thinking mode through DeepInfra, whose manifest reports FP8. GPT-OSS used high reasoning effort through Cerebras, with MXFP4 listed for the Hub weights. Both manifests say the served revision was not pinned. The recorded Hub revisions are `Qwen/Qwen3.6-27B@6a9e13bd6fc8f0983b9b99948120bc37f49c13e9` and `openai/gpt-oss-120b@b5c939de8f754692c1647ca79fbf85e8c1e70f8a`. The article does not assert unobserved kernels or compare inference speed.

The official model cards report 27 billion Qwen language-model parameters and 117 billion total GPT-OSS parameters, with 5.1 billion active per token for GPT-OSS. Relative to GoePT's 19943808 parameters, the ratios are 1353.80, 5866.48, and 255.72. The prose rounds these to about 1350, 5900, and 256. The ratios concern parameter counts rather than download size or execution speed. The official sources are https://huggingface.co/Qwen/Qwen3.6-27B and https://huggingface.co/openai/gpt-oss-120b.
