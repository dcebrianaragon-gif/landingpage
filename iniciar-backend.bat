@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"

echo Iniciando backend MotoGP...
echo Backend API: http://localhost:5501
echo Frontend recomendado: http://localhost:5502
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod -Uri 'http://localhost:5501/api/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if "%ERRORLEVEL%"=="0" (
    echo El backend ya esta funcionando.
    start "" "http://localhost:5502/registro.html"
    pause
    exit /b 0
)

start "MotoGP Backend" /min "%NODE_EXE%" ".vscode\server.js"

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 1; try { Invoke-RestMethod -Uri 'http://localhost:5501/api/health' -TimeoutSec 4 | Out-Null; exit 0 } catch { exit 1 }"
if "%ERRORLEVEL%"=="0" (
    echo Backend iniciado correctamente.
    start "" "http://localhost:5502/registro.html"
    pause
    exit /b 0
)

echo No se pudo comprobar el backend.
echo Prueba manualmente: "%NODE_EXE%" ".vscode\server.js"
pause
