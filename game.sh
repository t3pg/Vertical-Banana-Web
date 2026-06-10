#!/bin/bash

cd "$(dirname "$0")"

osascript -e '
tell application "Terminal"

do script "cd /Users/koshimizuiori/Documents/GitHub/gp1-submit-keshizumi1115/server && source venv/bin/activate && python -m uvicorn main:app --reload"

do script "cd /Users/koshimizuiori/Documents/GitHub/gp1-submit-keshizumi1115/web && python -m http.server 5500"

end tell
'

sleep 3

open http://localhost:5500
