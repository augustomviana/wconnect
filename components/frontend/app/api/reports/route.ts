import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "7d"

    // Simular dados de relatório
    const stats = {
      totalMessages: Math.floor(Math.random() * 10000) + 1000,
      totalContacts: Math.floor(Math.random() * 1000) + 100,
      activeChats: Math.floor(Math.random() * 50) + 10,
      botResponses: Math.floor(Math.random() * 5000) + 500,
      responseTime: Math.floor(Math.random() * 10) + 2,
      satisfactionRate: Math.floor(Math.random() * 30) + 70,
    }

    const chartData = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      messages: Math.floor(Math.random() * 500) + 100,
      contacts: Math.floor(Math.random() * 50) + 10,
      botResponses: Math.floor(Math.random() * 200) + 50,
    }))

    return NextResponse.json({
      success: true,
      stats,
      chartData,
    })
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
