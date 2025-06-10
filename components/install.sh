#!/bin/bash

echo "🚀 WhatsApp Web System - Instalação Automática"
echo "================================================"

# Verificar dependências
command -v node >/dev/null 2>&1 || { echo "❌ Node.js é necessário. Instale primeiro."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm é necessário. Instale primeiro."; exit 1; }

# Criar estrutura do projeto
echo "📁 Criando estrutura de pastas..."
mkdir -p whatsapp-web-system/{frontend,backend,database,shared,docs,scripts}
cd whatsapp-web-system

# Frontend package.json
echo "📦 Configurando frontend..."
mkdir -p frontend/{app,components,lib,hooks,public}
mkdir -p frontend/app/{contacts,messages,api}

cat > frontend/package.json << 'EOF'
{
  "name": "whatsapp-web-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18",
    "react-dom": "^18",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "lucide-react": "^0.294.0",
    "socket.io-client": "^4.7.4",
    "axios": "^1.6.0"
  }
}
EOF

# Backend package.json
echo "📦 Configurando backend..."
mkdir -p backend/{src,config,uploads}
mkdir -p backend/src/{controllers,models,routes,middleware,services,utils}

cat > backend/package.json << 'EOF'
{
  "name": "whatsapp-web-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.4",
    "whatsapp-web.js": "^1.23.0",
    "qrcode": "^1.5.3",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1",
    "joi": "^17.11.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.9.0",
    "@types/pg": "^8.10.7",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/multer": "^1.4.11",
    "typescript": "^5.2.2",
    "nodemon": "^3.0.1",
    "ts-node": "^10.9.1"
  }
}
EOF

# Root package.json
cat > package.json << 'EOF'
{
  "name": "whatsapp-web-system",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF

# Instalar dependências
echo "📦 Instalando dependências..."
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

echo "✅ Estrutura básica criada!"
echo ""
echo "⚠️  PRÓXIMOS PASSOS:"
echo "1. Copie os arquivos de código do v0 para as pastas correspondentes"
echo "2. Configure o banco PostgreSQL"
echo "3. Configure as variáveis de ambiente"
echo "4. Execute: npm run dev"
echo ""
echo "📁 Estrutura criada em: $(pwd)"
