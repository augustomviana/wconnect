@echo off
chcp 65001 >nul
echo ===================================
echo 🔍 Procurando PostgreSQL no Windows
echo ===================================

REM Locais comuns do PostgreSQL no Windows
set POSTGRES_PATHS[0]="C:\Program Files\PostgreSQL\17\bin"
set POSTGRES_PATHS[1]="C:\Program Files\PostgreSQL\15\bin"
set POSTGRES_PATHS[2]="C:\Program Files\PostgreSQL\14\bin"
set POSTGRES_PATHS[3]="C:\Program Files\PostgreSQL\13\bin"
set POSTGRES_PATHS[4]="C:\Program Files (x86)\PostgreSQL\15\bin"
set POSTGRES_PATHS[5]="C:\Program Files (x86)\PostgreSQL\14\bin"

echo 🔍 Procurando PostgreSQL...
echo.

for /L %%i in (0,1,5) do (
    call set "path_to_check=%%POSTGRES_PATHS[%%i]%%"
    call set path_to_check=%%path_to_check:"=%%
    if exist "!path_to_check!\psql.exe" (
        echo ✅ PostgreSQL encontrado em: !path_to_check!
        echo.
        echo 💡 Para adicionar ao PATH permanentemente:
        echo    1. Pressione Win + R
        echo    2. Digite: sysdm.cpl
        echo    3. Vá em "Avançado" ^> "Variáveis de Ambiente"
        echo    4. Edite a variável PATH
        echo    5. Adicione: !path_to_check!
        echo.
        echo 🚀 Para usar agora (temporário):
        echo    set PATH=!path_to_check!;%%PATH%%
        echo.
        pause
        exit /b 0
    )
)

echo ❌ PostgreSQL não encontrado nos locais padrão!
echo.
echo 💡 Soluções:
echo    1. Instalar PostgreSQL: https://www.postgresql.org/download/windows/
echo    2. Verificar se está instalado em outro local
echo    3. Usar PostgreSQL via Docker
echo.
echo 🐳 Alternativa com Docker:
echo    docker run --name postgres-whatsapp -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
echo.
pause
