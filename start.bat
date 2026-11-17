@echo off
REM Double-click this to preview the loading screen in your browser.
REM (Browsers block 3D model loading when you open index.html directly.)
cd /d "%~dp0"
start "" http://localhost:8000
python -m http.server 8000
