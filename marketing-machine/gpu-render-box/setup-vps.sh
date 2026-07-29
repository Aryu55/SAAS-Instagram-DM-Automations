#!/bin/bash
set -e

echo "🚀 Setting up Janus GPU Render Server on VPS..."

# 1. Update and install system dependencies
echo "📦 Installing System Packages (FFmpeg, Node.js 20, Git)..."
apt-get update -y
apt-get install -y curl git ffmpeg build-essential

# Install Node.js 20 if not installed
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ FFmpeg version: $(ffmpeg -version | head -n 1)"

# 2. Install NPM dependencies
echo "📦 Installing Node dependencies..."
cd /root/marketing-machine/gpu-render-box
npm install

# 3. Create .env if not exists
if [ ! -f .env ]; then
    echo "🔑 Creating default .env file..."
    cat <<EOT > .env
PORT=4000
NODE_ENV=production
FACTORY_SECRET=ig-internal-salt
POSTIZ_API_URL=http://localhost:3000/api/posts
POSTIZ_API_KEY=
EOT
fi

# 4. Install & start systemd service
echo "⚙️ Setting up systemd service..."
cp render-agent.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable render-agent
systemctl restart render-agent

echo "🎉 Render agent started successfully!"
echo "📊 Checking service status:"
systemctl status render-agent --no-pager
