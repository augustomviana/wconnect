#!/bin/bash

echo "🔍 Diagnosticando erro 404 e problemas de servidor..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar se o backend está rodando
echo -e "${BLUE}1️⃣ Verificando se o backend está rodando...${NC}"
BACKEND_PID=$(lsof -i:5000 -t 2>/dev/null)
if [ ! -z "$BACKEND_PID" ]; then
  echo -e "${GREEN}✅ Backend está rodando no PID $BACKEND_PID${NC}"
  
  # Testar se o backend responde
  echo -e "${YELLOW}⚠️ Testando resposta do backend...${NC}"
  HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:5000/health -o /tmp/health_response.txt)
  HTTP_CODE="${HEALTH_RESPONSE: -3}"
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Backend responde corretamente (HTTP 200)${NC}"
    cat /tmp/health_response.txt
  else
    echo -e "${RED}❌ Backend não responde corretamente (HTTP $HTTP_CODE)${NC}"
    echo "Resposta:"
    cat /tmp/health_response.txt
  fi
else
  echo -e "${RED}❌ Backend não está rodando${NC}"
  echo -e "${YELLOW}⚠️ Iniciando backend...${NC}"
  cd backend
  npm run dev &
  BACKEND_PID=$!
  echo -e "${GREEN}✅ Backend iniciado com PID $BACKEND_PID${NC}"
  sleep 5
  cd ..
fi

# 2. Verificar se o frontend está rodando
echo -e "${BLUE}2️⃣ Verificando se o frontend está rodando...${NC}"
FRONTEND_PID=$(lsof -i:3000 -t 2>/dev/null)
if [ ! -z "$FRONTEND_PID" ]; then
  echo -e "${GREEN}✅ Frontend está rodando no PID $FRONTEND_PID${NC}"
else
  echo -e "${RED}❌ Frontend não está rodando${NC}"
  echo -e "${YELLOW}⚠️ Iniciando frontend...${NC}"
  cd frontend
  npm run dev &
  FRONTEND_PID=$!
  echo -e "${GREEN}✅ Frontend iniciado com PID $FRONTEND_PID${NC}"
  sleep 5
  cd ..
fi

# 3. Testar rotas específicas que podem estar causando 404
echo -e "${BLUE}3️⃣ Testando rotas específicas...${NC}"

# Lista de rotas para testar
ROUTES=(
  "http://localhost:5000/health"
  "http://localhost:5000/api/test"
  "http://localhost:5000/api/integrations"
  "http://localhost:5000/api/gmaps-extractor/campaigns"
  "http://localhost:3000/api/integrations"
  "http://localhost:3000/api/gmaps-extractor/campaigns"
)

for route in "${ROUTES[@]}"; do
  echo -e "${YELLOW}⚠️ Testando: $route${NC}"
  RESPONSE=$(curl -s -w "%{http_code}" "$route" -o /tmp/route_response.txt)
  HTTP_CODE="${RESPONSE: -3}"
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ $route - OK (HTTP 200)${NC}"
  else
    echo -e "${RED}❌ $route - ERRO (HTTP $HTTP_CODE)${NC}"
    echo "Resposta:"
    head -n 5 /tmp/route_response.txt
    echo "..."
  fi
done

# 4. Verificar variáveis de ambiente
echo -e "${BLUE}4️⃣ Verificando variáveis de ambiente...${NC}"

# Verificar frontend .env
if [ -f "frontend/.env.local" ]; then
  echo -e "${GREEN}✅ frontend/.env.local existe${NC}"
  echo "Conteúdo:"
  cat frontend/.env.local
else
  echo -e "${RED}❌ frontend/.env.local não existe${NC}"
  echo -e "${YELLOW}⚠️ Criando frontend/.env.local...${NC}"
  cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=seu_segredo_nextauth
EOF
  echo -e "${GREEN}✅ frontend/.env.local criado${NC}"
fi

# Verificar backend .env
if [ -f "backend/.env" ]; then
  echo -e "${GREEN}✅ backend/.env existe${NC}"
else
  echo -e "${RED}❌ backend/.env não existe${NC}"
  echo -e "${YELLOW}⚠️ Criando backend/.env...${NC}"
  cat > backend/.env << EOF
PORT=5000
DB_USER=whatsapp_user
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_web
JWT_SECRET=seu_segredo_jwt
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
EOF
  echo -e "${GREEN}✅ backend/.env criado${NC}"
fi

# 5. Verificar se as rotas estão registradas no server.ts
echo -e "${BLUE}5️⃣ Verificando rotas registradas no backend...${NC}"
cd backend

if [ -f "src/server.ts" ]; then
  echo -e "${GREEN}✅ src/server.ts existe${NC}"
  
  # Verificar se as rotas estão registradas
  if grep -q "integrations" src/server.ts; then
    echo -e "${GREEN}✅ Rota integrations está registrada${NC}"
  else
    echo -e "${RED}❌ Rota integrations NÃO está registrada${NC}"
  fi
  
  if grep -q "gmaps-extractor" src/server.ts; then
    echo -e "${GREEN}✅ Rota gmaps-extractor está registrada${NC}"
  else
    echo -e "${RED}❌ Rota gmaps-extractor NÃO está registrada${NC}"
  fi
else
  echo -e "${RED}❌ src/server.ts não existe${NC}"
fi

# 6. Verificar se os arquivos de rota existem
echo -e "${BLUE}6️⃣ Verificando arquivos de rota...${NC}"

ROUTE_FILES=(
  "src/routes/integrations.ts"
  "src/routes/gmaps-extractor.ts"
  "src/routes/auth.ts"
  "src/routes/contacts.ts"
)

for file in "${ROUTE_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅ $file existe${NC}"
  else
    echo -e "${RED}❌ $file NÃO existe${NC}"
  fi
done

# 7. Verificar logs do backend
echo -e "${BLUE}7️⃣ Verificando logs do backend...${NC}"
if [ ! -z "$BACKEND_PID" ]; then
  echo -e "${YELLOW}⚠️ Últimas linhas do log do backend:${NC}"
  # Como o backend está rodando em background, vamos verificar se há logs
  if [ -f "backend.log" ]; then
    tail -n 10 backend.log
  else
    echo -e "${YELLOW}⚠️ Arquivo de log não encontrado${NC}"
  fi
fi

# 8. Recompilar e reiniciar backend se necessário
echo -e "${BLUE}8️⃣ Recompilando e reiniciando backend...${NC}"

# Parar backend atual
if [ ! -z "$BACKEND_PID" ]; then
  echo -e "${YELLOW}⚠️ Parando backend atual...${NC}"
  kill -9 $BACKEND_PID 2>/dev/null
  sleep 2
fi

# Recompilar
echo -e "${YELLOW}⚠️ Recompilando TypeScript...${NC}"
npm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Compilação bem-sucedida${NC}"
else
  echo -e "${RED}❌ Erro na compilação${NC}"
  echo -e "${YELLOW}⚠️ Tentando executar sem compilação...${NC}"
fi

# Reiniciar backend
echo -e "${YELLOW}⚠️ Reiniciando backend...${NC}"
npm run dev > backend.log 2>&1 &
NEW_BACKEND_PID=$!
echo -e "${GREEN}✅ Backend reiniciado com PID $NEW_BACKEND_PID${NC}"

# Aguardar inicialização
sleep 5

# 9. Testar novamente após reinicialização
echo -e "${BLUE}9️⃣ Testando rotas após reinicialização...${NC}"

# Testar rota principal
echo -e "${YELLOW}⚠️ Testando /health...${NC}"
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:5000/health -o /tmp/final_health.txt)
HTTP_CODE="${HEALTH_RESPONSE: -3}"

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Backend funcionando corretamente!${NC}"
  cat /tmp/final_health.txt
else
  echo -e "${RED}❌ Backend ainda com problemas (HTTP $HTTP_CODE)${NC}"
  echo "Resposta:"
  cat /tmp/final_health.txt
  
  # Mostrar logs do backend
  echo -e "${YELLOW}⚠️ Logs do backend:${NC}"
  tail -n 20 backend.log
fi

cd ..

# 10. Criar script de teste para o frontend
echo -e "${BLUE}🔟 Criando script de teste para o frontend...${NC}"
cat > test-frontend-api.js << 'EOF'
// Teste das APIs do frontend
const testAPIs = async () => {
  const apis = [
    'http://localhost:3000/api/integrations',
    'http://localhost:3000/api/gmaps-extractor/campaigns'
  ];
  
  for (const api of apis) {
    try {
      console.log(`Testando: ${api}`);
      const response = await fetch(api);
      const data = await response.text();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${data.substring(0, 200)}...`);
      console.log('---');
    } catch (error) {
      console.error(`Erro ao testar ${api}:`, error.message);
    }
  }
};

testAPIs();
EOF

echo -e "${YELLOW}⚠️ Testando APIs do frontend...${NC}"
node test-frontend-api.js

# 11. Resumo e próximos passos
echo -e "${BLUE}📋 RESUMO DO DIAGNÓSTICO:${NC}"
echo -e "${GREEN}✅ Backend PID: $NEW_BACKEND_PID${NC}"
echo -e "${GREEN}✅ Frontend PID: $FRONTEND_PID${NC}"

echo -e "${YELLOW}🔧 PRÓXIMOS PASSOS:${NC}"
echo "1. Acesse http://localhost:3000 no navegador"
echo "2. Abra o DevTools (F12) e vá na aba Network"
echo "3. Navegue até a página que está dando erro"
echo "4. Verifique quais requisições estão falhando"
echo "5. Se ainda houver erro 404, execute:"
echo "   - tail -f backend/backend.log (para ver logs em tempo real)"
echo "   - curl -v http://localhost:5000/api/integrations"

echo -e "${GREEN}🚀 Diagnóstico concluído!${NC}"

