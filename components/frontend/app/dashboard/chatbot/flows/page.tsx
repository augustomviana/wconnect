"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Zap, Plus, Edit, Trash2, Play, Pause, Copy, Search } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { useToast } from "@/hooks/use-toast"

interface Flow {
  id: string
  name: string
  description: string
  trigger: string
  active: boolean
  steps: number
  created_at: string
  usage_count: number
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFlow, setEditingFlow] = useState<Flow | null>(null)
  const { toast } = useToast()

  const [newFlow, setNewFlow] = useState({
    name: "",
    description: "",
    trigger: "",
    active: true,
  })

  useEffect(() => {
    loadFlows()
  }, [])

  const loadFlows = async () => {
    try {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockFlows: Flow[] = [
        {
          id: "1",
          name: "Atendimento Inicial",
          description: "Fluxo de boas-vindas e direcionamento inicial",
          trigger: "início",
          active: true,
          steps: 5,
          created_at: "2024-01-15",
          usage_count: 156,
        },
        {
          id: "2",
          name: "Suporte Técnico",
          description: "Fluxo para problemas técnicos e suporte",
          trigger: "suporte",
          active: true,
          steps: 8,
          created_at: "2024-01-10",
          usage_count: 89,
        },
        {
          id: "3",
          name: "Vendas",
          description: "Fluxo para processo de vendas e orçamentos",
          trigger: "vendas",
          active: false,
          steps: 12,
          created_at: "2024-01-05",
          usage_count: 34,
        },
      ]

      setFlows(mockFlows)
    } catch (error) {
      console.error("Erro ao carregar fluxos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os fluxos de conversa.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!newFlow.name.trim() || !newFlow.trigger.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha o nome e o gatilho do fluxo.",
          variant: "destructive",
        })
        return
      }

      const flowData = {
        ...newFlow,
        id: editingFlow?.id || Date.now().toString(),
        steps: editingFlow?.steps || 1,
        created_at: editingFlow?.created_at || new Date().toISOString().split("T")[0],
        usage_count: editingFlow?.usage_count || 0,
      }

      if (editingFlow) {
        setFlows((prev) => prev.map((f) => (f.id === editingFlow.id ? flowData : f)))
        toast({
          title: "Fluxo atualizado",
          description: "O fluxo de conversa foi atualizado com sucesso.",
        })
      } else {
        setFlows((prev) => [...prev, flowData])
        toast({
          title: "Fluxo criado",
          description: "Novo fluxo de conversa foi criado com sucesso.",
        })
      }

      setIsDialogOpen(false)
      setEditingFlow(null)
      setNewFlow({ name: "", description: "", trigger: "", active: true })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o fluxo.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (flow: Flow) => {
    setEditingFlow(flow)
    setNewFlow({
      name: flow.name,
      description: flow.description,
      trigger: flow.trigger,
      active: flow.active,
    })
    setIsDialogOpen(true)
  }

  const handleToggleActive = async (id: string) => {
    try {
      setFlows((prev) => prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f)))
      toast({
        title: "Status atualizado",
        description: "O status do fluxo foi alterado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do fluxo.",
        variant: "destructive",
      })
    }
  }

  const handleDuplicate = async (flow: Flow) => {
    try {
      const duplicatedFlow = {
        ...flow,
        id: Date.now().toString(),
        name: `${flow.name} (Cópia)`,
        active: false,
        created_at: new Date().toISOString().split("T")[0],
        usage_count: 0,
      }

      setFlows((prev) => [...prev, duplicatedFlow])
      toast({
        title: "Fluxo duplicado",
        description: "O fluxo foi duplicado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível duplicar o fluxo.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setFlows((prev) => prev.filter((f) => f.id !== id))
      toast({
        title: "Fluxo excluído",
        description: "O fluxo de conversa foi excluído com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o fluxo.",
        variant: "destructive",
      })
    }
  }

  const filteredFlows = flows.filter(
    (flow) =>
      flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flow.trigger.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ href: "/dashboard/chatbot", label: "Chatbot" }, { label: "Fluxos de Conversa" }]} />
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
      <Breadcrumb items={[{ href: "/dashboard/chatbot", label: "Chatbot" }, { label: "Fluxos de Conversa" }]} />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fluxos de Conversa</h1>
          <p className="text-muted-foreground">Crie e gerencie fluxos automatizados de conversa</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingFlow(null)
                setNewFlow({ name: "", description: "", trigger: "", active: true })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Fluxo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFlow ? "Editar Fluxo" : "Novo Fluxo de Conversa"}</DialogTitle>
              <DialogDescription>Configure um novo fluxo automatizado de conversa.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Fluxo</Label>
                <Input
                  id="name"
                  placeholder="Ex: Atendimento Inicial"
                  value={newFlow.name}
                  onChange={(e) => setNewFlow((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo deste fluxo..."
                  value={newFlow.description}
                  onChange={(e) => setNewFlow((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trigger">Palavra-chave (Gatilho)</Label>
                <Input
                  id="trigger"
                  placeholder="Ex: início, suporte, vendas..."
                  value={newFlow.trigger}
                  onChange={(e) => setNewFlow((prev) => ({ ...prev, trigger: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={newFlow.active}
                  onChange={(e) => setNewFlow((prev) => ({ ...prev, active: e.target.checked }))}
                />
                <Label htmlFor="active">Ativar fluxo</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>{editingFlow ? "Atualizar" : "Criar"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar fluxos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de Fluxos */}
      <div className="grid gap-4">
        {filteredFlows.map((flow) => (
          <Card key={flow.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <div>
                    <CardTitle className="text-lg">{flow.name}</CardTitle>
                    <CardDescription>Gatilho: "{flow.trigger}"</CardDescription>
                  </div>
                  <Badge variant={flow.active ? "default" : "secondary"}>{flow.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggleActive(flow.id)}>
                    {flow.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(flow)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(flow)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(flow.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-3">{flow.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{flow.steps} etapas configuradas</span>
                <span>Usado {flow.usage_count} vezes</span>
                <span>Criado em {new Date(flow.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFlows.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum fluxo encontrado</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? "Tente ajustar os termos de busca." : "Comece criando seu primeiro fluxo de conversa."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Fluxo
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
