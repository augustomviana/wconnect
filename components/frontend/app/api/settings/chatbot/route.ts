import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // Simular busca das configurações do chatbot
    const settings = {
      enabled: true,
      welcome_message: "Olá! Como posso ajudá-lo hoje?",
      fallback_message: "Desculpe, não entendi sua mensagem. Pode reformular?",
      response_delay: 2,
      max_interactions: 10,
      business_hours_enabled: false,
      business_start: "09:00",
      business_end: "18:00",
      weekend_enabled: false,
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Erro ao buscar configurações do chatbot:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()

    // Validar dados
    if (!settings.welcome_message || !settings.fallback_message) {
      return NextResponse.json({ error: "Mensagens são obrigatórias" }, { status: 400 })
    }

    // Simular salvamento no banco
    console.log("Salvando configurações do chatbot:", settings)

    return NextResponse.json({
      message: "Configurações do chatbot salvas com sucesso",
      settings,
    })
  } catch (error) {
    console.error("Erro ao salvar configurações do chatbot:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
