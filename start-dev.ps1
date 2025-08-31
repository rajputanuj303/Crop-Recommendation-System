# Crop Recommendation System - Development Startup Script
# This script helps you start all services for development

Write-Host "🌾 Starting Crop Recommendation System..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python first." -ForegroundColor Red
    exit 1
}

# Check if MongoDB is running
try {
    $mongoStatus = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    if ($mongoStatus -and $mongoStatus.Status -eq "Running") {
        Write-Host "✅ MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB service not found or not running" -ForegroundColor Yellow
        Write-Host "   You may need to start MongoDB manually" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not check MongoDB status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Starting services..." -ForegroundColor Cyan

# Start Backend Server
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm install; npm run dev" -WindowStyle Normal

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start ML Service
Write-Host "Starting ML Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml-service; python -m venv venv; .\venv\Scripts\Activate.ps1; pip install -r requirements.txt; python app.py" -WindowStyle Normal

# Wait a bit for ML service to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm install; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "🎉 All services are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Frontend will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 Backend API will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🤖 ML Service will be available at: http://localhost:5001" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Tip: Check each terminal window for any error messages" -ForegroundColor Yellow
Write-Host "💡 Tip: Make sure MongoDB is running before testing the system" -ForegroundColor Yellow

# Keep the script running
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
