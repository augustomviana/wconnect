"use client"

import { useState } from "react"
import { Search, UserPlus, UserCheck, UserX, MoreHorizontal, Shield, Headphones, Eye, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Breadcrumb } from "@/components/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Dados simulados
const mockMembers = [
  {
    id: 1,
    name: "Maria Silva",
    email: "maria.silva@exemplo.com",
    role: "admin",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    lastActive: "2023-06-06T10:30:00",
    phone: "+55 11 99999-9999",
    department: "Administração",
    joinDate: "2023-01-15",
  },
  {
    id: 2,
    name: "João Oliveira",
    email: "joao.oliveira@exemplo.com",
    role: "agent",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    lastActive: "2023-06-06T09:45:00",
    phone: "+55 11 88888-8888",
    department: "Atendimento",
    joinDate: "2023-02-20",
  },
  {
    id: 3,
    name: "Ana Pereira",
    email: "ana.pereira@exemplo.com",
    role: "agent",
    status: "inactive",
    avatar: "/placeholder.svg?height=40&width=40",
    lastActive: "2023-06-05T16:20:00",
    phone: "+55 11 77777-7777",
    department: "Atendimento",
    joinDate: "2023-03-10",
  },
  {
    id: 4,
    name: "Carlos Santos",
    email: "carlos.santos@exemplo.com",
    role: "viewer",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
    lastActive: "2023-06-06T08:15:00",
    phone: "+55 11 66666-6666",
    department: "Supervisão",
    joinDate: "2023-04-05",
  },
  {
    id: 5,
    name: "Juliana Lima",
    email: "juliana.lima@exemplo.com",
    role: "agent",
    status: "pending",
    avatar: "/placeholder.svg?height=40&width=40",
    lastActive: null,
    phone: "+55 11 55555-5555",
    department: "Atendimento",
    joinDate: "2023-06-01",
  },
]

const roleLabels = {
  admin: "Administrador",
  agent: "Atendente",
  viewer: "Visualizador",
}

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  pending: "Pendente",
}

export default function MembersPage() {
  const [members, setMembers] = useState(mockMembers)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("agent")

  // Estados para modais
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === "all" || member.role === roleFilter
    const matchesStatus = statusFilter === "all" || member.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleInviteMember = (e) => {
    e.preventDefault()
    if (!newMemberEmail) return

    const newMember = {
      id: members.length + 1,
      name: newMemberEmail.split("@")[0],
      email: newMemberEmail,
      role: newMemberRole,
      status: "pending",
      avatar: "/placeholder.svg?height=40&width=40",
      lastActive: null,
      phone: "",
      department: "Atendimento",
      joinDate: new Date().toISOString().split("T")[0],
    }

    setMembers([...members, newMember])
    setNewMemberEmail("")
    setShowInviteForm(false)
    alert("Convite enviado com sucesso!")
  }

  const handleChangeRole = (memberId, newRole) => {
    setMembers(
      members.map((member) => {
        if (member.id === memberId) {
          return { ...member, role: newRole }
        }
        return member
      }),
    )
    alert(`Função alterada para ${roleLabels[newRole]}`)
  }

  const handleChangeStatus = (memberId, newStatus) => {
    setMembers(
      members.map((member) => {
        if (member.id === memberId) {
          return { ...member, status: newStatus }
        }
        return member
      }),
    )
    alert(`Status alterado para ${statusLabels[newStatus]}`)
  }

  const handleViewDetails = (member) => {
    setSelectedMember(member)
    setShowDetailsModal(true)
  }

  const handleEditProfile = (member) => {
    setSelectedMember(member)
    setShowEditModal(true)
  }

  const handleRemoveMember = (memberId) => {
    if (confirm("Tem certeza que deseja remover este membro?")) {
      setMembers(members.filter((member) => member.id !== memberId))
      alert("Membro removido com sucesso!")
    }
  }

  const formatLastActive = (timestamp) => {
    if (!timestamp) return "Nunca"

    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m atrás`
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`
    } else if (diffDays < 7) {
      return `${diffDays}d atrás`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Membros" }]} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Membros da Equipe</h1>
          <p className="text-muted-foreground">Gerencie os membros da sua equipe</p>
        </div>
        <Button onClick={() => setShowInviteForm(!showInviteForm)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Membro
        </Button>
      </div>

      {showInviteForm && (
        <div className="bg-white rounded-lg shadow-sm border p-4 lg:p-6">
          <h2 className="text-lg font-medium mb-4">Convidar Novo Membro</h2>
          <form onSubmit={handleInviteMember} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Função
                </label>
                <select
                  id="role"
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                >
                  <option value="admin">Administrador</option>
                  <option value="agent">Atendente</option>
                  <option value="viewer">Visualizador</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setShowInviteForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">Enviar Convite</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center flex-1 gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar membros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white">
                    <span className="mr-1">Função:</span>
                    {roleFilter === "all"
                      ? "Todas"
                      : roleFilter === "admin"
                        ? "Administradores"
                        : roleFilter === "agent"
                          ? "Atendentes"
                          : "Visualizadores"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border shadow-md">
                  <DropdownMenuItem onClick={() => setRoleFilter("all")}>Todas as funções</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("admin")}>Administradores</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("agent")}>Atendentes</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("viewer")}>Visualizadores</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white">
                    <span className="mr-1">Status:</span>
                    {statusFilter === "all"
                      ? "Todos"
                      : statusFilter === "active"
                        ? "Ativos"
                        : statusFilter === "inactive"
                          ? "Inativos"
                          : "Pendentes"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border shadow-md">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>Todos os status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>Ativos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>Inativos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pendentes</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acesso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={member.avatar || "/placeholder.svg"}
                          alt={member.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 flex items-center gap-1 border border-gray-200 bg-white"
                        >
                          {member.role === "admin" && <Shield className="h-4 w-4 text-blue-600" />}
                          {member.role === "agent" && <Headphones className="h-4 w-4 text-green-600" />}
                          {member.role === "viewer" && <Eye className="h-4 w-4 text-gray-600" />}
                          <span className="text-sm">{roleLabels[member.role]}</span>
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-white border shadow-md">
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member.id, "admin")}
                          className="flex items-center gap-2"
                        >
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span>Administrador</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member.id, "agent")}
                          className="flex items-center gap-2"
                        >
                          <Headphones className="h-4 w-4 text-green-600" />
                          <span>Atendente</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member.id, "viewer")}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                          <span>Visualizador</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.status === "active"
                          ? "bg-green-100 text-green-800"
                          : member.status === "inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {statusLabels[member.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLastActive(member.lastActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {member.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeStatus(member.id, "inactive")}
                          className="text-red-500"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChangeStatus(member.id, "active")}
                          className="text-green-500"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border shadow-md">
                          <DropdownMenuItem onClick={() => handleViewDetails(member)}>Ver detalhes</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditProfile(member)}>Editar perfil</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveMember(member.id)}>
                            Remover membro
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

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-200">
          {filteredMembers.map((member) => (
            <div key={member.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <img className="h-10 w-10 rounded-full" src={member.avatar || "/placeholder.svg"} alt={member.name} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white border shadow-md">
                    <DropdownMenuItem onClick={() => handleViewDetails(member)}>Ver detalhes</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditProfile(member)}>Editar perfil</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveMember(member.id)}>
                      Remover membro
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    member.status === "active"
                      ? "bg-green-100 text-green-800"
                      : member.status === "inactive"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {statusLabels[member.status]}
                </span>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                  {roleLabels[member.role]}
                </span>
              </div>

              <div className="text-xs text-gray-500">Último acesso: {formatLastActive(member.lastActive)}</div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="p-8 text-center">
            <UserX className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum membro encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">Não encontramos nenhum membro com esses critérios de busca.</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Membro</DialogTitle>
            <DialogDescription>Informações completas do membro da equipe</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  className="h-16 w-16 rounded-full"
                  src={selectedMember.avatar || "/placeholder.svg"}
                  alt={selectedMember.name}
                />
                <div>
                  <h3 className="text-lg font-medium">{selectedMember.name}</h3>
                  <p className="text-sm text-gray-500">{selectedMember.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Função</Label>
                  <p>{roleLabels[selectedMember.role]}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <p>{statusLabels[selectedMember.status]}</p>
                </div>
                <div>
                  <Label className="font-medium">Telefone</Label>
                  <p>{selectedMember.phone || "Não informado"}</p>
                </div>
                <div>
                  <Label className="font-medium">Departamento</Label>
                  <p>{selectedMember.department}</p>
                </div>
                <div>
                  <Label className="font-medium">Data de Ingresso</Label>
                  <p>{new Date(selectedMember.joinDate).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <Label className="font-medium">Último Acesso</Label>
                  <p>{formatLastActive(selectedMember.lastActive)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>Edite as informações do membro da equipe</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit-name">Nome</Label>
                  <Input id="edit-name" defaultValue={selectedMember.name} placeholder="Nome completo" />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    defaultValue={selectedMember.email}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input id="edit-phone" defaultValue={selectedMember.phone} placeholder="+55 11 99999-9999" />
                </div>
                <div>
                  <Label htmlFor="edit-department">Departamento</Label>
                  <Input id="edit-department" defaultValue={selectedMember.department} placeholder="Departamento" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowEditModal(false)
                alert("Perfil atualizado com sucesso!")
              }}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
