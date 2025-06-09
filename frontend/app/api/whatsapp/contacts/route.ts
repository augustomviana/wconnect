export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function GET(request: NextRequest) {
  try {
    const authorizationHeader = request.headers.get("authorization")

    if (!authorizationHeader) {
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }
    console.log("Fazendo requisição para:", `${API_URL}/api/whatsapp/contacts com token`)

    const response = await fetch(`${API_URL}/api/whatsapp/contacts`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorizationHeader, // Repassa o token
      },
    })

    console.log("Status da resposta do backend:", response.status)
    const result = await response.json()
    console.log("Resultado do backend:", result)

    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error("Erro ao sincronizar contatos via proxy:", error)
    return NextResponse.json({ error: "Erro interno do servidor no proxy de sincronização" }, { status: 500 })
  }
}
