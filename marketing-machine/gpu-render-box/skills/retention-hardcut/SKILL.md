---
name: retention-hardcut
type: EDITING_STYLE
description: "Cut a long video (podcast, interview, tutorial, stream — 30min+) into a shortform clip using the hard-cut retention grammar: ~2s average shot, dead-centre karaoke captions (unspoken words dim grey, spoken white), zero dead air, every shot literally illustrating the words on screen. No intro, no outro, no CTA. Reverse-engineered frame-by-frame from a reference clip."
isVisual: true
styleReference:
  referenceVideoUrl: "~/Downloads/vidssave.com How did Thor realize that Odin was actually Loki in disguise_ #marvel #foryou #usa #fyp #movie 720P.mp4"
  frameExtracts:
    - reference/frame_0.10s.png    # open: NO caption, mystery object, not a face
    - reference/frame_0.70s.png    # caption illuminating mid-line
    - reference/frame_22.50s.png   # shot-word lock: "he rubbed his hands together"
    - reference/frame_44.50s.png   # the single dip-to-black, section break
    - reference/frame_47.00s.png   # THE money frame: dim unspoken words visible on dark bg
    - reference/frame_62.00s.png   # payoff shot
---

# Retention Hard-Cut

The house style for turning **any long video into a shortform clip**. Measured
frame-by-frame off the reference (see `reference/TEARDOWN.md` for the raw numbers).

**Read § 1 before touching a knob.** Every number in § 3 is downstream of it. Copying the
numbers without the logic produces a clip that looks right and retains nothing.

---

## 1. First principles — what a shortform video actually is

A shortform video is not "a short video." It is an entry in a **repeated, involuntary
attention auction**, judged on a retention curve. That single fact generates every rule below.

**1. The unit of value is the next second, not the video.**
There is no setup budget. A 30-minute video earns patience; a shortform clip earns nothing and
must re-earn attention every second. Any second that exists only to enable a later second is a
second where people leave.

**2. The viewer arrives with zero context and zero commitment.**
They did not choose this. It appeared. So there is no "hey guys", no logo sting, no channel
intro, no "before we start". Frame 1 is already the content. The reference proves this
literally: **caption and narration start at 0.4s, and the very first image is a mystery object
(a tumbling hammer) — not a face, not a title card.**

**3. Attention habituates to a static image in about two seconds.**
This is the actual reason for fast cutting — not style. A cut is a re-arousal pulse that resets
the habituation clock. The reference cuts **31 times per minute, median shot 1.93s**. That is
tuned to the habituation window, which is why it feels "fast but not frantic."

**4. Silence is an exit ramp.**
A pause is a permission slip to scroll. The reference's audio sits at **−13 to −16 dB for all
66 seconds with zero silence and zero dynamic dip.** Not one breath gap. This is the single
most-copied-wrong part of the style: people copy the cuts and leave the pauses in.

**5. Most viewers are watching muted.**
Captions are not accessibility here, they are the primary channel. That drives placement
(centre, where the eye already is and where no platform UI covers), weight (ExtraBold), and the
one-line-only rule. If the clip doesn't work muted, it doesn't work.

**6. Comprehension must be free.**
Every moment the viewer must *work* to connect word to image is a moment they can leave. Hence
the shot-word lock (§ 3.4): the picture shows exactly what the words say, at the moment they say
it. Decorative b-roll is worse than no b-roll.

**7. Curiosity is the only thing that survives a scroll impulse.**
Open a loop in second one; refuse to close it until the end. The reference asks its title
question at 0.4s, **re-asks it at 9s before answering**, and doesn't pay off until 54s.

**8. The ending is a retention event too.**
The reference ends on the final narrated word — **no CTA, no outro card, no "follow for more."**
Completion rate is a ranking input, and an abrupt end loops cleanly. An outro is where you
donate your completion rate.

### What changes when the source is *found footage*

The reference is a **fully authored narrated explainer**: someone wrote the script, then chose
every shot to match it. A clip cut from a podcast or tutorial is the reverse — **the audio is
fixed and you can only choose pictures.** So the grammar inverts:

| | Authored explainer (the reference) | Clipping a long video (what we do) |
|---|---|---|
| Script | written first | already spoken, immovable |
| Shots | chosen to fit words | must be *manufactured* (punch-ins, inserts, angles) |
| Pacing | built in | must be *extracted* by removing dead air |
| Job | illustrate | find the 45s that already has an arc, then hide the seams |

**The clip's arc has to already exist in the source.** Editing cannot create a payoff that
wasn't said. Selection is 80% of the work; § 5 is the selection rule.

---

## 2. The style in one paragraph

Square-to-vertical footage, brightened and desaturated. Hard cuts roughly every two seconds,
never a wipe or a slide. One line of heavy white text sitting dead centre, where the words ahead
of the voice sit dim grey and turn solid white exactly as they are spoken. Audio never drops and
never pauses. Every shot shows literally what is being said. It starts mid-thought with no
intro and stops dead on the last word with no outro.

---

## 3. The measured spec

### 3.1 Container
- **9:16, 1080×1920, 30fps.** (Reference was 1:1 720×720; all geometry below is re-derived as
  percentages and applied to 1080×1920.)
- Target length **35–70s**. Reference is 65.8s.

### 3.2 Captions — the defining mechanic

This is the thing people get wrong, so it is specified exactly.

**The whole line is laid out at once and stays put. Words do not fly in or push each other
around. The unspoken words are already sitting there in dim grey; each word flips to solid
white at the instant it is spoken.**

On a bright background the dim grey washes out and it *looks* like the line is typing itself on.
On a dark background you can read the whole upcoming line in grey. Both are the same effect.
`reference/frame_47.00s.png` is the proof frame — the caption reads
"There **was another** important clue" with the last two words visibly grey.

| Property | Value | Notes |
|---|---|---|
| Vertical position | **centre, 50% of frame height** | Measured 49.7–50.6%. Not lower-third. |
| Lines | **exactly one, always** | Never wraps to two. |
| Words per line | **5–6 typical**, 2–8 range | |
| Font | **Montserrat ExtraBold** | Heavy geometric sans, slight negative tracking. |
| Size | **~4.2% of frame height** → ~80px at 1920 | |
| Max line width | **~80% of frame width** | |
| Spoken word | `#FFFFFF` solid | |
| Unspoken word | **dim grey ~`#8A8A8A`** | **Not yellow. Not an accent colour.** |
| Outline | thin dark, ~0.3% of height (~6px at 1920) | |
| Shadow | soft drop shadow | |
| Background plate | **none** | No box, no bar, no blur pad. |
| Line change | cross-fade out ~0.25s, brief empty gap, next line fades in | |
| Emoji / keyword colouring | **none** | |

**Why centre and not lower-third:** it is where the eye already rests, it clears the caption/
username UI at the bottom of every platform, and on a talking-head clip it sits across the
chest — readable without covering the face.

### 3.3 Cut rhythm

- **Median shot 1.93s. Mean 1.93s. 31 cuts/min.** Aim for a median in the **1.8–2.2s** band.
- **Range 0.7s – 5.5s.** Do not make every shot the same length; that reads as a slideshow.
  Reference distribution across 34 shots:
  `<1.0s ×3 | 1.0–1.5s ×9 | 1.5–2.0s ×6 | 2.0–2.5s ×12 | 2.5–3.0s ×2 | >3.0s ×2`
- **Hard cuts only.** No wipes, slides, spins, zoom-blurs, glitch transitions.
- **Exactly one dip-to-black in the whole clip**, used once as a section break (reference: 44.5s,
  between the two bodies of evidence). It is punctuation, not decoration. If you use two, both
  stop meaning anything.
- **Let the payoff breathe.** The two longest holds (5.2s, 5.5s) are both in the proof section.
  Speed is for setup; the answer gets room.

### 3.4 Shot-word lock

**The cut lands on the noun.** Every shot literally illustrates the words on screen at that
moment. From the reference:

| Words on screen | What is shown |
|---|---|
| "He rubbed his hands together" | hands rubbing |
| "kept making nervous little gestures" | the fidget |
| "Surtur had already told Thor…" | Surtur |
| "And because Thor grew up beside him" | the child |
| "hurled Mjolnir" | the hammer flying |

If a shot does not illustrate the current sentence, it does not belong. **Ambient/decorative
b-roll is a retention leak, not filler.** When in doubt, stay on the speaker.

### 3.5 Audio

- **Wall-to-wall. Zero silence.** Remove every pause, breath and filler with jump cuts.
- **Loudness pinned to a −14 dB LUFS-ish band, compressed/limited flat.** Reference never
  leaves −13…−16 dB across 66 seconds.
- **No whoosh SFX on cuts. No sub-drops. No music swells.** The reference has none. The cut
  itself is the punctuation.
- Background music optional and low (≤0.10) — it must never create a dynamic dip.
- **One sanctioned exception:** the source's own audio may surface for a single quoted line
  (reference: Surtur's "Odin is not on Asgard"). Once per clip, at the proof beat.

### 3.6 Grade

Brightened, contrast-pushed, **heavily desaturated**. Reference measures full-range
(black 0 / white 255) with **saturation average 7–23**, which is very low.

Starting point: `eq=brightness=0.04:contrast=1.12:saturation=0.72`

Grade last, after captions are burned, so text contrast is judged against the final image.

### 3.7 Open and close

- **Open:** ~0.3–0.4s of picture with no caption, then words start. Lead with an **intriguing
  image, not a face** if one exists in the source. No logo, no title card, no intro animation.
- **Close:** end on the last spoken word. **No CTA, no outro, no end card, no follow prompt.**

---

## 4. Two profiles — podcast vs tutorial

These are genuinely different creative problems and must not share one setting. Same caption
spec, same audio spec, same open/close rule; **the picture logic differs.**

### Profile A — `podcast` (conversation, interview, two-person, rant)
The value is a **person saying something**. The face is the content.

- **Keep the speaker on screen most of the time.** Manufacture the cut rhythm with **punch-ins**:
  alternate `1.0×` wide / `1.15×` mid / `1.3×` close on the same take. A scale change reads as a
  cut and costs nothing.
- **Cut on the reaction** when a second person is present — the listener's face at the punchline
  is the single highest-value cutaway available.
- **B-roll sparingly**, only on a concrete noun (§ 3.4), never over an emotional beat. Cutting
  away from a face mid-emotion kills the clip.
- **Jump-cut the dead air aggressively.** This is where a podcast clip's pacing comes from.
- **Crop must follow the speaker.** A blind centre crop decapitates a two-person setup —
  see § 6.

### Profile B — `tutorial` (screen-share, walkthrough, build-along, stream)
The value is **a thing happening on a screen**. The face is secondary.

- **Screen is the hero.** Speaker goes to a small inset, or drops out entirely.
- **Punch-ins become zoom-to-region:** crop to the part of the screen being discussed. This is
  the tutorial equivalent of the shot-word lock, and it is mandatory — full-screen 1080p UI is
  unreadable at 9:16.
- **Cadence runs slower: median 2.2–2.8s.** The viewer is reading the screen as well as the
  captions; 1.9s is too fast to comprehend a UI.
- **Never cut away mid-action.** Show the click and its result in one shot.
- **The arc is a result, not a story:** broken state → the fix → it works. If the source segment
  has no visible result, it is not a clip.

---

## 5. Selection — how to pick the 45 seconds

Do this **before** any editing. A perfectly edited clip of a boring 45s is a boring clip.

A segment qualifies only if **all four** are true:

1. **It opens a loop in its first sentence** — a question, a claim that demands justification, or
   a contradiction. If sentence one is context, the segment starts in the wrong place.
2. **It resolves inside the window.** A clip that needs the previous 10 minutes to land is not a
   clip.
3. **It is self-contained.** No unexplained "as I mentioned", no dangling pronouns.
4. **It has one idea.** Two ideas is two clips.

Then: **find the real first sentence and cut there.** The most common failure is starting 8
seconds early on throat-clearing. If the best line is 20s in, start at 20s.

Re-open the loop once before paying it off (reference does this at 9s). Costs two seconds,
buys the middle of the video.

---

## 6. Janus render config

Drop-in for `template.json`, consumed by `render.js` and `whisper_align.py`. Also stored as
`config.json` beside this file, and on `Skill.config`.

```json
{
  "resolution": "1080x1920",
  "fps": 30,
  "font": "Montserrat-ExtraBold",
  "subtitleStyle": "karaoke-word",
  "subtitlePrimaryColor": "#FFFFFF",
  "subtitleHighlightColor": "#8A8A8A",
  "subtitleY": 0.50,
  "subtitleFontSize": 80,
  "maxWordsPerLine": 6,
  "music": { "volume": 0.0 },
  "hookCard": { "enabled": false },
  "logo": { "enabled": false }
}
```

### ⚠️ `subtitleHighlightColor` is the UNSPOKEN colour, not the highlight

Non-obvious and worth stating plainly. In `whisper_align.py:45` the style line is:

```
Style: Default,{font},68,{primary_color},{highlight_color},...
```

which maps to ASS `PrimaryColour, SecondaryColour, …`. Under `\k` karaoke, **`SecondaryColour`
is the colour a word shows *before* it is spoken, and `PrimaryColour` is what it becomes after.**

So `subtitleHighlightColor` is really "colour of words not yet reached." The current default
`#FFD400` means **Janus renders words yellow, turning white** — the reverse of the intuition the
name suggests, and not the reference look. Setting it to `#8A8A8A` gives the reference's
dim-grey → white.

### Deltas from the current default

| Key | Current | This skill | Why |
|---|---|---|---|
| `subtitleHighlightColor` | `#FFD400` | `#8A8A8A` | Reference dims unspoken words; never yellow |
| `subtitleY` | `0.62` | `0.50` | Reference is dead centre, not lower-third |
| `maxWordsPerLine` | `4` | `6` | Reference runs 5–6; 4 causes constant line churn |
| `subtitleFontSize` | *hardcoded 68* | `80` | 68/1920 = 3.5%; reference is 4.2% |
| `hookCard` | `enabled: true` | `false` | § 1.2 — no title card |
| `music.volume` | `0.12` | `0.0` | § 3.5 — nothing that creates a dip |

### Renderer gaps — what `render.js` cannot do yet

The clip path (`render.js` § *Clip Extraction & Formatting*) currently trims one continuous
segment, centre-crops to 9:16 and burns ASS. To execute this skill it needs, in priority order:

1. **A cut engine.** Today the clip is **one unbroken shot**; this style needs ~31 cuts/min.
   Cheapest viable version: scripted punch-in schedule (alternating `1.0/1.15/1.3` scale on a
   timeline) applied via a single `crop`/`scale` filter chain. This is the biggest gap by far.
2. **Dead-air removal.** No silence detection today, so podcast pauses survive into the clip and
   break § 3.5. `silencedetect` → segment list → concat.
3. **Speaker-aware crop.** `crop=1080:1920` takes the centre blindly; on a two-person podcast
   this frames the gap between them. Needs at minimum a configurable X offset.
4. **`subtitleFontSize` is hardcoded** at 68 in `whisper_align.py:45` — not templated.
5. **Grade pass** (§ 3.6) — no `eq` filter in the chain today.
6. **Whisper model is `base`** (`whisper_align.py:142`). Weak on Hinglish; word timings drive the
   whole caption mechanic, so drift here breaks the look. Consider `medium` for Hinglish sources.

Items 1 and 2 are what separate "a cropped clip with captions" from this style. Until they exist,
the config above gets the captions right and the cutting will still be flat.

---

## 7. Checklist before shipping a clip

- [ ] First frame is content — no logo, no title card, no intro
- [ ] First spoken sentence opens a loop
- [ ] Median shot length in the 1.8–2.2s band (2.2–2.8s for `tutorial`)
- [ ] Zero silence anywhere in the timeline
- [ ] Captions dead centre, one line, ≤6 words
- [ ] Unspoken words dim grey, spoken solid white — **not yellow**
- [ ] Every shot illustrates the words on screen at that moment
- [ ] At most one dip-to-black
- [ ] Ends on the last spoken word — no CTA, no outro
- [ ] **Watch it muted.** If it doesn't land muted, it doesn't ship.

---

## 8. Not part of the style

The reference carries a roving `@CineDrama-h7d` watermark that drifts position at ~25% opacity.
That is the original creator's anti-repost measure — **do not reproduce it.** If we want a brand
mark, that is a separate decision; this style ships clean.

The reference's bleach grade also doubles as copyright-detection evasion on movie footage. For
our own source material only the legibility half of § 3.6 matters.
