#!/bin/bash
# Exit immediately if any command fails
set -e

echo "=== Hostinger KVM 2 VPS Setup: AI Marketing Machine ==="

# 1. Update system packages
echo "Updating apt repositories..."
sudo apt-get update -y

# 2. Install FFmpeg, Python, pip, curl, and build tools
echo "Installing FFmpeg, Python3, and build utilities..."
sudo apt-get install -y ffmpeg python3 python3-pip python3-venv curl build-essential

# 3. Install Node.js (v20 LTS)
if ! command -v node &> /dev/null; then
  echo "Installing Node.js (v20)..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "Node.js is already installed: $(node -v)"
fi

# 4. Check/Install Docker (for Postiz)
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
else
  echo "Docker is already installed: $(docker --version)"
fi

# 5. Check/Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
  echo "Installing Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
else
  echo "Docker Compose is already installed: $(docker-compose --version)"
fi

# 6. Create directories for our render box
echo "Setting up project folders..."
mkdir -p ~/marketing-machine/gpu-render-box
mkdir -p ~/marketing-machine/postiz-config

# 7. Create Docker Compose file for Postiz
cat << 'EOF' > ~/marketing-machine/postiz-config/docker-compose.yml
version: '3.8'

services:
  postiz:
    image: gitroomhq/postiz-app:latest
    ports:
      - "3000:3000"
    environment:
      - MAIN_URL=http://localhost:3000
      - DATABASE_URL=postgresql://postiz:postiz@postgres:5432/postiz?schema=public
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=change-this-to-a-very-secret-key-12345
    depends_on:
      - postgres
      - redis
    restart: always

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postiz
      - POSTGRES_PASSWORD=postiz
      - POSTGRES_DB=postiz
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:alpine
    restart: always

volumes:
  pgdata:
EOF

echo "========================================================="
echo "Setup script completed successfully!"
echo "Next Steps:"
echo "1. Transfer your render box directory from local to ~/marketing-machine/"
echo "2. Spin up Postiz by running:"
echo "   cd ~/marketing-machine/postiz-config && docker-compose up -d"
echo "3. Access Postiz on http://<YOUR_VPS_IP>:3000"
echo "========================================================="
