#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$DIR/app.pid" ]; then
  PID=$(cat "$DIR/app.pid")
  [ -n "$PID" ] && kill -9 "$PID" 2>/dev/null || true
  rm -f "$DIR/app.pid"
fi

if [ -f "$DIR/backend.pid" ]; then
  PID=$(cat "$DIR/backend.pid")
  [ -n "$PID" ] && kill -9 "$PID" 2>/dev/null || true
  rm -f "$DIR/backend.pid"
fi

if [ -f "$DIR/frontend.pid" ]; then
  PID=$(cat "$DIR/frontend.pid")
  [ -n "$PID" ] && kill -9 "$PID" 2>/dev/null || true
  rm -f "$DIR/frontend.pid"
fi

# Fast kill any node process running pk-brain server.js
pkill -9 -f "node.*server.js" 2>/dev/null || true

echo "✨ PK Brain services stopped."

