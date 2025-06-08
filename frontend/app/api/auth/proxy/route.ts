// Renomeando frontend/app/api/auth/route.ts para frontend/app/api/auth/proxy/route.ts
// para evitar conflito com a pasta /auth do backend se estivessem no mesmo nível de proxy reverso.
// E para ser mais explícito sobre sua função.

import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body // action será 'login' ou 'register'

    if (!action || (action !== "login" && action !== "register")) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }

    const response = await fetch(`${API_URL}/api/auth/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    const status = response.status

    // Se for login e bem-sucedido, o backend já envia o token.
    // Se for registro e bem-sucedido, o backend envia os dados do usuário.
    return NextResponse.json(result, { status })
  } catch (error) {
    console.error(`Erro no proxy de autenticação (${(error as Error).message}):`, error)
    return NextResponse.json({ error: "Erro interno do servidor no proxy de autenticação" }, { status: 500 })
  }
}
