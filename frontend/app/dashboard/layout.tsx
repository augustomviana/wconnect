"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Home,
  MessageSquare,
  Users,
  LogOut,
  User,
  Bot,
  Zap,
  Settings,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Route {
  name: string
  href: string
  icon: any
  children?: Route[]
}

const navigation: Route[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Conversas",
    href: "/dashboard/conversations",
    icon: MessageSquare,
  },
  {
    name: "Membros",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    name: "Contatos",
    href: "/dashboard/contacts",
    icon: Users,
  },
  {
    name: "WhatsApp",
    href: "/dashboard/whatsapp",
    icon: MessageSquare,
  },
  {
    name: "Chatbot",
    href: "/dashboard/chatbot",
    icon: Bot,
    children: [
      {
        name: "Respostas Automáticas",
        href: "/dashboard/chatbot/responses",
        icon: MessageSquare,
      },
      {
        name: "Fluxos de Conversa",
        href: "/dashboard/chatbot/flows",
        icon: Zap,
      },
      {
        name: "Configurações",
        href: "/dashboard/chatbot/settings",
        icon: Settings,
      },
      {
        name: "Relatórios",
        href: "/dashboard/reports",
        icon: BarChart3,
      },
      {
        name: "Sessões Ativas",
        href: "/dashboard/sessions",
        icon: Users,
      },
      {
        name: "Logs de Interação",
        href: "/dashboard/logs",
        icon: MessageSquare,
      },
    ],
  },
  {
    name: "Integrações",
    href: "/dashboard/integrations",
    icon: Zap,
  },
  {
    name: "Configurações",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    name: "Perfil",
    href: "/dashboard/profile",
    icon: User,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  useEffect(() => {
    const userData = localStorage.getItem("userData")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Auto-expand Chatbot menu if we're on a chatbot page
    if (
      pathname.includes("/chatbot") ||
      pathname.includes("/reports") ||
      pathname.includes("/sessions") ||
      pathname.includes("/logs")
    ) {
      setExpandedItems((prev) => (prev.includes("Chatbot") ? prev : [...prev, "Chatbot"]))
    }
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    router.push("/login")
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard"
    if (pathname.includes("/conversations")) return "Conversas"
    if (pathname.includes("/members")) return "Membros"
    if (pathname.includes("/contacts")) return "Contatos"
    if (pathname.includes("/whatsapp")) return "WhatsApp"
    if (pathname.includes("/chatbot")) return "Chatbot & Automação"
    if (pathname.includes("/integrations")) return "Integrações"
    if (pathname.includes("/settings")) return "Configurações"
    if (pathname.includes("/profile")) return "Perfil"
    if (pathname.includes("/reports")) return "Relatórios"
    if (pathname.includes("/sessions")) return "Sessões Ativas"
    if (pathname.includes("/logs")) return "Logs de Interação"
    return "Dashboard"
  }

  const getPageDescription = () => {
    if (pathname === "/dashboard") return "Bem-vindo de volta! Gerencie suas mensagens e contatos."
    if (pathname.includes("/conversations")) return "Gerencie todas as conversas ativas"
    if (pathname.includes("/members")) return "Gerencie membros da equipe"
    if (pathname.includes("/contacts")) return "Gerencie seus contatos do WhatsApp"
    if (pathname.includes("/whatsapp")) return "Configure e monitore sua conexão WhatsApp"
    if (pathname.includes("/chatbot")) return "Gerencie chatbots, respostas automáticas e fluxos de conversa"
    if (pathname.includes("/integrations")) return "Configure integrações com sistemas externos"
    if (pathname.includes("/settings")) return "Configure as preferências do sistema"
    if (pathname.includes("/profile")) return "Gerencie suas informações pessoais"
    return "Bem-vindo de volta! Gerencie suas mensagens e contatos."
  }

  const renderNavItem = (route: Route, level = 0) => {
    const hasChildren = route.children && route.children.length > 0
    const isExpanded = expandedItems.includes(route.name)
    const isItemActive = isActive(route.href)
    const hasActiveChild = hasChildren && route.children?.some((child) => isActive(child.href))

    return (
      <li key={route.href}>
        <div className="flex items-center">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(route.name)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
                isItemActive || hasActiveChild
                  ? "bg-green-100 text-green-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <route.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{route.name}</span>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <a
              href={route.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
                isItemActive ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <route.icon className="h-5 w-5" />
              <span>{route.name}</span>
            </a>
          )}
        </div>

        {hasChildren && (
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <ul className="mt-1 space-y-1 pl-4 border-l border-gray-200">
              {route.children?.map((child) => renderNavItem(child, level + 1))}
            </ul>
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">WConect</span>
          </div>

          {/* Page Title */}
          <div className="flex-1 text-center hidden md:block">
            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
            <p className="text-sm text-gray-500">{getPageDescription()}</p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/contacts")}
              className="hidden sm:flex"
            >
              <Users className="mr-2 h-4 w-4" />
              Ver Contatos
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => router.push("/dashboard/whatsapp")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-80px)] hidden lg:block">
          <nav className="p-4">
            <ul className="space-y-2">{navigation.map((route) => renderNavItem(route))}</ul>
          </nav>

          {/* User Info & Logout */}
          <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || "Usuário"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || "usuario@email.com"}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="grid grid-cols-5 gap-1 py-2 px-2">
            {/* Primeira linha - 5 itens principais */}
            <a
              href="/dashboard"
              className={`flex flex-col items-center p-2 text-xs ${
                pathname === "/dashboard" ? "text-green-600" : "text-gray-600"
              }`}
            >
              <Home className="h-4 w-4 mb-1" />
              <span className="truncate">Dashboard</span>
            </a>
            <a
              href="/dashboard/conversations"
              className={`flex flex-col items-center p-2 text-xs ${
                pathname.includes("/conversations") ? "text-green-600" : "text-gray-600"
              }`}
            >
              <MessageSquare className="h-4 w-4 mb-1" />
              <span className="truncate">Conversas</span>
            </a>
            <a
              href="/dashboard/contacts"
              className={`flex flex-col items-center p-2 text-xs ${
                pathname.includes("/contacts") ? "text-green-600" : "text-gray-600"
              }`}
            >
              <Users className="h-4 w-4 mb-1" />
              <span className="truncate">Contatos</span>
            </a>
            <a
              href="/dashboard/whatsapp"
              className={`flex flex-col items-center p-2 text-xs ${
                pathname.includes("/whatsapp") ? "text-green-600" : "text-gray-600"
              }`}
            >
              <MessageSquare className="h-4 w-4 mb-1" />
              <span className="truncate">WhatsApp</span>
            </a>
            <a
              href="/dashboard/chatbot"
              className={`flex flex-col items-center p-2 text-xs ${
                pathname.includes("/chatbot") ? "text-green-600" : "text-gray-600"
              }`}
            >
              <Bot className="h-4 w-4 mb-1" />
              <span className="truncate">Chatbot</span>
            </a>
          </div>

          {/* Segunda linha - 4 itens + botão sair */}
          <div className="grid grid-cols-5 gap-1 py-1 px-2 border-t border-gray-100">
            <a
              href="/dashboard/members"
              className={`flex flex-col items-center p-2 text-xs ${
                pathname.includes("/members") ? "text-green-600" : "text-gray-600"
              }`}
            >
              <Users className="h-4 w-4 mb-1" />
              <span className="truncate">Membros</span>
            </a>
            <a
              href="/dashboard/integrations"
              className={`flex flex-col items-center p-2 text-xs ${
                pathname.includes("/integrations") ? "text-green-600" : "text-gray-600"
              }`}
            >
              <Zap className="h-4 w-4 mb-1" />
              <span className="truncate">Integrações</span>
            </a>
            <a
              href="/dashboard/settings"
              className={`flex flex-col items-center p-2 text-xs ${
                pathname.includes("/settings") ? "text-green-600" : "text-gray-600"
              }`}
            >
              <Settings className="h-4 w-4 mb-1" />
              <span className="truncate">Config.</span>
            </a>
            <a
              href="/dashboard/profile"
              className={`flex flex-col items-center p-2 text-xs ${
                pathname.includes("/profile") ? "text-green-600" : "text-gray-600"
              }`}
            >
              <User className="h-4 w-4 mb-1" />
              <span className="truncate">Perfil</span>
            </a>
            <button onClick={handleLogout} className="flex flex-col items-center p-2 text-xs text-red-600">
              <LogOut className="h-4 w-4 mb-1" />
              <span className="truncate">Sair</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 pb-32 lg:pb-6">{children}</main>
      </div>
    </div>
  )
}
