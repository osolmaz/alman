/**
 * Pinned provenance of the GoePT-1-20M browser package. Values come from the
 * frozen release manifest (`browser.json`) of
 * osolmaz/alman-student-spm16k-base-10m-h50-onnx@8049cbd9cee1f9f417540e14df788022e9e7a5b7,
 * mirrored publicly as osolmaz/GoePT-1-20M. Every downloaded file is verified
 * against these digests before use.
 */
export interface ModelPackageFile {
  path: string;
  bytes: number;
  sha256: string;
}

export const MODEL_PACKAGE = {
  repo: "osolmaz/GoePT-1-20M",
  // TODO(pin): replace with the mirror's commit hash once the first upload lands.
  revision: "main",
  source: "osolmaz/alman-student-spm16k-base-10m-h50-onnx@8049cbd9cee1f9f417540e14df788022e9e7a5b7",
  files: [
    {
      path: "model/config.json",
      bytes: 960,
      sha256: "e53320949493898824276ffe2f4436384fdd202b07fe99a8e938a7d61bbd2a5f",
    },
    {
      path: "model/generation_config.json",
      bytes: 255,
      sha256: "ce1e5b703aeedc45ab2428a56c462f21ec0cf3b9c305c12be8014054abb3979f",
    },
    {
      path: "model/onnx/decoder_model_merged_quantized.onnx",
      bytes: 15432869,
      sha256: "c13e8b3f2da4d558f474c1f695dda9b4c2fa6dceba2802a7cb1282802604eb39",
    },
    {
      path: "model/onnx/encoder_model_quantized.onnx",
      bytes: 17544727,
      sha256: "29bac47d82d5509d6fdd816426ad7c38b2d547a92780f06b296b47788a6aa449",
    },
    {
      path: "model/tokenizer.json",
      bytes: 1023642,
      sha256: "3b7e12a3f909de261ace73b79f51c31dc2b1c513d89644b15898f32f92ec433c",
    },
    {
      path: "model/tokenizer_config.json",
      bytes: 257,
      sha256: "6357ba035ea5a7a375e5c85c32f8341755fdd668b808638f0b534ddc100fdbcd",
    },
  ] satisfies ModelPackageFile[],
  totalBytes: 34_002_710,
  /**
   * ORT WASM runtime files from the qualified package. They ship as app/extension
   * assets (never downloaded from the Hub at runtime); tests assert the npm
   * onnxruntime-web dist stays hash-identical to these qualified binaries.
   */
  wasm: [
    {
      path: "wasm/ort-wasm-simd-threaded.asyncify.mjs",
      bytes: 47389,
      sha256: "5959c6733039619c9af710d8e1bae8d6e84402787990637be987c2b1bd6c5fa9",
    },
    {
      path: "wasm/ort-wasm-simd-threaded.asyncify.wasm",
      bytes: 23567050,
      sha256: "e0c0c6d3e73d43b8a249972f8358f845b08cc16fec3c80efafdf8bed40366786",
    },
  ] satisfies ModelPackageFile[],
} as const;

/** Generation parameters of the qualified translator adapter — do not alter. */
export const GENERATION_PARAMS = {
  decoder_start_token_id: 0,
  do_sample: false,
  eos_token_id: 1,
  max_new_tokens: 1024,
  num_beams: 1,
  pad_token_id: 0,
} as const;

export function assetUrl(path: string, baseUrl?: string): string {
  const base = baseUrl ?? `https://huggingface.co/${MODEL_PACKAGE.repo}/resolve/${MODEL_PACKAGE.revision}/`;
  return base.endsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
