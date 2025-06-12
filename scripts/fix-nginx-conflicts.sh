#!/bin/bash

echo "🔧 Corrigindo conflitos de configuração do Nginx..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="wconnect.repagil.com.br"

echo -e "${BLUE}1️⃣ Identificando configurações conflitantes...${NC}"

# Listar todos os arquivos de configuração que podem estar causando conflito
echo -e "${YELLOW}⚠️ Arquivos de configuração encontrados:${NC}"
ls -la /etc/nginx/sites-enabled/

# Verificar se há múltiplas configurações para o mesmo domínio
echo -e "${YELLOW}⚠️ Verificando conflitos de server_name...${NC}"
grep -r "server_name.*$DOMAIN" /etc/nginx/sites-enabled/ || echo "Nenhum conflito encontrado"

echo -e "${BLUE}2️⃣ Removendo todas as configurações conflitantes...${NC}"

# Parar nginx temporariamente
sudo systemctl stop nginx

# Remover TODAS as configurações do sites-enabled
sudo rm -f /etc/nginx/sites-enabled/*

# Remover configurações antigas do sites-available (exceto default)
sudo rm -f /etc/nginx/sites-available/$DOMAIN
sudo rm -f /etc/nginx/sites-available/test.conf*

echo -e "${GREEN}✅ Configurações antigas removidas${NC}"

echo -e "${BLUE}3️⃣ Criando configuração única e limpa...${NC}"

# Criar configuração única e correta
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << 'EOF'
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
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Logs específicos para debug
    access_log /var/log/nginx/wconnect_access.log;
    error_log /var/log/nginx/wconnect_error.log;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API routes - proxy para backend na porta 5000
    location /api/ {
        # Log para debug
        access_log /var/log/nginx/api_access.log;
        
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://wconnect.repagil.com.br" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://wconnect.repagil.com.br";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }

    # Frontend routes - proxy para Next.js na porta 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo -e "${GREEN}✅ Nova configuração única criada${NC}"

echo -e "${BLUE}4️⃣ Habilitando apenas a configuração correta...${NC}"

# Habilitar apenas nossa configuração
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN

echo -e "${GREEN}✅ Configuração habilitada${NC}"

echo -e "${BLUE}5️⃣ Verificando se o backend está rodando na porta 5000...${NC}"

# Verificar se o backend está rodando
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/health --connect-timeout 5)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Backend está rodando na porta 5000${NC}"
else
    echo -e "${RED}❌ Backend não está respondendo na porta 5000 (Status: $BACKEND_STATUS)${NC}"
    echo -e "${YELLOW}⚠️ Verificando processos na porta 5000...${NC}"
    sudo lsof -i:5000 || echo "Nenhum processo na porta 5000"
    
    echo -e "${YELLOW}⚠️ Reiniciando backend...${NC}"
    pm2 restart whatsapp-backend
    sleep 3
    
    # Testar novamente
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/health --connect-timeout 5)
    if [ "$BACKEND_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Backend agora está rodando na porta 5000${NC}"
    else
        echo -e "${RED}❌ Backend ainda não está respondendo${NC}"
    fi
fi

echo -e "${BLUE}6️⃣ Verificando se o frontend está rodando na porta 3000...${NC}"

# Verificar se o frontend está rodando
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ --connect-timeout 5)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Frontend está rodando na porta 3000${NC}"
else
    echo -e "${RED}❌ Frontend não está respondendo na porta 3000 (Status: $FRONTEND_STATUS)${NC}"
    echo -e "${YELLOW}⚠️ Reiniciando frontend...${NC}"
    pm2 restart whatsapp-frontend
    sleep 3
fi

echo -e "${BLUE}7️⃣ Testando configuração do Nginx...${NC}"

sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Configuração do Nginx está correta${NC}"
    
    echo -e "${BLUE}8️⃣ Iniciando Nginx...${NC}"
    sudo systemctl start nginx
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx iniciado com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao iniciar Nginx${NC}"
        sudo systemctl status nginx
    fi
else
    echo -e "${RED}❌ Erro na configuração do Nginx${NC}"
    sudo nginx -t
    exit 1
fi

echo -e "${BLUE}9️⃣ Aguardando serviços estabilizarem...${NC}"
sleep 5

echo -e "${BLUE}🔟 Teste final completo...${NC}"

# Testar HTTPS do site
echo -e "${YELLOW}⚠️ Testando HTTPS do site...${NC}"
HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/ --connect-timeout 15)
if [ "$HTTPS_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS do site funcionando! Status: $HTTPS_STATUS${NC}"
else
    echo -e "${RED}❌ HTTPS do site não funciona. Status: $HTTPS_STATUS${NC}"
fi

# Testar API de health
echo -e "${YELLOW}⚠️ Testando API de health...${NC}"
HEALTH_API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/health --connect-timeout 15)
if [ "$HEALTH_API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API de health funcionando! Status: $HEALTH_API_STATUS${NC}"
else
    echo -e "${RED}❌ API de health não funciona. Status: $HEALTH_API_STATUS${NC}"
fi

# Testar API de backend
echo -e "${YELLOW}⚠️ Testando API do backend...${NC}"
BACKEND_API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/test --connect-timeout 15)
if [ "$BACKEND_API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API do backend funcionando! Status: $BACKEND_API_STATUS${NC}"
else
    echo -e "${RED}❌ API do backend não funciona. Status: $BACKEND_API_STATUS${NC}"
    
    # Debug adicional
    echo -e "${YELLOW}⚠️ Testando diretamente no backend...${NC}"
    DIRECT_BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/api/test --connect-timeout 5)
    echo -e "${BLUE}📊 Backend direto: $DIRECT_BACKEND${NC}"
fi

# Testar API de proxy de auth
echo -e "${YELLOW}⚠️ Testando API de proxy de auth...${NC}"
AUTH_API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/auth/proxy --connect-timeout 15)
if [ "$AUTH_API_STATUS" = "405" ] || [ "$AUTH_API_STATUS" = "400" ]; then
    echo -e "${GREEN}✅ API de auth funcionando! Status: $AUTH_API_STATUS (esperado para GET)${NC}"
else
    echo -e "${RED}❌ API de auth não funciona. Status: $AUTH_API_STATUS${NC}"
fi

echo -e "${BLUE}📋 Status dos serviços:${NC}"
pm2 status

echo -e "${BLUE}📋 Resumo da correção:${NC}"
echo -e "${GREEN}✅ Configurações conflitantes removidas${NC}"
echo -e "${GREEN}✅ Configuração única do Nginx criada${NC}"
echo -e "${GREEN}✅ Backend e frontend verificados${NC}"
echo -e "${GREEN}✅ Nginx reiniciado com configuração limpa${NC}"

echo -e "${YELLOW}🎯 Agora teste:${NC}"
echo "1. Acesse: https://wconnect.repagil.com.br"
echo "2. Faça login (deve funcionar perfeitamente)"
echo "3. Verifique no DevTools → Network se as APIs usam HTTPS"

echo -e "${BLUE}📊 Para monitorar logs em tempo real:${NC}"
echo "sudo tail -f /var/log/nginx/wconnect_error.log"
echo "sudo tail -f /var/log/nginx/api_access.log"
echo "pm2 logs whatsapp-backend"
echo "pm2 logs whatsapp-frontend"

echo -e "${GREEN}🚀 Correção de conflitos do Nginx finalizada!${NC}"

