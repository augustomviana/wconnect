"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Workflow, Plus, Edit, Trash2, Play, Pause, Users, MessageSquare, CheckCircle, Clock, ArrowRight, Settings } from 'lucide-react'

interface Flow {
  id: number
  name: string
  description: string
  trigger_type: string
  trigger_value: string
  is_active: boolean
  priority: number
  steps_count: number
  executions_count: number
  created_at: string
}

interface FlowStats {
  total_flows: number
  active_flows: number
  active_executions: number
  completed_today: number
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [stats, setStats] = useState<FlowStats>({
    total_flows: 0,
    active_flows: 0,
    active_executions: 0,
    completed_today: 0
  })
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newFlow, setNewFlow] = useState({
    name: '',
    description: '',
    trigger_type: 'keyword',
    trigger_value: '',
    priority: 5
  })

  useEffect(() => {
    fetchFlows()
    fetchStats()
  }, [])

  const fetchFlows = async () => {
    try {
      const response = await fetch('/api/flows')
      const data = await response.json()
      
      if (data.success) {
        setFlows(data.flows)
      }
    } catch (error) {
      console.error('Erro ao buscar fluxos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/flows/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const createFlow = async () => {
    try {
      const response = await fetch('/api/flows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFlow),
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchFlows()
        await fetchStats()
        setIsCreateModalOpen(false)
        setNewFlow({
          name: '',
          description: '',
          trigger_type: 'keyword',
          trigger_value: '',
          priority: 5
        })
      }
    } catch (error) {
      console.error('Erro ao criar fluxo:', error)
    }
  }

  const toggleFlowStatus = async (flowId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchFlows()
        await fetchStats()
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
    }
  }

  const deleteFlow = async (flowId: number) => {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) {
      return
    }

    try {
      const response = await fetch(`/api/flows/${flowId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchFlows()
        await fetchStats()
      }
    } catch (error) {
      console.error('Erro ao excluir fluxo:', error)
    }
  }

  const getTriggerTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      keyword: 'Palavra-chave',
      greeting: 'Saudação',
      fallback: 'Fallback',
      manual: 'Manual'
    }
    return types[type] || type
  }

  const getTriggerTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      keyword: 'bg-blue-100 text-blue-800',
      greeting: 'bg-green-100 text-green-800',
      fallback: 'bg-yellow-100 text-yellow-800',
      manual: 'bg-purple-100 text-purple-800'
    }
    return variants[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando fluxos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fluxos de Conversa</h1>
          <p className="text-gray-600">Gerencie fluxos automatizados de atendimento</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Fluxo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Fluxo</DialogTitle>
              <DialogDescription>
                Configure um novo fluxo de conversa automatizado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Fluxo</Label>
                <Input
                  id="name"
                  value={newFlow.name}
                  onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                  placeholder="Ex: Atendimento de Vendas"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newFlow.description}
                  onChange={(e) => setNewFlow({ ...newFlow, description: e.target.value })}
                  placeholder="Descreva o objetivo deste fluxo"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="trigger_type">Tipo de Gatilho</Label>
                <Select
                  value={newFlow.trigger_type}
                  onValueChange={(value) => setNewFlow({ ...newFlow, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Palavra-chave</SelectItem>
                    <SelectItem value="greeting">Saudação</SelectItem>
                    <SelectItem value="fallback">Fallback</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trigger_value">Valor do Gatilho</Label>
                <Input
                  id="trigger_value"
                  value={newFlow.trigger_value}
                  onChange={(e) => setNewFlow({ ...newFlow, trigger_value: e.target.value })}
                  placeholder="Ex: vendas,comprar,preço"
                />
              </div>
              <div>
                <Label htmlFor="priority">Prioridade (1-10)</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  max="10"
                  value={newFlow.priority}
                  onChange={(e) => setNewFlow({ ...newFlow, priority: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={createFlow} className="flex-1">
                  Criar Fluxo
                </Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fluxos</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_flows}</div>
            <p className="text-xs text-muted-foreground">Fluxos configurados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fluxos Ativos</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active_flows}</div>
            <p className="text-xs text-muted-foreground">Em execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções Ativas</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active_executions}</div>
            <p className="text-xs text-muted-foreground">Usuários em fluxos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.completed_today}</div>
            <p className="text-xs text-muted-foreground">Fluxos finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Flows List */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxos Configurados</CardTitle>
          <CardDescription>
            Gerencie seus fluxos de conversa automatizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flows.length === 0 ? (
            <div className="text-center py-8">
              <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum fluxo configurado</h3>
              <p className="text-gray-600 mb-4">Crie seu primeiro fluxo de conversa automatizado</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Fluxo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {flows.map((flow) => (
                <div key={flow.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{flow.name}</h3>
                        <Badge className={getTriggerTypeBadge(flow.trigger_type)}>
                          {getTriggerTypeLabel(flow.trigger_type)}
                        </Badge>
                        {flow.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                        )}
                        <Badge variant="outline">Prioridade {flow.priority}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{flow.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {flow.steps_count} etapas
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {flow.executions_count} execuções ativas
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Gatilho: {flow.trigger_value}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFlowStatus(flow.id, flow.is_active)}
                      >
                        {flow.is_active ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Etapas
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFlow(flow.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}