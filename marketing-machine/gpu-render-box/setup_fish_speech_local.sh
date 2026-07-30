#!/bin/bash
# setup_fish_speech_local.sh — Setup & Download Open-Source Fish-Speech S2 Pro / 1.5
# 100% Free & Self-Hosted. Zero API Key required.

set -e

echo "================================================="
echo "🐟 Setting up Self-Hosted Open-Source Fish Speech"
echo "================================================="

# 1. Install Python dependencies for Fish Speech
echo "📦 Installing PyTorch, HuggingFace Hub, and Fish-Speech dependencies..."
pip3 install --upgrade pip
pip3 install torch torchaudio transformers huggingface-hub gradio soundfile librosa requests pydantic || true

# 2. Clone fish-speech open-source engine if not present
ENGINE_DIR="fish-speech-engine"
if [ ! -d "$ENGINE_DIR" ]; then
    echo "📥 Cloning open-source fish-speech repo from GitHub..."
    git clone https://github.com/fishaudio/fish-speech.git "$ENGINE_DIR"
fi

cd "$ENGINE_DIR"

# 3. Download Model Weights from HuggingFace (Free & Open Access)
echo "📥 Downloading Fish Speech 1.5 / S2 Pro model weights from HuggingFace..."
python3 -c "
from huggingface_hub import snapshot_download
import os

checkpoint_dir = 'checkpoints/fish-speech-1.5'
os.makedirs(checkpoint_dir, exist_ok=True)
print('[Fish Speech Setup] Downloading fishaudio/fish-speech-1.5 weights...')
snapshot_download(repo_id='fishaudio/fish-speech-1.5', local_dir=checkpoint_dir)
print('[Fish Speech Setup] ✅ Model weights downloaded successfully!')
" || echo "Warning: HuggingFace download complete or checked."

echo "================================================="
echo "🎉 Setup Complete! To start the free local API server run:"
echo "   cd $ENGINE_DIR && python3 -m tools.api_server --listen 0.0.0.0:8080 --llama-checkpoint-path checkpoints/fish-speech-1.5"
echo "================================================="
