"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  Zap,
  Globe,
  Database,
  Mail,
  Bot,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  type: "webhook" | "api" | "database" | "email" | "chatbot" | "external"
  status: "active" | "inactive" | "error"
  config: {
    url?: string
    apiKey?: string
    method?: string
    headers?: Record<string, string>
  }
  lastSync?: string
  createdAt: string
}

const integrationTypes = [
  { value: "webhook", label: "Webhook", icon: Zap, description: "Receber notificações em tempo real" },
  { value: "api", label: "API Externa", icon: Globe, description: "Conectar com APIs de terceiros" },
  { value: "database", label: "Banco de Dados", icon: Database, description: "Sincronizar com outros bancos" },
  { value: "email", label: "Email", icon: Mail, description: "Enviar notificações por email" },
  { value: "chatbot", label: "Chatbot IA", icon: Bot, description: "Integrar com IA externa" },
  { value: "external", label: "Sistema Externo", icon: ExternalLink, description: "Conectar com outros sistemas" },
]

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "webhook" as Integration["type"],
    url: "",
    apiKey: "",
    method: "POST",
    headers: "{}",
    isActive: true,
  })

  // Carregar integrações
  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/integrations")
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations || [])
      }
    } catch (error) {
      console.error("Erro ao carregar integrações:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIntegration = async () => {
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          config: {
            url: formData.url,
            apiKey: formData.apiKey,
            method: formData.method,
            headers: JSON.parse(formData.headers || "{}"),
          },
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        await loadIntegrations()
        setShowCreateModal(false)
        resetForm()
      }
    } catch (error) {
      console.error("Erro ao criar integração:", error)
    }
  }

  const handleToggleIntegration = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        await loadIntegrations()
      }
    } catch (error) {
      console.error("Erro ao atualizar integração:", error)
    }
  }

  const handleDeleteIntegration = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta integração?")) return

    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await loadIntegrations()
      }
    } catch (error) {
      console.error("Erro ao excluir integração:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "webhook",
      url: "",
      apiKey: "",
      method: "POST",
      headers: "{}",
      isActive: true,
    })
    setEditingIntegration(null)
  }

  const getStatusIcon = (status: Integration["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-400" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: Integration["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      error: "bg-red-100 text-red-800",
    }

    const labels = {
      active: "Ativo",
      inactive: "Inativo",
      error: "Erro",
    }

    return <Badge className={variants[status]}>{labels[status]}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando integrações...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
          <p className="text-gray-600">Conecte seu WhatsApp com outros sistemas e serviços</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Integração
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
              <Settings className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter((i) => i.status === "active").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inativas</p>
                <p className="text-2xl font-bold text-gray-600">
                  {integrations.filter((i) => i.status === "inactive").length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Com Erro</p>
                <p className="text-2xl font-bold text-red-600">
                  {integrations.filter((i) => i.status === "error").length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Integrações */}
      <Card>
        <CardHeader>
          <CardTitle>Integrações Configuradas</CardTitle>
          <CardDescription>Gerencie suas integrações ativas e configure novas conexões</CardDescription>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma integração configurada</h3>
              <p className="text-gray-600 mb-4">Comece criando sua primeira integração</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Integração
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => {
                const typeInfo = integrationTypes.find((t) => t.value === integration.type)
                const TypeIcon = typeInfo?.icon || Settings

                return (
                  <div key={integration.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TypeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{integration.name}</h3>
                          <p className="text-sm text-gray-600">{integration.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(integration.status)}
                            <span className="text-xs text-gray-500">{typeInfo?.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={integration.status === "active"}
                          onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingIntegration(integration)
                            setShowCreateModal(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteIntegration(integration.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingIntegration ? "Editar Integração" : "Nova Integração"}</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Integração</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Webhook de Vendas"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o propósito desta integração"
                />
              </div>

              <div>
                <Label htmlFor="type">Tipo de Integração</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Integration["type"] })}
                  className="w-full p-2 border rounded-md"
                >
                  {integrationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="url">URL/Endpoint</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://api.exemplo.com/webhook"
                />
              </div>

              <div>
                <Label htmlFor="apiKey">API Key (opcional)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Sua chave de API"
                />
              </div>

              <div>
                <Label htmlFor="method">Método HTTP</Label>
                <select
                  id="method"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Ativar integração</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateIntegration}>{editingIntegration ? "Atualizar" : "Criar"} Integração</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
