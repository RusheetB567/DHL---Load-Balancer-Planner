@echo off
cd /d "%~dp0"
echo Starting IFOROS local preview...
node scripts\preview.cjs
if errorlevel 1 (
  echo Preview could not start. Read the error above.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:4300/"
