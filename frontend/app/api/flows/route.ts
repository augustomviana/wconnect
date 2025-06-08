import { type NextRequest, NextResponse } from "next/server"

// Dados simulados para demonstração
const mockFlows = [
  {
    id: "1",
    name: "Atendimento Inicial",
    description: "Fluxo de boas-vindas e direcionamento inicial",
    isActive: true,
    trigger: "olá",
    steps: 5,
    completions: 127,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Suporte Técnico",
    description: "Fluxo para problemas técnicos e dúvidas",
    isActive: true,
    trigger: "suporte",
    steps: 8,
    completions: 89,
    createdAt: "2024-01-20T14:30:00Z",
  },
  {
    id: "3",
    name: "Vendas e Orçamentos",
    description: "Fluxo para consultas comerciais",
    isActive: false,
    trigger: "preço",
    steps: 6,
    completions: 45,
    createdAt: "2024-01-25T09:15:00Z",
  },
]

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      flows: mockFlows,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro ao buscar fluxos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newFlow = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description,
      isActive: body.isActive || false,
      trigger: body.trigger,
      steps: body.steps || 1,
      completions: 0,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      flow: newFlow,
      message: "Fluxo criado com sucesso",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro ao criar fluxo" }, { status: 500 })
  }
}
