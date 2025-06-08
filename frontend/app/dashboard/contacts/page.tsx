"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface Contact {
  id: number
  whatsapp_id: string
  name: string
  phone_number: string
  profile_pic_url?: string
  is_group: boolean
  is_blocked: boolean
  created_at: string
}

// Mock data com mais contatos para demonstrar paginação
const generateMockContacts = (page: number, limit: number): Contact[] => {
  const contacts: Contact[] = []
  const startId = (page - 1) * limit + 1

  for (let i = 0; i < limit; i++) {
    const id = startId + i
    contacts.push({
      id,
      whatsapp_id: `55119${String(id).padStart(8, "0")}@c.us`,
      name: `Contato ${id}`,
      phone_number: `+5511${String(id).padStart(9, "0")}`,
      profile_pic_url: Math.random() > 0.5 ? `/placeholder.svg?height=40&width=40` : undefined,
      is_group: Math.random() > 0.8,
      is_blocked: Math.random() > 0.9,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return contacts
}

export default function ContactsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalContacts, setTotalContacts] = useState(43311)
  const [contactsPerPage] = useState(30)
  const totalPages = Math.ceil(totalContacts / contactsPerPage)

  const [stats, setStats] = useState({
    total: 43311,
    groups: 156,
    blocked: 23,
    recent: 89,
  })

  // Estados para modais
  const [showCallModal, setShowCallModal] = useState(false)
  const [showAddContactModal, setShowAddContactModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
  })

  useEffect(() => {
    fetchContacts()
    fetchStats()
  }, [search, currentPage])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Gerar contatos mock baseado na página atual
      const mockContacts = generateMockContacts(currentPage, contactsPerPage)

      // Filtrar por busca se necessário
      let filteredContacts = mockContacts
      if (search) {
        filteredContacts = mockContacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(search.toLowerCase()) || contact.phone_number.includes(search),
        )
      }

      setContacts(filteredContacts)
    } catch (error) {
      setError("Erro de conexão com o servidor")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Simular busca de estatísticas
      await new Promise((resolve) => setTimeout(resolve, 500))
      setStats({
        total: 43311,
        groups: 156,
        blocked: 23,
        recent: 89,
      })
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    }
  }

  const syncContacts = async () => {
    try {
      setSyncing(true)
      setError(null)

      // Simular sincronização
      await new Promise((resolve) => setTimeout(resolve, 3000))

      await fetchContacts()
      await fetchStats()

      toast({
        title: "Contatos sincronizados",
        description: "Contatos sincronizados com sucesso! 150 contatos processados.",
      })
    } catch (error) {
      setError("Erro ao sincronizar contatos. Verifique se o WhatsApp está conectado.")
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar os contatos.",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleCall = (contact: Contact) => {
    setSelectedContact(contact)
    setShowCallModal(true)
  }

  const handleMessage = (contact: Contact) => {
    router.push(`/dashboard/chat/${encodeURIComponent(contact.whatsapp_id)}`)
  }

  const handleAddContact = () => {
    setShowAddContactModal(true)
  }

  const saveNewContact = async () => {
    try {
      if (!newContact.name || !newContact.phone) {
        toast({
          title: "Campos obrigatórios",
          description: "Nome e telefone são obrigatórios.",
          variant: "destructive",
        })
        return
      }

      // Simular salvamento
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const contact: Contact = {
        id: Date.now(),
        whatsapp_id: `${newContact.phone.replace(/\D/g, "")}@c.us`,
        name: newContact.name,
        phone_number: newContact.phone,
        is_group: false,
        is_blocked: false,
        created_at: new Date().toISOString(),
      }

      setContacts((prev) => [contact, ...prev.slice(0, -1)])
      setStats((prev) => ({ ...prev, total: prev.total + 1 }))

      toast({
        title: "Contato adicionado",
        description: `${newContact.name} foi adicionado com sucesso!`,
      })

      setShowAddContactModal(false)
      setNewContact({ name: "", phone: "" })
    } catch (error) {
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o contato.",
        variant: "destructive",
      })
    }
  }

  const handleBlockContact = (contact: Contact) => {
    setContacts(contacts.map((c) => (c.id === contact.id ? { ...c, is_blocked: !c.is_blocked } : c)))
    toast({
      title: `Contato ${contact.is_blocked ? "desbloqueado" : "bloqueado"}`,
      description: `${contact.name} foi ${contact.is_blocked ? "desbloqueado" : "bloqueado"} com sucesso!`,
    })
  }

  const handleDeleteContact = (contact: Contact) => {
    setContacts(contacts.filter((c) => c.id !== contact.id))
    toast({
      title: "Contato excluído",
      description: `${contact.name} foi excluído com sucesso!`,
    })
  }

  const initiateCall = () => {
    if (selectedContact) {
      toast({
        title: "Chamada iniciada",
        description: `Iniciando chamada para ${selectedContact.name} (${selectedContact.phone_number})`,
      })
      setShowCallModal(false)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        <Breadcrumb items={[{ label: "Contatos" }]} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-2">
              <h1 className="text-xl font-semibold text-gray-900">Contatos</h1>
              <p className="text-sm text-gray-600">Gerencie seus contatos do WhatsApp</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={fetchContacts} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button onClick={syncContacts} disabled={syncing || loading} variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              {syncing ? "Sincronizando..." : "Sincronizar WhatsApp"}
            </Button>
            <Button onClick={handleAddContact} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Contato
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => setError(null)}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total de Contatos</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Grupos</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.groups}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Bloqueados</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.blocked}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Novos (7 dias)</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.recent}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-4 lg:p-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar contatos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Contacts List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Lista de Contatos</h3>
              <div className="text-sm text-gray-500">
                Página {currentPage} de {totalPages} ({stats.total.toLocaleString()} contatos)
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Carregando contatos...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">
                  {search ? "Nenhum contato encontrado para a busca" : "Nenhum contato encontrado"}
                </p>
                {!search && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-400">Certifique-se de que o WhatsApp está conectado no Dashboard</p>
                    <Button onClick={syncContacts} disabled={syncing}>
                      {syncing ? "Sincronizando..." : "Sincronizar Contatos"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-hidden">
                {/* Desktop List */}
                <div className="hidden lg:block">
                  <ul className="divide-y divide-gray-200">
                    {contacts.map((contact) => (
                      <li key={contact.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {contact.profile_pic_url ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={contact.profile_pic_url || "/placeholder.svg"}
                                  alt={contact.name}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <Users className="h-6 w-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-gray-900">{contact.name || "Sem nome"}</p>
                                {contact.is_group && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Grupo
                                  </span>
                                )}
                                {contact.is_blocked && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Bloqueado
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{contact.phone_number}</p>
                              <p className="text-xs text-gray-400">
                                Adicionado: {new Date(contact.created_at).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCall(contact)}
                              className="p-2 text-gray-400 hover:text-blue-600"
                              title="Iniciar chamada"
                            >
                              <Phone className="h-5 w-5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMessage(contact)}
                              className="p-2 text-gray-400 hover:text-green-600"
                              title="Enviar mensagem"
                            >
                              <MessageCircle className="h-5 w-5" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="p-2 text-gray-400 hover:text-gray-600"
                                  title="Mais opções"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white border shadow-md">
                                <DropdownMenuItem onClick={() => handleMessage(contact)}>
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Enviar mensagem
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCall(contact)}>
                                  <Phone className="mr-2 h-4 w-4" />
                                  Iniciar chamada
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBlockContact(contact)}>
                                  <Users className="mr-2 h-4 w-4" />
                                  {contact.is_blocked ? "Desbloquear" : "Bloquear"} contato
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteContact(contact)} className="text-red-600">
                                  <Users className="mr-2 h-4 w-4" />
                                  Excluir contato
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {contact.profile_pic_url ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={contact.profile_pic_url || "/placeholder.svg"}
                              alt={contact.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{contact.name || "Sem nome"}</p>
                            <p className="text-sm text-gray-500">{contact.phone_number}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border shadow-md">
                            <DropdownMenuItem onClick={() => handleMessage(contact)}>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Enviar mensagem
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCall(contact)}>
                              <Phone className="mr-2 h-4 w-4" />
                              Iniciar chamada
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBlockContact(contact)}>
                              <Users className="mr-2 h-4 w-4" />
                              {contact.is_blocked ? "Desbloquear" : "Bloquear"} contato
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteContact(contact)} className="text-red-600">
                              <Users className="mr-2 h-4 w-4" />
                              Excluir contato
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {contact.is_group && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Grupo
                          </span>
                        )}
                        {contact.is_blocked && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Bloqueado
                          </span>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleCall(contact)} className="flex-1">
                          <Phone className="h-4 w-4 mr-2" />
                          Ligar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleMessage(contact)} className="flex-1">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Mensagem
                        </Button>
                      </div>

                      <p className="text-xs text-gray-400 mt-2">
                        Adicionado: {new Date(contact.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Paginação */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} variant="outline">
                      Anterior
                    </Button>
                    <Button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                    >
                      Próximo
                    </Button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{(currentPage - 1) * contactsPerPage + 1}</span> até{" "}
                        <span className="font-medium">{Math.min(currentPage * contactsPerPage, stats.total)}</span> de{" "}
                        <span className="font-medium">{stats.total.toLocaleString()}</span> resultados
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <Button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          variant="outline"
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        >
                          <span className="sr-only">Anterior</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </Button>

                        {/* Páginas */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <Button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              className="relative inline-flex items-center px-4 py-2 text-sm font-semibold"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}

                        <Button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        >
                          <span className="sr-only">Próximo</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Chamada */}
        <Dialog open={showCallModal} onOpenChange={setShowCallModal}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Iniciar Chamada</DialogTitle>
              <DialogDescription>Você está prestes a iniciar uma chamada para este contato</DialogDescription>
            </DialogHeader>
            {selectedContact && (
              <div className="flex items-center space-x-4 py-4">
                {selectedContact.profile_pic_url ? (
                  <img
                    className="h-12 w-12 rounded-full"
                    src={selectedContact.profile_pic_url || "/placeholder.svg"}
                    alt={selectedContact.name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium">{selectedContact.name || "Sem nome"}</h3>
                  <p className="text-sm text-gray-500">{selectedContact.phone_number}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCallModal(false)}>
                Cancelar
              </Button>
              <Button onClick={initiateCall} className="bg-green-600 hover:bg-green-700">
                <Phone className="mr-2 h-4 w-4" />
                Ligar Agora
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Adicionar Contato */}
        <Dialog open={showAddContactModal} onOpenChange={setShowAddContactModal}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Contato</DialogTitle>
              <DialogDescription>Adicione um novo contato à sua lista</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Nome</Label>
                <Input
                  id="contact-name"
                  placeholder="Nome do contato"
                  value={newContact.name}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Telefone</Label>
                <Input
                  id="contact-phone"
                  placeholder="+5511999999999"
                  value={newContact.phone}
                  onChange={(e) => setNewContact((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddContactModal(false)}>
                Cancelar
              </Button>
              <Button onClick={saveNewContact} className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Contato
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
