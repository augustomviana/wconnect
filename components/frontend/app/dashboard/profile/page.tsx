"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Save,
  Edit,
  Shield,
  Key,
  Monitor,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react"
import { Breadcrumb } from "@/components/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: "José Augusto",
    email: "jose.augusto@exemplo.com",
    phone: "+55 11 99999-9999",
    avatar: "/placeholder.svg?height=120&width=120",
    bio: "Administrador do sistema WConect",
    department: "Tecnologia da Informação",
    position: "Administrador de Sistema",
    joinDate: "2023-01-15",
    location: "São Paulo, SP",
    timezone: "America/Sao_Paulo",
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState(user)
  const [saving, setSaving] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false)
  const [isSessionsDialogOpen, setIsSessionsDialogOpen] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, device: "Chrome - Windows", location: "São Paulo, SP", lastActive: "Agora", current: true },
    { id: 2, device: "Safari - iPhone", location: "São Paulo, SP", lastActive: "2 horas atrás", current: false },
    { id: 3, device: "Firefox - Linux", location: "Rio de Janeiro, RJ", lastActive: "1 dia atrás", current: false },
  ])
  const { toast } = useToast()

  useEffect(() => {
    // Carregar dados do usuário do localStorage ou API
    const userData = localStorage.getItem("userData")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser({ ...user, ...parsedUser })
      setEditedUser({ ...user, ...parsedUser })
    }

    // Carregar preferências
    const savedDarkMode = localStorage.getItem("darkMode") === "true"
    setDarkMode(savedDarkMode)
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setUser(editedUser)
      localStorage.setItem("userData", JSON.stringify(editedUser))

      setIsEditing(false)
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o perfil. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedUser(user)
    setIsEditing(false)
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        // Simular upload
        const reader = new FileReader()
        reader.onload = (e) => {
          const newAvatar = e.target?.result as string
          setEditedUser((prev) => ({ ...prev, avatar: newAvatar }))
          setUser((prev) => ({ ...prev, avatar: newAvatar }))
          toast({
            title: "Avatar atualizado",
            description: "Sua foto de perfil foi atualizada com sucesso!",
          })
        }
        reader.readAsDataURL(file)
        setIsAvatarDialogOpen(false)
      } catch (error) {
        toast({
          title: "Erro no upload",
          description: "Não foi possível fazer upload da imagem.",
          variant: "destructive",
        })
      }
    }
  }

  const handlePasswordChange = async () => {
    try {
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos de senha.",
          variant: "destructive",
        })
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({
          title: "Senhas não coincidem",
          description: "A nova senha e a confirmação devem ser iguais.",
          variant: "destructive",
        })
        return
      }

      if (passwordData.newPassword.length < 6) {
        toast({
          title: "Senha muito fraca",
          description: "A senha deve ter pelo menos 6 caracteres.",
          variant: "destructive",
        })
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setIsPasswordDialogOpen(false)
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro ao alterar senha",
        description: "Não foi possível alterar a senha. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEnable2FA = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setIs2FADialogOpen(false)
      toast({
        title: "2FA Ativado",
        description: "Autenticação de dois fatores foi ativada com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro ao ativar 2FA",
        description: "Não foi possível ativar a autenticação de dois fatores.",
        variant: "destructive",
      })
    }
  }

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled)
    localStorage.setItem("darkMode", enabled.toString())

    if (enabled) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    toast({
      title: enabled ? "Modo escuro ativado" : "Modo claro ativado",
      description: enabled ? "Interface alterada para modo escuro." : "Interface alterada para modo claro.",
    })
  }

  const handleEndSession = async (sessionId: number) => {
    try {
      // Simular encerramento da sessão
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setActiveSessions((prev) => prev.filter((session) => session.id !== sessionId))

      toast({
        title: "Sessão encerrada",
        description: "A sessão foi encerrada com sucesso!",
      })
    } catch (error) {
      toast({
        title: "Erro ao encerrar sessão",
        description: "Não foi possível encerrar a sessão. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Perfil" }]} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Perfil do Usuário</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Informações Pessoais</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {/* Avatar e Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Suas informações pessoais e de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative">
                  <img
                    src={user.avatar || "/placeholder.svg"}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                  {isEditing && (
                    <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                      <DialogTrigger asChild>
                        <button
                          className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                          title="Alterar foto"
                        >
                          <Camera className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Alterar Foto de Perfil</DialogTitle>
                          <DialogDescription>
                            Escolha uma nova foto para seu perfil. Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center justify-center w-full">
                            <label
                              htmlFor="avatar-upload"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Camera className="w-8 h-8 mb-4 text-gray-500" />
                                <p className="mb-2 text-sm text-gray-500">
                                  <span className="font-semibold">Clique para fazer upload</span>
                                </p>
                                <p className="text-xs text-gray-500">PNG, JPG ou GIF (MAX. 5MB)</p>
                              </div>
                              <input
                                id="avatar-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                              />
                            </label>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <p className="text-gray-600">{user.position}</p>
                  <p className="text-sm text-gray-500">{user.department}</p>
                </div>
              </div>

              {/* Formulário */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      value={isEditing ? editedUser.name : user.name}
                      onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={isEditing ? editedUser.email : user.email}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={isEditing ? editedUser.phone : user.phone}
                      onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={isEditing ? editedUser.position : user.position}
                    onChange={(e) => setEditedUser({ ...editedUser, position: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={isEditing ? editedUser.department : user.department}
                    onChange={(e) => setEditedUser({ ...editedUser, department: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      value={isEditing ? editedUser.location : user.location}
                      onChange={(e) => setEditedUser({ ...editedUser, location: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={isEditing ? editedUser.bio : user.bio}
                  onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>Detalhes sobre sua conta no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Data de Ingresso</Label>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(user.joinDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <div className="text-sm text-gray-600">{user.timezone}</div>
                </div>

                <div className="space-y-2">
                  <Label>Status da Conta</Label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Ativa
                  </span>
                </div>

                <div className="space-y-2">
                  <Label>Último Login</Label>
                  <div className="text-sm text-gray-600">{new Date().toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Gerencie suas configurações de segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Alterar Senha</h4>
                      <p className="text-sm text-gray-600">Última alteração há 30 dias</p>
                    </div>
                  </div>
                  <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Alterar</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription>Digite sua senha atual e escolha uma nova senha segura.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Senha Atual</Label>
                          <div className="relative">
                            <Input
                              id="current-password"
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                              }
                              placeholder="Digite sua senha atual"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                              onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                            >
                              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">Nova Senha</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Digite sua nova senha"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                              onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
                            >
                              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordData.confirmPassword}
                              onChange={(e) =>
                                setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                              }
                              placeholder="Confirme sua nova senha"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                              onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                            >
                              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handlePasswordChange}>Alterar Senha</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">Autenticação de Dois Fatores</h4>
                      <p className="text-sm text-gray-600">Adicione uma camada extra de segurança</p>
                    </div>
                  </div>
                  <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Configurar</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
                        <DialogDescription>
                          Configure a autenticação de dois fatores para maior segurança da sua conta.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="w-48 h-48 mx-auto mb-4 border-2 border-gray-200 rounded-lg overflow-hidden">
                            <img
                              src="/images/qr-code-2fa.png"
                              alt="QR Code para 2FA"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Escaneie este QR Code com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="verification-code">Código de Verificação</Label>
                          <Input id="verification-code" placeholder="Digite o código de 6 dígitos" maxLength={6} />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIs2FADialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleEnable2FA}>Ativar 2FA</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-5 w-5 text-purple-500" />
                    <div>
                      <h4 className="font-medium">Sessões Ativas</h4>
                      <p className="text-sm text-gray-600">Gerencie dispositivos conectados</p>
                    </div>
                  </div>
                  <Dialog open={isSessionsDialogOpen} onOpenChange={setIsSessionsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Visualizar</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Sessões Ativas</DialogTitle>
                        <DialogDescription>Gerencie todos os dispositivos conectados à sua conta.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {activeSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Monitor className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="font-medium text-sm">{session.device}</p>
                                <p className="text-xs text-gray-500">{session.location}</p>
                                <p className="text-xs text-gray-500">{session.lastActive}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {session.current && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">
                                  Atual
                                </span>
                              )}
                              {!session.current && (
                                <Button variant="destructive" size="sm" onClick={() => handleEndSession(session.id)}>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Encerrar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferências do Sistema</CardTitle>
              <CardDescription>Configure como você interage com o sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Notificações por Email</h4>
                    <p className="text-sm text-gray-600">Receber notificações importantes por email</p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={(checked) => {
                      setNotifications(checked)
                      toast({
                        title: checked ? "Notificações ativadas" : "Notificações desativadas",
                        description: checked
                          ? "Você receberá notificações por email."
                          : "Notificações por email foram desativadas.",
                      })
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Notificações Push</h4>
                    <p className="text-sm text-gray-600">Receber notificações no navegador</p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={(checked) => {
                      setPushNotifications(checked)
                      toast({
                        title: checked ? "Push notifications ativadas" : "Push notifications desativadas",
                        description: checked
                          ? "Você receberá notificações no navegador."
                          : "Notificações push foram desativadas.",
                      })
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Modo Escuro</h4>
                    <p className="text-sm text-gray-600">Usar tema escuro na interface</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
