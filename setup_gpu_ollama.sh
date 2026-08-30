#!/usr/bin/env bash
set -e

echo "=========================================="
echo "🚀 Installing NVIDIA Driver & Ollama"
echo "=========================================="

echo "[1/4] Updating package lists..."
sudo apt-get update -y

echo "[2/4] Installing NVIDIA Driver 580 (Recommended for GTX 1650 Mobile)..."
sudo apt-get install -y nvidia-driver-580 nvidia-utils-580

echo "[3/4] Installing Ollama Local AI Runtime..."
curl -fsSL https://ollama.com/install.sh | sh

echo "[4/4] Setup complete!"
echo "=========================================="
echo "🎉 Installation finished!"
echo "⚠️ Please run: sudo reboot"
echo "to load the NVIDIA GPU kernel modules!"
echo "=========================================="
