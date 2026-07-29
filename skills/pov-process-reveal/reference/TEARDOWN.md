# Reference teardown — 1950s Refrigerator Restoration
Source: vidssave.com 1950s Refrigerator Restoration That's Actually Incredible 720P.mp4
Measured with /style-teardown on 2026-07-29.

## Container
720x960 (3:4), 60fps, 46.5s, h264, ~2.34 Mbps video, AAC 128kbps 44.1k stereo.
High bitrate — texture is the product.

## Cut rhythm
22 shots / 46.5s. mean 2.09s, median 2.00s, min 0.70s, max 5.06s. 28.7 cuts/min.
<1.0s x2 | 1.0-1.5s x6 | 1.5-2.0s x2 | 2.0-2.5s x6 | 2.5-3.0s x3 | >3.0s x3
Hard cuts (s): 3.37, 9.67, 10.37, 11.90, 16.67, 18.97, 21.53, 25.87, 26.90, 28.03,
30.43, 31.87, 34.33, 37.07, 38.33, 39.80, 41.80, 44.50
Soft transitions merged: 8.43, 13.97, 43.80

!! The scene detector fires CONTINUOUSLY from 0.03s to 3.37s with no cut in that span.
   That is camera motion, not cutting. It is the core finding: the camera does the editing.

## Captions
ONE WORD at a time, hard swap. No karaoke, no build, no dimmed upcoming words.
Verified on a 5fps grid (reference/caption_mechanic_5fps.png):
  AFTER · THIS · GUY · DECIDED · TO · CLEAN · UP · HIS · 1950S · REFRIGERATOR · FINAL ·
  RESULT · WAS · ALMOST · IMPOSSIBLE · BELIEVE · THIS · MY · 1950S
Word hold = spoken duration, 0.2-0.8s.
ALL CAPS. White fill, THICK black outline, minimal shadow.
Geometry (centre band y430-530, kills frost contamination):
  t=16.1  x309-411 w=102 (14.2%)  capH=45 (4.7% of 960)  cx=360
  t=29.9  x325-393 w= 68 ( 9.4%)  capH=40 (4.2% of 960)  cx=359
  t=5.4   x200-519 w=319 (44.3%)  "REFRIGERATOR" — longest word  cx=359
Frame centre = 360 -> captions dead centre horizontally. Vertically 49-50%.

## Audio
RMS per 2s: min -25.7, max -10.6, RANGE 15.1 dB -> natural human dynamics (NOT a TTS wall).
BUT silencedetect (-32dB, 0.25s) found ZERO gaps. Continuous room tone + tool sound.
=> Rule: kill dead air, keep dynamics. Cut pauses out; don't compress them out.
No music bed detected. No whoosh SFX.

## Grade
YAVG 97-140, SATAVG 12-22. Mild, near-natural. Teal reads as teal.
Much lighter touch than retention-hardcut's bleach look (SAT 7-23 + heavy lift).

## Structure
0.0   HOOK, third person, promises a visible payoff:
      "After this guy decided to clean up his 1950s refrigerator, the final result was
       almost impossible to believe."
6.4   switches to FIRST person: "This is my 1950s General Electric..."
      -> aggregator/repost pattern: a promise bolted onto someone's process footage
9-28  PROCESS: freezer frosted solid, original 1950s manual, hot pan method
28-38 PAYOFF: the frost lifts out as one intact sheet
40-46 RESULT: clean empty freezer, ice trays back in
46.5  CLOSE on aphorism "...old gold never becomes old", to camera. No CTA. Ends on last word.
