import sys
import os
import json
import math
import hashlib
import argparse

def hex_to_ass(hex_str):
    hex_str = str(hex_str).strip().lstrip('#')
    if len(hex_str) == 6:
        r, g, b = hex_str[0:2], hex_str[2:4], hex_str[4:6]
        return f"&H00{b}{g}{r}"
    return "&H00FFFFFF"

def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centiseconds = int(round((seconds % 1) * 100))
    if centiseconds == 100:
        secs += 1
        centiseconds = 0
    return f"{hours}:{minutes:02d}:{secs:02d}.{centiseconds:02d}"

def compute_file_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def is_arabic_script(text):
    for char in text:
        if '\u0600' <= char <= '\u06FF':
            return True
    return False

def filter_arabic_script(text):
    # If a word contains Arabic/Urdu script, replace with Devanagari fallback or clean text
    return "".join(c for c in text if not ('\u0600' <= c <= '\u06FF'))

def generate_ass(words, output_ass, template):
    font_name = template.get("subtitleFont") or template.get("font", "Montserrat-ExtraBold")
    primary_color = hex_to_ass(template.get("subtitlePrimaryColor", "#FFFFFF"))
    highlight_color = hex_to_ass(template.get("subtitleHighlightColor", "#FFD400"))
    subtitle_y = template.get("subtitleY", 0.50)
    max_words_per_line = template.get("maxWordsPerLine", 4)
    font_size = template.get("subtitleFontSize") or template.get("fontSizePx", 80)
    outline = template.get("subtitleOutline", 6)
    shadow = template.get("subtitleShadow", 0)
    uppercase = template.get("subtitleUppercase", False) or (template.get("textTransform") == "uppercase")
    subtitle_style = template.get("subtitleStyle", "karaoke-word")

    overlay_style = template.get("overlayStyle")
    border_style = 4 if overlay_style == "dark-translucent-card" else 1
    back_color = "&H80000000" if overlay_style == "dark-translucent-card" else "&H00000000"

    margin_v = int(1920 * (1.0 - subtitle_y))

    header = f"""[Script Info]
Title: Content Factory Karaoke Subtitles
ScriptType: v4.00+
WrapStyle: 2
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{primary_color},{highlight_color},&H00000000,{back_color},-1,0,0,0,100,100,0,0,{border_style},{outline},{shadow},2,40,40,{margin_v},1
"""

    clean_words = []
    for w in words:
        if w["end"] > w["start"]:
            clean_words.append(w)

    if not clean_words:
        print("Warning: all words were degenerate. Writing empty ASS file.")
        with open(output_ass, "w", encoding="utf-8") as f:
            f.write(header + "\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
        return

    dialogues = []

    if subtitle_style == "one-word" or max_words_per_line == 1:
        for w in clean_words:
            w_start = w["start"]
            w_end = w["end"]
            duration_cs = max(5, int(round((w_end - w_start) * 100)))
            text_str = w["word"].strip()
            if uppercase:
                text_str = text_str.upper()
            ass_line = f"{{\\k{duration_cs}}}{text_str}"
            dialogues.append(
                f"Dialogue: 0,{format_time(w_start)},{format_time(w_end)},Default,,0,0,0,,{ass_line}"
            )
    else:
        lines = []
        current_line = []
        for w in clean_words:
            current_line.append(w)
            if len(current_line) >= max_words_per_line:
                lines.append(current_line)
                current_line = []
        if current_line:
            lines.append(current_line)

        for line in lines:
            if not line:
                continue
            line_start = line[0]["start"]
            line_end = line[-1]["end"]

            text_parts = []
            for i, w in enumerate(line):
                word_str = w["word"].strip()
                if uppercase:
                    word_str = word_str.upper()

                w_start = w["start"]
                w_end = w["end"]
                duration = max(0.05, w_end - w_start)
                duration_cs = int(round(duration * 100))
                text_parts.append(f"{{\\k{duration_cs}}}{word_str} ")

            ass_line = "".join(text_parts).strip()
            dialogues.append(
                f"Dialogue: 0,{format_time(line_start)},{format_time(line_end)},Default,,0,0,0,,{ass_line}"
            )

    with open(output_ass, "w", encoding="utf-8") as f:
        f.write(header)
        f.write("\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
        f.write("\n".join(dialogues))
        f.write("\n")

def main():
    parser = argparse.ArgumentParser(description="Whisper Subtitle Alignment with Strict Cache Keying & Devanagari Enforcement")
    parser.add_argument("audio_path", help="Path to audio file")
    parser.add_argument("template_path", help="Path to template.json or config.json")
    parser.add_argument("output_ass", help="Path to output ASS file")
    parser.add_argument("--model", default="large-v3", help="Whisper model name (default: large-v3)")
    parser.add_argument("--language", default=None, help="Language code hint (e.g. hi, en)")
    parser.add_argument("--cache-dir", default=os.path.join(os.path.dirname(__file__), "transcripts"), help="Cache directory")

    args = parser.parse_args()

    audio_path = args.audio_path
    template_path = args.template_path
    output_ass = args.output_ass
    model_name = args.model
    lang_hint = args.language
    cache_dir = args.cache_dir

    if not os.path.exists(audio_path):
        print(f"Error: audio file not found at {audio_path}")
        sys.exit(1)

    template = {}
    if os.path.exists(template_path):
        try:
            with open(template_path, "r", encoding="utf-8") as f:
                template = json.load(f)
        except Exception as e:
            print(f"Warning: failed to read template config, using defaults. Error: {e}")

    os.makedirs(cache_dir, exist_ok=True)
    audio_sha256 = compute_file_sha256(audio_path)
    lang_str = lang_hint or template.get("language") or "auto"
    
    cache_filename = f"{audio_sha256}__{model_name}__{lang_str}.json"
    cache_filepath = os.path.join(cache_dir, cache_filename)

    cache_bypass = os.environ.get("CACHE_BYPASS", "0") == "1"
    words = []

    if not cache_bypass and os.path.exists(cache_filepath):
        print(f"[CACHE_HIT] Loading transcript from {cache_filepath}")
        try:
            with open(cache_filepath, "r", encoding="utf-8") as f:
                words = json.load(f)
        except Exception as e:
            print(f"Warning: cache read error: {e}, falling back to fresh transcription.")

    if not words:
        print(f"[CACHE_MISS] Transcribing audio using faster-whisper (model={model_name}, lang={lang_str}, bypass={cache_bypass})...")
        strict = os.environ.get("STRICT", "1") == "1"
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            if strict:
                print("ERROR: [STRICT MODE] faster-whisper package is not installed. Aborting alignment.")
                sys.exit(1)
            words = [
                {"word": "Content", "start": 0.5, "end": 1.5},
                {"word": "Factory", "start": 1.5, "end": 2.5},
                {"word": "Render", "start": 2.5, "end": 3.5},
                {"word": "Video", "start": 3.5, "end": 4.5}
            ]
        else:
            loaded_model = None
            for try_model in [model_name, "medium", "base"]:
                try:
                    print(f"Attempting to load WhisperModel('{try_model}') on CPU...")
                    loaded_model = WhisperModel(try_model, device="cpu", compute_type="float32")
                    break
                except Exception as e:
                    print(f"Model {try_model} failed to load: {e}")

            if not loaded_model:
                print("ERROR: Failed to load any Whisper model.")
                if strict:
                    sys.exit(1)

            transcribe_kwargs = {"word_timestamps": True}
            if lang_str and lang_str not in ("auto", "hinglish"):
                transcribe_kwargs["language"] = lang_str
                if lang_str == "hi":
                    transcribe_kwargs["initial_prompt"] = "यह वीडियो हिंदी भाषा में है। स्वागता है।"

            segments, info = loaded_model.transcribe(audio_path, **transcribe_kwargs)
            for segment in segments:
                for w in segment.words:
                    clean_word = filter_arabic_script(w.word) if lang_str in ("hi", "hinglish") else w.word
                    if clean_word.strip():
                        words.append({
                            "word": clean_word,
                            "start": w.start,
                            "end": w.end
                        })

            if words:
                try:
                    with open(cache_filepath, "w", encoding="utf-8") as f:
                        json.dump(words, f, indent=2)
                    print(f"Saved transcript to cache: {cache_filepath}")
                except Exception as e:
                    print(f"Warning: failed to save transcript cache: {e}")

    if not words:
        print("Error: No words transcribed from the audio file.")
        sys.exit(1)

    print(f"Generating ASS subtitles with {len(words)} words...")
    generate_ass(words, output_ass, template)
    print(f"ASS subtitles successfully saved to {output_ass}")

if __name__ == "__main__":
    main()
