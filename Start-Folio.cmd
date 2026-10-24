@echo off
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  node server.cjs
  pause
  exit /b
)
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
  "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.cjs
  pause
  exit /b
)
echo Install Node.js, then run this launcher again.
pause
