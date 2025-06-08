"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Filter,
  Phone,
  MessageCircle,
  MoreVertical,
  Archive,
  Star,
  Trash2,
  CheckCircle,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Breadcrumb } from "@/components/breadcrumb"

interface Conversation {
  id: string
  contact_name: string
  contact_phone: string
  last_message: string
  last_message_time: string
  unread_count: number
  status: "active" | "archived" | "pending"
  is_starred: boolean
  profile_pic?: string
}

export default function ConversationsPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  useEffect(() => {
    filterConversations()
  }, [conversations, searchTerm, statusFilter])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("authToken")
      const response = await fetch("/api/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error("Erro ao buscar conversas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterConversations = () => {
    let filtered = conversations

    if (searchTerm) {
      filtered = filtered.filter(
        (conv) =>
          conv.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conv.contact_phone.includes(searchTerm) ||
          conv.last_message.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((conv) => conv.status === statusFilter)
    }

    setFilteredConversations(filtered)
  }

  const handleStartCall = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setIsCallModalOpen(true)
  }

  const handleOpenChat = (conversation: Conversation) => {
    const encodedContactId = encodeURIComponent(conversation.contact_phone)
    router.push(`/dashboard/chat/${encodedContactId}`)
  }

  const handleConversationAction = async (action: string, conversationId: string) => {
    try {
      const token = localStorage.getItem("authToken")
      await fetch(`/api/conversations/${conversationId}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      // Atualizar lista após ação
      fetchConversations()
    } catch (error) {
      console.error(`Erro ao ${action} conversa:`, error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
    }

    const labels = {
      active: "Ativa",
      archived: "Arquivada",
      pending: "Pendente",
    }

    return <Badge className={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Conversas", href: "/dashboard/conversations" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Conversas</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as conversas do WhatsApp</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white">
              <Filter className="h-4 w-4 mr-2" />
              Status: {statusFilter === "all" ? "Todos" : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border shadow-lg">
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>Ativas</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pendentes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("archived")}>Arquivadas</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lista de Conversas - Desktop */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle>Conversas ({filteredConversations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative">
                      {conversation.profile_pic ? (
                        <img
                          src={conversation.profile_pic || "/placeholder.svg"}
                          alt={conversation.contact_name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                      {conversation.unread_count > 0 && (
                        <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{conversation.contact_name}</h3>
                        {conversation.is_starred && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        {getStatusBadge(conversation.status)}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conversation.contact_phone}</p>
                      <p className="text-sm text-gray-500 truncate mt-1">{conversation.last_message}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatTime(conversation.last_message_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartCall(conversation)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenChat(conversation)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-700">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white border shadow-lg">
                        <DropdownMenuItem onClick={() => handleConversationAction("star", conversation.id)}>
                          <Star className="h-4 w-4 mr-2" />
                          {conversation.is_starred ? "Remover estrela" : "Adicionar estrela"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleConversationAction("mark-read", conversation.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como lida
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleConversationAction("archive", conversation.id)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Arquivar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleConversationAction("delete", conversation.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Conversas - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredConversations.map((conversation) => (
          <Card key={conversation.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="relative">
                  {conversation.profile_pic ? (
                    <img
                      src={conversation.profile_pic || "/placeholder.svg"}
                      alt={conversation.contact_name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  {conversation.unread_count > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs min-w-[18px] h-4 flex items-center justify-center rounded-full">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate text-sm">{conversation.contact_name}</h3>
                    {conversation.is_starred && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{conversation.contact_phone}</p>
                  <p className="text-xs text-gray-500 truncate mb-2">{conversation.last_message}</p>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(conversation.status)}
                    <p className="text-xs text-gray-500">{formatTime(conversation.last_message_time)}</p>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-600">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border shadow-lg">
                  <DropdownMenuItem onClick={() => handleOpenChat(conversation)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Abrir chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStartCall(conversation)}>
                    <Phone className="h-4 w-4 mr-2" />
                    Iniciar chamada
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleConversationAction("star", conversation.id)}>
                    <Star className="h-4 w-4 mr-2" />
                    {conversation.is_starred ? "Remover estrela" : "Adicionar estrela"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleConversationAction("archive", conversation.id)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Arquivar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de Chamada */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Iniciar Chamada</DialogTitle>
            <DialogDescription>Deseja iniciar uma chamada para {selectedConversation?.contact_name}?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsCallModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Implementar lógica de chamada aqui
                console.log("Iniciando chamada para:", selectedConversation?.contact_phone)
                setIsCallModalOpen(false)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Phone className="h-4 w-4 mr-2" />
              Ligar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {filteredConversations.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conversa encontrada</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca"
                : "As conversas aparecerão aqui quando chegarem mensagens"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
