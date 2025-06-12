#!/bin/bash

echo "🔧 Corrigindo PM2 e reiniciando serviços..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Atualizar PM2
echo -e "${BLUE}1️⃣ Atualizando PM2...${NC}"
pm2 update

# 2. Parar e deletar todos os processos PM2
echo -e "${BLUE}2️⃣ Limpando processos PM2...${NC}"
pm2 stop all
pm2 delete all

# 3. Verificar e matar processos nas portas
echo -e "${BLUE}3️⃣ Verificando processos nas portas...${NC}"
for PORT in 3000 5000; do
  PORT_PIDS=$(lsof -i:$PORT -t 2>/dev/null)
  if [ ! -z "$PORT_PIDS" ]; then
    echo -e "${YELLOW}⚠️ Processos encontrados na porta $PORT. Matando...${NC}"
    for PID in $PORT_PIDS; do
      echo -e "   Matando processo $PID na porta $PORT"
      kill -9 $PID 2>/dev/null
    done
    echo -e "${GREEN}✅ Processos na porta $PORT terminados${NC}"
  else
    echo -e "${GREEN}✅ Nenhum processo encontrado na porta $PORT${NC}"
  fi
done

# 4. Aguardar liberação das portas
echo -e "${BLUE}4️⃣ Aguardando liberação das portas...${NC}"
sleep 3

# 5. Verificar se ecosystem.config.js existe, se não, criar
echo -e "${BLUE}5️⃣ Verificando arquivo ecosystem.config.js...${NC}"
cd /root/whatsapp-web

if [ ! -f "ecosystem.config.js" ]; then
  echo -e "${YELLOW}⚠️ Arquivo ecosystem.config.js não encontrado. Criando...${NC}"
  cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "whatsapp-backend",
      script: "./backend/dist/server.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_file: "./logs/backend-combined.log",
    },
    {
      name: "whatsapp-frontend",
      script: "npm",
      args: "start",
      cwd: "./frontend",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_file: "./logs/frontend-combined.log",
    },
  ],
}
EOF
  echo -e "${GREEN}✅ Arquivo ecosystem.config.js criado${NC}"
else
  echo -e "${GREEN}✅ Arquivo ecosystem.config.js já existe${NC}"
fi

# 6. Criar diretório de logs se não existir
echo -e "${BLUE}6️⃣ Criando diretório de logs...${NC}"
mkdir -p logs
echo -e "${GREEN}✅ Diretório de logs criado${NC}"

# 7. Verificar se os builds existem
echo -e "${BLUE}7️⃣ Verificando builds...${NC}"

# Verificar backend build
if [ ! -f "backend/dist/server.js" ]; then
  echo -e "${YELLOW}⚠️ Build do backend não encontrado. Compilando...${NC}"
  cd backend
  npm run build
  cd ..
  echo -e "${GREEN}✅ Backend compilado${NC}"
else
  echo -e "${GREEN}✅ Build do backend existe${NC}"
fi

# Verificar frontend build
if [ ! -d "frontend/.next" ]; then
  echo -e "${YELLOW}⚠️ Build do frontend não encontrado. Compilando...${NC}"
  cd frontend
  npm run build
  cd ..
  echo -e "${GREEN}✅ Frontend compilado${NC}"
else
  echo -e "${GREEN}✅ Build do frontend existe${NC}"
fi

# 8. Iniciar backend primeiro
echo -e "${BLUE}8️⃣ Iniciando backend...${NC}"
pm2 start ecosystem.config.js --only whatsapp-backend

# Aguardar backend inicializar
echo -e "${YELLOW}⚠️ Aguardando backend inicializar...${NC}"
sleep 10

# Verificar se backend está rodando
BACKEND_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="whatsapp-backend") | .pm2_env.status')
if [ "$BACKEND_STATUS" == "online" ]; then
  echo -e "${GREEN}✅ Backend iniciado com sucesso${NC}"
else
  echo -e "${RED}❌ Erro ao iniciar backend. Status: $BACKEND_STATUS${NC}"
  echo -e "${YELLOW}⚠️ Logs do backend:${NC}"
  pm2 logs whatsapp-backend --lines 20
fi

# 9. Iniciar frontend
echo -e "${BLUE}9️⃣ Iniciando frontend...${NC}"
pm2 start ecosystem.config.js --only whatsapp-frontend

# Aguardar frontend inicializar
echo -e "${YELLOW}⚠️ Aguardando frontend inicializar...${NC}"
sleep 15

# 10. Verificar status final
echo -e "${BLUE}🔟 Verificando status final...${NC}"
pm2 status

# 11. Testar conexões
echo -e "${BLUE}1️⃣1️⃣ Testando conexões...${NC}"

# Testar backend
echo -e "${YELLOW}⚠️ Testando backend...${NC}"
for i in {1..5}; do
  BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
  if [ "$BACKEND_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✅ Backend está respondendo (HTTP 200)${NC}"
    break
  else
    echo -e "${YELLOW}⚠️ Tentativa $i/5: Backend não respondeu (HTTP $BACKEND_RESPONSE)${NC}"
    sleep 2
  fi
done

# Testar frontend
echo -e "${YELLOW}⚠️ Testando frontend...${NC}"
for i in {1..5}; do
  FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
  if [ "$FRONTEND_RESPONSE" == "200" ]; then
    echo -e "${GREEN}✅ Frontend está respondendo (HTTP 200)${NC}"
    break
  else
    echo -e "${YELLOW}⚠️ Tentativa $i/5: Frontend não respondeu (HTTP $FRONTEND_RESPONSE)${NC}"
    sleep 3
  fi
done

# 12. Testar HTTPS
echo -e "${BLUE}1️⃣2️⃣ Testando HTTPS...${NC}"
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://wconnect.repagil.com.br)
if [ "$HTTPS_RESPONSE" == "200" ]; then
  echo -e "${GREEN}✅ HTTPS está funcionando (HTTP 200)${NC}"
else
  echo -e "${YELLOW}⚠️ HTTPS não está funcionando corretamente (HTTP $HTTPS_RESPONSE)${NC}"
fi

# 13. Mostrar resumo
echo -e "${BLUE}📋 Resumo final:${NC}"
echo -e "${GREEN}✅ PM2 atualizado${NC}"
echo -e "${GREEN}✅ Processos limpos${NC}"
echo -e "${GREEN}✅ Ecosystem.config.js criado/verificado${NC}"
echo -e "${GREEN}✅ Builds verificados${NC}"
echo -e "${GREEN}✅ Serviços iniciados${NC}"

echo -e "${YELLOW}🎯 Para monitorar:${NC}"
echo -e "   pm2 status"
echo -e "   pm2 logs whatsapp-backend"
echo -e "   pm2 logs whatsapp-frontend"
echo -e "   pm2 monit"

echo -e "${YELLOW}🌐 URLs para testar:${NC}"
echo -e "   Backend: http://localhost:5000/health"
echo -e "   Frontend: http://localhost:3000"
echo -e "   HTTPS: https://wconnect.repagil.com.br"

echo -e "${GREEN}🚀 Correção do PM2 e reinicialização finalizada!${NC}"

