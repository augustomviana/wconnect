"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Users, TrendingUp, Activity, Send, UserPlus, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [whatsappStatus, setWhatsappStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected")
  const [stats, setStats] = useState({
    totalMessages: 1247,
    totalContacts: 43311,
    activeChats: 23,
    responseRate: 94.2,
  })

  useEffect(() => {
    // Simular carregamento de dados
    const timer = setTimeout(() => {
      setWhatsappStatus("disconnected")
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleConnectWhatsApp = () => {
    setWhatsappStatus("connecting")

    toast({
      title: "Conectando WhatsApp",
      description: "Redirecionando para página de conexão...",
    })

    setTimeout(() => {
      router.push("/dashboard/whatsapp")
    }, 1000)
  }

  const handleSendMessage = () => {
    router.push("/dashboard/contacts")
  }

  const handleManageContacts = () => {
    router.push("/dashboard/contacts")
  }

  const handleBulkMessage = () => {
    router.push("/dashboard/bulk-sending")
  }

  return (
    <div className="space-y-6">
      {/* Status do WhatsApp */}
      <Card
        className={`border-l-4 ${whatsappStatus === "connected" ? "border-l-green-500 bg-green-50" : "border-l-yellow-500 bg-yellow-50"}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Status do WhatsApp</CardTitle>
              <CardDescription>
                {whatsappStatus === "connected"
                  ? "Conectado e pronto para uso"
                  : whatsappStatus === "connecting"
                    ? "Conectando..."
                    : "Aguardando conexão"}
              </CardDescription>
            </div>
            <Button
              onClick={handleConnectWhatsApp}
              disabled={whatsappStatus === "connecting"}
              className={whatsappStatus === "connected" ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {whatsappStatus === "connecting" ? "Conectando..." : "Conectar"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% desde o mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+89 novos esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeChats}</div>
            <p className="text-xs text-muted-foreground">Conversas em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responseRate}%</div>
            <p className="text-xs text-muted-foreground">+2.1% desde ontem</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Acesse rapidamente as funcionalidades mais utilizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleSendMessage}
              className="h-24 flex flex-col items-center justify-center space-y-2"
              variant="outline"
            >
              <Send className="h-6 w-6" />
              <span>Enviar Mensagem</span>
              <span className="text-xs text-muted-foreground">Envie mensagens via WhatsApp</span>
            </Button>

            <Button
              onClick={handleManageContacts}
              className="h-24 flex flex-col items-center justify-center space-y-2"
              variant="outline"
            >
              <UserPlus className="h-6 w-6" />
              <span>Gerenciar Contatos</span>
              <span className="text-xs text-muted-foreground">Adicione ou edite contatos</span>
            </Button>

            <Button
              onClick={handleBulkMessage}
              className="h-24 flex flex-col items-center justify-center space-y-2"
              variant="outline"
            >
              <Zap className="h-6 w-6" />
              <span>Envio em Massa</span>
              <span className="text-xs text-muted-foreground">Envie mensagens para múltiplos contatos</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conecte seu WhatsApp */}
      {whatsappStatus !== "connected" && (
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Conecte seu WhatsApp para começar</CardTitle>
            <CardDescription>
              Para enviar mensagens, você precisa conectar sua conta do WhatsApp primeiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleConnectWhatsApp}
              disabled={whatsappStatus === "connecting"}
              className="bg-green-600 hover:bg-green-700"
            >
              {whatsappStatus === "connecting" ? "Conectando..." : "Conectar WhatsApp"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
