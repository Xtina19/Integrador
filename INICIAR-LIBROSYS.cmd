@echo off
title LibroSys - Backend + Frontend
cd /d "%~dp0"
echo.
echo  ========================================
echo   LibroSys - Iniciando backend + frontend
echo  ========================================
echo.
echo  Backend:  http://localhost:3001
echo  App web:  http://localhost:5173
echo.
echo  NO cierre esta ventana mientras use el sistema.
echo.
npm run dev
pause
