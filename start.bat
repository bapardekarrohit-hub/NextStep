@echo off
cd /d "%~dp0"
echo Starting NextStep on http://localhost:8000 (close this window to stop)
start "" http://localhost:8000
python -m app.server || py -m app.server
pause
