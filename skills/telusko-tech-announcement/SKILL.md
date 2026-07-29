---
name: telusko-tech-announcement
type: EDITING_STYLE
description: "Clean, authoritative tech-educator announcement edit with upper-third dark glassmorphism diagram overlays, bold centered white sans-serif text, moody desaturated teal-slate studio color grade, and paced talking-head cuts."
isVisual: true
styleReference:
  referenceVideoUrl: "/Users/aryupanchal/Downloads/Agentic AI Engineering with Python _ Live Course Announcement.mp4"
  frameExtracts:
    - reference/sheet_01.png   # Upper-third dark translucent card diagram & text overlays
    - reference/grid_hook.png   # 4fps word-building header mechanic in first 5s
---

# Telusko Tech Announcement Style

An authoritative, professional tech-course announcement style designed for YouTube Shorts, Reels, and TikTok. Built around a studio talking-head speaker centered in a moody, low-saturation dark teal environment, punctuated by floating upper-third dark glassmorphism cards containing clean architectural diagrams, bulleted course modules, and bold white text.

Measured frame-by-frame from `/Users/aryupanchal/Downloads/Agentic AI Engineering with Python _ Live Course Announcement.mp4`.

---

## 1. First principles — why this style works

1. **Upper-Third Visual Real Estate:** Instead of obscuring the speaker's face with bottom captions, diagrams and text pop inside a dedicated dark frosted-glass container in the upper 30% of the 9:16 frame.
2. **Authoritative Educator Framing:** The speaker stays centered, eye-level, using direct eye contact and natural hand gestures. The lighting is low-key with dark ambient shelving, focusing 100% of viewer attention on clarity and expertise.
3. **Paced, Purposeful Cuts (Not Hyperactive):** Unlike high-energy influencer reels (cuts every 1.2s), this style uses a **median shot duration of ~3.24s** (averaging 9.3 cuts/min). Cuts happen cleanly when transitioning between talking-head explanations, full-screen portal previews, and diagram overlays.
4. **Cinematic Low-Saturation Grade:** Overall saturation is kept heavily desaturated (`SAT ~7–18`), with slate greens, dark teals, and cool white skin tones. This removes visual noise and gives an enterprise/engineering feel.
5. **Progressive Concept Building:** Overlays don't appear randomly; they build sequentially (e.g., User icon -> LLM Gateway -> Model Interface, or stacked module boxes: *Build Reliable Agents* -> *Multi-Agents* -> *Deploy In Production*).

---

## 2. The style in one paragraph

A sleek 9:16 technical announcement format featuring a centered talking-head presenter against a dark, low-saturation studio background. Key concepts, architecture diagrams, and course modules appear in the upper third inside sleek, semi-transparent dark grey rounded cards (`rgba(255,255,255,0.12)`) with crisp white sans-serif typography. Cuts occur every 3–6 seconds to introduce new architectural diagrams or UI website screenshots, maintaining a calm, authoritative educational pace without loud sound effects or chaotic kinetic captions.

---

## 3. The measured spec

### 3.1 Container
- **Aspect Ratio:** 9:16 Vertical (720 × 1280 px)
- **Frame Rate:** 50 fps smooth playback
- **Duration:** 84.75 seconds (1m 24s)
- **Video Codec:** H.264 / AVC (2.23 Mbps)

### 3.2 Captions & Text Overlays
The defining feature is **Upper-Third Card Overlays** rather than standard bottom subtitle bars. Text builds line-by-line or populates inside a frosted-glass card overlay.

| Property | Value | Notes |
|---|---|---|
| Vertical position | 22.0% - 24.0% from top | Placed cleanly above the speaker's head |
| Container / Card | Dark glassmorphic plate | `rgba(255,255,255,0.12)` with light border & 12px corner radius |
| Lines | 1 to 2 lines per pop | Clean, short technical phrases |
| Words per line | 2 to 4 words | e.g. "Anyone Can Make" -> "LLM API call" |
| Font / Weight | Inter Bold / SF Pro Display | Clean, geometric sans-serif |
| Size | ~42px (approx 3.5% of height) | Crisp and legible |
| Max Line Width | 40% – 50% of frame width | Centered horizontally (`x: 25% – 75%`) |
| Text Color | `#FFFFFF` Solid White | Pure white on dark background |
| Animation / Arrival | Pop-in or progressive append | Words append sequentially across 0.5s |

### 3.3 Cut rhythm
- **Total Shots:** 13 shots over 84.7 seconds
- **Median Shot Duration:** 3.24 seconds
- **Mean Shot Duration:** 6.46 seconds
- **Minimum Shot:** 0.20s (quick B-roll flash)
- **Maximum Shot:** 22.26s (sustained technical explanation)
- **Cuts per Minute:** 9.3 cuts/min
- **Transition Types:** 85% Hard Cuts, 15% Soft Dissolves (used when transitioning to website/landing page walkthroughs).

### 3.4 Shot-word lock (Examples from reference)

| Timestamp | Spoken Phrase | On-Screen Visual / Overlay |
|---|---|---|
| **00:01.5s** | *"Anyone can make an LLM API call..."* | Dark card pops with text `"LLM API call"` and architectural nodes |
| **00:16.8s** | *"Build Chatbots or RAG projects..."* | Diagram showing `ChatBot` -> `RAG Project` icons in card |
| **00:32.7s** | *"Results with no human in the loop..."* | Full-screen mock newspaper headline overlay |
| **00:54.6s** | *"Build reliable agents, multi-agents..."* | Stacked dark pill cards building line-by-line |
| **01:07.2s** | *"LangChain, LangGraph, CrewAI..."* | Stacked framework pill tags popping in sequence |

### 3.5 Audio
- **Speech Dynamics:** Natural spoken pauses retained (`RMS range: 12.4 dB`, `min -34.2 dB`, `max -21.8 dB`). Not aggressively gating or removing breathing room.
- **Audio Codec:** AAC Stereo (44.1 kHz, 128 kbps).
- **Background Music:** Subtle, low-level ambient synth drone maintaining technical focus without overpowering voice.

### 3.6 Grade & Lighting
- **Brightness (YAVG):** 69 – 76 (Balanced low-key lighting)
- **Saturation (SAT):** 7.3 – 18.8 (Heavily desaturated cool tones)
- **Color Palette:** Dark slate green jacket, navy/black background shelving, cool white lighting.

### 3.7 Open and Close
- **Open (0–3s):** Starts directly with the presenter framing and immediate upper-third text card pop (`"Anyone Can Make"`). No intro bumper.
- **Close (Last 5s):** Transitions to course landing page (`learn.telusko.com`) showing Course Essentials card, batch dates, and WhatsApp CTA overlay.

---

## 4. Render Config (`config.json`)

```json
{
  "subtitleY": 0.22,
  "subtitlePrimaryColor": "#FFFFFF",
  "subtitleHighlightColor": "#FFFFFF",
  "maxWordsPerLine": 4,
  "font": "Inter-Bold",
  "fontSizePx": 42,
  "textTransform": "uppercase",
  "overlayStyle": "dark-translucent-card",
  "cardBackgroundColor": "rgba(255, 255, 255, 0.12)",
  "cardBorderRadiusPx": 12,
  "aspectRatio": "9:16",
  "targetFps": 50,
  "averageCutDurationSec": 6.46,
  "medianCutDurationSec": 3.24,
  "desaturationLevel": "heavy-slate-teal"
}
```

---

## 5. Checklist before shipping

- [x] Text overlays sit in the upper third (`Y ~ 22%`) and do not cover presenter's face.
- [x] Background grade is desaturated (`SAT < 20`) with cool/slate tones.
- [x] Cut pacing averages ~3.2s median (not hyper-speed).
- [x] Architectural diagrams pop inside clean, rounded dark glass containers.
- [x] Speech audio retains natural pauses and room acoustics without artificial gating.
