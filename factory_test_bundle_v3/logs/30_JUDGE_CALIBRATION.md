# ⚖️ Judge Calibration Report (10 Clips)

| Metric | Score |
|---|---|
| **Separation Accuracy** | **100%** |
| True Positives (Good -> Pass) | 5 / 5 |
| True Negatives (Bad -> Fail) | 5 / 5 |
| False Positives (Bad -> Pass) | 0 |
| False Negatives (Good -> Fail) | 0 |

### Detailed Calibration Results
| Clip ID | Description | Expected | Judge Verdict | Status |
|---|---|---|---|---|
| `clip_01` | Reference video 1 (retention-hardcut) | **GOOD** | **PASS** | ✅ PASS |
| `clip_02` | Reference video 2 (pov-process-reveal) | **GOOD** | **PASS** | ✅ PASS |
| `clip_03` | Test 3.0 Machine 1 render candidate | **GOOD** | **PASS** | ✅ PASS |
| `clip_04` | Test 3.0 Machine 2 render candidate | **GOOD** | **PASS** | ✅ PASS |
| `clip_05` | Test 3.0 Machine 3 render candidate | **GOOD** | **PASS** | ✅ PASS |
| `clip_06` | Test 2.0 faceless black rectangle failure | **BAD** | **FAIL** | ✅ PASS |
| `clip_07` | Test 2.0 podcast clip phantom commentary bug | **BAD** | **FAIL** | ✅ PASS |
| `clip_08` | Unspoken yellow font #FFD400 bug | **BAD** | **FAIL** | ✅ PASS |
| `clip_09` | Zero duration cue desync bug | **BAD** | **FAIL** | ✅ PASS |
| `clip_10` | Variable font fc-match fallback bug | **BAD** | **FAIL** | ✅ PASS |
