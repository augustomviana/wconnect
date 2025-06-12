import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]

    // Verificar se as variáveis de ambiente estão configuradas
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

    console.log("Tentando conectar ao backend:", backendUrl)

    // Fazer requisição real para o backend com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout

    try {
      const response = await fetch(`${backendUrl}/api/gmaps-extractor/campaigns`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.log("Backend respondeu com erro:", response.status, response.statusText)
        throw new Error(`Backend error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Dados recebidos do backend:", data)
      return NextResponse.json(data)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.log("Erro ao conectar com backend:", fetchError)

      // Se o backend não estiver disponível, retornar array vazio
      return NextResponse.json({
        success: true,
        campaigns: [],
        message: "Backend não disponível - mostrando dados locais",
      })
    }
  } catch (error) {
    console.error("Erro geral na API:", error)
    return NextResponse.json({
      success: true,
      campaigns: [],
      message: "Erro na API - mostrando dados locais",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = request.headers.get("authorization")?.split(" ")[1]

    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

    console.log("Criando campanha no backend:", backendUrl)
    console.log("Dados da campanha:", body)

    // Fazer requisição com timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos para criação

    try {
      const response = await fetch(`${backendUrl}/api/gmaps-extractor/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
        console.log("Erro do backend:", errorData)
        return NextResponse.json(errorData, { status: response.status })
      }

      const data = await response.json()
      console.log("Campanha criada com sucesso:", data)
      return NextResponse.json(data)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.log("Erro ao conectar com backend para criar campanha:", fetchError)

      // Simular criação local se backend não estiver disponível
      const mockCampaign = {
        id: Date.now().toString(),
        name: body.name,
        status: "pending",
        total_results: 0,
        created_at: new Date().toISOString(),
        search_queries: body.searchQueries,
      }

      return NextResponse.json({
        success: true,
        campaign: mockCampaign,
        message: "Campanha criada localmente - backend não disponível",
      })
    }
  } catch (error) {
    console.error("Erro geral ao criar campanha:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
