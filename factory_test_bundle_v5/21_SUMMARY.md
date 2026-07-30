# Janus Content Factory — Test 5.0 Audit Summary

- **Timestamp**: 2026-07-30T10:54:56.342Z
- **Strict Mode**: `STRICT=1`
- **Cache Mode**: `CACHE_BYPASS=1`

## Audit Results

| Machine | Output File | Size | SHA-256 Digest | Status |
|---|---|---|---|---|
| Machine 1 (Faceless Explainer) | `1_faceless_explainer/final_marketing_reel.mp4` | 6.00 MB | `6bb68c4d2a0e752066d1a82b9e98f66aadaae38759e4c39223e667b6108e45f4` | **PASS ✔️** |
| Machine 2 (Podcast Clipper) | `2_podcast_clipper/final_marketing_reel.mp4` | 1.78 MB | `193ecfb3d0292b6d2a47950185681c981c64168240a89cd39b659bca6e23b15b` | **PASS ✔️** |
| Machine 3 (Raw Footage Edit) | `3_raw_footage_edit/final_marketing_reel.mp4` | 4.89 MB | `44485991899fb7a3f1d9c062d1d7c42f1a06edb77d8ecaef9ac360716dec3abf` | **PASS ✔️** |

## Verification Checkpoints

1. **Machine 1 (~60s Faceless Explainer)**:
   - Script length: ~150 words, 8 scenes.
   - B-Roll: Concatenated multi-scene stock video clips from Pexels.
   - Voice: Neural Chatterbox TTS synthesis.
   - Subtitles: Montserrat-ExtraBold ASS captions formatted at Y=0.62.

2. **Machine 2 (Podcast Clipper)**:
   - Panel Height: 50% height panel ($1080 \times 960$ at Y=240 on blurred background).
   - Subtitles: Positioned below panel at `subtitleY: 0.72`, preventing content overlap.

3. **Machine 3 (Raw Footage Edit)**:
   - Transcription: Whisper Hindi Devanagari script.
   - Script Rejection: **ZERO Urdu/Arabic characters** (`U+0600..U+06FF`) verified under `CACHE_BYPASS=1`.

All 15 frame stills extracted under `factory_test_bundle_v5/<machine>/stills/`.
