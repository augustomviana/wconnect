import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function GET(request: NextRequest, { params }: { params: { contact1: string; contact2: string } }) {
  try {
    const { contact1, contact2 } = params
    const authorizationHeader = request.headers.get("authorization")

    if (!authorizationHeader) {
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    if (!contact1 || !contact2) {
      return NextResponse.json({ error: "IDs dos contatos são obrigatórios" }, { status: 400 })
    }

    // A rota do backend é /api/messages/conversation/:contact1/:contact2
    const response = await fetch(`${API_URL}/api/messages/conversation/${contact1}/${contact2}`, {
      headers: {
        Authorization: authorizationHeader,
      },
    })

    const result = await response.json()
    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error("Erro no proxy de conversa:", error)
    return NextResponse.json({ error: "Erro interno do servidor no proxy de conversa" }, { status: 500 })
  }
}
