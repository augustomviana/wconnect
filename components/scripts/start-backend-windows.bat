@echo off
chcp 65001 >nul
echo ===================================
echo 🚀 Iniciando Backend (Windows)
echo ===================================

REM Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ❌ Execute este script do diretório backend!
    echo    cd backend
    echo    scripts\start-backend-windows.bat
    pause
    exit /b 1
)

REM Verificar se o .env existe
if not exist ".env" (
    echo ❌ Arquivo .env não encontrado!
    echo Execute primeiro: scripts\setup-postgres-windows.bat
    pause
    exit /b 1
)

echo 📦 Verificando dependências...
if not exist "node_modules" (
    echo 📥 Instalando dependências...
    npm install
)

echo 🗄️ Testando banco de dados...
node test-db.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro na conexão com o banco!
    echo Execute: scripts\setup-postgres-windows.bat
    pause
    exit /b 1
)

echo 🚀 Iniciando servidor...
npm run dev
