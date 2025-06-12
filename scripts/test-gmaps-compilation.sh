#!/bin/bash

echo "🔧 Testando compilação do GMaps Extractor..."

cd backend

echo "1️⃣ Limpando cache..."
rm -rf dist/
rm -rf node_modules/.cache/

echo "2️⃣ Compilando TypeScript..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ Compilação bem-sucedida!"
    
    echo "3️⃣ Iniciando servidor de teste..."
    timeout 10s npm run dev &
    SERVER_PID=$!
    
    sleep 5
    
    echo "4️⃣ Testando rota GMaps..."
    curl -s http://localhost:5000/api/gmaps-extractor/campaigns || echo "Rota não encontrada"
    
    kill $SERVER_PID 2>/dev/null
    
    echo "✅ Teste concluído!"
else
    echo "❌ Erro de compilação"
    exit 1
fi
