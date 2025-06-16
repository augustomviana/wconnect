// frontend/app/dashboard/layout.tsx

"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home, MessageSquare, Users, LogOut, User, Bot, Zap, Settings,
  ChevronDown, ChevronRight, BarChart3, MapPin, Contact, BarChartHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- ADICIONADO: Importa o nosso novo provedor de contexto ---
import { WhatsAppProvider } from "@/context/WhatsAppProvider";

interface Route {
  name: string;
  href: string;
  icon: any;
  children?: Route[];
}

const navigation: Route[] = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Conversas", href: "/dashboard/conversations", icon: MessageSquare },
    { name: "Membros", href: "/dashboard/members", icon: Users },
    { name: "Contatos", href: "/dashboard/contacts", icon: Contact },
    { name: "WhatsApp", href: "/dashboard/whatsapp", icon: MessageSquare },
    { name: "Google Maps", href: "/dashboard/gmaps-extractor", icon: MapPin },
    { name: "Campanhas", href: "/dashboard/campanhas", icon: BarChartHorizontal },
    {
        name: "Chatbot", href: "/dashboard/chatbot", icon: Bot,
        children: [
            { name: "Respostas Automáticas", href: "/dashboard/chatbot/responses", icon: MessageSquare },
            { name: "Fluxos de Conversa", href: "/dashboard/chatbot/flows", icon: Zap },
            { name: "Configurações", href: "/dashboard/chatbot/settings", icon: Settings },
            { name: "Relatórios", href: "/dashboard/reports", icon: BarChart3 },
            { name: "Sessões Ativas", href: "/dashboard/sessions", icon: Users },
            { name: "Logs de Interação", href: "/dashboard/logs", icon: MessageSquare },
        ],
    },
    { name: "Integrações", href: "/dashboard/integrations", icon: Zap },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
    { name: "Perfil", href: "/dashboard/profile", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }

    const currentRoute = navigation.find(route => route.children?.some(child => pathname.startsWith(child.href)));
    if (currentRoute) {
        setExpandedItems(prev => (prev.includes(currentRoute.name) ? prev : [...prev, currentRoute.name]));
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]));
  };

  const getPageTitle = () => {
    // ... (sua lógica getPageTitle existente) ...
    return "Dashboard";
  };

  const getPageDescription = () => {
    // ... (sua lógica getPageDescription existente) ...
    return "Bem-vindo de volta!";
  };

  const renderNavItem = (route: Route, level = 0) => {
    const hasChildren = route.children && route.children.length > 0;
    const isExpanded = expandedItems.includes(route.name);
    const isItemActive = isActive(route.href);
    const hasActiveChild = hasChildren && route.children?.some((child) => isActive(child.href));

    return (
      <li key={route.href}>
        <div className="flex items-center">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(route.name)}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${isItemActive || hasActiveChild ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <route.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{route.name}</span>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <Link
              href={route.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${isItemActive ? "bg-green-100 text-green-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
              style={{ paddingLeft: `${12 + level * 16}px` }}
            >
              <route.icon className="h-5 w-5" />
              <span>{route.name}</span>
            </Link>
          )}
        </div>
        {hasChildren && (
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
            <ul className="mt-1 space-y-1 pl-4 border-l border-gray-200">
              {route.children?.map((child) => renderNavItem(child, level + 1))}
            </ul>
          </div>
        )}
      </li>
    );
  };

  return (
    // --- ADICIONADO: Envolve todo o layout com o WhatsAppProvider ---
    <WhatsAppProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
            {/* ... Seu código do Header ... */}
        </header>

        <div className="flex">
          <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-80px)] hidden lg:block">
            <nav className="p-4">
              <ul className="space-y-2">{navigation.map((route) => renderNavItem(route))}</ul>
            </nav>
            <div className="absolute bottom-0 left-0 right-0 w-64 p-4 border-t border-gray-200 bg-white">
                {/* ... Seu código de User Info & Logout ... */}
            </div>
          </aside>
          
          <main className="flex-1 p-4 lg:p-6 pb-32 lg:pb-6">{children}</main>
        </div>
      </div>
    </WhatsAppProvider>
  );
}