#!/bin/bash

echo "🔧 Corrigindo problemas de TypeScript..."

# Navegar para o backend
cd backend

echo "1️⃣ Limpando cache do TypeScript..."
rm -rf dist/
rm -rf node_modules/.cache/
npm run clean 2>/dev/null || true

echo "2️⃣ Reinstalando dependências..."
npm install

echo "3️⃣ Instalando tipos necessários..."
npm install --save-dev @types/jsonwebtoken @types/dotenv

echo "4️⃣ Testando compilação..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ Compilação TypeScript corrigida!"
    
    echo "5️⃣ Testando build..."
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✅ Build bem-sucedido!"
        
        echo "6️⃣ Iniciando servidor..."
        npm run dev &
        SERVER_PID=$!
        
        echo "Aguardando servidor iniciar..."
        sleep 5
        
        echo "7️⃣ Testando rota do GMaps..."
        curl -s http://localhost:5000/api/gmaps-extractor/campaigns || echo "❌ Rota não encontrada"
        
        # Parar servidor
        kill $SERVER_PID 2>/dev/null
        
    else
        echo "❌ Erro no build"
    fi
else
    echo "❌ Ainda há erros de TypeScript"
fi

cd ..
