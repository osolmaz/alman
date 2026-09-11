# GoePT announcement sources

The post is dated 11 September 2026. It introduces the existing July model without changing the model, benchmark references, or production package.

## Evidence

The main training record is `alman-research/docs/2026-07-26-base-student-final-record.md`. The native student report is `osolmaz/alman-student-spm16k-base-10m-h50@7b6c88e728fb679696857f0ca3733d763619304c/run.json`. The selected checkpoint is step 136444 from logical run `202607260328-mint-walrus`.

The teacher refit report is `osolmaz/alman-byt5-base-teacher@33277762ccbf14a858e301d862a16193f3a58239/refit.json`. The target corpus report is `osolmaz/alman-research-data@977fc0780fa829a5ad3d04c2fa37b2b5e9677edf/distillation/byt5-base-v1/run.json`. The final release report at the same revision is `programs/ALMAN-TS-20260723-01/base-only/release/10m-h50/release.json`.

On 11 September, the bucket inventory contained all 204 consecutive chunks under `osolmaz/jobs-artifacts/202607250833-edge-duck/outputs/`. Their combined size was 6471392748 bytes, matching the corpus report. The downloaded final chunk contained 21699 rows. Its SHA-256 matched `cf3662c8d0d6389b99b05d591ebbad3830dfda432fd63e4a1dc931d20976b905`. This was a sample verification, not a new audit of every corpus row.

The public browser package remains `osolmaz/GoePT-1-20M@5f8145012d666bc68b48bd0d89d47847fc950d90`. The browser package's `browser.json` records its file sizes and browser qualification. Its README incorrectly labels the 79.28% result as native. The final release report records native 2538/3204 and browser 2540/3204. The article follows the report.

## Publication boundaries

The 893/1029 result is the release result. The current site leaderboard uses a later scoring revision and does not include a unified GoePT entry. Do not compute current model-to-model margins from these different records. Several listed larger models score higher, so the article makes no overall state-of-the-art claim.

The reviewed references contain LLM-generated translations. The third review pass used `gpt-5.6-luna` at `xhigh`. Do not call this entirely human-authored data. The 2953 selection rows were excluded from student gradients but included in the teacher refit.

The author describes working through Telegram with ML Claw. The final training record says the selected run was executed directly from the maintainer session and that the ML Claw bundle was an archive copy. The draft distinguishes the conversational project workflow from final-run execution. Confirm that distinction with the author before publication.

The proposed learning benefit is untested. AlmanBench measures translation behavior, not learner outcomes. The article links the author's earlier arguments without treating them as a learner study.

The $29.04 student phase and $363.22 program subtotal are recorded compute estimates. The subtotal is not an audited lifetime cost for the project. Canceled-job charges and earlier data work prevent that claim.
