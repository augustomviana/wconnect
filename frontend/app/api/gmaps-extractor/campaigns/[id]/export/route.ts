import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    const campaignId = params.id

    // Fazer requisição real para o backend
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000"
    const response = await fetch(`${backendUrl}/api/gmaps-extractor/campaigns/${campaignId}/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao exportar resultados")
    }

    // Obter o blob do backend e repassar para o frontend
    const blob = await response.blob()

    // Criar uma resposta com o blob
    return new Response(blob, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="gmaps-results-${campaignId}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Erro na API:", error)
    return NextResponse.json({ error: "Erro ao exportar resultados" }, { status: 500 })
  }
}
