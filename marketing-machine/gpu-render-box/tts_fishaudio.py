#!/usr/bin/env python3
"""
tts_fishaudio.py — Fish Audio (Fish Speech S2 Pro) Synthesis Helper
Synthesizes speech using the Fish Audio API (https://api.fish.audio/v1/tts).
Supports 80+ languages (English, Hindi, Hinglish), emotion tags ([happy], [excited], etc.), and multi-speaker reference IDs.
"""

import sys
import os
import argparse
import requests

def synthesize_speech(text, api_key=None, reference_id=None, format="mp3", output_path="out.mp3"):
    key = api_key or os.getenv("FISH_AUDIO_API_KEY")
    if not key:
        raise ValueError("Missing FISH_AUDIO_API_KEY environment variable or argument.")

    url = "https://api.fish.audio/v1/tts"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    payload = {
        "text": text,
        "format": format,
        "mp3_bitrate": 192,
        "opus_bitrate": 32,
        "latency": "normal"
    }

    if reference_id and reference_id != "default":
        payload["reference_id"] = reference_id

    print(f"[Fish Audio] Sending request to {url} (text length: {len(text)} chars)...")
    response = requests.post(url, json=payload, headers=headers, timeout=30)

    if response.status_code == 200:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(response.content)
        file_size = os.path.getsize(output_path)
        print(f"[Fish Audio] PASS: Audio saved to {output_path} ({file_size} bytes)")
        return True
    else:
        err_msg = f"Fish Audio API error (HTTP {response.status_code}): {response.text}"
        print(f"[Fish Audio] FAIL: {err_msg}")
        raise RuntimeError(err_msg)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fish Audio TTS CLI")
    parser.add_argument("--text", required=True, help="Text string to synthesize")
    parser.add_argument("--api_key", help="Fish Audio API key")
    parser.add_argument("--voice", default="default", help="Voice / Reference ID")
    parser.add_argument("--out", default="voice.mp3", help="Output audio file path")
    parser.add_argument("--format", default="mp3", help="Audio format (mp3/wav)")

    args = parser.parse_args()

    try:
        synthesize_speech(
            text=args.text,
            api_key=args.api_key,
            reference_id=args.voice,
            format=args.format,
            output_path=args.out
        )
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)
