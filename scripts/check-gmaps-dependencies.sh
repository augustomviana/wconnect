#!/bin/bash

echo "🔍 Verificando dependências para o GMapExtractor..."

# Verificar se o puppeteer está instalado
if ! npm list puppeteer --prefix ./backend | grep -q puppeteer; then
  echo "📦 Instalando puppeteer..."
  cd backend && npm install puppeteer --save
  cd ..
else
  echo "✅ puppeteer já está instalado"
fi

# Verificar se o exceljs está instalado
if ! npm list exceljs --prefix ./backend | grep -q exceljs; then
  echo "📦 Instalando exceljs..."
  cd backend && npm install exceljs --save
  cd ..
else
  echo "✅ exceljs já está instalado"
fi

# Verificar se as tabelas existem no banco de dados
echo "🔍 Verificando tabelas no banco de dados..."

# Executar o script SQL para criar as tabelas se não existirem
echo "📝 Criando tabelas se não existirem..."
psql -h ${DB_HOST:-localhost} -U ${DB_USER:-whatsapp_user} -d ${DB_NAME:-whatsapp_web} -f  database/gmaps-extractor-schema.sql 2>/dev/null || echo "⚠️ Não foi possível executar o script SQL. Verifique se o PostgreSQL está instalado e rodando."

echo "✅ Verificação de dependências concluída!"
