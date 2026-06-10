@echo off
setlocal

cd /d "%~dp0"

set "SERVER_DIR=%~dp0server"
set "WEB_DIR=%~dp0web"

if exist "%SERVER_DIR%\venv\Scripts\python.exe" (
  set "PYTHON_SERVER=%SERVER_DIR%\venv\Scripts\python.exe"
) else (
  set "PYTHON_SERVER=python"
)

if exist "%WEB_DIR%\venv\Scripts\python.exe" (
  set "PYTHON_WEB=%WEB_DIR%\venv\Scripts\python.exe"
) else (
  set "PYTHON_WEB=python"
)

start "Vertical-Banana API" cmd /k "cd /d ^"%SERVER_DIR%^" && ^"%PYTHON_SERVER%^" -m uvicorn main:app --reload"
start "Vertical-Banana Web" cmd /k "cd /d ^"%WEB_DIR%^" && ^"%PYTHON_WEB%^" -m http.server 5500"

start "" http://localhost:5500

echo Starting Vertical-Banana...
ping -n 5 127.0.0.1 > nul

echo Done.
endlocal
