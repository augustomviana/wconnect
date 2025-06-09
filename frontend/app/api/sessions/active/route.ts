export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Simular sessões ativas
    const sessions = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
      id: `session-${i + 1}`,
      contactName: `Contato ${i + 1}`,
      contactPhone: `+55119${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      lastActivity: new Date(Date.now() - Math.random() * 1800000).toISOString(),
      messageCount: Math.floor(Math.random() * 50) + 1,
      status: ["active", "idle", "waiting"][Math.floor(Math.random() * 3)] as "active" | "idle" | "waiting",
      platform: ["whatsapp", "telegram", "web"][Math.floor(Math.random() * 3)] as "whatsapp" | "telegram" | "web",
    }))

    return NextResponse.json({
      success: true,
      sessions,
    })
  } catch (error) {
    console.error("Erro ao buscar sessões ativas:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
