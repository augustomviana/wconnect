import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    const campaignId = params.id

    // Fazer requisição real para o backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000"
    const response = await fetch(`${backendUrl}/api/gmaps-extractor/campaigns/${campaignId}/results`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao buscar resultados")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro na API:", error)
    return NextResponse.json(
      {
        success: false,
        results: [],
      },
      { status: 500 },
    )
  }
}
