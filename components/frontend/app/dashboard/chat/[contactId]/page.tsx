"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Send, Phone, MoreVertical, ArrowLeft, Paperclip, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Breadcrumb } from "@/components/breadcrumb"

interface Message {
  id: number
  content: string
  timestamp: string
  fromMe: boolean
  type: "text" | "image" | "audio" | "document"
}

interface Contact {
  id: string
  name: string
  phone: string
  avatar?: string
  isOnline: boolean
  lastSeen?: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadContactAndMessages()
  }, [params.contactId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadContactAndMessages = async () => {
    try {
      setLoading(true)

      // Simular carregamento de dados
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Dados simulados do contato
      const mockContact: Contact = {
        id: params.contactId as string,
        name: "Maria Santos",
        phone: "+5511999999999",
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: true,
        lastSeen: new Date().toISOString(),
      }

      // Mensagens simuladas
      const mockMessages: Message[] = [
        {
          id: 1,
          content: "Olá! Como posso ajudá-lo hoje?",
          timestamp: "2023-06-06T09:00:00",
          fromMe: true,
          type: "text",
        },
        {
          id: 2,
          content: "Oi! Gostaria de saber mais sobre seus serviços.",
          timestamp: "2023-06-06T09:05:00",
          fromMe: false,
          type: "text",
        },
        {
          id: 3,
          content: "Claro! Temos várias opções disponíveis. Que tipo de serviço você está procurando?",
          timestamp: "2023-06-06T09:06:00",
          fromMe: true,
          type: "text",
        },
        {
          id: 4,
          content: "Estou interessado em automação de atendimento.",
          timestamp: "2023-06-06T09:10:00",
          fromMe: false,
          type: "text",
        },
      ]

      setContact(mockContact)
      setMessages(mockMessages)
    } catch (error) {
      console.error("Erro ao carregar conversa:", error)
      alert("Erro ao carregar conversa. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)

      const message: Message = {
        id: messages.length + 1,
        content: newMessage,
        timestamp: new Date().toISOString(),
        fromMe: true,
        type: "text",
      }

      setMessages([...messages, message])
      setNewMessage("")

      // Simular envio para API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simular resposta automática
      setTimeout(() => {
        const autoReply: Message = {
          id: messages.length + 2,
          content: "Obrigado pela mensagem! Em breve retornaremos o contato.",
          timestamp: new Date().toISOString(),
          fromMe: false,
          type: "text",
        }
        setMessages((prev) => [...prev, autoReply])
      }, 2000)
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      alert("Erro ao enviar mensagem. Tente novamente.")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Carregando conversa...</p>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Contato não encontrado</p>
        <Button onClick={() => router.back()} className="mt-4">
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <Breadcrumb items={[{ href: "/dashboard/contacts", label: "Contatos" }, { label: contact.name }]} />

      {/* Header da Conversa */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="lg:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              {contact.avatar ? (
                <img className="h-10 w-10 rounded-full" src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium">{contact.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-900">{contact.name}</h3>
                <p className="text-sm text-gray-500">
                  {contact.isOnline ? (
                    <span className="text-green-600">Online</span>
                  ) : (
                    `Visto por último ${contact.lastSeen ? new Date(contact.lastSeen).toLocaleString("pt-BR") : "há muito tempo"}`
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.fromMe ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.fromMe ? "bg-blue-600 text-white" : "bg-white text-gray-900 border border-gray-200"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${message.fromMe ? "text-blue-100" : "text-gray-500"}`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={sending}
              className="pr-10"
            />
            <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
