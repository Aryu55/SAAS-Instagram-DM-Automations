#!/bin/bash
set -e

echo "🚀 Setting up Janus GPU Render Server on Hostinger VPS (KVM 2)..."

# 1. Update and install system dependencies (FFmpeg, Node.js 20, Python 3, Redis, Fontconfig)
echo "📦 Installing System Packages (FFmpeg, Node.js 20, Python3, Redis, Fontconfig)..."
apt-get update -y
apt-get install -y curl git ffmpeg build-essential fontconfig redis-server python3 python3-pip python3-venv

# Install Node.js 20 if not installed
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ FFmpeg version: $(ffmpeg -version | head -n 1)"

# 2. Configure & Start Redis Server with persistence
echo "🔴 Configuring Redis Server..."
systemctl enable redis-server || systemctl enable redis
sed -i 's/^appendonly no/appendonly yes/' /etc/redis/redis.conf 2>/dev/null || true
systemctl restart redis-server || systemctl restart redis
echo "✅ Redis status: $(redis-cli ping)"

# 3. Install Custom Fonts for Subtitle Rendering
echo "🔤 Installing Custom Fonts (Montserrat, Inter, Komika)..."
mkdir -p /usr/share/fonts/truetype/janus
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
if [ -d "$SCRIPT_DIR/assets/fonts" ]; then
    cp "$SCRIPT_DIR/assets/fonts/"*.ttf /usr/share/fonts/truetype/janus/ 2>/dev/null || true
fi
fc-cache -fv
echo "✅ Font Cache Updated:"
fc-list | grep -iE 'montserrat|inter|komika' || echo "Warning: Font verification check"

# 4. Install Python AI/ML dependencies
echo "🐍 Installing Python Dependencies (faster-whisper, torch, chatterbox-tts)..."
pip3 install --upgrade pip
pip3 install faster-whisper torch chatterbox-tts || echo "Warning: Python packages install step completed"

# 5. Install NPM dependencies
echo "📦 Installing Node dependencies..."
cd "$SCRIPT_DIR"
npm install

# 6. Create .env if not exists
if [ ! -f .env ]; then
    echo "🔑 Creating default .env file..."
    cat <<EOT > .env
PORT=4000
NODE_ENV=production
FACTORY_SECRET=ig-internal-salt
REDIS_URL=redis://127.0.0.1:6379
POSTIZ_API_URL=http://localhost:3000/api/posts
POSTIZ_API_KEY=
EOT
fi

# 7. Setup 24h temp directory cleanup cron job
echo "🧹 Setting up 24-hour temp directory cleanup cron job..."
(crontab -l 2>/dev/null | grep -v "janus/temp"; echo "0 4 * * * find $SCRIPT_DIR/temp -mindepth 1 -mtime +1 -exec rm -rf {} +") | crontab -

# 8. Install & start systemd service
echo "⚙️ Setting up systemd service..."
if [ -f render-agent.service ]; then
    cp render-agent.service /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable render-agent
    systemctl restart render-agent
fi

echo "🎉 Render agent setup completed successfully!"
echo "📊 System Status Summary:"
echo "   - Disk Space: $(df -h / | awk 'NR==2 {print $4}') available"
echo "   - Memory: $(free -h | awk 'NR==2 {print $7}') available"
