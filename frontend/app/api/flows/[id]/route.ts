export const dynamic = 'force-dynamic';
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Simular busca de fluxo específico
    const flow = {
      id: params.id,
      name: "Fluxo de Exemplo",
      description: "Descrição do fluxo",
      isActive: true,
      trigger: "exemplo",
      steps: 5,
      completions: 100,
      createdAt: "2024-01-15T10:00:00Z",
    }

    return NextResponse.json({
      success: true,
      flow,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro ao buscar fluxo" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    return NextResponse.json({
      success: true,
      message: "Fluxo atualizado com sucesso",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro ao atualizar fluxo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json({
      success: true,
      message: "Fluxo excluído com sucesso",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro ao excluir fluxo" }, { status: 500 })
  }
}
