#!/bin/bash

echo "🚀 Configurando WhatsApp Web System..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não encontrado. Instalando..."
    sudo apt update
    sudo apt install postgresql postgresql-contrib -y
fi

# Criar banco de dados
echo "📊 Configurando banco de dados..."
sudo -u postgres createdb whatsapp_web 2>/dev/null || echo "Banco já existe"
sudo -u postgres createuser whatsapp_user 2>/dev/null || echo "Usuário já existe"
sudo -u postgres psql -c "ALTER USER whatsapp_user PASSWORD 'sua_senha';" 2>/dev/null

# Executar schema SQL
sudo -u postgres psql -d whatsapp_web -f database/schema.sql

# Instalar dependências
echo "📦 Instalando dependências..."
npm run install:all

# Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env 2>/dev/null || echo "Frontend .env não necessário"

echo "✅ Setup concluído!"
echo ""
echo "Para iniciar o sistema:"
echo "npm run dev"
echo ""
echo "URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "Banco: localhost:5432"
