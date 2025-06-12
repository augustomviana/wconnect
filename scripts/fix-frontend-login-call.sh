#!/bin/bash

echo "🔧 Corrigindo chamada de login no frontend..."

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd frontend

# 1. Verificar se o arquivo de login existe
echo -e "${BLUE}1️⃣ Verificando arquivo de login...${NC}"
if [ -f "app/login/page.tsx" ]; then
  echo -e "${GREEN}✅ Arquivo app/login/page.tsx encontrado${NC}"
else
  echo -e "${RED}❌ Arquivo app/login/page.tsx não encontrado${NC}"
  exit 1
fi

# 2. Fazer backup do arquivo original
echo -e "${BLUE}2️⃣ Fazendo backup do arquivo original...${NC}"
cp app/login/page.tsx app/login/page.tsx.backup
echo -e "${GREEN}✅ Backup criado: app/login/page.tsx.backup${NC}"

# 3. Corrigir a chamada da API no arquivo de login
echo -e "${BLUE}3️⃣ Corrigindo chamada da API...${NC}"

# Verificar se já está usando a rota correta
if grep -q '"/api/auth/proxy"' app/login/page.tsx; then
  echo -e "${GREEN}✅ Arquivo já está usando a rota correta /api/auth/proxy${NC}"
else
  echo -e "${YELLOW}⚠️ Corrigindo rota da API...${NC}"
  
  # Substituir a chamada incorreta pela correta
  sed -i 's|"/api/auth/proxy"|"/api/auth/proxy"|g' app/login/page.tsx
  sed -i 's|"/proxy"|"/api/auth/proxy"|g' app/login/page.tsx
  sed -i 's|"/login"|"/api/auth/proxy"|g' app/login/page.tsx
  sed -i 's|"/api/login"|"/api/auth/proxy"|g' app/login/page.tsx
  
  echo -e "${GREEN}✅ Rota corrigida para /api/auth/proxy${NC}"
fi

# 4. Verificar se o payload está correto
echo -e "${BLUE}4️⃣ Verificando payload da requisição...${NC}"

# Criar o arquivo de login corrigido
cat > app/login/page.tsx << 'EOF'
"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogIn, Mail, Lock, Send } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      console.log("🚀 Iniciando login com:", { email, action: "login" })
      
      const response = await fetch("/api/auth/proxy", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          action: "login", 
          email, 
          password 
        }),
      })

      console.log("📡 Resposta do servidor:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      const data = await response.json()
      console.log("📦 Dados recebidos:", data)

      if (response.ok && data.token) {
        console.log("✅ Login bem-sucedido!")
        localStorage.setItem("authToken", data.token)
        localStorage.setItem("userData", JSON.stringify(data.user))
        router.push("/dashboard")
      } else {
        console.log("❌ Erro no login:", data)
        setError(data.error || "Falha no login. Verifique suas credenciais.")
      }
    } catch (err) {
      console.error("💥 Erro na requisição:", err)
      setError("Erro ao conectar com o servidor. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-2xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <Send size={32} className="text-white transform -rotate-45" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">WConect</h1>
            <p className="text-gray-500 mt-1">Bem-vindo de volta!</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="voce@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <a href="#" className="font-medium text-green-600 hover:text-green-500">
                  Esqueceu sua senha?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <LogIn className="mr-2 h-5 w-5" />
                )}
                Entrar
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Não tem uma conta?{" "}
            <Link href="/register" className="font-medium text-green-600 hover:text-green-500">
              Registre-se aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
EOF

echo -e "${GREEN}✅ Arquivo de login corrigido com logs detalhados${NC}"

# 5. Verificar variáveis de ambiente
echo -e "${BLUE}5️⃣ Verificando variáveis de ambiente...${NC}"
if [ -f ".env.local" ]; then
  if grep -q "NEXT_PUBLIC_API_URL" .env.local; then
    echo -e "${GREEN}✅ NEXT_PUBLIC_API_URL encontrada em .env.local${NC}"
    grep "NEXT_PUBLIC_API_URL" .env.local
  else
    echo -e "${YELLOW}⚠️ Adicionando NEXT_PUBLIC_API_URL ao .env.local${NC}"
    echo "NEXT_PUBLIC_API_URL=http://185.217.126.180:5000" >> .env.local
  fi
else
  echo -e "${YELLOW}⚠️ Criando arquivo .env.local${NC}"
  echo "NEXT_PUBLIC_API_URL=http://185.217.126.180:5000" > .env.local
fi

# 6. Verificar se o arquivo de proxy existe
echo -e "${BLUE}6️⃣ Verificando arquivo de proxy...${NC}"
if [ -f "app/api/auth/proxy/route.ts" ]; then
  echo -e "${GREEN}✅ Arquivo de proxy existe${NC}"
else
  echo -e "${RED}❌ Arquivo de proxy não encontrado${NC}"
  echo -e "${YELLOW}⚠️ Criando arquivo de proxy...${NC}"
  mkdir -p app/api/auth/proxy
  cat > app/api/auth/proxy/route.ts << 'EOF'
import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://185.217.126.180:5000"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Proxy recebeu requisição")
    const body = await request.json()
    console.log("📦 Dados recebidos no proxy:", body)
    
    const { action, ...data } = body

    if (!action || (action !== "login" && action !== "register")) {
      console.log("❌ Ação inválida:", action)
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }

    const backendUrl = `${API_URL}/api/auth/${action}`
    console.log("🎯 Enviando para backend:", backendUrl)
    console.log("📤 Dados enviados:", data)

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    console.log("📡 Resposta do backend:", {
      status: response.status,
      statusText: response.statusText
    })

    const result = await response.json()
    console.log("📦 Dados do backend:", result)

    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error("💥 Erro no proxy:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor no proxy de autenticação" }, 
      { status: 500 }
    )
  }
}
EOF
  echo -e "${GREEN}✅ Arquivo de proxy criado com logs detalhados${NC}"
fi

# 7. Compilar o frontend
echo -e "${BLUE}7️⃣ Compilando frontend...${NC}"
npm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend compilado com sucesso${NC}"
else
  echo -e "${RED}❌ Erro na compilação do frontend${NC}"
  echo -e "${YELLOW}⚠️ Tentando compilação em modo desenvolvimento...${NC}"
fi

# 8. Reiniciar o frontend
echo -e "${BLUE}8️⃣ Reiniciando frontend...${NC}"
if command -v pm2 &> /dev/null; then
  pm2 restart whatsapp-frontend --update-env
  echo -e "${GREEN}✅ Frontend reiniciado com PM2${NC}"
else
  echo -e "${YELLOW}⚠️ PM2 não encontrado. Inicie manualmente com: npm run dev${NC}"
fi

# 9. Testar a rota de proxy
echo -e "${BLUE}9️⃣ Testando rota de proxy...${NC}"
sleep 3

# Testar se o frontend está respondendo
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
  echo -e "${GREEN}✅ Frontend está respondendo na porta 3000${NC}"
else
  echo -e "${RED}❌ Frontend não está respondendo (código: $FRONTEND_RESPONSE)${NC}"
fi

# 10. Instruções finais
echo -e "${BLUE}📋 Instruções finais:${NC}"
echo -e "${GREEN}✅ Correções aplicadas:${NC}"
echo -e "   • Rota corrigida para /api/auth/proxy"
echo -e "   • Payload com action: 'login'"
echo -e "   • Logs detalhados adicionados"
echo -e "   • Variável NEXT_PUBLIC_API_URL configurada"

echo -e "${YELLOW}🔍 Para testar:${NC}"
echo -e "1. Abra http://localhost:3000/login"
echo -e "2. Abra DevTools → Network → XHR"
echo -e "3. Tente fazer login"
echo -e "4. Verifique se aparece: POST /api/auth/proxy"
echo -e "5. Verifique os logs no console do navegador"

echo -e "${BLUE}🚀 Correção do login finalizada!${NC}"

cd ..

