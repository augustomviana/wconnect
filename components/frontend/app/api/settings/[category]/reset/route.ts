import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function POST(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const response = await fetch(`${API_URL}/api/settings/${params.category}/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao resetar configurações:", error)
    return NextResponse.json(
      { success: false, error: "Falha ao resetar configurações" },
      { status: 500 }
    )
  }
}