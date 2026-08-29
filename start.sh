#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Fast stop previous
"$DIR/stop.sh" >/dev/null 2>&1 || true
sleep 0.5

echo "🧠 Starting PK Brain server..."

# Start backend server
cd "$DIR/backend"
nohup node --max-old-space-size=128 server.js < /dev/null > "$DIR/app.log" 2>&1 &
APP_PID=$!
echo "$APP_PID" > "$DIR/app.pid"

sleep 0.5

echo "✅ PK Brain started (PID: $APP_PID) on http://0.0.0.0:5174"
echo "🎉 Access URL: http://homelab.tail7d4c51.ts.net:5174 (or http://localhost:5174)"

