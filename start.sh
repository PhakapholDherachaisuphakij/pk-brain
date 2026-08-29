#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$HOME/.local/bin:$PATH"

"$DIR/stop.sh" >/dev/null 2>&1 || true
sleep 1

echo "🧠 Starting PK Brain in Ultra-Low-Resource Production Mode..."

# Ensure frontend is built
if [ ! -d "$DIR/frontend/dist" ]; then
  echo "📦 Building frontend static assets..."
  cd "$DIR/frontend" && npm run build >/dev/null 2>&1
fi

# Start unified lightweight server on Port 5174 (RAM ~35MB, 0% CPU idle)
cd "$DIR/backend"
nohup node --max-old-space-size=128 server.js > "$DIR/app.log" 2>&1 &
APP_PID=$!
echo "$APP_PID" > "$DIR/app.pid"

sleep 1

echo "✅ PK Brain started (PID: $APP_PID) on http://0.0.0.0:5174"
echo "⚡ Mode: Unified Fast Production (Memory limit: 128MB, 0% idle CPU)"
echo "🎉 Access URL: http://homelab.tail7d4c51.ts.net:5174 (or http://localhost:5174)"
