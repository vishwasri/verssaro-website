#!/bin/bash
cd "$(dirname "$0")/htdocs"
echo "VERSSARO local preview: http://localhost:8000  (Ctrl+C to stop)"
(sleep 1; open http://localhost:8000) &
python3 -m http.server 8000
