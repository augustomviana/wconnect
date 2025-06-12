#!/bin/bash

echo "🚀 Aplicando correção final do GMaps Extractor..."

cd backend

echo "1️⃣ Limpando cache e node_modules..."
rm -rf dist/
rm -rf node_modules/.cache/
rm -rf .tsbuildinfo

echo "2️⃣ Reinstalando dependências..."
npm install

echo "3️⃣ Instalando dependências específicas do GMaps..."
npm install puppeteer exceljs @types/node

echo "4️⃣ Testando compilação TypeScript..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ Compilação bem-sucedida!"
    
    echo "5️⃣ Construindo projeto..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build bem-sucedido!"
        
        echo "6️⃣ Iniciando servidor de teste..."
        timeout 15s npm run dev &
        SERVER_PID=$!
        
        sleep 8
        
        echo "7️⃣ Testando rotas do GMaps..."
        echo "Testando GET /api/gmaps-extractor/campaigns..."
        curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/gmaps-extractor/campaigns
        echo ""
        
        echo "Testando POST /api/gmaps-extractor/campaigns..."
        curl -s -o /dev/null -w "%{http_code}" -X POST \
          -H "Content-Type: application/json" \
          -d '{"name":"teste","searchQueries":["teste"],"options":{}}' \
          http://localhost:5000/api/gmaps-extractor/campaigns
        echo ""
        
        kill $SERVER_PID 2>/dev/null
        wait $SERVER_PID 2>/dev/null
        
        echo "8️⃣ Verificando estrutura de arquivos..."
        if [ -f "src/services/gmaps-extractor.ts" ]; then
            echo "✅ Serviço GMaps existe"
        else
            echo "❌ Serviço GMaps não encontrado"
        fi
        
        if [ -f "src/routes/gmaps-extractor.ts" ]; then
            echo "✅ Rotas GMaps existem"
        else
            echo "❌ Rotas GMaps não encontradas"
        fi
        
        echo ""
        echo "🎉 Correção final aplicada com sucesso!"
        echo "📋 Próximos passos:"
        echo "   1. cd backend && npm run dev"
        echo "   2. Teste o frontend em http://localhost:3000"
        echo "   3. Acesse GMaps Extractor no dashboard"
        
    else
        echo "❌ Erro no build"
        exit 1
    fi
else
    echo "❌ Erro de compilação TypeScript"
    echo "Verificando erros específicos..."
    npx tsc --noEmit --listFiles | grep -E "(error|Error)"
    exit 1
fi
