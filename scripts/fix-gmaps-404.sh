#!/bin/bash

echo "🔧 Diagnosticando problema 404 do GMapExtractor..."

# 1. Verificar se o backend está rodando
echo "1️⃣ Verificando se o backend está rodando..."
if ! curl -s http://localhost:5000/health > /dev/null; then
    echo "❌ Backend não está rodando"
    echo "Execute: cd backend && npm run dev"
    exit 1
fi
echo "✅ Backend está rodando"

# 2. Verificar se o arquivo de rota existe
echo "2️⃣ Verificando arquivo de rota..."
if [ ! -f "backend/src/routes/gmaps-extractor.ts" ]; then
    echo "❌ Arquivo gmaps-extractor.ts não encontrado"
    exit 1
fi
echo "✅ Arquivo de rota existe"

# 3. Testar compilação TypeScript
echo "3️⃣ Testando compilação..."
cd backend
npx tsc --noEmit src/routes/gmaps-extractor.ts || {
    echo "❌ Erro de compilação TypeScript"
    exit 1
}
echo "✅ Compilação OK"

# 4. Verificar se as dependências estão instaladas
echo "4️⃣ Verificando dependências..."
npm list puppeteer > /dev/null || {
    echo "❌ Puppeteer não instalado"
    npm install puppeteer
}

npm list exceljs > /dev/null || {
    echo "❌ ExcelJS não instalado"
    npm install exceljs
}

npm list @types/puppeteer > /dev/null || {
    echo "❌ Tipos do Puppeteer não instalados"
    npm install --save-dev @types/puppeteer
}

echo "✅ Dependências OK"

# 5. Verificar tabelas do banco
echo "5️⃣ Verificando tabelas do banco..."
cd ..
chmod +x scripts/check-gmaps-tables.sh
./scripts/check-gmaps-tables.sh

# 6. Testar rota diretamente
echo "6️⃣ Testando rota..."
curl -s -X GET http://localhost:5000/api/gmaps-extractor/campaigns \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" || echo "❌ Rota não responde"

echo "✅ Diagnóstico concluído"
echo "Reinicie o backend: cd backend && npm run dev"
