#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Corrigindo conexão do WhatsApp...${NC}"

# 1. Verificar se o backend está rodando
echo -e "${BLUE}1️⃣ Verificando status do backend...${NC}"
if ! pm2 list | grep -q "whatsapp-backend.*online"; then
  echo -e "${RED}❌ Backend não está rodando. Iniciando...${NC}"
  cd /root/whatsapp-web
  pm2 start ecosystem.config.js --only whatsapp-backend
  sleep 5
else
  echo -e "${GREEN}✅ Backend está rodando${NC}"
fi

# 2. Verificar dependências do Puppeteer
echo -e "${BLUE}2️⃣ Verificando dependências do Puppeteer...${NC}"
echo -e "${YELLOW}⚠️ Instalando dependências do Chrome/Puppeteer...${NC}"

# Instalar dependências do Chrome
apt-get update
apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget

echo -e "${GREEN}✅ Dependências do Chrome instaladas${NC}"

# 3. Verificar e corrigir configuração do WhatsApp no backend
echo -e "${BLUE}3️⃣ Verificando configuração do WhatsApp no backend...${NC}"

# Verificar se o diretório de sessões existe
if [ ! -d "/root/whatsapp-web/backend/sessions_simple" ]; then
  echo -e "${YELLOW}⚠️ Diretório de sessões não encontrado. Criando...${NC}"
  mkdir -p /root/whatsapp-web/backend/sessions_simple
  chmod 777 /root/whatsapp-web/backend/sessions_simple
  echo -e "${GREEN}✅ Diretório de sessões criado${NC}"
else
  echo -e "${GREEN}✅ Diretório de sessões existe${NC}"
  # Limpar sessões antigas
  echo -e "${YELLOW}⚠️ Limpando sessões antigas...${NC}"
  rm -rf /root/whatsapp-web/backend/sessions_simple/*
  echo -e "${GREEN}✅ Sessões antigas removidas${NC}"
fi

# 4. Verificar e corrigir o serviço WhatsApp no backend
echo -e "${BLUE}4️⃣ Verificando serviço WhatsApp no backend...${NC}"

# Verificar se o arquivo whatsapp-simple.ts existe
if [ ! -f "/root/whatsapp-web/backend/src/services/whatsapp-simple.ts" ]; then
  echo -e "${RED}❌ Arquivo whatsapp-simple.ts não encontrado${NC}"
else
  echo -e "${GREEN}✅ Arquivo whatsapp-simple.ts encontrado${NC}"
fi

# 5. Instalar Puppeteer globalmente
echo -e "${BLUE}5️⃣ Instalando Puppeteer globalmente...${NC}"
npm install -g puppeteer
echo -e "${GREEN}✅ Puppeteer instalado globalmente${NC}"

# 6. Instalar Puppeteer no projeto
echo -e "${BLUE}6️⃣ Instalando Puppeteer no projeto...${NC}"
cd /root/whatsapp-web
npm install puppeteer
cd /root/whatsapp-web/backend
npm install puppeteer
echo -e "${GREEN}✅ Puppeteer instalado no projeto${NC}"

# 7. Configurar variáveis de ambiente para o Puppeteer
echo -e "${BLUE}7️⃣ Configurando variáveis de ambiente para o Puppeteer...${NC}"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=$(which google-chrome || which chromium-browser || which chromium)

if [ -z "$PUPPETEER_EXECUTABLE_PATH" ]; then
  echo -e "${RED}❌ Chrome/Chromium não encontrado. Instalando Google Chrome...${NC}"
  wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
  echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
  apt-get update
  apt-get install -y google-chrome-stable
  export PUPPETEER_EXECUTABLE_PATH=$(which google-chrome)
  echo -e "${GREEN}✅ Google Chrome instalado: $PUPPETEER_EXECUTABLE_PATH${NC}"
else
  echo -e "${GREEN}✅ Chrome/Chromium encontrado: $PUPPETEER_EXECUTABLE_PATH${NC}"
fi

# Adicionar variáveis ao .env do backend
echo -e "${YELLOW}⚠️ Adicionando variáveis ao .env do backend...${NC}"
if ! grep -q "PUPPETEER_EXECUTABLE_PATH" /root/whatsapp-web/backend/.env; then
  echo "PUPPETEER_EXECUTABLE_PATH=$PUPPETEER_EXECUTABLE_PATH" >> /root/whatsapp-web/backend/.env
  echo "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> /root/whatsapp-web/backend/.env
  echo -e "${GREEN}✅ Variáveis adicionadas ao .env${NC}"
else
  echo -e "${GREEN}✅ Variáveis já existem no .env${NC}"
fi

# 8. Modificar o código do serviço WhatsApp para usar o Chrome instalado
echo -e "${BLUE}8️⃣ Modificando código do serviço WhatsApp...${NC}"

# Fazer backup do arquivo original
cp /root/whatsapp-web/backend/src/services/whatsapp.ts /root/whatsapp-web/backend/src/services/whatsapp.ts.bak

# Modificar o arquivo para usar o Chrome instalado
sed -i "s|puppeteer: {|puppeteer: {\n      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,|" /root/whatsapp-web/backend/src/services/whatsapp.ts

echo -e "${GREEN}✅ Código do serviço WhatsApp modificado${NC}"

# 9. Recompilar o backend
echo -e "${BLUE}9️⃣ Recompilando o backend...${NC}"
cd /root/whatsapp-web/backend
npm run build
echo -e "${GREEN}✅ Backend recompilado${NC}"

# 10. Reiniciar o backend
echo -e "${BLUE}🔟 Reiniciando o backend...${NC}"
cd /root/whatsapp-web
pm2 restart whatsapp-backend
echo -e "${GREEN}✅ Backend reiniciado${NC}"

# 11. Aguardar inicialização
echo -e "${YELLOW}⚠️ Aguardando inicialização do backend (30 segundos)...${NC}"
sleep 30

# 12. Verificar logs para confirmar que o QR Code está sendo gerado
echo -e "${BLUE}1️⃣2️⃣ Verificando logs para confirmar geração do QR Code...${NC}"
if pm2 logs whatsapp-backend --lines 50 --nostream | grep -q "QR Code"; then
  echo -e "${GREEN}✅ QR Code está sendo gerado! Acesse a interface web para escanear.${NC}"
else
  echo -e "${RED}❌ QR Code não detectado nos logs. Verifique os logs completos.${NC}"
fi

# 13. Instruções finais
echo -e "${BLUE}📋 Instruções para conectar o WhatsApp:${NC}"
echo -e "1. Acesse ${GREEN}https://wconnect.repagil.com.br/dashboard/whatsapp${NC}"
echo -e "2. Clique em ${GREEN}Reiniciar Conexão / Novo QR Code${NC}"
echo -e "3. Escaneie o QR Code com seu WhatsApp"
echo -e "4. Aguarde a confirmação de conexão"
echo -e "5. Para monitorar o processo, execute: ${GREEN}pm2 logs whatsapp-backend${NC}"

echo -e "${GREEN}🚀 Script de correção do WhatsApp finalizado!${NC}"
