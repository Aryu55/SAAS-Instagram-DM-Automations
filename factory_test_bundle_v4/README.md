# 📁 Content Factory Test 4.0 Audit Bundle (`factory_test_bundle_v4`)

This directory contains the complete evidence bundle for **Content Factory Test 4.0 (Fix Pack v4)**.

## 📊 Summary Table
| Metric | Machine 1 (Faceless) | Machine 2 (Podcast) | Machine 3 (Raw Footage) |
|---|---|---|---|
| **Skill Loaded** | `retention-hardcut` | `retention-hardcut` | `telusko-tech-announcement` |
| **Font Resolved** | `Montserrat-ExtraBold` | `Montserrat-ExtraBold` | `Inter-Bold` |
| **Crop Layout** | `fill` (1080x1920) | `fit` (1080px preserved) | `fill` (1080x1920) |
| **Subtitle Y** | `0.50` (Center) | `0.72` (Dark background) | `0.22` (Top panel) |
| **B-Roll Engine** | Pexels API HD Stock Video | Source Video | Source Video |
| **Language Script** | English | Hindi (Devanagari) | Hindi (Devanagari) |
| **Judge Verdict** | **PASS** | **PASS** | **PASS** |

## 📂 Bundle Structure
- `outputs/`: Rendered MP4 files.
- `subtitles/`: Rendered ASS karaoke subtitle files.
- `frames/`: 15 frame stills (10%, 30%, 50%, 70%, 90% timestamps).
- `logs/00_PREFLIGHT.json`: Preflight system assertions & Pexels key verification.
- `logs/10_TIMELINE.json`: Execution timeline with real `elapsed_sec`.
- `logs/11_PROVENANCE.json`: Provenance tracking & SHA-256 digests.
- `logs/20_SELF_AUDIT.md`: 11-point self-audit report.
- `logs/21_SUMMARY.md`: Executive summary.
- `logs/30_JUDGE_CALIBRATION.md`: 10-clip judge calibration matrix.
- `logs/31_JUDGE_VERDICTS.json`: Tier 1 & Tier 2 judge evaluations.
- `logs/32_BROLL_DECISIONS.json`: Pexels stock video API download logs.
- `logs/33_GATE_EVIDENCE.json`: Exact numeric values and thresholds per gate.
