export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const response = await fetch(`${API_URL}/api/settings/${params.category}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json(
      { success: false, error: "Falha ao buscar configurações" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${API_URL}/api/settings/${params.category}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    return NextResponse.json(
      { success: false, error: "Falha ao atualizar configurações" },
      { status: 500 }
    )
  }
}