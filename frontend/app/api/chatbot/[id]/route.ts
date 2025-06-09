export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Dados simulados para demonstração
    const mockChatbot = {
      id: params.id,
      name: params.id === "1" ? "Assistente WhatsApp" : "Assistente Principal",
      description:
        params.id === "1"
          ? "Chatbot padrão para atendimento automático"
          : "Chatbot principal para atendimento automatizado",
      isActive: true,
      welcomeMessage: "Olá! Como posso ajudá-lo hoje?",
      fallbackMessage: "Desculpe, não entendi. Pode reformular sua pergunta?",
      responseDelay: 1000,
      maxRetries: 3,
      language: "pt-BR",
      timezone: "America/Sao_Paulo",
      workingHours: {
        enabled: true,
        start: "08:00",
        end: "18:00",
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      },
      responses: [
        {
          id: "1",
          trigger: "oi",
          response: "Olá! Como posso ajudá-lo?",
          isActive: true,
        },
        {
          id: "2",
          trigger: "preço",
          response: "Nossos preços variam conforme o plano. Gostaria de mais informações?",
          isActive: true,
        },
        {
          id: "3",
          trigger: "horário",
          response: "Funcionamos de segunda a sexta, das 8h às 18h.",
          isActive: false,
        },
      ],
    }

    return NextResponse.json({
      success: true,
      chatbot: mockChatbot,
    })
  } catch (error) {
    console.error("Erro ao buscar chatbot:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    // Aqui você salvaria no banco de dados
    console.log("Salvando chatbot:", params.id, body)

    return NextResponse.json({
      success: true,
      message: "Chatbot atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao salvar chatbot:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
