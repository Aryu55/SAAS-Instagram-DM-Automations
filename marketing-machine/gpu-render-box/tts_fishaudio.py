#!/usr/bin/env python3
"""
tts_fishaudio.py — Fish Speech Open-Source & Cloud API Synthesis Helper
Supports both:
1. Open-Source Local Fish-Speech Server (https://github.com/fishaudio/fish-speech)
   Run: `python -m tools.api_server --listen 0.0.0.0:8080` (Free, zero API key)
2. Fish Audio Cloud API (https://api.fish.audio/v1/tts)
"""

import sys
import os
import argparse
import requests

def synthesize_speech(text, api_key=None, server_url=None, reference_id=None, format="mp3", output_path="out.mp3"):
    # Determine endpoint: Local open-source server or Cloud API
    local_url = server_url or os.getenv("FISH_SPEECH_URL") or "http://127.0.0.1:8080/v1/tts"
    key = api_key or os.getenv("FISH_AUDIO_API_KEY")

    if key:
        url = "https://api.fish.audio/v1/tts"
        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        print(f"[Fish Speech] Mode: Cloud API ({url})")
    else:
        url = local_url
        headers = {
            "Content-Type": "application/json"
        }
        print(f"[Fish Speech] Mode: Local Open-Source Server ({url})")

    payload = {
        "text": text,
        "format": format,
        "mp3_bitrate": 192,
        "opus_bitrate": 32,
        "latency": "normal"
    }

    if reference_id and reference_id != "default":
        payload["reference_id"] = reference_id

    print(f"[Fish Speech] Synthesizing text ({len(text)} chars)...")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.exceptions.ConnectionError:
        if not key:
            raise RuntimeError(
                f"Could not connect to local Fish-Speech server at {url}.\n"
                f"Make sure you started the open-source server from https://github.com/fishaudio/fish-speech using:\n"
                f"  python -m tools.api_server --listen 0.0.0.0:8080\n"
                f"Or set FISH_AUDIO_API_KEY for cloud access."
            )
        raise

    if response.status_code == 200:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(response.content)
        file_size = os.path.getsize(output_path)
        print(f"[Fish Speech] PASS: Audio saved to {output_path} ({file_size} bytes)")
        return True
    else:
        err_msg = f"Fish Speech error (HTTP {response.status_code}): {response.text}"
        print(f"[Fish Speech] FAIL: {err_msg}")
        raise RuntimeError(err_msg)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fish Speech Open-Source & Cloud TTS CLI")
    parser.add_argument("--text", required=True, help="Text string to synthesize")
    parser.add_argument("--api_key", help="Fish Audio API key (optional for cloud)")
    parser.add_argument("--url", help="Local Fish Speech server URL (default: http://127.0.0.1:8080/v1/tts)")
    parser.add_argument("--voice", default="default", help="Voice / Reference ID")
    parser.add_argument("--out", default="voice.mp3", help="Output audio file path")
    parser.add_argument("--format", default="mp3", help="Audio format (mp3/wav)")

    args = parser.parse_args()

    try:
        synthesize_speech(
            text=args.text,
            api_key=args.api_key,
            server_url=args.url,
            reference_id=args.voice,
            format=args.format,
            output_path=args.out
        )
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)
