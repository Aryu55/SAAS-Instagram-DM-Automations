# 📁 Content Factory Test 3.0 Audit Bundle (`factory_test_bundle_v3`)

This directory contains the complete evidence bundle for **Content Factory Test 3.0 (Fix Pack)**.

## 📊 Summary Table
| Metric | Machine 1 (Faceless) | Machine 2 (Podcast) | Machine 3 (Raw Footage) |
|---|---|---|---|
| **Skill Loaded** | `retention-hardcut` | `retention-hardcut` | `pov-process-reveal` |
| **Font Resolved** | `Montserrat-ExtraBold` | `Montserrat-ExtraBold` | `Komika-Axis` |
| **Subtitle Style** | karaoke-word (80px) | karaoke-word (80px) | one-word (120px, UPPERCASE) |
| **Subtitle Y** | 0.50 (Bottom-Center) | 0.50 (Bottom-Center) | 0.50 (Bottom-Center) |
| **Commentary** | Disabled | Disabled | Disabled |
| **B-Roll Engine** | ALL-AI-IMAGE (Ken Burns) | Source Video | Source Video |
| **Judge Verdict** | **PASS** | **PASS** | **PASS** |

## 📂 Bundle Structure
- `outputs/`: Rendered MP4 files.
- `subtitles/`: Rendered ASS karaoke subtitle files.
- `frames/`: 15 frame stills (10%, 30%, 50%, 70%, 90% timestamps).
- `logs/00_PREFLIGHT.json`: Preflight system assertions.
- `logs/10_TIMELINE.json`: Execution timeline with real `elapsed_sec`.
- `logs/11_PROVENANCE.json`: Provenance tracking & SHA-256 digests.
- `logs/20_SELF_AUDIT.md`: 12-point self-audit report.
- `logs/21_SUMMARY.md`: Executive summary.
- `logs/30_JUDGE_CALIBRATION.md`: 10-clip judge calibration matrix.
- `logs/31_JUDGE_VERDICTS.json`: Tier 1 & Tier 2 judge evaluations.
- `logs/32_BROLL_DECISIONS.json`: Video-level B-roll decision logs.
