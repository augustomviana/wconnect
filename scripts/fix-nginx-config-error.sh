#!/bin/bash

echo "🔧 Corrigindo erro de configuração do Nginx..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="wconnect.repagil.com.br"

echo -e "${BLUE}1️⃣ Removendo configurações conflitantes...${NC}"

# Remover arquivos de backup que podem estar causando conflito
sudo rm -f /etc/nginx/sites-enabled/test.conf.bak
sudo rm -f /etc/nginx/sites-enabled/*.bak

echo -e "${GREEN}✅ Arquivos de backup removidos${NC}"

echo -e "${BLUE}2️⃣ Corrigindo configuração do Nginx...${NC}"

# Criar uma configuração correta do Nginx
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << 'EOF'
# Rate limiting - deve estar no contexto http, não server
# Movido para nginx.conf principal

server {
    listen 80;
    server_name wconnect.repagil.com.br;
    
    # Redirecionar HTTP para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wconnect.repagil.com.br;
    
    # Configurações SSL
    ssl_certificate /etc/letsencrypt/live/wconnect.repagil.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wconnect.repagil.com.br/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API routes - proxy para backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://wconnect.repagil.com.br" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://wconnect.repagil.com.br";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept";
            add_header Access-Control-Allow-Credentials "true";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # Frontend routes - proxy para Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo -e "${GREEN}✅ Nova configuração do Nginx criada${NC}"

echo -e "${BLUE}3️⃣ Verificando se rate limiting está no nginx.conf principal...${NC}"

# Verificar se rate limiting já está no nginx.conf
if ! grep -q "limit_req_zone" /etc/nginx/nginx.conf; then
    echo -e "${YELLOW}⚠️ Adicionando rate limiting ao nginx.conf principal...${NC}"
    
    # Fazer backup do nginx.conf
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
    
    # Adicionar rate limiting no contexto http
    sudo sed -i '/http {/a\\n\t# Rate limiting\n\tlimit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\n\tlimit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;\n' /etc/nginx/nginx.conf
    
    echo -e "${GREEN}✅ Rate limiting adicionado ao nginx.conf${NC}"
else
    echo -e "${GREEN}✅ Rate limiting já está configurado no nginx.conf${NC}"
fi

echo -e "${BLUE}4️⃣ Habilitando o site...${NC}"

# Remover link simbólico antigo se existir
sudo rm -f /etc/nginx/sites-enabled/$DOMAIN

# Criar novo link simbólico
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

echo -e "${GREEN}✅ Site habilitado${NC}"

echo -e "${BLUE}5️⃣ Testando configuração do Nginx...${NC}"

sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Configuração do Nginx está correta${NC}"
    
    echo -e "${BLUE}6️⃣ Recarregando Nginx...${NC}"
    sudo systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx recarregado com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao recarregar Nginx${NC}"
        echo -e "${YELLOW}⚠️ Verificando logs...${NC}"
        sudo tail -n 10 /var/log/nginx/error.log
    fi
else
    echo -e "${RED}❌ Ainda há erros na configuração do Nginx${NC}"
    echo -e "${YELLOW}⚠️ Detalhes do erro:${NC}"
    sudo nginx -t
fi

echo -e "${BLUE}7️⃣ Atualizando variáveis de ambiente para HTTPS...${NC}"

# Atualizar frontend para usar HTTPS
if [ -f "frontend/.env.local" ]; then
    # Fazer backup
    cp frontend/.env.local frontend/.env.local.bak
    
    # Atualizar para HTTPS
    sed -i "s|http://.*|https://$DOMAIN|g" frontend/.env.local
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://$DOMAIN|g" frontend/.env.local
    
    echo -e "${GREEN}✅ Variáveis do frontend atualizadas para HTTPS${NC}"
    echo -e "${BLUE}📄 Conteúdo do frontend/.env.local:${NC}"
    cat frontend/.env.local
fi

# Atualizar backend para usar HTTPS
if [ -f "backend/.env" ]; then
    # Fazer backup
    cp backend/.env backend/.env.bak
    
    # Atualizar para HTTPS
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|g" backend/.env
    
    echo -e "${GREEN}✅ Variáveis do backend atualizadas para HTTPS${NC}"
fi

echo -e "${BLUE}8️⃣ Recompilando e reiniciando aplicações...${NC}"

# Recompilar frontend
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend recompilado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro na compilação do frontend${NC}"
fi

# Reiniciar aplicações
pm2 restart whatsapp-frontend --update-env
pm2 restart whatsapp-backend --update-env

cd ..

echo -e "${GREEN}✅ Aplicações reiniciadas${NC}"

echo -e "${BLUE}9️⃣ Teste final...${NC}"

sleep 5

# Testar HTTPS
echo -e "${YELLOW}⚠️ Testando HTTPS...${NC}"
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ --connect-timeout 15)
if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS funcionando! Status: $HTTPS_STATUS${NC}"
else
    echo -e "${RED}❌ HTTPS não funciona. Status: $HTTPS_STATUS${NC}"
fi

# Testar API
echo -e "${YELLOW}⚠️ Testando API HTTPS...${NC}"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/auth/proxy --connect-timeout 15)
if [ "$API_STATUS" = "405" ] || [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API HTTPS funcionando! Status: $API_STATUS${NC}"
else
    echo -e "${RED}❌ API HTTPS não funciona. Status: $API_STATUS${NC}"
fi

echo -e "${BLUE}📋 Resumo da correção:${NC}"
echo -e "${GREEN}✅ Configuração do Nginx corrigida${NC}"
echo -e "${GREEN}✅ Rate limiting movido para nginx.conf${NC}"
echo -e "${GREEN}✅ Variáveis de ambiente atualizadas para HTTPS${NC}"
echo -e "${GREEN}✅ Aplicações recompiladas e reiniciadas${NC}"

echo -e "${YELLOW}🎯 Agora teste:${NC}"
echo "1. Acesse: https://wconnect.repagil.com.br"
echo "2. Faça login (deve funcionar agora)"
echo "3. Verifique no DevTools se as APIs usam HTTPS"

echo -e "${GREEN}🚀 Correção do Nginx finalizada!${NC}"

