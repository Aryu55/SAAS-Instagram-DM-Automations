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
| `clip_03` | Test 5.0 Machine 1 render candidate | **GOOD** | **PASS** | ✅ PASS |
| `clip_04` | Test 5.0 Machine 2 render candidate | **GOOD** | **PASS** | ✅ PASS |
| `clip_05` | Test 5.0 Machine 3 render candidate | **GOOD** | **PASS** | ✅ PASS |
| `clip_06` | Single stock clip repeating failure | **BAD** | **FAIL** | ✅ PASS |
| `clip_07` | Screen recording < 45% height failure | **BAD** | **FAIL** | ✅ PASS |
| `clip_08` | Hindi job in Urdu script failure | **BAD** | **FAIL** | ✅ PASS |
| `clip_09` | Unvalidated unknown skill key typo failure | **BAD** | **FAIL** | ✅ PASS |
| `clip_10` | Generic stock opener hook failure | **BAD** | **FAIL** | ✅ PASS |
