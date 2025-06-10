@echo off
chcp 65001 >nul
echo ===================================
echo 🐘 Configurando PostgreSQL no Windows
echo ===================================

REM Definir variáveis
set DB_USER=whatsapp_user
set DB_PASSWORD=whatsapp_password
set DB_NAME=whatsapp_web

echo 📋 Configurações:
echo    Usuário: %DB_USER%
echo    Senha: %DB_PASSWORD%
echo    Banco: %DB_NAME%
echo.

REM Verificar se o PostgreSQL está instalado
echo 🔍 Verificando PostgreSQL...
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PostgreSQL não encontrado no PATH!
    echo.
    echo 💡 Soluções:
    echo    1. Instale o PostgreSQL: https://www.postgresql.org/download/windows/
    echo    2. Ou adicione ao PATH: C:\Program Files\PostgreSQL\15\bin
    echo    3. Ou execute: scripts\find-postgres-windows.bat
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL encontrado!
echo.

REM Verificar se o serviço está rodando
echo 🔄 Verificando serviço PostgreSQL...
sc query postgresql-x64-15 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ Serviço PostgreSQL não encontrado, tentando iniciar...
    net start postgresql-x64-15 >nul 2>&1
)

echo 🔐 Digite a senha do usuário 'postgres' quando solicitado
echo.

REM Criar usuário
echo 👤 Criando usuário %DB_USER%...
psql -U postgres -c "DROP USER IF EXISTS %DB_USER%;" 2>nul
psql -U postgres -c "CREATE USER %DB_USER% WITH PASSWORD '%DB_PASSWORD%' CREATEDB;"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao criar usuário!
    pause
    exit /b 1
)

REM Criar banco de dados
echo 🗄️ Criando banco de dados %DB_NAME%...
psql -U postgres -c "DROP DATABASE IF EXISTS %DB_NAME%;" 2>nul
psql -U postgres -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Erro ao criar banco de dados!
    pause
    exit /b 1
)

REM Conceder privilégios
echo 🔑 Concedendo privilégios...
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;"
psql -U postgres -d %DB_NAME% -c "GRANT ALL ON SCHEMA public TO %DB_USER%;"

echo.
echo ✅ PostgreSQL configurado com sucesso!
echo.

REM Criar arquivo .env
echo 📝 Criando arquivo .env...
(
echo # Database Configuration
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=%DB_NAME%
echo.
echo # Server Configuration
echo PORT=5000
echo NODE_ENV=development
echo FRONTEND_URL=http://localhost:3000
echo.
echo # JWT Configuration
echo JWT_SECRET=whatsapp_romanos_2024_jwt_secret_super_seguro_chave_unica_12345678
echo JWT_EXPIRES_IN=7d
echo.
echo # WhatsApp Configuration
echo WHATSAPP_SESSION_PATH=./sessions
echo.
echo # Upload Configuration
echo UPLOAD_PATH=./uploads
echo MAX_FILE_SIZE=10485760
) > .env

echo ✅ Arquivo .env criado!
echo.
echo 🧪 Testando conexão...
node test-db.js

echo.
echo ===================================
echo 🎉 Configuração concluída!
echo ===================================
echo.
echo 📋 Próximos passos:
echo    1. npm run dev (para iniciar o backend)
echo    2. Verificar logs de conexão
echo.
pause
