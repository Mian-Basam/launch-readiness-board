#!/usr/bin/env bash
# Start the Launch Readiness Board.
#
#   ./start.sh            dev server with hot reload (default)
#   ./start.sh prod       production build, then serve it
#   ./start.sh check      lint + tests + build
#
# Set PORT to change the port (default 5173), e.g. PORT=3000 ./start.sh
set -euo pipefail

cd "$(dirname "$0")"

MODE="${1:-dev}"
PORT="${PORT:-5173}"

case "$MODE" in
  dev|prod|check) ;;
  *) echo "Unknown mode: $MODE (use dev, prod or check)" >&2; exit 1 ;;
esac

# --- Node check -------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install Node 20+ from https://nodejs.org and try again." >&2
  exit 1
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node 20+ is required (found $(node -v))." >&2
  exit 1
fi

# --- Dependencies -----------------------------------------------------------
# Install when node_modules is missing or package files changed since the last install.
if [ ! -d node_modules ] || [ package.json -nt node_modules ] || { [ -f package-lock.json ] && [ package-lock.json -nt node_modules ]; }; then
  echo "Installing dependencies…"
  if [ -f package-lock.json ]; then npm ci; else npm install; fi
  touch node_modules
fi

# --- Port check -------------------------------------------------------------
port_in_use() { lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

if [ "$MODE" != "check" ] && port_in_use "$PORT"; then
  echo "Port $PORT is already in use — the board may already be running at http://localhost:$PORT/board" >&2
  echo "Stop that process or pick another port: PORT=5174 ./start.sh" >&2
  exit 1
fi

# --- Run --------------------------------------------------------------------
case "$MODE" in
  dev)
    echo "Starting dev server → http://localhost:$PORT/board"
    exec npm run dev -- --port "$PORT" --strictPort
    ;;
  prod)
    npm run build
    echo "Serving production build → http://localhost:$PORT/board"
    exec npm run preview -- --port "$PORT" --strictPort
    ;;
  check)
    npm run lint
    npm test
    npm run build
    echo "All checks passed."
    ;;
  *)
    echo "Unknown mode: $MODE (use dev, prod or check)" >&2
    exit 1
    ;;
esac
