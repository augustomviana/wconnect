"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bot, MessageSquare, Settings, BarChart3, Users, Zap, Plus, Play, Pause, Edit, TrendingUp } from "lucide-react"

interface ChatbotStats {
  active_chatbots: number
  active_responses: number
  active_sessions: number
  interactions_today: number
}

interface Chatbot {
  id: number
  name: string
  description: string
  is_active: boolean
  created_at: string
}

export default function ChatbotDashboard() {
  const [stats, setStats] = useState<ChatbotStats>({
    active_chatbots: 0,
    active_responses: 0,
    active_sessions: 0,
    interactions_today: 0,
  })
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("authToken")
      if (!token) {
        setError("Token de autenticação não encontrado")
        return
      }

      // Buscar estatísticas e chatbots em paralelo
      const [statsResponse, chatbotsResponse] = await Promise.all([
        fetch("/api/chatbot/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/chatbot", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (chatbotsResponse.ok) {
        const chatbotsData = await chatbotsResponse.json()
        setChatbots(chatbotsData.chatbots || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = "blue",
    description,
  }: {
    title: string
    value: number | string
    icon: React.ElementType
    color?: string
    description?: string
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  const QuickActionCard = ({
    title,
    description,
    icon: Icon,
    href,
    color = "blue",
  }: {
    title: string
    description: string
    icon: React.ElementType
    href: string
    color?: string
  }) => (
    <Link href={href} className="block">
      <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Carregando dados do chatbot...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Erro: {error}</p>
        <button onClick={fetchData} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatbot & Automação</h1>
          <p className="text-gray-600">Gerencie chatbots, respostas automáticas e fluxos de conversa</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/chatbot/responses"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Resposta</span>
          </Link>
          <Link
            href="/dashboard/chatbot/flows"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Fluxo</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Chatbots Ativos"
          value={stats.active_chatbots}
          icon={Bot}
          color="blue"
          description="Em funcionamento"
        />
        <StatCard
          title="Respostas Automáticas"
          value={stats.active_responses}
          icon={MessageSquare}
          color="green"
          description="Configuradas"
        />
        <StatCard
          title="Sessões Ativas"
          value={stats.active_sessions}
          icon={Users}
          color="purple"
          description="Conversas em andamento"
        />
        <StatCard
          title="Interações Hoje"
          value={stats.interactions_today}
          icon={TrendingUp}
          color="orange"
          description="Mensagens processadas"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Respostas Automáticas"
            description="Configurar respostas para palavras-chave"
            icon={MessageSquare}
            href="/dashboard/chatbot/responses"
            color="green"
          />
          <QuickActionCard
            title="Fluxos de Conversa"
            description="Criar fluxos de atendimento automatizado"
            icon={Zap}
            href="/dashboard/chatbot/flows"
            color="blue"
          />
          <QuickActionCard
            title="Configurações"
            description="Configurar chatbots e parâmetros"
            icon={Settings}
            href="/dashboard/chatbot/settings"
            color="gray"
          />
          <QuickActionCard
            title="Relatórios"
            description="Visualizar métricas e performance"
            icon={BarChart3}
            href="/dashboard/reports"
            color="purple"
          />
          <QuickActionCard
            title="Sessões Ativas"
            description="Monitorar conversas em andamento"
            icon={Users}
            href="/dashboard/sessions"
            color="orange"
          />
          <QuickActionCard
            title="Logs de Interação"
            description="Histórico de todas as interações"
            icon={MessageSquare}
            href="/dashboard/logs"
            color="indigo"
          />
        </div>
      </div>

      {/* Chatbots List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Chatbots Configurados</h3>
        </div>
        <div className="p-6">
          {chatbots.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum chatbot configurado</p>
              <Link
                href="/dashboard/chatbot/settings"
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Chatbot
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {chatbots.map((chatbot) => (
                <div key={chatbot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bot className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{chatbot.name}</h4>
                      <p className="text-sm text-gray-600">{chatbot.description}</p>
                      <p className="text-xs text-gray-400">
                        Criado em {new Date(chatbot.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        chatbot.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {chatbot.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <button
                      className={`p-2 rounded-lg ${
                        chatbot.is_active
                          ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                          : "bg-green-100 text-green-600 hover:bg-green-200"
                      }`}
                      title={chatbot.is_active ? "Pausar chatbot" : "Ativar chatbot"}
                    >
                      {chatbot.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <Link
                      href={`/dashboard/chatbot/edit/${chatbot.id}`}
                      className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                      title="Editar chatbot"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.interactions_today}</p>
            <p className="text-sm text-gray-600">Interações Hoje</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{stats.active_sessions}</p>
            <p className="text-sm text-gray-600">Sessões Ativas</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Zap className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats.active_responses}</p>
            <p className="text-sm text-gray-600">Respostas Configuradas</p>
          </div>
        </div>
      </div>
    </div>
  )
}
