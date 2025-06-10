@echo off
chcp 65001 >nul
echo ===================================
echo 🧪 Testando PostgreSQL no Windows
echo ===================================

REM Verificar se o arquivo .env existe
if not exist ".env" (
    echo ❌ Arquivo .env não encontrado!
    echo Execute primeiro: scripts\setup-postgres-windows.bat
    pause
    exit /b 1
)

echo 📋 Carregando configurações do .env...
for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
    if "%%a"=="DB_HOST" set DB_HOST=%%b
    if "%%a"=="DB_PORT" set DB_PORT=%%b
    if "%%a"=="DB_NAME" set DB_NAME=%%b
)

echo    Host: %DB_HOST%
echo    Porta: %DB_PORT%
echo    Banco: %DB_NAME%
echo    Usuário: %DB_USER%
echo.

echo 🔌 Testando conexão...
psql -U %DB_USER% -d %DB_NAME% -h %DB_HOST% -p %DB_PORT% -c "SELECT 'Conexão bem-sucedida!' as status, NOW() as tempo;"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERRO: Falha na conexão!
    echo.
    echo 🔧 Verificações:
    echo    1. PostgreSQL está rodando?
    echo       - Serviços do Windows ^> PostgreSQL
    echo    2. Credenciais corretas?
    echo       - Usuário: %DB_USER%
    echo       - Senha: %DB_PASSWORD%
    echo    3. Banco existe?
    echo       - Banco: %DB_NAME%
    echo.
    echo 💡 Para reconfigurar:
    echo    scripts\setup-postgres-windows.bat
    echo.
) else (
    echo.
    echo ✅ Conexão bem-sucedida!
    echo.
    echo 🚀 Agora você pode iniciar o backend:
    echo    npm run dev
    echo.
)

pause
