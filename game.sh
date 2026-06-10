#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

osascript <<EOF
 tell application "Terminal"
   do script "cd '$SCRIPT_DIR/server' && source venv/bin/activate && python -m uvicorn main:app --reload"
   do script "cd '$SCRIPT_DIR/web' && python -m http.server 5500"
 end tell
EOF

sleep 3

open http://localhost:5500
