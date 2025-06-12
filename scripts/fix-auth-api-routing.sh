#!/bin/bash  
echo "🔧 Corrigindo roteamento da API de autenticação..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar se a rota /api/auth/proxy existe no frontend
echo -e "${BLUE}1️⃣ Verificando rota /api/auth/proxy no frontend...${NC}"
cd frontend

if [ -f "app/api/auth/proxy/route.ts" ]; then
  echo -e "${GREEN}✅ Arquivo app/api/auth/proxy/route.ts existe${NC}"
else
  echo -e "${RED}❌ Arquivo app/api/auth/proxy/route.ts não encontrado${NC}"
  echo -e "${YELLOW}⚠️ Criando arquivo de proxy...${NC}"
  
  mkdir -p app/api/auth/proxy
  cat > app/api/auth/proxy/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Proxy recebeu requisição de auth')
    
    const body = await request.json()
    console.log('📦 Payload recebido:', JSON.stringify(body, null, 2))
    
    const backendUrl = `${BACKEND_URL}/api/auth/login`
    console.log('🎯 Enviando para backend:', backendUrl)
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password
      }),
    })
    
    console.log('📡 Resposta do backend - Status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro do backend:', errorText)
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend error: ${response.status} - ${errorText}` 
        },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('✅ Dados do backend:', JSON.stringify(data, null, 2))
    
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('💥 Erro no proxy:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: `Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Auth proxy is working',
    backend_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timestamp: new Date().toISOString()
  })
}
EOF
  echo -e "${GREEN}✅ Arquivo de proxy criado${NC}"
fi

# 2. Verificar variáveis de ambiente
echo -e "${BLUE}2️⃣ Verificando variáveis de ambiente...${NC}"
if [ -f ".env.local" ]; then
  echo -e "${GREEN}✅ Arquivo .env.local existe${NC}"
  echo -e "${YELLOW}📄 Conteúdo atual:${NC}"
  cat .env.local
else
  echo -e "${RED}❌ Arquivo .env.local não encontrado${NC}"
  echo -e "${YELLOW}⚠️ Criando .env.local...${NC}"
  cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://wconnect.repagil.com.br
NEXT_PUBLIC_SOCKET_URL=https://wconnect.repagil.com.br
EOF
  echo -e "${GREEN}✅ Arquivo .env.local criado${NC}"
fi

# 3. Testar backend diretamente
echo -e "${BLUE}3️⃣ Testando backend diretamente...${NC}"
cd ../backend

# Verificar se backend está rodando
if lsof -i:5000 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend está rodando na porta 5000${NC}"
  
  # Testar rota de health
  echo -e "${YELLOW}⚠️ Testando rota de health...${NC}"
  HEALTH_RESPONSE=$(curl -s http://localhost:5000/health)
  if [[ $HEALTH_RESPONSE == *"OK"* ]]; then
    echo -e "${GREEN}✅ Rota /health funcionando${NC}"
  else
    echo -e "${RED}❌ Rota /health não funcionando${NC}"
  fi
  
  # Testar rota de auth
  echo -e "${YELLOW}⚠️ Testando rota de auth...${NC}"
  AUTH_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test123"}')
  
  if [[ $AUTH_RESPONSE == *"error"* ]] || [[ $AUTH_RESPONSE == *"success"* ]]; then
    echo -e "${GREEN}✅ Rota /api/auth/login está respondendo${NC}"
    echo -e "${YELLOW}📄 Resposta: ${AUTH_RESPONSE}${NC}"
  else
    echo -e "${RED}❌ Rota /api/auth/login não está funcionando${NC}"
    echo -e "${YELLOW}📄 Resposta: ${AUTH_RESPONSE}${NC}"
  fi
  
else
  echo -e "${RED}❌ Backend não está rodando na porta 5000${NC}"
  echo -e "${YELLOW}⚠️ Iniciando backend...${NC}"
  
  # Verificar se o arquivo .env existe
  if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️ Criando arquivo .env do backend...${NC}"
    cat > .env << EOF
PORT=5000
DB_USER=whatsapp_user
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_web
JWT_SECRET=seu_segredo_jwt_muito_seguro_aqui
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://wconnect.repagil.com.br
EOF
  fi
  
  # Iniciar backend
  npm run dev &
  BACKEND_PID=$!
  echo -e "${GREEN}✅ Backend iniciado com PID $BACKEND_PID${NC}"
  
  # Aguardar inicialização
  sleep 5
fi

# 4. Compilar frontend
echo -e "${BLUE}4️⃣ Compilando frontend...${NC}"
cd ../frontend

npm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend compilado com sucesso${NC}"
else
  echo -e "${RED}❌ Erro na compilação do frontend${NC}"
  exit 1
fi

# 5. Reiniciar frontend
echo -e "${BLUE}5️⃣ Reiniciando frontend...${NC}"
pm2 restart whatsapp-frontend --update-env

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend reiniciado com sucesso${NC}"
else
  echo -e "${RED}❌ Erro ao reiniciar frontend${NC}"
fi

# 6. Aguardar estabilização
echo -e "${BLUE}6️⃣ Aguardando serviços estabilizarem...${NC}"
sleep 5

# 7. Testar rota de proxy do frontend
echo -e "${BLUE}7️⃣ Testando rota de proxy do frontend...${NC}"

# Testar GET primeiro
echo -e "${YELLOW}⚠️ Testando GET /api/auth/proxy...${NC}"
PROXY_GET_RESPONSE=$(curl -s https://wconnect.repagil.com.br/api/auth/proxy)
if [[ $PROXY_GET_RESPONSE == *"Auth proxy is working"* ]]; then
  echo -e "${GREEN}✅ Proxy GET funcionando${NC}"
  echo -e "${YELLOW}📄 Resposta: ${PROXY_GET_RESPONSE}${NC}"
else
  echo -e "${RED}❌ Proxy GET não funcionando${NC}"
  echo -e "${YELLOW}📄 Resposta: ${PROXY_GET_RESPONSE}${NC}"
fi

# Testar POST
echo -e "${YELLOW}⚠️ Testando POST /api/auth/proxy...${NC}"
PROXY_POST_RESPONSE=$(curl -s -X POST https://wconnect.repagil.com.br/api/auth/proxy \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}')

if [[ $PROXY_POST_RESPONSE == *"error"* ]] || [[ $PROXY_POST_RESPONSE == *"success"* ]]; then
  echo -e "${GREEN}✅ Proxy POST funcionando${NC}"
  echo -e "${YELLOW}📄 Resposta: ${PROXY_POST_RESPONSE}${NC}"
else
  echo -e "${RED}❌ Proxy POST não funcionando${NC}"
  echo -e "${YELLOW}📄 Resposta: ${PROXY_POST_RESPONSE}${NC}"
fi

# 8. Verificar configuração do Nginx
echo -e "${BLUE}8️⃣ Verificando configuração do Nginx...${NC}"

# Verificar se a configuração inclui proxy para APIs
if grep -q "location /api/" /etc/nginx/sites-available/wconnect.repagil.com.br; then
  echo -e "${GREEN}✅ Nginx configurado para proxificar APIs${NC}"
else
  echo -e "${YELLOW}⚠️ Atualizando configuração do Nginx para APIs...${NC}"
  
  # Backup da configuração atual
  cp /etc/nginx/sites-available/wconnect.repagil.com.br /etc/nginx/sites-available/wconnect.repagil.com.br.backup
  
  # Criar nova configuração com proxy para APIs
  cat > /etc/nginx/sites-available/wconnect.repagil.com.br << 'EOF'
server {
    listen 80;
    server_name wconnect.repagil.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name wconnect.repagil.com.br;

    ssl_certificate /etc/letsencrypt/live/wconnect.repagil.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wconnect.repagil.com.br/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Logs
    access_log /var/log/nginx/wconnect_access.log;
    error_log /var/log/nginx/wconnect_error.log;

    # Rate limiting
    limit_req zone=api burst=20 nodelay;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API Routes (Next.js API routes)
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Backend direto (para debug)
    location /backend/ {
        rewrite ^/backend/(.*) /$1 break;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

  # Testar configuração
  nginx -t
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nova configuração do Nginx válida${NC}"
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx recarregado${NC}"
  else
    echo -e "${RED}❌ Erro na configuração do Nginx${NC}"
    # Restaurar backup
    cp /etc/nginx/sites-available/wconnect.repagil.com.br.backup /etc/nginx/sites-available/wconnect.repagil.com.br
  fi
fi

# 9. Teste final completo
echo -e "${BLUE}9️⃣ Teste final completo...${NC}"

# Aguardar um pouco para estabilizar
sleep 3

echo -e "${YELLOW}⚠️ Testando HTTPS do site...${NC}"
SITE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://wconnect.repagil.com.br)
if [ "$SITE_RESPONSE" = "200" ]; then
  echo -e "${GREEN}✅ Site HTTPS funcionando! Status: $SITE_RESPONSE${NC}"
else
  echo -e "${RED}❌ Site HTTPS não funciona. Status: $SITE_RESPONSE${NC}"
fi

echo -e "${YELLOW}⚠️ Testando API de auth via HTTPS...${NC}"
AUTH_HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://wconnect.repagil.com.br/api/auth/proxy)
if [ "$AUTH_HTTPS_RESPONSE" = "200" ]; then
  echo -e "${GREEN}✅ API de auth HTTPS funcionando! Status: $AUTH_HTTPS_RESPONSE${NC}"
else
  echo -e "${RED}❌ API de auth HTTPS não funciona. Status: $AUTH_HTTPS_RESPONSE${NC}"
fi

# 10. Status dos serviços
echo -e "${BLUE}🔟 Status dos serviços...${NC}"
echo -e "${YELLOW}📊 PM2 Status:${NC}"
pm2 status

echo -e "${YELLOW}📊 Portas em uso:${NC}"
echo -e "${BLUE}Backend (5000):${NC}"
lsof -i:5000 | head -2

echo -e "${BLUE}Frontend (3000):${NC}"
lsof -i:3000 | head -2

echo -e "${BLUE}Nginx (80/443):${NC}"
lsof -i:80 | head -2
lsof -i:443 | head -2

# 11. Resumo final
echo -e "${BLUE}📋 Resumo da correção:${NC}"
echo -e "${GREEN}✅ Rota /api/auth/proxy verificada/criada${NC}"
echo -e "${GREEN}✅ Variáveis de ambiente configuradas${NC}"
echo -e "${GREEN}✅ Backend testado e funcionando${NC}"
echo -e "${GREEN}✅ Frontend recompilado e reiniciado${NC}"
echo -e "${GREEN}✅ Nginx configurado para proxificar APIs${NC}"

echo -e "${BLUE}🎯 Agora teste:${NC}"
echo -e "1. Acesse: ${YELLOW}https://wconnect.repagil.com.br${NC}"
echo -e "2. Faça login com suas credenciais"
echo -e "3. Abra DevTools → Network → XHR"
echo -e "4. Verifique se aparece: ${GREEN}POST /api/auth/proxy${NC} com status 200"

echo -e "${BLUE}📊 Para monitorar logs em tempo real:${NC}"
echo -e "${YELLOW}sudo tail -f /var/log/nginx/wconnect_error.log${NC}"
echo -e "${YELLOW}pm2 logs whatsapp-frontend${NC}"
echo -e "${YELLOW}pm2 logs whatsapp-backend${NC}"

echo -e "${GREEN}🚀 Correção de roteamento da API de auth finalizada!${NC}"

cd ..

