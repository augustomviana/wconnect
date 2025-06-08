import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json({
      success: true,
      message: "Fluxo duplicado com sucesso",
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erro ao duplicar fluxo" }, { status: 500 })
  }
}
