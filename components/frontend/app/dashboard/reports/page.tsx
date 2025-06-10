"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Users, MessageSquare, Bot, Download } from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"

interface ReportStats {
  totalMessages: number
  totalContacts: number
  activeChats: number
  botResponses: number
  responseTime: number
  satisfactionRate: number
}

interface ChartData {
  date: string
  messages: number
  contacts: number
  botResponses: number
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [period, setPeriod] = useState("7d")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [period])

  const fetchReports = async () => {
    try {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock data
      setStats({
        totalMessages: 7745,
        totalContacts: 335,
        activeChats: 42,
        botResponses: 4812,
        responseTime: 4,
        satisfactionRate: 98,
      })

      // Mock chart data
      const mockChartData = [
        { date: "2024-01-01", messages: 120, contacts: 15, botResponses: 80 },
        { date: "2024-01-02", messages: 150, contacts: 20, botResponses: 95 },
        { date: "2024-01-03", messages: 180, contacts: 25, botResponses: 110 },
        { date: "2024-01-04", messages: 200, contacts: 30, botResponses: 125 },
        { date: "2024-01-05", messages: 170, contacts: 22, botResponses: 105 },
        { date: "2024-01-06", messages: 190, contacts: 28, botResponses: 115 },
        { date: "2024-01-07", messages: 220, contacts: 35, botResponses: 140 },
      ]
      setChartData(mockChartData)
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      // Simular export
      const csvContent =
        "data:text/csv;charset=utf-8," +
        "Data,Mensagens,Contatos,Respostas Bot\n" +
        chartData.map((row) => `${row.date},${row.messages},${row.contacts},${row.botResponses}`).join("\n")

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `relatorio-${period}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Relatórios" }]} />
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">📊 Relatórios</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Relatórios" }]} />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📊 Relatórios</h1>
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Último dia</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">+12% em relação ao período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalContacts || 0}</div>
            <p className="text-xs text-muted-foreground">+8% em relação ao período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respostas do Bot</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.botResponses || 0}</div>
            <p className="text-xs text-muted-foreground">+25% em relação ao período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.responseTime || 0}s</div>
            <p className="text-xs text-muted-foreground">-15% em relação ao período anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Atividade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade por Período</CardTitle>
            <CardDescription>Mensagens e contatos ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <svg width="100%" height="100%" viewBox="0 0 400 300" className="border rounded">
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Chart bars */}
                {chartData.map((data, index) => {
                  const barHeight = (data.messages / 250) * 200
                  const x = 50 + index * 45
                  const y = 250 - barHeight

                  return (
                    <g key={index}>
                      <rect x={x} y={y} width="30" height={barHeight} fill="#3b82f6" rx="2" />
                      <text x={x + 15} y={270} textAnchor="middle" fontSize="10" fill="#6b7280">
                        {new Date(data.date).getDate()}
                      </text>
                      <text x={x + 15} y={y - 5} textAnchor="middle" fontSize="10" fill="#374151">
                        {data.messages}
                      </text>
                    </g>
                  )
                })}

                {/* Y-axis labels */}
                <text x="20" y="60" fontSize="10" fill="#6b7280">
                  250
                </text>
                <text x="20" y="110" fontSize="10" fill="#6b7280">
                  200
                </text>
                <text x="20" y="160" fontSize="10" fill="#6b7280">
                  150
                </text>
                <text x="20" y="210" fontSize="10" fill="#6b7280">
                  100
                </text>
                <text x="20" y="260" fontSize="10" fill="#6b7280">
                  50
                </text>

                {/* Title */}
                <text x="200" y="20" textAnchor="middle" fontSize="12" fill="#374151" fontWeight="bold">
                  Mensagens por Dia
                </text>
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance do Chatbot</CardTitle>
            <CardDescription>Eficiência das respostas automáticas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Taxa de Satisfação</span>
                <span className="text-sm text-muted-foreground">{stats?.satisfactionRate || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.satisfactionRate || 0}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Respostas Automáticas</span>
                <span className="text-sm text-muted-foreground">78%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: "78%" }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tempo Médio de Resposta</span>
                <span className="text-sm text-muted-foreground">{stats?.responseTime || 0}s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: "65%" }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
