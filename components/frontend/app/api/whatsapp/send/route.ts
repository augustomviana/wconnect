import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const authorizationHeader = request.headers.get("authorization")
    if (!authorizationHeader) {
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`${API_URL}/api/whatsapp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorizationHeader,
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()
    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error("Erro no proxy /api/whatsapp/send:", error)
    return NextResponse.json({ error: "Erro interno do servidor no proxy de envio" }, { status: 500 })
  }
}
