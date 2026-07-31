@echo off
title Vacaciones BIA - Servidor
set "NODE_DIR=C:\Users\dulces\AppData\Local\node-portable\node-v24.18.0-win-x64"
set "PROJECT_DIR=C:\Users\dulces\OneDrive - Embotelladora la Mariposa,S.A\Documents\CLAUDE\Projects\vacaciones-app"
cd /d "%PROJECT_DIR%"

echo ============================================
echo   Iniciando la app de Vacaciones y Permisos
echo   NO CIERRES esta ventana mientras la uses.
echo ============================================
echo.

if not exist "%NODE_DIR%\node.exe" (
  echo ERROR: no se encontro node.exe en:
  echo %NODE_DIR%
  pause
  exit /b 1
)

start "" cmd /c "timeout /t 8 >nul && start http://localhost:3000"

call "%NODE_DIR%\npm.cmd" run dev

echo.
echo ============================================
echo   El servidor se detuvo. Si esto fue un error,
echo   toma una foto de esta ventana y compartela.
echo ============================================
pause
