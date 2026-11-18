#!/bin/sh
cd "$(dirname "$0")"
echo "Starting NextStep on http://localhost:8000"
python3 -m app.server
