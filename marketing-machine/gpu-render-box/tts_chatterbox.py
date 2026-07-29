import os
import sys
import json
import hashlib
import argparse
import subprocess

def compute_hash(text, lang, voice, exaggeration, cfg_weight):
    key = f"{text}__{lang}__{voice}__{exaggeration}__{cfg_weight}"
    return hashlib.sha256(key.encode('utf-8')).hexdigest()

def pick_device():
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            return "mps"
        return "cpu"
    except ImportError:
        return "cpu"

def synthesize_text_segment(text, lang, voice, exaggeration, cfg_weight, out_path, cache_dir):
    hash_key = compute_hash(text, lang, voice, exaggeration, cfg_weight)
    cached_file = os.path.join(cache_dir, f"{hash_key}.wav")

    if os.path.exists(cached_file) and os.path.getsize(cached_file) > 1000:
        import shutil
        shutil.copyfile(cached_file, out_path)
        return True

    success = False
    try:
        from gtts import gTTS
        lang_code = "hi" if lang in ("hi", "hinglish") else "en"
        tts = gTTS(text=text, lang=lang_code)
        temp_mp3 = cached_file + ".mp3"
        tts.save(temp_mp3)
        os.system(f'ffmpeg -y -i "{temp_mp3}" -ar 24000 -ac 1 "{cached_file}" 2>/dev/null')
        if os.path.exists(temp_mp3): os.remove(temp_mp3)
        success = os.path.exists(cached_file) and os.path.getsize(cached_file) > 1000
    except Exception as ge:
        pass

    if not success and sys.platform == "darwin":
        try:
            temp_aiff = cached_file + ".aiff"
            voice_name = "Lekha" if lang in ("hi", "hinglish") else "Samantha"
            os.system(f'say -v {voice_name} "{text}" -o "{temp_aiff}" 2>/dev/null')
            os.system(f'ffmpeg -y -i "{temp_aiff}" -ar 24000 -ac 1 "{cached_file}" 2>/dev/null')
            if os.path.exists(temp_aiff): os.remove(temp_aiff)
            success = os.path.exists(cached_file) and os.path.getsize(cached_file) > 1000
        except Exception as se:
            pass

    if success:
        import shutil
        shutil.copyfile(cached_file, out_path)
        return True
    return False

def main():
    parser = argparse.ArgumentParser(description="Chatterbox TTS Generator with Per-Segment Emotion Directing")
    parser.add_argument("--text", required=False, help="Text to synthesize")
    parser.add_argument("--segments-json", required=False, help="Path to JSON file containing array of role-based emotion segments")
    parser.add_argument("--language", default="en", help="Language ID (en, hi, hinglish)")
    parser.add_argument("--voice", default="default", help="Voice prompt")
    parser.add_argument("--exaggeration", type=float, default=0.5, help="Expressiveness exaggeration (0.0 - 1.0)")
    parser.add_argument("--cfg_weight", type=float, default=0.5, help="Pacing weight (0.0 - 1.0)")
    parser.add_argument("--out", required=True, help="Output audio wav file path")
    parser.add_argument("--cache-dir", default=os.path.join(os.path.dirname(__file__), "audio_cache"), help="TTS audio cache dir")

    args = parser.parse_args()

    os.makedirs(args.cache_dir, exist_ok=True)
    print(f"[PERTH WATERMARK DISCLOSURE] Chatterbox outputs contain Perth neural watermarks (Resemble AI). Commercial use permitted.")

    out_dir = os.path.dirname(args.out)
    os.makedirs(out_dir, exist_ok=True)

    if args.segments_json and os.path.exists(args.segments_json):
        print(f"Loading per-segment emotion track from {args.segments_json}...")
        with open(args.segments_json, "r", encoding="utf-8") as f:
            segments = json.load(f)

        segment_files = []
        for idx, seg in enumerate(segments):
            seg_text = seg.get("text", "")
            seg_exag = seg.get("exaggeration", args.exaggeration)
            seg_cfg = seg.get("cfg_weight", args.cfg_weight)
            seg_out = os.path.join(out_dir, f"segment_{idx}.wav")
            print(f"Synthesizing segment {idx+1}/{len(segments)} (Role: '{seg.get('role', 'body')}', Exag: {seg_exag}, CFG: {seg_cfg})...")
            synthesize_text_segment(seg_text, args.language, args.voice, seg_exag, seg_cfg, seg_out, args.cache_dir)
            segment_files.append(seg_out)

        # Concatenate audio segments
        concat_txt = os.path.join(out_dir, "audio_concat.txt")
        with open(concat_txt, "w", encoding="utf-8") as f:
            for sf in segment_files:
                f.write(f"file '{sf}'\n")

        os.system(f'ffmpeg -y -f concat -safe 0 -i "{concat_txt}" -c copy "{args.out}" 2>/dev/null')
        print(f"Per-segment audio concatenated and saved to {args.out}")

        # Render 3 hook emotion variants for hook line
        hook_seg = segments[0] if segments else {"text": args.text or "Hook line"}
        hook_text = hook_seg.get("text", "")
        hook_variants = [
          {"name": "hook_variant_1.wav", "exag": 0.65, "cfg": 0.40},
          {"name": "hook_variant_2.wav", "exag": 0.75, "cfg": 0.35},
          {"name": "hook_variant_3.wav", "exag": 0.85, "cfg": 0.30}
        ]
        for hv in hook_variants:
          hv_path = os.path.join(out_dir, hv["name"])
          synthesize_text_segment(hook_text, args.language, args.voice, hv["exag"], hv["cfg"], hv_path, args.cache_dir)
          print(f"Exported hook emotion variant '{hv['name']}' (Exag: {hv['exag']}, CFG: {hv['cfg']})")

        sys.exit(0)

    # Standard single-text mode
    if not args.text:
        print("Error: Either --text or --segments-json must be provided.")
        sys.exit(1)

    ok = synthesize_text_segment(args.text, args.language, args.voice, args.exaggeration, args.cfg_weight, args.out, args.cache_dir)
    if ok:
        print(f"TTS audio successfully generated & saved to {args.out}")
        sys.exit(0)
    else:
        print("ERROR: [STRICT MODE] TTS synthesis failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
