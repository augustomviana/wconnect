#!/bin/bash

echo "⚡ WhatsApp Web System - Quick Start"
echo "===================================="

# Verificar se está na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script na pasta raiz do projeto"
    exit 1
fi

# Configurar .env do backend
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Configurando variáveis de ambiente..."
    cat > backend/.env << 'EOF'
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=whatsapp_web
DB_USER=whatsapp_user
DB_PASSWORD=sua_senha

JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
JWT_EXPIRES_IN=7d

WHATSAPP_SESSION_PATH=./sessions
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
EOF
fi

# Configurar .env do frontend
if [ ! -f "frontend/.env.local" ]; then
    cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
EOF
fi

echo "🚀 Iniciando sistema..."
npm run dev
