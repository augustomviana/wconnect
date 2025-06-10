import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authorizationHeader = request.headers.get("authorization") // Pega o header Authorization

    if (!authorizationHeader) {
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    const response = await fetch(`${API_URL}/api/contacts?${searchParams}`, {
      headers: {
        "Content-Type": "application/json", // O backend espera JSON para algumas rotas, mas para GET pode não ser necessário
        Authorization: authorizationHeader, // Repassa o header Authorization
      },
    })

    const result = await response.json()
    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error("Erro no proxy /api/contacts:", error)
    return NextResponse.json({ error: "Erro interno do servidor no proxy de contatos" }, { status: 500 })
  }
}
