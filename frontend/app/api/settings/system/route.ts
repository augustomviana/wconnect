export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // Simular busca das configurações do sistema
    const settings = {
      session_timeout: 3600,
      max_message_length: 4096,
      backup_enabled: true,
      backup_frequency: "daily",
      log_level: "info",
      notifications_enabled: true,
      email_notifications: false,
      webhook_url: "",
      api_rate_limit: 100,
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Erro ao buscar configurações do sistema:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()

    // Validar dados
    if (settings.session_timeout < 300 || settings.session_timeout > 86400) {
      return NextResponse.json({ error: "Timeout de sessão deve estar entre 300 e 86400 segundos" }, { status: 400 })
    }

    // Simular salvamento no banco
    console.log("Salvando configurações do sistema:", settings)

    return NextResponse.json({
      message: "Configurações do sistema salvas com sucesso",
      settings,
    })
  } catch (error) {
    console.error("Erro ao salvar configurações do sistema:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
