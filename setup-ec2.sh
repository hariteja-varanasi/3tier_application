#!/bin/bash
# ============================================================
#  EC2 Bootstrap Script — Run this ONCE on a fresh EC2 instance
#  Ubuntu 22.04 LTS (t2.micro or above)
#  Run as: bash setup-ec2.sh
# ============================================================
set -e

echo "========================================"
echo "  3-Tier App — EC2 Setup Script"
echo "========================================"

# 1. Update system
echo "📦 Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# 2. Install Docker
echo "🐳 Installing Docker..."
sudo apt-get install -y ca-certificates curl gnupg lsb-release

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# 3. Install docker-compose standalone (v2)
echo "🔧 Installing Docker Compose..."
COMPOSE_VERSION="2.24.0"
sudo curl -SL \
  "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Add current user to docker group (no sudo needed)
echo "👤 Adding user to docker group..."
sudo usermod -aG docker $USER

# 5. Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# 6. Create app directory
echo "📁 Creating app directory..."
mkdir -p /home/$USER/app/database

# 7. Open required ports (using ufw if available)
if command -v ufw &>/dev/null; then
  echo "🔓 Opening ports 22, 80, 5000..."
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 5000/tcp
  sudo ufw --force enable
fi

echo ""
echo "========================================"
echo "  ✅ EC2 Setup Complete!"
echo "========================================"
echo ""
echo "IMPORTANT: Log out and back in so docker group takes effect."
echo "  → Run: exit  then SSH back in"
echo ""
echo "Verify with: docker --version && docker-compose --version"
echo ""
echo "Next step: Add these GitHub Secrets in your repo settings:"
echo "  DOCKERHUB_USERNAME  — your DockerHub username"
echo "  DOCKERHUB_TOKEN     — DockerHub access token"
echo "  EC2_HOST            — your EC2 public IP or DNS"
echo "  EC2_USER            — ubuntu (default for Ubuntu AMIs)"
echo "  EC2_SSH_KEY         — paste your private key contents (.pem)"
echo ""
