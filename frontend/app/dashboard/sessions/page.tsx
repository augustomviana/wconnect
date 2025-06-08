"use client"

import { useState, useEffect } from "react"
import { Users, Clock, MessageCircle, MoreVertical, Search, Filter, UserCheck, ArrowRight } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface ActiveSession {
  id: number
  contact_name: string
  contact_phone: string
  contact_avatar?: string
  started_at: string
  last_activity: string
  message_count: number
  status: "active" | "idle" | "waiting"
  agent_name?: string
  platform: "whatsapp" | "web" | "mobile"
}

interface Agent {
  id: number
  name: string
  email: string
  status: "online" | "offline" | "busy"
}

const mockSessions: ActiveSession[] = [
  {
    id: 1,
    contact_name: "Maria Santos",
    contact_phone: "+5511999999999",
    contact_avatar: "/placeholder.svg?height=40&width=40",
    started_at: "2023-06-06T09:30:00",
    last_activity: "2023-06-06T10:25:00",
    message_count: 12,
    status: "active",
    agent_name: "João Oliveira",
    platform: "whatsapp",
  },
  {
    id: 2,
    contact_name: "Carlos Silva",
    contact_phone: "+5511888888888",
    started_at: "2023-06-06T10:15:00",
    last_activity: "2023-06-06T10:20:00",
    message_count: 5,
    status: "waiting",
    platform: "whatsapp",
  },
  {
    id: 3,
    contact_name: "Ana Pereira",
    contact_phone: "+5511777777777",
    contact_avatar: "/placeholder.svg?height=40&width=40",
    started_at: "2023-06-06T08:45:00",
    last_activity: "2023-06-06T09:50:00",
    message_count: 8,
    status: "idle",
    agent_name: "Maria Silva",
    platform: "web",
  },
]

const mockAgents: Agent[] = [
  { id: 1, name: "João Oliveira", email: "joao@empresa.com", status: "online" },
  { id: 2, name: "Maria Silva", email: "maria@empresa.com", status: "online" },
  { id: 3, name: "Pedro Santos", email: "pedro@empresa.com", status: "busy" },
  { id: 4, name: "Ana Costa", email: "ana@empresa.com", status: "offline" },
]

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>(mockSessions)
  const [filteredSessions, setFilteredSessions] = useState<ActiveSession[]>(mockSessions)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [platformFilter, setPlatformFilter] = useState("all")

  // Transfer modal states
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [transferNote, setTransferNote] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    filterSessions()
  }, [searchQuery, statusFilter, platformFilter, sessions])

  const filterSessions = () => {
    let filtered = sessions

    if (searchQuery) {
      filtered = filtered.filter(
        (session) =>
          session.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.contact_phone.includes(searchQuery) ||
          session.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((session) => session.status === statusFilter)
    }

    if (platformFilter !== "all") {
      filtered = filtered.filter((session) => session.platform === platformFilter)
    }

    setFilteredSessions(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "idle":
        return "bg-yellow-100 text-yellow-800"
      case "waiting":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativa"
      case "idle":
        return "Inativa"
      case "waiting":
        return "Aguardando"
      default:
        return "Desconhecido"
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "whatsapp":
        return "💬"
      case "web":
        return "🌐"
      case "mobile":
        return "📱"
      default:
        return "❓"
    }
  }

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)

    if (diffMins < 60) {
      return `${diffMins}m`
    } else {
      return `${diffHours}h ${diffMins % 60}m`
    }
  }

  const formatLastActivity = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 1) {
      return "Agora"
    } else if (diffMins < 60) {
      return `${diffMins}m atrás`
    } else {
      const diffHours = Math.round(diffMs / 3600000)
      return `${diffHours}h atrás`
    }
  }

  const handleTakeSession = (sessionId: number) => {
    setSessions(
      sessions.map((session) =>
        session.id === sessionId ? { ...session, status: "active" as const, agent_name: "Usuário Atual" } : session,
      ),
    )
    toast({
      title: "Sessão assumida",
      description: "Você assumiu a sessão com sucesso!",
    })
  }

  const handleEndSession = (sessionId: number) => {
    setSessions(sessions.filter((session) => session.id !== sessionId))
    toast({
      title: "Sessão encerrada",
      description: "A sessão foi encerrada com sucesso!",
    })
  }

  const handleTransferSession = (session: ActiveSession) => {
    setSelectedSession(session)
    setShowTransferModal(true)
  }

  const executeTransfer = () => {
    if (!selectedSession || !selectedAgent) return

    const agent = mockAgents.find((a) => a.id === selectedAgent)
    if (!agent) return

    setSessions(
      sessions.map((session) =>
        session.id === selectedSession.id ? { ...session, agent_name: agent.name, status: "active" as const } : session,
      ),
    )

    toast({
      title: "Sessão transferida",
      description: `Sessão transferida para ${agent.name} com sucesso!`,
    })

    setShowTransferModal(false)
    setSelectedSession(null)
    setSelectedAgent(null)
    setTransferNote("")
  }

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "busy":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Sessões Ativas" }]} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sessões Ativas</h1>
          <p className="text-muted-foreground">Monitore conversas em andamento</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredSessions.length} sessão{filteredSessions.length !== 1 ? "ões" : ""} ativa
            {filteredSessions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center flex-1 gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar sessões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="idle">Inativas</SelectItem>
                <SelectItem value="waiting">Aguardando</SelectItem>
              </SelectContent>
            </Select>

            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de Sessões */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Conversas em Andamento</h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Carregando sessões...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchQuery || statusFilter !== "all" || platformFilter !== "all"
                  ? "Nenhuma sessão encontrada com os filtros aplicados"
                  : "Nenhuma sessão ativa no momento"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contato
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duração
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mensagens
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Última Atividade
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {session.contact_avatar ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={session.contact_avatar || "/placeholder.svg"}
                                  alt={session.contact_name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <Users className="h-6 w-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 flex items-center">
                                {session.contact_name}
                                <span className="ml-2 text-lg">{getPlatformIcon(session.platform)}</span>
                              </div>
                              <div className="text-sm text-gray-500">{session.contact_phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {session.agent_name || "Não atribuído"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.status)}`}
                          >
                            {getStatusLabel(session.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            {formatDuration(session.started_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <MessageCircle className="h-4 w-4 text-gray-400 mr-2" />
                            {session.message_count}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatLastActivity(session.last_activity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" title="Visualizar conversa">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border shadow-md">
                                {!session.agent_name && (
                                  <DropdownMenuItem onClick={() => handleTakeSession(session.id)}>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Assumir sessão
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleTransferSession(session)}>
                                  <ArrowRight className="mr-2 h-4 w-4" />
                                  Transferir
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEndSession(session.id)} className="text-red-600">
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Encerrar sessão
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View */}
              <div className="lg:hidden space-y-4">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {session.contact_avatar ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={session.contact_avatar || "/placeholder.svg"}
                            alt={session.contact_name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {session.contact_name}
                            <span className="ml-2 text-lg">{getPlatformIcon(session.platform)}</span>
                          </div>
                          <div className="text-sm text-gray-500">{session.contact_phone}</div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border shadow-md">
                          {!session.agent_name && (
                            <DropdownMenuItem onClick={() => handleTakeSession(session.id)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Assumir sessão
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleTransferSession(session)}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Transferir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEndSession(session.id)} className="text-red-600">
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Encerrar sessão
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}
                      >
                        {getStatusLabel(session.status)}
                      </span>
                      {session.agent_name && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          {session.agent_name}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="flex items-center text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          Duração
                        </div>
                        <div className="font-medium">{formatDuration(session.started_at)}</div>
                      </div>
                      <div>
                        <div className="flex items-center text-gray-500">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Mensagens
                        </div>
                        <div className="font-medium">{session.message_count}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Última atividade</div>
                        <div className="font-medium">{formatLastActivity(session.last_activity)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Transferência */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transferir Sessão</DialogTitle>
            <DialogDescription>Selecione um agente para transferir esta sessão de atendimento</DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              {/* Informações da sessão */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                {selectedSession.contact_avatar ? (
                  <img
                    className="h-12 w-12 rounded-full"
                    src={selectedSession.contact_avatar || "/placeholder.svg"}
                    alt={selectedSession.contact_name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium">{selectedSession.contact_name}</h3>
                  <p className="text-sm text-gray-500">{selectedSession.contact_phone}</p>
                  <p className="text-xs text-gray-400">
                    {selectedSession.message_count} mensagens • {formatDuration(selectedSession.started_at)}
                  </p>
                </div>
              </div>

              {/* Seleção de agente */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecionar Agente</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {mockAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAgent === agent.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                      } ${agent.status === "offline" ? "opacity-50" : ""}`}
                      onClick={() => agent.status !== "offline" && setSelectedAgent(agent.id)}
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{agent.name.charAt(0)}</span>
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getAgentStatusColor(agent.status)}`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                      </div>
                      <div className="text-xs text-gray-400 capitalize">{agent.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nota de transferência */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nota de Transferência (Opcional)</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                  placeholder="Adicione uma nota sobre o contexto da conversa..."
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferModal(false)}>
              Cancelar
            </Button>
            <Button onClick={executeTransfer} disabled={!selectedAgent} className="bg-blue-600 hover:bg-blue-700">
              <ArrowRight className="mr-2 h-4 w-4" />
              Transferir Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
