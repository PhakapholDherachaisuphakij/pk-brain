#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$DIR/app.pid" ]; then
  PID=$(cat "$DIR/app.pid")
  kill -9 "$PID" 2>/dev/null || true
  rm -f "$DIR/app.pid"
fi

if [ -f "$DIR/backend.pid" ]; then
  PID=$(cat "$DIR/backend.pid")
  kill -9 "$PID" 2>/dev/null || true
  rm -f "$DIR/backend.pid"
fi

if [ -f "$DIR/frontend.pid" ]; then
  PID=$(cat "$DIR/frontend.pid")
  kill -9 "$PID" 2>/dev/null || true
  rm -f "$DIR/frontend.pid"
fi

# Cleanup any stray node on port 5174 or 3001
fuser -k 5174/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true

echo "✨ PK Brain services stopped."
