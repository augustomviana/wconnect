#!/bin/bash

echo "🔧 Corrigindo erros críticos do sistema..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Parar todos os processos
echo -e "${BLUE}1️⃣ Parando todos os processos...${NC}"
pm2 stop all
sleep 2

# 2. Verificar e matar processos na porta 5000
echo -e "${BLUE}2️⃣ Verificando processos na porta 5000...${NC}"
PORT_PIDS=$(lsof -i:5000 -t 2>/dev/null)
if [ ! -z "$PORT_PIDS" ]; then
  echo -e "${YELLOW}⚠️ Processos encontrados na porta 5000. Matando...${NC}"
  for PID in $PORT_PIDS; do
    echo -e "   Matando processo $PID"
    kill -9 $PID 2>/dev/null
  done
  echo -e "${GREEN}✅ Processos na porta 5000 terminados${NC}"
else
  echo -e "${GREEN}✅ Nenhum processo encontrado na porta 5000${NC}"
fi

# 3. Instalar Chromium para Puppeteer
echo -e "${BLUE}3️⃣ Instalando Chromium para Puppeteer...${NC}"
echo -e "${YELLOW}⚠️ Método 1: Instalando via apt...${NC}"
apt-get update
apt-get install -y chromium-browser

echo -e "${YELLOW}⚠️ Método 2: Instalando via npm...${NC}"
cd /root/whatsapp-web
npm install puppeteer

echo -e "${YELLOW}⚠️ Método 3: Configurando variáveis de ambiente...${NC}"
# Adicionar variáveis de ambiente para o Puppeteer
cat > /root/whatsapp-web/backend/.puppeteerrc.js << EOF
const { join } = require('path');

/**
 * @type {import('puppeteer').Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
EOF

# Atualizar o arquivo whatsapp.ts para usar o Chromium instalado
echo -e "${BLUE}4️⃣ Atualizando configuração do WhatsApp Service...${NC}"
cd /root/whatsapp-web/backend
WHATSAPP_SERVICE_FILE="src/services/whatsapp.ts"

if [ -f "$WHATSAPP_SERVICE_FILE" ]; then
  # Fazer backup
  cp "$WHATSAPP_SERVICE_FILE" "${WHATSAPP_SERVICE_FILE}.bak"
  
  # Atualizar configuração do puppeteer
  sed -i 's/puppeteer: {/puppeteer: {\n      executablePath: "\/usr\/bin\/chromium-browser",/g' "$WHATSAPP_SERVICE_FILE"
  
  echo -e "${GREEN}✅ Configuração do WhatsApp Service atualizada${NC}"
else
  echo -e "${RED}❌ Arquivo do WhatsApp Service não encontrado${NC}"
fi

# 5. Reconstruir o frontend
echo -e "${BLUE}5️⃣ Reconstruindo o frontend...${NC}"
cd /root/whatsapp-web/frontend
rm -rf .next
npm run build

# 6. Reconstruir o backend
echo -e "${BLUE}6️⃣ Reconstruindo o backend...${NC}"
cd /root/whatsapp-web/backend
npm run build

# 7. Reiniciar os serviços
echo -e "${BLUE}7️⃣ Reiniciando os serviços...${NC}"
cd /root/whatsapp-web
pm2 start ecosystem.config.js

# 8. Verificar status
echo -e "${BLUE}8️⃣ Verificando status dos serviços...${NC}"
sleep 5
pm2 status

# 9. Testar conexões
echo -e "${BLUE}9️⃣ Testando conexões...${NC}"
echo -e "${YELLOW}⚠️ Testando backend (porta 5000)...${NC}"
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$BACKEND_RESPONSE" == "200" ]; then
  echo -e "${GREEN}✅ Backend está respondendo (HTTP 200)${NC}"
else
  echo -e "${RED}❌ Backend não está respondendo corretamente (HTTP $BACKEND_RESPONSE)${NC}"
fi

echo -e "${YELLOW}⚠️ Testando frontend (porta 3000)...${NC}"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_RESPONSE" == "200" ]; then
  echo -e "${GREEN}✅ Frontend está respondendo (HTTP 200)${NC}"
else
  echo -e "${RED}❌ Frontend não está respondendo corretamente (HTTP $FRONTEND_RESPONSE)${NC}"
fi

# 10. Verificar logs
echo -e "${BLUE}🔟 Verificando logs recentes...${NC}"
echo -e "${YELLOW}⚠️ Últimas 10 linhas do log do backend:${NC}"
pm2 logs whatsapp-backend --lines 10

echo -e "${YELLOW}⚠️ Últimas 10 linhas do log do frontend:${NC}"
pm2 logs whatsapp-frontend --lines 10

echo -e "${GREEN}🚀 Correção de erros críticos finalizada!${NC}"
echo -e "${YELLOW}⚠️ Se ainda houver problemas, verifique os logs completos com:${NC}"
echo -e "   pm2 logs whatsapp-backend"
echo -e "   pm2 logs whatsapp-frontend"

