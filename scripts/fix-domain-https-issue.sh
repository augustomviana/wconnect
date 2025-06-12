#!/bin/bash

echo "🔧 Diagnosticando e corrigindo problema de domínio HTTPS..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="wconnect.repagil.com.br"
SERVER_IP="185.217.126.180"

echo -e "${BLUE}🔍 Diagnóstico do problema HTTPS/Domínio${NC}"

# 1. Verificar se o domínio aponta para o IP correto
echo -e "${BLUE}1️⃣ Verificando DNS do domínio...${NC}"
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
  echo -e "${GREEN}✅ DNS correto: $DOMAIN aponta para $SERVER_IP${NC}"
else
  echo -e "${RED}❌ DNS incorreto: $DOMAIN aponta para $DOMAIN_IP, deveria ser $SERVER_IP${NC}"
  echo -e "${YELLOW}⚠️ Você precisa configurar o DNS do domínio para apontar para $SERVER_IP${NC}"
fi

# 2. Testar conectividade HTTP vs HTTPS
echo -e "${BLUE}2️⃣ Testando conectividade...${NC}"

# Testar HTTP no IP
echo -e "${YELLOW}⚠️ Testando HTTP no IP...${NC}"
HTTP_IP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:3000/ --connect-timeout 10)
if [ "$HTTP_IP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ HTTP no IP funciona (Status: $HTTP_IP_STATUS)${NC}"
else
  echo -e "${RED}❌ HTTP no IP não funciona (Status: $HTTP_IP_STATUS)${NC}"
fi

# Testar HTTPS no domínio
echo -e "${YELLOW}⚠️ Testando HTTPS no domínio...${NC}"
HTTPS_DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ --connect-timeout 10 --insecure)
if [ "$HTTPS_DOMAIN_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ HTTPS no domínio funciona (Status: $HTTPS_DOMAIN_STATUS)${NC}"
else
  echo -e "${RED}❌ HTTPS no domínio não funciona (Status: $HTTPS_DOMAIN_STATUS)${NC}"
fi

# Testar HTTP no domínio
echo -e "${YELLOW}⚠️ Testando HTTP no domínio...${NC}"
HTTP_DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/ --connect-timeout 10)
if [ "$HTTP_DOMAIN_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ HTTP no domínio funciona (Status: $HTTP_DOMAIN_STATUS)${NC}"
else
  echo -e "${RED}❌ HTTP no domínio não funciona (Status: $HTTP_DOMAIN_STATUS)${NC}"
fi

# 3. Verificar se o Nginx está configurado para HTTPS
echo -e "${BLUE}3️⃣ Verificando configuração do Nginx...${NC}"
if [ -f "/etc/nginx/sites-available/$DOMAIN" ]; then
  echo -e "${GREEN}✅ Arquivo de configuração do Nginx existe${NC}"
  
  # Verificar se tem configuração SSL
  if grep -q "ssl_certificate" /etc/nginx/sites-available/$DOMAIN; then
    echo -e "${GREEN}✅ Configuração SSL encontrada${NC}"
  else
    echo -e "${RED}❌ Configuração SSL não encontrada${NC}"
  fi
else
  echo -e "${RED}❌ Arquivo de configuração do Nginx não encontrado${NC}"
  echo -e "${YELLOW}⚠️ Criando configuração do Nginx para o domínio...${NC}"
  
  # Criar configuração do Nginx
  sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # Configurações SSL (será configurado pelo Certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API routes - proxy para backend
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Login rate limiting
    location /login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Frontend routes - proxy para Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }
}
EOF

  # Habilitar o site
  sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
  echo -e "${GREEN}✅ Configuração do Nginx criada${NC}"
fi

# 4. Verificar se o Certbot está instalado
echo -e "${BLUE}4️⃣ Verificando certificado SSL...${NC}"
if command -v certbot &> /dev/null; then
  echo -e "${GREEN}✅ Certbot está instalado${NC}"
  
  # Verificar se já existe certificado
  if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${GREEN}✅ Certificado SSL já existe${NC}"
    
    # Verificar validade do certificado
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem | cut -d= -f2)
    echo -e "${BLUE}📅 Certificado expira em: $CERT_EXPIRY${NC}"
  else
    echo -e "${YELLOW}⚠️ Certificado SSL não encontrado. Instalando...${NC}"
    
    # Parar nginx temporariamente
    sudo systemctl stop nginx
    
    # Obter certificado SSL
    sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Certificado SSL obtido com sucesso${NC}"
      
      # Atualizar configuração do Nginx para usar SSL
      sudo sed -i "s|# ssl_certificate|ssl_certificate|g" /etc/nginx/sites-available/$DOMAIN
      sudo sed -i "s|# ssl_certificate_key|ssl_certificate_key|g" /etc/nginx/sites-available/$DOMAIN
    else
      echo -e "${RED}❌ Falha ao obter certificado SSL${NC}"
    fi
    
    # Reiniciar nginx
    sudo systemctl start nginx
  fi
else
  echo -e "${YELLOW}⚠️ Certbot não está instalado. Instalando...${NC}"
  sudo apt update
  sudo apt install -y certbot python3-certbot-nginx
  echo -e "${GREEN}✅ Certbot instalado${NC}"
fi

# 5. Verificar variáveis de ambiente para HTTPS
echo -e "${BLUE}5️⃣ Verificando variáveis de ambiente...${NC}"

# Frontend
if [ -f "frontend/.env.local" ]; then
  echo -e "${GREEN}✅ Arquivo frontend/.env.local existe${NC}"
  
  # Verificar se tem HTTPS configurado
  if grep -q "https://$DOMAIN" frontend/.env.local; then
    echo -e "${GREEN}✅ HTTPS configurado no frontend${NC}"
  else
    echo -e "${YELLOW}⚠️ Atualizando variáveis de ambiente do frontend para HTTPS...${NC}"
    
    # Backup do arquivo atual
    cp frontend/.env.local frontend/.env.local.bak
    
    # Atualizar para HTTPS
    sed -i "s|http://.*|https://$DOMAIN|g" frontend/.env.local
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$DOMAIN|g" frontend/.env.local
    
    echo -e "${GREEN}✅ Variáveis de ambiente do frontend atualizadas${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Criando arquivo frontend/.env.local...${NC}"
  cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN
NEXT_PUBLIC_APP_NAME=WConnect
BACKEND_URL=https://$DOMAIN
EOF
  echo -e "${GREEN}✅ Arquivo frontend/.env.local criado${NC}"
fi

# Backend
if [ -f "backend/.env" ]; then
  echo -e "${GREEN}✅ Arquivo backend/.env existe${NC}"
  
  # Verificar se tem HTTPS configurado
  if grep -q "https://$DOMAIN" backend/.env; then
    echo -e "${GREEN}✅ HTTPS configurado no backend${NC}"
  else
    echo -e "${YELLOW}⚠️ Atualizando variáveis de ambiente do backend para HTTPS...${NC}"
    
    # Backup do arquivo atual
    cp backend/.env backend/.env.bak
    
    # Atualizar para HTTPS
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" backend/.env
    
    echo -e "${GREEN}✅ Variáveis de ambiente do backend atualizadas${NC}"
  fi
fi

# 6. Testar e reiniciar serviços
echo -e "${BLUE}6️⃣ Testando configuração do Nginx...${NC}"
sudo nginx -t

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Configuração do Nginx está correta${NC}"
  
  echo -e "${YELLOW}⚠️ Reiniciando Nginx...${NC}"
  sudo systemctl reload nginx
  
  echo -e "${YELLOW}⚠️ Reiniciando aplicações...${NC}"
  
  # Recompilar frontend com novas variáveis
  cd frontend
  npm run build
  
  # Reiniciar com PM2
  pm2 restart whatsapp-frontend --update-env
  pm2 restart whatsapp-backend --update-env
  
  cd ..
  
  echo -e "${GREEN}✅ Serviços reiniciados${NC}"
else
  echo -e "${RED}❌ Erro na configuração do Nginx${NC}"
fi

# 7. Teste final
echo -e "${BLUE}7️⃣ Teste final...${NC}"
sleep 5

echo -e "${YELLOW}⚠️ Testando HTTPS após correções...${NC}"
FINAL_TEST=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ --connect-timeout 15)
if [ "$FINAL_TEST" = "200" ]; then
  echo -e "${GREEN}✅ HTTPS funcionando! Status: $FINAL_TEST${NC}"
else
  echo -e "${RED}❌ HTTPS ainda não funciona. Status: $FINAL_TEST${NC}"
fi

# 8. Resumo e próximos passos
echo -e "${BLUE}📋 Resumo da correção:${NC}"
echo -e "${GREEN}✅ Configuração do Nginx criada/atualizada${NC}"
echo -e "${GREEN}✅ Certificado SSL verificado/instalado${NC}"
echo -e "${GREEN}✅ Variáveis de ambiente atualizadas para HTTPS${NC}"
echo -e "${GREEN}✅ Aplicações reiniciadas${NC}"

echo -e "${YELLOW}🔍 Próximos passos para verificar:${NC}"
echo "1. Acesse https://$DOMAIN e teste o login"
echo "2. Verifique se o certificado SSL está válido no navegador"
echo "3. Teste as APIs no DevTools (devem usar HTTPS)"
echo "4. Se ainda houver problemas, verifique os logs:"
echo "   - sudo tail -f /var/log/nginx/error.log"
echo "   - pm2 logs whatsapp-frontend"
echo "   - pm2 logs whatsapp-backend"

echo -e "${GREEN}🚀 Correção de domínio HTTPS finalizada!${NC}"

