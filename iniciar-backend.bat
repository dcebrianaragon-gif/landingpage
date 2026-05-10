@echo off
setlocal
cd /d "%~dp0"

set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"

set "BACKEND_URL=http://localhost:5501"
set "FRONTEND_URL=http://localhost:5502"
set "BACKEND_READY=0"
set "FRONTEND_READY=0"

echo Iniciando entorno local MotoGP...
echo Backend API: %BACKEND_URL%
echo Frontend local: %FRONTEND_URL%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod -Uri '%BACKEND_URL%/api/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if "%ERRORLEVEL%"=="0" (
    set "BACKEND_READY=1"
    echo El backend ya esta funcionando.
) else (
    echo Arrancando backend en segundo plano...
    start "MotoGP Backend" /min "%NODE_EXE%" ".vscode\server.js"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-RestMethod -Uri '%FRONTEND_URL%/__frontend_health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if "%ERRORLEVEL%"=="0" (
    set "FRONTEND_READY=1"
    echo El frontend local ya esta funcionando.
) else (
    echo Arrancando frontend local en segundo plano...
    start "MotoGP Frontend" /min "%NODE_EXE%" ".vscode\frontend-server.js"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; try { Invoke-RestMethod -Uri '%BACKEND_URL%/api/health' -TimeoutSec 4 | Out-Null; exit 0 } catch { exit 1 }"
if "%ERRORLEVEL%"=="0" (
    set "BACKEND_READY=1"
    echo Backend listo.
) else (
    echo No se pudo comprobar el backend.
    echo Prueba manualmente: "%NODE_EXE%" ".vscode\server.js"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 1; try { Invoke-RestMethod -Uri '%FRONTEND_URL%/__frontend_health' -TimeoutSec 4 | Out-Null; exit 0 } catch { exit 1 }"
if "%ERRORLEVEL%"=="0" (
    set "FRONTEND_READY=1"
    echo Frontend local listo.
) else (
    echo No se pudo comprobar el frontend local.
    echo Prueba manualmente: "%NODE_EXE%" ".vscode\frontend-server.js"
)

echo.
if "%BACKEND_READY%"=="1" if "%FRONTEND_READY%"=="1" (
    echo Entorno levantado correctamente.
    start "" "%FRONTEND_URL%/entrada1.html"
    pause
    exit /b 0
)

if "%FRONTEND_READY%"=="1" (
    echo Solo el frontend esta disponible.
    start "" "%FRONTEND_URL%/entrada1.html"
) else (
    echo No he podido abrir automaticamente el frontend local.
)

pause
