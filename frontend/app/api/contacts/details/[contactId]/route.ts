export const dynamic = 'force-dynamic';
// Nova rota proxy para buscar detalhes de um contato específico
import { type NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function GET(request: NextRequest, { params }: { params: { contactId: string } }) {
  try {
    const { contactId } = params
    const authorizationHeader = request.headers.get("authorization")

    if (!authorizationHeader) {
      return NextResponse.json({ error: "Token de acesso requerido" }, { status: 401 })
    }

    if (!contactId) {
      return NextResponse.json({ error: "ID do contato é obrigatório" }, { status: 400 })
    }

    // A rota do backend é /api/contacts/:id. Se o ID for um whatsapp_id, o backend precisa tratar isso.
    // Vamos assumir que o backend /api/contacts/:id pode buscar por whatsapp_id se o formato for xxxxx@c.us
    // ou por ID numérico do banco.
    // Se o backend só busca por ID numérico, precisaremos de uma rota específica no backend
    // como /api/contacts/whatsapp/:whatsappId
    const response = await fetch(`${API_URL}/api/contacts/whatsapp/${contactId}`, {
      // Assumindo nova rota no backend
      headers: {
        Authorization: authorizationHeader,
      },
    })

    const result = await response.json()
    return NextResponse.json(result, { status: response.status })
  } catch (error) {
    console.error("Erro no proxy de detalhes do contato:", error)
    return NextResponse.json({ error: "Erro interno do servidor no proxy de detalhes do contato" }, { status: 500 })
  }
}
