@echo off
cd /d "%~dp0"
echo Starting IFOROS synthetic local development workspace...
echo Open http://127.0.0.1:4300 and select a demo role.
node scripts\dev.cjs
pause
