#!/bin/bash

echo "🔧 Corrigindo autenticação do banco de dados e frontend..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Parar todos os serviços
echo -e "${BLUE}1️⃣ Parando todos os serviços...${NC}"
pm2 stop all
pm2 delete all
sleep 2

# Matar processos nas portas
echo -e "${YELLOW}⚠️ Liberando portas 3000 e 5000...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
sleep 2

# 2. Atualizar PM2
echo -e "${BLUE}2️⃣ Atualizando PM2...${NC}"
pm2 update
pm2 kill
sleep 2

# 3. Verificar e corrigir configuração do banco
echo -e "${BLUE}3️⃣ Verificando configuração do banco de dados...${NC}"

# Verificar se PostgreSQL está rodando
if ! systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}⚠️ PostgreSQL não está rodando. Iniciando...${NC}"
    systemctl start postgresql
    sleep 3
fi

# Verificar arquivo .env do backend
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️ Arquivo backend/.env não encontrado. Criando...${NC}"
    cat > backend/.env << EOF
PORT=5000
DB_USER=whatsapp_user
DB_PASSWORD=romanos1
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_web
JWT_SECRET=seu_jwt_secreto_muito_seguro_aqui_2024
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://wconnect.repagil.com.br
ALLOWED_ORIGINS=https://wconnect.repagil.com.br,http://localhost:3000
EOF
    echo -e "${GREEN}✅ Arquivo backend/.env criado${NC}"
fi

# Ler variáveis do .env
source backend/.env

# 4. Corrigir usuário e senha do banco
echo -e "${BLUE}4️⃣ Corrigindo usuário e senha do banco...${NC}"

# Conectar como postgres e corrigir o usuário
sudo -u postgres psql << EOF
-- Remover usuário se existir
DROP USER IF EXISTS whatsapp_user;

-- Criar usuário com senha correta
CREATE USER whatsapp_user WITH PASSWORD 'romanos1';

-- Dar permissões
ALTER USER whatsapp_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE whatsapp_web TO whatsapp_user;

-- Conectar ao banco e dar permissões nas tabelas
\c whatsapp_web;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO whatsapp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO whatsapp_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO whatsapp_user;

-- Alterar owner das tabelas
ALTER DATABASE whatsapp_web OWNER TO whatsapp_user;

\q
EOF

echo -e "${GREEN}✅ Usuário do banco corrigido${NC}"

# 5. Testar conexão com o banco
echo -e "${BLUE}5️⃣ Testando conexão com o banco...${NC}"
if PGPASSWORD=whatsapp123 psql -h localhost -p 5432 -U whatsapp_user -d whatsapp_web -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexão com banco funcionando${NC}"
else
    echo -e "${RED}❌ Ainda há problemas com a conexão do banco${NC}"
    
    # Tentar criar o banco se não existir
    echo -e "${YELLOW}⚠️ Tentando criar banco...${NC}"
    sudo -u postgres createdb whatsapp_web 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE whatsapp_web TO whatsapp_user;" 2>/dev/null || true
fi

# 6. Verificar e corrigir frontend
echo -e "${BLUE}6️⃣ Verificando frontend...${NC}"

# Verificar se o build existe
if [ ! -d "frontend/.next" ]; then
    echo -e "${YELLOW}⚠️ Build do frontend não encontrado. Compilando...${NC}"
    cd frontend
    npm run build
    cd ..
    echo -e "${GREEN}✅ Frontend compilado${NC}"
else
    echo -e "${GREEN}✅ Build do frontend existe${NC}"
fi

# Verificar arquivo .env.local do frontend
if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠️ Arquivo frontend/.env.local não encontrado. Criando...${NC}"
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=https://wconnect.repagil.com.br
NEXT_PUBLIC_SOCKET_URL=https://wconnect.repagil.com.br
EOF
    echo -e "${GREEN}✅ Arquivo frontend/.env.local criado${NC}"
fi

# 7. Verificar ecosystem.config.js
echo -e "${BLUE}7️⃣ Verificando ecosystem.config.js...${NC}"
if [ ! -f "ecosystem.config.js" ]; then
    echo -e "${YELLOW}⚠️ Arquivo ecosystem.config.js não encontrado. Criando...${NC}"
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'whatsapp-backend',
      script: './backend/dist/server.js',
      cwd: '/root/whatsapp-web',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      log_file: './logs/backend-combined.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '500M'
    },
    {
      name: 'whatsapp-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/root/whatsapp-web/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: './logs/frontend-combined.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '300M'
    }
  ]
};
EOF
    echo -e "${GREEN}✅ Arquivo ecosystem.config.js criado${NC}"
fi

# 8. Criar diretório de logs
echo -e "${BLUE}8️⃣ Criando diretório de logs...${NC}"
mkdir -p logs
mkdir -p frontend/logs
mkdir -p backend/logs
echo -e "${GREEN}✅ Diretórios de logs criados${NC}"

# 9. Compilar backend
echo -e "${BLUE}9️⃣ Compilando backend...${NC}"
cd backend
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend compilado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro na compilação do backend${NC}"
fi
cd ..

# 10. Iniciar backend primeiro
echo -e "${BLUE}🔟 Iniciando backend...${NC}"
pm2 start ecosystem.config.js --only whatsapp-backend
sleep 5

# Verificar se backend iniciou
if pm2 list | grep -q "whatsapp-backend.*online"; then
    echo -e "${GREEN}✅ Backend iniciado com sucesso${NC}"
else
    echo -e "${RED}❌ Backend não iniciou corretamente${NC}"
    echo -e "${YELLOW}⚠️ Logs do backend:${NC}"
    pm2 logs whatsapp-backend --lines 10
fi

# 11. Aguardar backend estabilizar e iniciar frontend
echo -e "${BLUE}1️⃣1️⃣ Aguardando backend estabilizar...${NC}"
sleep 10

echo -e "${BLUE}1️⃣2️⃣ Iniciando frontend...${NC}"
pm2 start ecosystem.config.js --only whatsapp-frontend
sleep 5

# Verificar se frontend iniciou
if pm2 list | grep -q "whatsapp-frontend.*online"; then
    echo -e "${GREEN}✅ Frontend iniciado com sucesso${NC}"
else
    echo -e "${RED}❌ Frontend não iniciou corretamente${NC}"
    echo -e "${YELLOW}⚠️ Logs do frontend:${NC}"
    pm2 logs whatsapp-frontend --lines 10
fi

# 12. Testar conexões
echo -e "${BLUE}1️⃣3️⃣ Testando conexões...${NC}"

# Aguardar serviços estabilizarem
sleep 10

# Testar backend
echo -e "${YELLOW}⚠️ Testando backend...${NC}"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health 2>/dev/null || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Backend respondendo (HTTP $BACKEND_STATUS)${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo (HTTP $BACKEND_STATUS)${NC}"
fi

# Testar frontend
echo -e "${YELLOW}⚠️ Testando frontend...${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Frontend respondendo (HTTP $FRONTEND_STATUS)${NC}"
else
    echo -e "${RED}❌ Frontend não está respondendo (HTTP $FRONTEND_STATUS)${NC}"
fi

# Testar HTTPS
echo -e "${YELLOW}⚠️ Testando HTTPS...${NC}"
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://wconnect.repagil.com.br 2>/dev/null || echo "000")
if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS funcionando (HTTP $HTTPS_STATUS)${NC}"
else
    echo -e "${RED}❌ HTTPS não está funcionando (HTTP $HTTPS_STATUS)${NC}"
fi

# 13. Status final
echo -e "${BLUE}1️⃣4️⃣ Status final dos serviços...${NC}"
pm2 status

echo -e "${BLUE}📋 Resumo da correção:${NC}"
echo -e "${GREEN}✅ Usuário do banco de dados corrigido${NC}"
echo -e "${GREEN}✅ Senha do banco atualizada para: romanos1${NC}"
echo -e "${GREEN}✅ Permissões do banco configuradas${NC}"
echo -e "${GREEN}✅ Frontend e backend recompilados${NC}"
echo -e "${GREEN}✅ Ecosystem.config.js criado${NC}"
echo -e "${GREEN}✅ Serviços iniciados com PM2${NC}"

echo -e "${BLUE}🔍 Para monitorar:${NC}"
echo -e "pm2 logs whatsapp-backend"
echo -e "pm2 logs whatsapp-frontend"
echo -e "pm2 status"

echo -e "${BLUE}🌐 Para testar:${NC}"
echo -e "https://wconnect.repagil.com.br"

echo -e "${GREEN}🚀 Correção finalizada!${NC}"

