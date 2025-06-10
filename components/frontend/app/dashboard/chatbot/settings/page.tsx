"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Bot, Save, RotateCcw, CheckCircle, AlertTriangle, Clock } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { useToast } from "@/hooks/use-toast"

interface ChatbotSettings {
  enabled: boolean
  welcome_message: string
  fallback_message: string
  response_delay: number
  max_interactions: number
  business_hours_enabled: boolean
  business_start: string
  business_end: string
  weekend_enabled: boolean
}

export default function ChatbotSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const { toast } = useToast()

  const [chatbotSettings, setChatbotSettings] = useState<ChatbotSettings>({
    enabled: true,
    welcome_message: "Olá! Como posso ajudá-lo hoje?",
    fallback_message: "Desculpe, não entendi sua mensagem. Pode reformular?",
    response_delay: 2,
    max_interactions: 10,
    business_hours_enabled: false,
    business_start: "09:00",
    business_end: "18:00",
    weekend_enabled: false,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveChatbotSettings = async () => {
    try {
      setSaveStatus("saving")
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSaveStatus("saved")
      toast({
        title: "Configurações salvas",
        description: "As configurações do chatbot foram salvas com sucesso!",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setSaveStatus("error")
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const resetToDefaults = () => {
    setChatbotSettings({
      enabled: true,
      welcome_message: "Olá! Como posso ajudá-lo hoje?",
      fallback_message: "Desculpe, não entendi sua mensagem. Pode reformular?",
      response_delay: 2,
      max_interactions: 10,
      business_hours_enabled: false,
      business_start: "09:00",
      business_end: "18:00",
      weekend_enabled: false,
    })
    toast({
      title: "Configurações restauradas",
      description: "As configurações foram restauradas para os valores padrão.",
    })
  }

  const handleChatbotToggle = (enabled: boolean) => {
    setChatbotSettings((prev) => ({ ...prev, enabled }))
    toast({
      title: enabled ? "Chatbot ativado" : "Chatbot desativado",
      description: enabled
        ? "O chatbot agora responderá automaticamente às mensagens."
        : "O chatbot foi desativado e não responderá automaticamente.",
    })
  }

  const handleBusinessHoursToggle = (enabled: boolean) => {
    setChatbotSettings((prev) => ({ ...prev, business_hours_enabled: enabled }))
    toast({
      title: enabled ? "Horário comercial ativado" : "Horário comercial desativado",
      description: enabled
        ? "O chatbot funcionará apenas no horário comercial configurado."
        : "O chatbot funcionará 24 horas por dia.",
    })
  }

  const isCurrentlyInBusinessHours = () => {
    if (!chatbotSettings.business_hours_enabled) return true

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const startTime =
      Number.parseInt(chatbotSettings.business_start.split(":")[0]) * 60 +
      Number.parseInt(chatbotSettings.business_start.split(":")[1])
    const endTime =
      Number.parseInt(chatbotSettings.business_end.split(":")[0]) * 60 +
      Number.parseInt(chatbotSettings.business_end.split(":")[1])

    const isWeekend = now.getDay() === 0 || now.getDay() === 6
    if (isWeekend && !chatbotSettings.weekend_enabled) return false

    return currentTime >= startTime && currentTime <= endTime
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ href: "/dashboard/chatbot", label: "Chatbot" }, { label: "Configurações" }]} />
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações do Chatbot</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ href: "/dashboard/chatbot", label: "Chatbot" }, { label: "Configurações" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações do Chatbot</h1>
        </div>
      </div>

      {/* Status Alert */}
      {chatbotSettings.enabled && (
        <Alert
          className={`border-l-4 ${isCurrentlyInBusinessHours() ? "border-l-green-500 bg-green-50" : "border-l-yellow-500 bg-yellow-50"}`}
        >
          <CheckCircle className={`h-4 w-4 ${isCurrentlyInBusinessHours() ? "text-green-600" : "text-yellow-600"}`} />
          <AlertDescription className={isCurrentlyInBusinessHours() ? "text-green-800" : "text-yellow-800"}>
            <strong>Status atual:</strong>{" "}
            {isCurrentlyInBusinessHours()
              ? "Chatbot ativo e funcionando"
              : "Chatbot ativo mas fora do horário comercial"}
          </AlertDescription>
        </Alert>
      )}

      {!chatbotSettings.enabled && (
        <Alert className="border-l-4 border-l-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Chatbot desativado:</strong> O chatbot não responderá automaticamente às mensagens.
          </AlertDescription>
        </Alert>
      )}

      {/* Configurações do Chatbot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Configurações do Chatbot
          </CardTitle>
          <CardDescription>Configure o comportamento e mensagens do chatbot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status do Chatbot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-0.5">
              <Label className="text-base font-medium flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Chatbot Ativo
              </Label>
              <p className="text-sm text-muted-foreground">
                {chatbotSettings.enabled
                  ? "O chatbot está ativo e responderá automaticamente às mensagens"
                  : "O chatbot está desativado e não responderá automaticamente"}
              </p>
            </div>
            <Switch checked={chatbotSettings.enabled} onCheckedChange={handleChatbotToggle} />
          </div>

          <Separator />

          {/* Mensagens */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="welcome">Mensagem de Boas-vindas</Label>
              <Textarea
                id="welcome"
                placeholder="Digite a mensagem de boas-vindas..."
                value={chatbotSettings.welcome_message}
                onChange={(e) => setChatbotSettings((prev) => ({ ...prev, welcome_message: e.target.value }))}
                rows={3}
                disabled={!chatbotSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Esta mensagem será enviada quando um novo contato iniciar uma conversa
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback">Mensagem de Fallback</Label>
              <Textarea
                id="fallback"
                placeholder="Mensagem quando não entender..."
                value={chatbotSettings.fallback_message}
                onChange={(e) => setChatbotSettings((prev) => ({ ...prev, fallback_message: e.target.value }))}
                rows={3}
                disabled={!chatbotSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">
                Esta mensagem será enviada quando o chatbot não conseguir entender a mensagem do usuário
              </p>
            </div>
          </div>

          <Separator />

          {/* Configurações de Comportamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delay">Delay de Resposta (segundos)</Label>
              <Input
                id="delay"
                type="number"
                min="0"
                max="10"
                value={chatbotSettings.response_delay}
                onChange={(e) => setChatbotSettings((prev) => ({ ...prev, response_delay: Number(e.target.value) }))}
                disabled={!chatbotSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">Tempo de espera antes de enviar a resposta automática</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-interactions">Máx. Interações por Sessão</Label>
              <Input
                id="max-interactions"
                type="number"
                min="1"
                max="50"
                value={chatbotSettings.max_interactions}
                onChange={(e) => setChatbotSettings((prev) => ({ ...prev, max_interactions: Number(e.target.value) }))}
                disabled={!chatbotSettings.enabled}
              />
              <p className="text-xs text-muted-foreground">Número máximo de mensagens automáticas por conversa</p>
            </div>
          </div>

          <Separator />

          {/* Horário Comercial */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-0.5">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horário Comercial
                </Label>
                <p className="text-sm text-muted-foreground">
                  {chatbotSettings.business_hours_enabled
                    ? `Chatbot funcionará das ${chatbotSettings.business_start} às ${chatbotSettings.business_end}`
                    : "Chatbot funcionará 24 horas por dia, 7 dias por semana"}
                </p>
              </div>
              <Switch
                checked={chatbotSettings.business_hours_enabled}
                onCheckedChange={handleBusinessHoursToggle}
                disabled={!chatbotSettings.enabled}
              />
            </div>

            {chatbotSettings.business_hours_enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200 bg-blue-50 p-4 rounded-r-lg">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Horário de Início</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={chatbotSettings.business_start}
                    onChange={(e) => setChatbotSettings((prev) => ({ ...prev, business_start: e.target.value }))}
                    disabled={!chatbotSettings.enabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">Horário de Fim</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={chatbotSettings.business_end}
                    onChange={(e) => setChatbotSettings((prev) => ({ ...prev, business_end: e.target.value }))}
                    disabled={!chatbotSettings.enabled}
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Funcionar nos fins de semana</Label>
                      <p className="text-xs text-muted-foreground">
                        Permitir que o chatbot funcione aos sábados e domingos
                      </p>
                    </div>
                    <Switch
                      checked={chatbotSettings.weekend_enabled}
                      onCheckedChange={(checked) =>
                        setChatbotSettings((prev) => ({ ...prev, weekend_enabled: checked }))
                      }
                      disabled={!chatbotSettings.enabled}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrões
            </Button>

            <Button onClick={saveChatbotSettings} disabled={saveStatus === "saving"}>
              <Save className="h-4 w-4 mr-2" />
              {saveStatus === "saving" ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
