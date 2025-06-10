"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Settings, Database, Bell, Save, AlertCircle, Shield, Smartphone, Mail, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemSettings {
  session_timeout: number
  max_message_length: number
  backup_enabled: boolean
  backup_frequency: string
  log_level: string
  api_rate_limit: number
  webhook_url: string
}

interface NotificationSettings {
  notifications_enabled: boolean
  email_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  sound_enabled: boolean
  desktop_notifications: boolean
  notification_frequency: string
  quiet_hours_enabled: boolean
  quiet_start: string
  quiet_end: string
  email_address: string
  phone_number: string
}

interface SecuritySettings {
  two_factor_enabled: boolean
  session_timeout: number
  password_expiry_days: number
  login_attempts: number
  ip_whitelist_enabled: boolean
  audit_logs_enabled: boolean
  backup_encryption: boolean
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("system")
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const { toast } = useToast()

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    session_timeout: 3600,
    max_message_length: 4096,
    backup_enabled: true,
    backup_frequency: "daily",
    log_level: "info",
    api_rate_limit: 100,
    webhook_url: "",
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    notifications_enabled: true,
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    sound_enabled: true,
    desktop_notifications: true,
    notification_frequency: "immediate",
    quiet_hours_enabled: false,
    quiet_start: "22:00",
    quiet_end: "08:00",
    email_address: "usuario@empresa.com",
    phone_number: "+5511999999999",
  })

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    session_timeout: 3600,
    password_expiry_days: 90,
    login_attempts: 5,
    ip_whitelist_enabled: false,
    audit_logs_enabled: true,
    backup_encryption: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSystemSettings = async () => {
    try {
      setSaveStatus("saving")
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSaveStatus("saved")
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram salvas com sucesso!",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setSaveStatus("error")
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const saveNotificationSettings = async () => {
    try {
      setSaveStatus("saving")
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSaveStatus("saved")
      toast({
        title: "Notificações configuradas",
        description: "As configurações de notificação foram salvas com sucesso!",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setSaveStatus("error")
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const saveSecuritySettings = async () => {
    try {
      setSaveStatus("saving")
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSaveStatus("saved")
      toast({
        title: "Segurança configurada",
        description: "As configurações de segurança foram salvas com sucesso!",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Erro ao salvar:", error)
      setSaveStatus("error")
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const enable2FA = async () => {
    try {
      setSaveStatus("saving")
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSecuritySettings((prev) => ({ ...prev, two_factor_enabled: true }))
      setSaveStatus("saved")
      toast({
        title: "2FA Ativado",
        description: "Autenticação de dois fatores foi ativada com sucesso!",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Erro ao ativar 2FA:", error)
      setSaveStatus("error")
      toast({
        title: "Erro ao ativar 2FA",
        description: "Ocorreu um erro ao ativar a autenticação de dois fatores.",
        variant: "destructive",
      })
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const testNotification = async (type: string) => {
    toast({
      title: "Notificação de teste",
      description: `Teste de notificação ${type} enviado com sucesso!`,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>Configure parâmetros gerais do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Performance</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Timeout de Sessão (segundos)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      min="300"
                      max="86400"
                      value={systemSettings.session_timeout}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({ ...prev, session_timeout: Number(e.target.value) }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message-length">Tamanho Máx. Mensagem</Label>
                    <Input
                      id="message-length"
                      type="number"
                      min="100"
                      max="10000"
                      value={systemSettings.max_message_length}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({ ...prev, max_message_length: Number(e.target.value) }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate-limit">Limite de API (req/min)</Label>
                    <Input
                      id="rate-limit"
                      type="number"
                      min="10"
                      max="1000"
                      value={systemSettings.api_rate_limit}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({ ...prev, api_rate_limit: Number(e.target.value) }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="log-level">Nível de Log</Label>
                    <Select
                      value={systemSettings.log_level}
                      onValueChange={(value) => setSystemSettings((prev) => ({ ...prev, log_level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Backup */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Backup</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Backup Automático</Label>
                    <p className="text-sm text-muted-foreground">Realizar backup automático dos dados</p>
                  </div>
                  <Switch
                    checked={systemSettings.backup_enabled}
                    onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, backup_enabled: checked }))}
                  />
                </div>

                {systemSettings.backup_enabled && (
                  <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                    <Label htmlFor="backup-frequency">Frequência do Backup</Label>
                    <Select
                      value={systemSettings.backup_frequency}
                      onValueChange={(value) => setSystemSettings((prev) => ({ ...prev, backup_frequency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">A cada hora</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Separator />

              {/* Webhook */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Integrações</h3>

                <div className="space-y-2">
                  <Label htmlFor="webhook">URL do Webhook</Label>
                  <Input
                    id="webhook"
                    type="url"
                    placeholder="https://exemplo.com/webhook"
                    value={systemSettings.webhook_url}
                    onChange={(e) => setSystemSettings((prev) => ({ ...prev, webhook_url: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">URL para receber eventos do sistema</p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end pt-4">
                <Button onClick={saveSystemSettings} disabled={saveStatus === "saving"}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveStatus === "saving" ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificações
              </CardTitle>
              <CardDescription>Configure como e quando receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notificações Gerais */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notificações Gerais</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Notificações Ativadas</Label>
                      <p className="text-sm text-muted-foreground">
                        {notificationSettings.notifications_enabled
                          ? "Você receberá notificações do sistema"
                          : "Todas as notificações estão desativadas"}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.notifications_enabled}
                      onCheckedChange={(checked) => {
                        setNotificationSettings((prev) => ({ ...prev, notifications_enabled: checked }))
                        toast({
                          title: checked ? "Notificações ativadas" : "Notificações desativadas",
                          description: checked
                            ? "Você receberá notificações do sistema."
                            : "Todas as notificações foram desativadas.",
                        })
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Som das Notificações</Label>
                      <p className="text-sm text-muted-foreground">
                        {notificationSettings.sound_enabled
                          ? "Som será reproduzido ao receber notificações"
                          : "Notificações serão silenciosas"}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.sound_enabled}
                      onCheckedChange={(checked) => {
                        setNotificationSettings((prev) => ({ ...prev, sound_enabled: checked }))
                        toast({
                          title: checked ? "Som ativado" : "Som desativado",
                          description: checked
                            ? "As notificações reproduzirão som."
                            : "As notificações serão silenciosas.",
                        })
                      }}
                      disabled={!notificationSettings.notifications_enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Notificações Desktop</Label>
                      <p className="text-sm text-muted-foreground">
                        {notificationSettings.desktop_notifications
                          ? "Notificações aparecerão na área de trabalho"
                          : "Notificações desktop estão desativadas"}
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.desktop_notifications}
                      onCheckedChange={(checked) => {
                        setNotificationSettings((prev) => ({ ...prev, desktop_notifications: checked }))
                        toast({
                          title: checked ? "Notificações desktop ativadas" : "Notificações desktop desativadas",
                          description: checked
                            ? "Notificações aparecerão na área de trabalho."
                            : "Notificações desktop foram desativadas.",
                        })
                      }}
                      disabled={!notificationSettings.notifications_enabled}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tipos de Notificação */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tipos de Notificação</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div className="space-y-0.5">
                        <Label className="text-base">Notificações por Email</Label>
                        <p className="text-sm text-muted-foreground">Receber notificações por email</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={notificationSettings.email_notifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({ ...prev, email_notifications: checked }))
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testNotification("email")}
                        disabled={!notificationSettings.email_notifications}
                      >
                        Testar
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-5 w-5 text-green-500" />
                      <div className="space-y-0.5">
                        <Label className="text-base">Notificações SMS</Label>
                        <p className="text-sm text-muted-foreground">Receber notificações por SMS</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={notificationSettings.sms_notifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({ ...prev, sms_notifications: checked }))
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testNotification("SMS")}
                        disabled={!notificationSettings.sms_notifications}
                      >
                        Testar
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                      <div className="space-y-0.5">
                        <Label className="text-base">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receber notificações push no navegador</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={notificationSettings.push_notifications}
                        onCheckedChange={(checked) =>
                          setNotificationSettings((prev) => ({ ...prev, push_notifications: checked }))
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testNotification("push")}
                        disabled={!notificationSettings.push_notifications}
                      >
                        Testar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Configurações Avançadas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configurações Avançadas</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="notification-frequency">Frequência das Notificações</Label>
                    <Select
                      value={notificationSettings.notification_frequency}
                      onValueChange={(value) =>
                        setNotificationSettings((prev) => ({ ...prev, notification_frequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Imediata</SelectItem>
                        <SelectItem value="every_5_min">A cada 5 minutos</SelectItem>
                        <SelectItem value="every_15_min">A cada 15 minutos</SelectItem>
                        <SelectItem value="hourly">A cada hora</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-address">Email para Notificações</Label>
                    <Input
                      id="email-address"
                      type="email"
                      value={notificationSettings.email_address}
                      onChange={(e) => setNotificationSettings((prev) => ({ ...prev, email_address: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-number">Telefone para SMS</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      value={notificationSettings.phone_number}
                      onChange={(e) => setNotificationSettings((prev) => ({ ...prev, phone_number: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Horário Silencioso */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Horário Silencioso</Label>
                    <p className="text-sm text-muted-foreground">
                      {notificationSettings.quiet_hours_enabled
                        ? `Silencioso das ${notificationSettings.quiet_start} às ${notificationSettings.quiet_end}`
                        : "Receber notificações em todos os horários"}
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.quiet_hours_enabled}
                    onCheckedChange={(checked) => {
                      setNotificationSettings((prev) => ({ ...prev, quiet_hours_enabled: checked }))
                      toast({
                        title: checked ? "Horário silencioso ativado" : "Horário silencioso desativado",
                        description: checked
                          ? "Notificações serão pausadas no horário configurado."
                          : "Notificações funcionarão 24 horas.",
                      })
                    }}
                    disabled={!notificationSettings.notifications_enabled}
                  />
                </div>

                {notificationSettings.quiet_hours_enabled && (
                  <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200 bg-blue-50 p-4 rounded-r-lg">
                    <div className="space-y-2">
                      <Label htmlFor="quiet-start">Início do Silêncio</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={notificationSettings.quiet_start}
                        onChange={(e) => setNotificationSettings((prev) => ({ ...prev, quiet_start: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quiet-end">Fim do Silêncio</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={notificationSettings.quiet_end}
                        onChange={(e) => setNotificationSettings((prev) => ({ ...prev, quiet_end: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end pt-4">
                <Button onClick={saveNotificationSettings} disabled={saveStatus === "saving"}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveStatus === "saving" ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>Configure parâmetros de segurança do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Autenticação */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Autenticação</h3>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Autenticação de Dois Fatores (2FA)</Label>
                    <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança à sua conta</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {securitySettings.two_factor_enabled ? (
                      <>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSecuritySettings((prev) => ({ ...prev, two_factor_enabled: false }))
                            toast({
                              title: "2FA Desativado",
                              description: "Autenticação de dois fatores foi desativada.",
                              variant: "destructive",
                            })
                          }}
                        >
                          Desativar
                        </Button>
                      </>
                    ) : (
                      <Button onClick={enable2FA} disabled={saveStatus === "saving"}>
                        {saveStatus === "saving" ? "Ativando..." : "Ativar 2FA"}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout-security">Timeout de Sessão (segundos)</Label>
                    <Input
                      id="session-timeout-security"
                      type="number"
                      min="300"
                      max="86400"
                      value={securitySettings.session_timeout}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({ ...prev, session_timeout: Number(e.target.value) }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-attempts">Tentativas de Login</Label>
                    <Input
                      id="login-attempts"
                      type="number"
                      min="3"
                      max="10"
                      value={securitySettings.login_attempts}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({ ...prev, login_attempts: Number(e.target.value) }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-expiry">Expiração de Senha (dias)</Label>
                    <Input
                      id="password-expiry"
                      type="number"
                      min="30"
                      max="365"
                      value={securitySettings.password_expiry_days}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({ ...prev, password_expiry_days: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Controles de Acesso */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Controles de Acesso</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Lista Branca de IPs</Label>
                      <p className="text-sm text-muted-foreground">Restringir acesso apenas a IPs específicos</p>
                    </div>
                    <Switch
                      checked={securitySettings.ip_whitelist_enabled}
                      onCheckedChange={(checked) => {
                        setSecuritySettings((prev) => ({ ...prev, ip_whitelist_enabled: checked }))
                        toast({
                          title: checked ? "Lista branca ativada" : "Lista branca desativada",
                          description: checked
                            ? "Apenas IPs autorizados poderão acessar o sistema."
                            : "Todos os IPs poderão acessar o sistema.",
                        })
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Logs de Auditoria</Label>
                      <p className="text-sm text-muted-foreground">Registrar todas as ações dos usuários</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={securitySettings.audit_logs_enabled}
                        onCheckedChange={(checked) => {
                          setSecuritySettings((prev) => ({ ...prev, audit_logs_enabled: checked }))
                          toast({
                            title: checked ? "Logs de auditoria ativados" : "Logs de auditoria desativados",
                            description: checked
                              ? "Todas as ações serão registradas nos logs."
                              : "As ações não serão mais registradas.",
                          })
                        }}
                      />
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Recomendado
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Criptografia de Backup</Label>
                      <p className="text-sm text-muted-foreground">Criptografar backups automaticamente</p>
                    </div>
                    <Switch
                      checked={securitySettings.backup_encryption}
                      onCheckedChange={(checked) => {
                        setSecuritySettings((prev) => ({ ...prev, backup_encryption: checked }))
                        toast({
                          title: checked ? "Criptografia ativada" : "Criptografia desativada",
                          description: checked
                            ? "Os backups serão criptografados automaticamente."
                            : "Os backups não serão mais criptografados.",
                        })
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Alertas de Segurança */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Status de Segurança</h3>

                <div className="grid gap-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Nível de Segurança: Alto</strong>
                      <br />
                      Suas configurações de segurança estão bem configuradas.
                    </AlertDescription>
                  </Alert>

                  {!securitySettings.two_factor_enabled && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recomendação:</strong> Ative a autenticação de dois fatores para maior segurança.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end pt-4">
                <Button onClick={saveSecuritySettings} disabled={saveStatus === "saving"}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveStatus === "saving" ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
