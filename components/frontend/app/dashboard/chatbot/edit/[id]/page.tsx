"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Bot, MessageSquare, Settings, Zap } from "lucide-react"

interface Chatbot {
  id: string
  name: string
  description: string
  isActive: boolean
  welcomeMessage: string
  fallbackMessage: string
  responseDelay: number
  maxRetries: number
  language: string
  timezone: string
  workingHours: {
    enabled: boolean
    start: string
    end: string
    days: string[]
  }
  responses: Array<{
    id: string
    trigger: string
    response: string
    isActive: boolean
  }>
}

export default function EditChatbotPage() {
  const params = useParams()
  const router = useRouter()
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchChatbot(params.id as string)
    }
  }, [params.id])

  const fetchChatbot = async (id: string) => {
    try {
      const response = await fetch(`/api/chatbot/${id}`)
      const data = await response.json()
      setChatbot(data.chatbot)
    } catch (error) {
      console.error("Erro ao carregar chatbot:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveChatbot = async () => {
    if (!chatbot) return

    try {
      setSaving(true)
      const response = await fetch(`/api/chatbot/${chatbot.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatbot),
      })

      if (response.ok) {
        alert("Chatbot salvo com sucesso!")
      } else {
        alert("Erro ao salvar chatbot")
      }
    } catch (error) {
      console.error("Erro ao salvar chatbot:", error)
      alert("Erro ao salvar chatbot")
    } finally {
      setSaving(false)
    }
  }

  const updateChatbot = (field: string, value: any) => {
    if (!chatbot) return
    setChatbot({ ...chatbot, [field]: value })
  }

  const updateWorkingHours = (field: string, value: any) => {
    if (!chatbot) return
    setChatbot({
      ...chatbot,
      workingHours: { ...chatbot.workingHours, [field]: value },
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Carregando...</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Chatbot não encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">✏️ Editar Chatbot</h1>
            <p className="text-muted-foreground">Configurações do {chatbot.name}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant={chatbot.isActive ? "default" : "secondary"}>{chatbot.isActive ? "Ativo" : "Inativo"}</Badge>
          <Button onClick={saveChatbot} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Bot className="mr-2 h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="mr-2 h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="responses">
            <Zap className="mr-2 h-4 w-4" />
            Respostas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Configure as informações principais do chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Chatbot</Label>
                  <Input
                    id="name"
                    value={chatbot.name}
                    onChange={(e) => updateChatbot("name", e.target.value)}
                    placeholder="Nome do chatbot"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={chatbot.isActive}
                    onCheckedChange={(checked) => updateChatbot("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Chatbot ativo</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={chatbot.description}
                  onChange={(e) => updateChatbot("description", e.target.value)}
                  placeholder="Descreva o propósito do chatbot"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Padrão</CardTitle>
              <CardDescription>Configure as mensagens automáticas do chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="welcomeMessage"
                  value={chatbot.welcomeMessage}
                  onChange={(e) => updateChatbot("welcomeMessage", e.target.value)}
                  placeholder="Olá! Como posso ajudá-lo hoje?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fallbackMessage">Mensagem de Fallback</Label>
                <Textarea
                  id="fallbackMessage"
                  value={chatbot.fallbackMessage}
                  onChange={(e) => updateChatbot("fallbackMessage", e.target.value)}
                  placeholder="Desculpe, não entendi. Pode reformular sua pergunta?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>Ajuste o comportamento do chatbot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responseDelay">Delay de Resposta (ms)</Label>
                  <Input
                    id="responseDelay"
                    type="number"
                    value={chatbot.responseDelay}
                    onChange={(e) => updateChatbot("responseDelay", Number.parseInt(e.target.value))}
                    min="0"
                    max="5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxRetries">Máximo de Tentativas</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={chatbot.maxRetries}
                    onChange={(e) => updateChatbot("maxRetries", Number.parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Select value={chatbot.language} onValueChange={(value) => updateChatbot("language", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={chatbot.timezone} onValueChange={(value) => updateChatbot("timezone", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                      <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
              <CardDescription>Configure quando o chatbot deve estar ativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="workingHoursEnabled"
                  checked={chatbot.workingHours.enabled}
                  onCheckedChange={(checked) => updateWorkingHours("enabled", checked)}
                />
                <Label htmlFor="workingHoursEnabled">Ativar horário de funcionamento</Label>
              </div>

              {chatbot.workingHours.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Horário de Início</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={chatbot.workingHours.start}
                      onChange={(e) => updateWorkingHours("start", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Horário de Fim</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={chatbot.workingHours.end}
                      onChange={(e) => updateWorkingHours("end", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Respostas Automáticas</CardTitle>
              <CardDescription>Gerencie as respostas automáticas do chatbot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chatbot.responses.map((response, index) => (
                  <div key={response.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={response.isActive ? "default" : "secondary"}>
                        {response.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                      <Switch
                        checked={response.isActive}
                        onCheckedChange={(checked) => {
                          const updatedResponses = [...chatbot.responses]
                          updatedResponses[index].isActive = checked
                          updateChatbot("responses", updatedResponses)
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Gatilho</Label>
                        <Input
                          value={response.trigger}
                          onChange={(e) => {
                            const updatedResponses = [...chatbot.responses]
                            updatedResponses[index].trigger = e.target.value
                            updateChatbot("responses", updatedResponses)
                          }}
                          placeholder="palavra-chave"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Resposta</Label>
                        <Textarea
                          value={response.response}
                          onChange={(e) => {
                            const updatedResponses = [...chatbot.responses]
                            updatedResponses[index].response = e.target.value
                            updateChatbot("responses", updatedResponses)
                          }}
                          placeholder="Resposta automática"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full">
                  + Adicionar Nova Resposta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
