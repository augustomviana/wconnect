"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MessageSquare, Plus, Edit, Trash2, Search, Filter } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { useToast } from "@/hooks/use-toast"

interface AutoResponse {
  id: string
  trigger: string
  response: string
  active: boolean
  created_at: string
  usage_count: number
}

export default function AutoResponsesPage() {
  const [responses, setResponses] = useState<AutoResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingResponse, setEditingResponse] = useState<AutoResponse | null>(null)
  const { toast } = useToast()

  const [newResponse, setNewResponse] = useState({
    trigger: "",
    response: "",
    active: true,
  })

  useEffect(() => {
    loadResponses()
  }, [])

  const loadResponses = async () => {
    try {
      setLoading(true)
      // Simular carregamento de dados
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockResponses: AutoResponse[] = [
        {
          id: "1",
          trigger: "olá",
          response: "Olá! Como posso ajudá-lo hoje?",
          active: true,
          created_at: "2024-01-15",
          usage_count: 245,
        },
        {
          id: "2",
          trigger: "horário",
          response: "Nosso horário de funcionamento é de segunda a sexta, das 9h às 18h.",
          active: true,
          created_at: "2024-01-10",
          usage_count: 89,
        },
        {
          id: "3",
          trigger: "preço",
          response: "Para informações sobre preços, entre em contato com nossa equipe comercial.",
          active: false,
          created_at: "2024-01-05",
          usage_count: 34,
        },
      ]

      setResponses(mockResponses)
    } catch (error) {
      console.error("Erro ao carregar respostas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as respostas automáticas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!newResponse.trigger.trim() || !newResponse.response.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha o gatilho e a resposta.",
          variant: "destructive",
        })
        return
      }

      const responseData = {
        ...newResponse,
        id: editingResponse?.id || Date.now().toString(),
        created_at: editingResponse?.created_at || new Date().toISOString().split("T")[0],
        usage_count: editingResponse?.usage_count || 0,
      }

      if (editingResponse) {
        setResponses((prev) => prev.map((r) => (r.id === editingResponse.id ? responseData : r)))
        toast({
          title: "Resposta atualizada",
          description: "A resposta automática foi atualizada com sucesso.",
        })
      } else {
        setResponses((prev) => [...prev, responseData])
        toast({
          title: "Resposta criada",
          description: "Nova resposta automática foi criada com sucesso.",
        })
      }

      setIsDialogOpen(false)
      setEditingResponse(null)
      setNewResponse({ trigger: "", response: "", active: true })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a resposta.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (response: AutoResponse) => {
    setEditingResponse(response)
    setNewResponse({
      trigger: response.trigger,
      response: response.response,
      active: response.active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      setResponses((prev) => prev.filter((r) => r.id !== id))
      toast({
        title: "Resposta excluída",
        description: "A resposta automática foi excluída com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a resposta.",
        variant: "destructive",
      })
    }
  }

  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      response.trigger.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.response.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !showActiveOnly || response.active
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ href: "/dashboard/chatbot", label: "Chatbot" }, { label: "Respostas Automáticas" }]} />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ href: "/dashboard/chatbot", label: "Chatbot" }, { label: "Respostas Automáticas" }]} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Respostas Automáticas</h1>
          <p className="text-muted-foreground">Configure respostas automáticas para palavras-chave</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingResponse(null)
                setNewResponse({ trigger: "", response: "", active: true })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Resposta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingResponse ? "Editar Resposta" : "Nova Resposta Automática"}</DialogTitle>
              <DialogDescription>
                Configure uma resposta automática para uma palavra-chave específica.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trigger">Palavra-chave (Gatilho)</Label>
                <Input
                  id="trigger"
                  placeholder="Ex: olá, horário, preço..."
                  value={newResponse.trigger}
                  onChange={(e) => setNewResponse((prev) => ({ ...prev, trigger: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response">Resposta</Label>
                <Textarea
                  id="response"
                  placeholder="Digite a resposta automática..."
                  value={newResponse.response}
                  onChange={(e) => setNewResponse((prev) => ({ ...prev, response: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={newResponse.active}
                  onChange={(e) => setNewResponse((prev) => ({ ...prev, active: e.target.checked }))}
                />
                <Label htmlFor="active">Ativar resposta automática</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>{editingResponse ? "Atualizar" : "Criar"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por gatilho ou resposta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button variant={showActiveOnly ? "default" : "outline"} onClick={() => setShowActiveOnly(!showActiveOnly)}>
          <Filter className="mr-2 h-4 w-4" />
          {showActiveOnly ? "Todas" : "Apenas Ativas"}
        </Button>
      </div>

      {/* Lista de Respostas */}
      <div className="grid gap-4">
        {filteredResponses.map((response) => (
          <Card key={response.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">"{response.trigger}"</CardTitle>
                  <Badge variant={response.active ? "default" : "secondary"}>
                    {response.active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(response)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(response.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-3">{response.response}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Criada em {new Date(response.created_at).toLocaleDateString("pt-BR")}</span>
                <span>Usada {response.usage_count} vezes</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResponses.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma resposta encontrada</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "Tente ajustar os filtros de busca." : "Comece criando sua primeira resposta automática."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Resposta
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
