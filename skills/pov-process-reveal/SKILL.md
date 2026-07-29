---
name: pov-process-reveal
type: EDITING_STYLE
description: "POV process/transformation clip: handheld first-person footage where the CAMERA does the cutting, ONE-WORD all-caps captions dead centre with a thick black outline, a third-person hook that promises a payoff, then the process, then the reveal. For build-alongs, restorations, before/afters, teardowns. Opposite of a narrated b-roll explainer — see retention-hardcut."
isVisual: true
styleReference:
  referenceVideoUrl: "~/Downloads/vidssave.com 1950s Refrigerator Restoration That's Actually Incredible 720P.mp4"
  frameExtracts:
    - reference/frame_0.00s.png              # opens ON the presenter, caption already up
    - reference/frame_1.00s.png              # hand enters frame — motion is the edit
    - reference/frame_5.40s.png              # "REFRIGERATOR" — longest word, 44% frame width
    - reference/frame_16.10s.png             # clean single-word caption
    - reference/frame_29.90s.png             # the payoff (sheet of frost lifting out)
    - reference/frame_45.00s.png             # close: presenter, aphorism, no CTA
    - reference/caption_mechanic_5fps.png    # 5fps grid — PROOF captions are one word, hard-swap
---

# POV Process Reveal

For turning **build-alongs, restorations, teardowns, before/afters and "watch me make this"**
footage into a shortform clip. The value is *a thing visibly changing*, and the viewer's
question is always "does it work?"

This is the **counterpart** to `retention-hardcut`, not a variant of it. That style is a
narrated explainer where a script chooses pictures. This one is first-person footage where the
pictures already exist and the words serve them. Read § 1.3 before mixing the two.

---

## 1. First principles

### 1.1 What this style is competing on

Same attention auction as any shortform, but the promise is different. An explainer promises
**"you will understand something."** A process video promises **"you will see something
finish."** That single difference drives everything:

- The hook must promise a **payoff you can see**, not a fact you'll learn.
- The middle is tolerated only because the end was promised. Every second is a withdrawal
  against that promise.
- The payoff must be **visually obvious in one frame** — frost lifting out in one sheet, a
  panel coming clean. If the result needs explaining, it isn't a payoff.

### 1.2 The camera does the cutting

**This is the load-bearing insight and the one nobody copies.**

The reference cuts 28.7×/min — statistically almost identical to `retention-hardcut`'s 31 —
yet it feels nothing alike. Because the frame is *never still*. It's handheld, hands enter and
leave, doors open, the camera pushes into what the hands are doing. Scene detection lights up
**continuously for the first 3.4 seconds without a single cut** — that's how much motion is in
the frame.

So: attention gets re-aroused every ~2s the same way, but by **movement instead of by cutting.**

The practical consequence: **do not cut this style to a metronome.** Cut on action —
the hand closes on the tool, the panel comes free, the door opens. A hard cut in the middle of
a continuous gesture reads as a mistake here, where in an explainer it reads as pace.

**60fps, not 30.** The reference is 60fps and that is deliberate: when the frame is
continuously moving, 30fps judders and 60 stays liquid. It's the same reason satisfying/ASMR
content shoots high frame rate.

### 1.3 What must NOT be borrowed from `retention-hardcut`

| | `retention-hardcut` | this style |
|---|---|---|
| Source | authored, script first | found/self-shot, footage first |
| Rhythm engine | **hard cuts** on a ~2s cadence | **camera motion**, cuts on action |
| Captions | pre-laid line, karaoke illuminate, 5–6 words | **one word**, hard swap, all-caps |
| Audio | flat −13…−16 dB, engineered wall | natural human dynamics, 15 dB range |
| Frame rate | 30fps | **60fps** |
| Promise | "you'll understand" | "you'll see it finish" |

Applying the explainer's metronome cutting to process footage chops up the very motion that
makes it work. Applying this style's one-word captions to a dense explainer script produces
unreadable strobing. **They are opposite tools.**

### 1.4 Why one word at a time

Counter-intuitive, and the reason it works here: in process footage **the picture is the
content and the caption is the metronome.** A 6-word line asks the eye to leave the action and
read. A single word is absorbed peripherally without ever leaving the hands.

It also survives muted viewing while occupying almost none of the frame — which matters when
the frame is the product.

---

## 2. The style in one paragraph

Handheld first-person footage, shot at 60fps, where hands are always doing something and the
camera follows them. One big all-caps word at a time sits dead centre in white with a thick
black outline, swapping to the next word as it's spoken. A voice promises up front that the
result will be hard to believe, walks you through the process, and then shows you the result.
It opens on the presenter's face with the caption already up, and it stops the moment the last
word is said.

---

## 3. The measured spec

### 3.1 Container
- **720×960 (3:4), 60fps, 46.5s.** High bitrate (~2.3 Mbps) — the detail is the product,
  don't crush it.
- 3:4 is the reference's ratio. For our distribution use **1080×1920 (9:16)**; keep 60fps.

### 3.2 Captions — one word, hard swap

**One word on screen at a time. No karaoke, no line build, no dimmed upcoming words.** Each
word appears, holds for exactly as long as it is spoken, and is replaced by the next.
`reference/caption_mechanic_5fps.png` is the proof — a 5fps grid where you can read the word
swapping: `AFTER · THIS · GUY · DECIDED · TO · CLEAN · UP · HIS · 1950S · REFRIGERATOR`.

| Property | Value | Notes |
|---|---|---|
| Words on screen | **exactly one** | |
| Case | **ALL CAPS** | |
| Position | **dead centre, both axes** | measured cx = 359–360 of 720; y ≈ 49–50% |
| Cap height | **~4.5% of frame height** | ≈ 86px at 1920 |
| Font | heavy **rounded** display sans | reads as Komika Axis / Luckiest Guy family |
| Fill | `#FFFFFF` | |
| Outline | **thick black, ~0.6% of frame height** | the defining treatment — much heavier than normal |
| Shadow | minimal to none | the outline does the work |
| Word hold | 0.2s – 0.8s, = spoken duration | |
| Longest word width | ~44% of frame width ("REFRIGERATOR") | never wraps |
| Background plate | none | |

Words are **never dropped** — every spoken word gets its frame, including "to", "up", "his".

### 3.3 Cut rhythm

- **22 shots / 46.5s. Median 2.00s. Mean 2.09s. Range 0.70–5.06s. 28.7 cuts/min.**
- Distribution: `<1.0s ×2 | 1.0–1.5s ×6 | 1.5–2.0s ×2 | 2.0–2.5s ×6 | 2.5–3.0s ×3 | >3.0s ×3`
- **Cut on action, never on a timer** (§ 1.2). The longest shot (5.06s) is the opening
  demonstration; the shortest are process steps.
- 3 soft transitions detected (8.4s, 14.0s, 43.8s) marking section changes.
- **Treat the median as an outcome, not a target.** If you hit 2.0s by cutting mid-gesture you
  have already lost the thing that makes this work.

### 3.4 Shot-word lock

Present and literal, same as `retention-hardcut`:

| Words | What is shown |
|---|---|
| "DECIDED TO CLEAN UP" | hand gripping the door handle |
| "1950S REFRIGERATOR" | the interior reveal, lit and full |
| "FINAL RESULT" | the closed, clean exterior |
| "ALMOST IMPOSSIBLE BELIEVE" | freezer opening onto solid frost |
| "INSTRUCTIONS" | the original 1950s manual, in hand |
| "HOT" | the saucepan going on the stove |

Here it is nearly free — you are describing what your hands are already doing. **If you find
yourself needing b-roll, the narration has drifted off the action.** Fix the words, not the
pictures.

### 3.5 Audio

**Different from `retention-hardcut` and easy to get wrong in both directions.**

- **Natural human dynamics — RMS range 15.1 dB** (−10.6 to −25.7). Do *not* flatten this to a
  TTS-style wall; the unpolished voice is why it reads as real.
- **But zero true silence.** `silencedetect` at −32 dB / 0.25s found **no gaps at all.** Room
  tone, handling noise and tool sounds fill every moment.
- So the rule is: **kill dead air, keep dynamics.** Remove pauses by cutting, not by
  compressing.
- Tool/process sound (scraping, ice cracking, doors) is **content** — keep it up. This is the
  ASMR half of why restoration content performs.
- No music bed detectable. No whoosh SFX on cuts.

### 3.6 Grade

Mild. `YAVG 97–140`, `SATAVG 12–22`. Slightly desaturated but far closer to natural than
`retention-hardcut`'s bleach look. The teal fridge still reads as teal.

Starting point: `eq=brightness=0.02:contrast=1.06:saturation=0.92`

**Do not crush this footage.** The payoff is texture — frost, chrome, rust. Grade is here to
stop it looking flat on a phone, nothing more.

### 3.7 Open and close

- **Open:** caption is up **from frame 1** — no naked-picture beat. Opens on the **presenter's
  face**, then immediately moves to the hands.
- **The hook is third-person and promises the payoff:**
  *"After this guy decided to clean up his 1950s refrigerator, the final result was almost
  impossible to believe."*
  Then it switches to first person — *"This is my 1950s General Electric…"* — and stays there.
  That third-person → first-person switch is the **aggregator/repost hook pattern**: a promise
  bolted onto someone's process footage. It works because the hook makes a claim the footage
  then has to honour.
- **Close:** ends on an aphorism — *"…old gold never becomes old"* — delivered to camera on the
  same shot it opened on. **No CTA, no follow prompt, no end card.** Stops on the last word.

---

## 4. Selection — what footage qualifies

1. **There is a visible before and a visible after.** No visible delta, no clip.
2. **The payoff reads in a single frame.** If you'd have to explain the result, skip it.
3. **Hands are in frame doing something** for most of the runtime.
4. **The process has a surprise** — something harder, more disgusting, or more satisfying than
   expected. The frost coming out as one intact sheet is the whole video.

Then write the hook **last**, from the payoff backwards. The hook's job is to promise
specifically the thing your best frame delivers.

---

## 5. Render config

```json
{
  "resolution": "1080x1920",
  "fps": 60,
  "font": "Komika-Axis",
  "subtitleStyle": "one-word",
  "subtitlePrimaryColor": "#FFFFFF",
  "subtitleHighlightColor": "#FFFFFF",
  "subtitleY": 0.50,
  "subtitleFontSize": 120,
  "subtitleOutline": 12,
  "subtitleShadow": 0,
  "subtitleUppercase": true,
  "maxWordsPerLine": 1,
  "music": { "volume": 0.0 },
  "hookCard": { "enabled": false },
  "logo": { "enabled": false }
}
```

`subtitleHighlightColor` is set **equal to** the primary. Per `whisper_align.py:45` it maps to
ASS `SecondaryColour` (the pre-spoken colour); with one word per line there is no un-spoken
word to tint, and matching them guarantees no stray karaoke tint appears.

### Deltas from the stock default

| Key | Stock | This skill | Why |
|---|---|---|---|
| `fps` | 30 | **60** | § 1.2 — continuous motion judders at 30 |
| `maxWordsPerLine` | 4 | **1** | § 3.2 |
| `subtitleHighlightColor` | `#FFD400` | `#FFFFFF` | no karaoke state in this style |
| `subtitleY` | 0.62 | 0.50 | dead centre |
| `subtitleFontSize` | *hardcoded 68* | 120 | ~4.5% cap height at 1920 |
| `subtitleUppercase` | — | `true` | new key |
| `subtitleOutline` | *hardcoded 6* | 12 | the thick outline is the signature |
| `font` | Montserrat-ExtraBold | Komika-Axis | rounded, not geometric |

### Renderer gaps

Beyond the gaps already listed in `retention-hardcut` (no cut engine, no silence removal,
blind centre crop):

1. **`subtitleUppercase` and `subtitleOutline` don't exist.** Outline is hardcoded to `6` and
   font size to `68` in `whisper_align.py:45`. Both need templating for this style.
2. **60fps is not plumbed.** `render.js` re-encodes without an explicit `-r`, so source fps
   survives — verify rather than assume, and don't let a 30fps intermediate sneak in.
3. **Cut-on-action cannot be automated** the way a metronome can. This style needs either a
   human pass or shot-boundary detection on hand motion. **Do not let an automated 2s cutter
   loose on process footage** — it will cut through the gestures.
4. **Font `Komika-Axis` must be installed on the render box.** Verify before first render;
   libass silently substitutes and the look collapses.

---

## 6. Checklist before shipping

- [ ] Hook promises a **specific visible payoff** in the first sentence
- [ ] The payoff frame reads without explanation
- [ ] Captions: **one word**, ALL CAPS, dead centre, thick black outline
- [ ] Every cut lands on an action, none mid-gesture
- [ ] Hands visible for most of the runtime
- [ ] 60fps end to end
- [ ] No dead air — but voice dynamics left intact, not flattened
- [ ] Process/tool sound audible
- [ ] Ends on the last spoken word, no CTA
- [ ] **Watch it muted.** The process must be legible with the sound off.

---

## 7. Not part of the style

- **3:4 (720×960) is the reference's container, probably a repost artefact.** Ship 9:16.
- **The third-person hook implies someone else's footage.** When it's our own build, use first
  person throughout — the promise structure is what transfers, not the borrowed voice.
- No watermark present on this reference.

---

## 8. Where this applies to us

This is the closer match for **build-along / vibe-coding / "watch me ship this" content** than
`retention-hardcut` is. Screen recording *is* process footage: the cursor is the hands, the
working feature is the payoff frame, and "watch me build X in 20 minutes — it actually worked"
is exactly the § 3.7 hook shape. Use `retention-hardcut` for narrated explainers;
use this for anything where something visibly gets built or fixed.
