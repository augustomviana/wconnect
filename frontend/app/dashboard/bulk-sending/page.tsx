"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Send, Play, Pause, Square, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Contact {
  id: string
  name: string
  phone: string
  selected: boolean
}

interface Campaign {
  id: string
  name: string
  message: string
  contacts: Contact[]
  status: "draft" | "sending" | "completed" | "paused"
  sent: number
  total: number
  created_at: string
}

export default function BulkSendingPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [campaignName, setCampaignName] = useState("")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(false)
  const [sendingProgress, setSendingProgress] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    loadContacts()
    loadCampaigns()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      // Simular carregamento de contatos
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockContacts: Contact[] = Array.from({ length: 50 }, (_, i) => ({
        id: `contact-${i + 1}`,
        name: `Contato ${i + 1}`,
        phone: `+5511${String(Math.floor(Math.random() * 900000000) + 100000000)}`,
        selected: false,
      }))

      setContacts(mockContacts)
    } catch (error) {
      console.error("Erro ao carregar contatos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os contatos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCampaigns = async () => {
    // Simular carregamento de campanhas
    const mockCampaigns: Campaign[] = [
      {
        id: "campaign-1",
        name: "Promoção Black Friday",
        message: "🔥 Black Friday chegou! Descontos de até 70% em todos os produtos. Não perca!",
        contacts: [],
        status: "completed",
        sent: 1250,
        total: 1250,
        created_at: "2024-06-01T10:00:00Z",
      },
      {
        id: "campaign-2",
        name: "Lembrete de Consulta",
        message: "Olá! Este é um lembrete da sua consulta agendada para amanhã às 14h.",
        contacts: [],
        status: "sending",
        sent: 45,
        total: 120,
        created_at: "2024-06-06T09:00:00Z",
      },
    ]
    setCampaigns(mockCampaigns)
    setActiveCampaign(mockCampaigns.find((c) => c.status === "sending") || null)
  }

  const handleContactSelect = (contactId: string, selected: boolean) => {
    if (selected) {
      setSelectedContacts((prev) => [...prev, contactId])
    } else {
      setSelectedContacts((prev) => prev.filter((id) => id !== contactId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedContacts(contacts.map((c) => c.id))
    } else {
      setSelectedContacts([])
    }
  }

  const startCampaign = async () => {
    if (!message.trim() || selectedContacts.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Preencha a mensagem e selecione pelo menos um contato.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const newCampaign: Campaign = {
        id: `campaign-${Date.now()}`,
        name: campaignName || `Campanha ${new Date().toLocaleDateString()}`,
        message,
        contacts: contacts.filter((c) => selectedContacts.includes(c.id)),
        status: "sending",
        sent: 0,
        total: selectedContacts.length,
        created_at: new Date().toISOString(),
      }

      setCampaigns((prev) => [newCampaign, ...prev])
      setActiveCampaign(newCampaign)

      toast({
        title: "Campanha iniciada",
        description: `Enviando mensagens para ${selectedContacts.length} contatos.`,
      })

      // Simular envio progressivo
      for (let i = 0; i <= selectedContacts.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        setSendingProgress((i / selectedContacts.length) * 100)

        if (i === selectedContacts.length) {
          setActiveCampaign((prev) => (prev ? { ...prev, status: "completed", sent: selectedContacts.length } : null))
          setCampaigns((prev) =>
            prev.map((c) =>
              c.id === newCampaign.id ? { ...c, status: "completed", sent: selectedContacts.length } : c,
            ),
          )

          toast({
            title: "Campanha concluída",
            description: `Todas as ${selectedContacts.length} mensagens foram enviadas com sucesso!`,
          })
        }
      }

      // Limpar formulário
      setMessage("")
      setCampaignName("")
      setSelectedContacts([])
      setSendingProgress(0)
    } catch (error) {
      console.error("Erro ao iniciar campanha:", error)
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a campanha.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const pauseCampaign = () => {
    if (activeCampaign) {
      setActiveCampaign((prev) => (prev ? { ...prev, status: "paused" } : null))
      toast({
        title: "Campanha pausada",
        description: "O envio foi pausado e pode ser retomado a qualquer momento.",
      })
    }
  }

  const resumeCampaign = () => {
    if (activeCampaign) {
      setActiveCampaign((prev) => (prev ? { ...prev, status: "sending" } : null))
      toast({
        title: "Campanha retomada",
        description: "O envio foi retomado.",
      })
    }
  }

  const stopCampaign = () => {
    if (activeCampaign) {
      setActiveCampaign(null)
      setSendingProgress(0)
      toast({
        title: "Campanha interrompida",
        description: "O envio foi interrompido.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Send className="h-6 w-6" />
            Envio em Massa
          </h1>
          <p className="text-muted-foreground">Envie mensagens para múltiplos contatos simultaneamente</p>
        </div>
      </div>

      {/* Campanha Ativa */}
      {activeCampaign && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {activeCampaign.name}
                </CardTitle>
                <CardDescription>
                  {activeCampaign.sent} de {activeCampaign.total} mensagens enviadas
                </CardDescription>
              </div>
              <Badge variant={activeCampaign.status === "sending" ? "default" : "secondary"}>
                {activeCampaign.status === "sending"
                  ? "Enviando"
                  : activeCampaign.status === "paused"
                    ? "Pausado"
                    : "Concluído"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={(activeCampaign.sent / activeCampaign.total) * 100} className="w-full" />

            {activeCampaign.status === "sending" && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={pauseCampaign}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
                <Button size="sm" variant="destructive" onClick={stopCampaign}>
                  <Square className="h-4 w-4 mr-2" />
                  Parar
                </Button>
              </div>
            )}

            {activeCampaign.status === "paused" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={resumeCampaign}>
                  <Play className="h-4 w-4 mr-2" />
                  Retomar
                </Button>
                <Button size="sm" variant="destructive" onClick={stopCampaign}>
                  <Square className="h-4 w-4 mr-2" />
                  Parar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nova Campanha */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Campanha</CardTitle>
            <CardDescription>Configure uma nova campanha de envio em massa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nome da Campanha (opcional)</Label>
              <Input
                id="campaign-name"
                placeholder="Ex: Promoção de Verão"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                disabled={loading || !!activeCampaign}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                disabled={loading || !!activeCampaign}
              />
              <p className="text-xs text-muted-foreground">{message.length}/1000 caracteres</p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Contatos Selecionados</Label>
                <Badge variant="outline">
                  {selectedContacts.length} de {contacts.length}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedContacts.length === contacts.length}
                  onCheckedChange={handleSelectAll}
                  disabled={loading || !!activeCampaign}
                />
                <Label htmlFor="select-all">Selecionar todos</Label>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2">
                {contacts.slice(0, 10).map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={contact.id}
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => handleContactSelect(contact.id, checked as boolean)}
                      disabled={loading || !!activeCampaign}
                    />
                    <Label htmlFor={contact.id} className="text-sm">
                      {contact.name} - {contact.phone}
                    </Label>
                  </div>
                ))}
                {contacts.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center">
                    ... e mais {contacts.length - 10} contatos
                  </p>
                )}
              </div>
            </div>

            <Button
              onClick={startCampaign}
              disabled={loading || !!activeCampaign || !message.trim() || selectedContacts.length === 0}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Iniciando..." : "Iniciar Campanha"}
            </Button>
          </CardContent>
        </Card>

        {/* Histórico de Campanhas */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Campanhas</CardTitle>
            <CardDescription>Campanhas enviadas recentemente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border rounded p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{campaign.name}</h4>
                    <Badge
                      variant={
                        campaign.status === "completed"
                          ? "default"
                          : campaign.status === "sending"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {campaign.status === "completed"
                        ? "Concluída"
                        : campaign.status === "sending"
                          ? "Enviando"
                          : "Pausada"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{campaign.message}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {campaign.sent}/{campaign.total} enviadas
                    </span>
                    <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                  </div>

                  {campaign.status !== "completed" && (
                    <Progress value={(campaign.sent / campaign.total) * 100} className="h-2" />
                  )}
                </div>
              ))}

              {campaigns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma campanha encontrada</p>
                  <p className="text-sm">Crie sua primeira campanha de envio em massa</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
