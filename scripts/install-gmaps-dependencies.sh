#!/bin/bash

echo "🔍 Instalando dependências para o GMapExtractor..."

# Navegar para o diretório do backend
cd backend

# Instalar puppeteer e exceljs
npm install --save puppeteer exceljs

# Verificar se a instalação foi bem-sucedida
if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso!"
else
    echo "❌ Erro ao instalar dependências. Tente manualmente:"
    echo "cd backend && npm install --save puppeteer exceljs"
    exit 1
fi

# Criar diretório para exportações
mkdir -p exports
chmod 777 exports

echo "📊 Criando tabelas no banco de dados..."

# Executar script SQL para criar tabelas
psql -h ${DB_HOST:-localhost} -U ${DB_USER:-whatsapp_user} -d ${DB_NAME:-whatsapp_web} -f  ../database/gmaps-extractor-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Tabelas criadas com sucesso!"
else
    echo "❌ Erro ao criar tabelas. Verifique a conexão com o banco de dados."
    echo "Você pode executar manualmente: psql -U postgres -d whatsapp_db -f ../database/gmaps-extractor-schema.sql"
fi

echo "🚀 Configuração concluída!"
