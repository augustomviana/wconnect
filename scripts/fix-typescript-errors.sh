#!/bin/bash

echo "🔧 Corrigindo erros de TypeScript..."

# Criar diretório de tipos se não existir
mkdir -p backend/src/types

# Verificar se o arquivo de tipos já existe
if [ ! -f "backend/src/types/express.d.ts" ]; then
    echo "📝 Criando arquivo de tipos..."
    cat > backend/src/types/express.d.ts << 'EOF'
import { JwtPayload } from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string
      }
    }
  }
}

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
}
EOF
    echo "✅ Arquivo de tipos criado"
else
    echo "ℹ️ Arquivo de tipos já existe"
fi

# Atualizar tsconfig.json para incluir os tipos
if [ -f "backend/tsconfig.json" ]; then
    echo "📝 Atualizando tsconfig.json..."
    
    # Backup do arquivo original
    cp backend/tsconfig.json backend/tsconfig.json.backup
    
    # Verificar se typeRoots já existe
    if ! grep -q "typeRoots" backend/tsconfig.json; then
        # Adicionar typeRoots ao compilerOptions
        sed -i 's/"compilerOptions": {/"compilerOptions": {\n    "typeRoots": ["node_modules\/@types", "src\/types"],/' backend/tsconfig.json
        echo "✅ typeRoots adicionado ao tsconfig.json"
    else
        echo "ℹ️ typeRoots já configurado"
    fi
fi

echo "🔧 Verificando dependências..."

# Verificar se as dependências necessárias estão instaladas
cd backend

if ! npm list @types/express > /dev/null 2>&1; then
    echo "📦 Instalando @types/express..."
    npm install --save-dev @types/express
fi

if ! npm list @types/jsonwebtoken > /dev/null 2>&1; then
    echo "📦 Instalando @types/jsonwebtoken..."
    npm install --save-dev @types/jsonwebtoken
fi

cd ..

echo "✅ Correções de TypeScript aplicadas com sucesso!"
echo "🚀 Agora você pode executar 'npm run dev' no backend"
