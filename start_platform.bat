@echo off
title Smart Farming Guide - Server Launcher
echo ========================================================
echo        Starting Smart Farming Guide Platform...
echo ========================================================
echo.

echo Cleaning up previous instances on ports 5000 and 5001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000\>"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5001\>"') do taskkill /F /PID %%a >nul 2>&1

echo [1/2] Starting Flask ML Server on Port 5001...
start "Flask ML Server (Port 5001)" cmd /k "cd /d "%~dp0plant_disease_app" && "C:\Users\SWIFT\AppData\Local\Programs\Python\Python311\python.exe" app.py"

timeout /t 3 /nobreak > nul

echo [2/2] Starting Node.js Platform on Port 5000...
start "Node.js Backend (Port 5000)" cmd /k "cd /d "%~dp0smartfarm_backend" && npm start"

timeout /t 2 /nobreak > nul

echo.
echo ========================================================
echo Platform started successfully!
echo Opening Dashboard at http://localhost:5000 ...
echo ========================================================
start http://localhost:5000

exit
