"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MapPin, Phone, Globe, Mail, Star, Download, Play, Plus, Eye } from "lucide-react"

interface Campaign {
  id: string
  name: string
  status: string
  total_results: number
  created_at: string
  updated_at: string
}

interface ExtractedData {
  name: string
  mobileNumber: string
  reviewCount: number
  rating: number
  category: string
  address: string
  website: string
  email: string
  plusCode: string
  closingHours: string
  latitude: number
  longitude: number
  instagramProfile: string
  facebookProfile: string
  linkedinProfile: string
  twitterProfile: string
  imagesFolder: string
}

export default function GMapExtractorPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showNewCampaignDialog, setShowNewCampaignDialog] = useState(false)
  const [showResultsDialog, setShowResultsDialog] = useState(false)

  // Form states
  const [campaignName, setCampaignName] = useState("")
  const [searchQueries, setSearchQueries] = useState("")
  const [grabEmails, setGrabEmails] = useState(false)
  const [grabImages, setGrabImages] = useState(false)
  const [maxResults, setMaxResults] = useState(50)

  const { toast } = useToast()

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const response = await fetch("/api/gmaps-extractor/campaigns", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar campanhas",
        variant: "destructive",
      })
    }
  }

  const createCampaign = async () => {
    if (!campaignName.trim() || !searchQueries.trim()) {
      toast({
        title: "Erro",
        description: "Nome da campanha e termos de busca são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const queries = searchQueries.split("\n").filter((q) => q.trim())

      const response = await fetch("/api/gmaps-extractor/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: campaignName,
          searchQueries: queries,
          options: {
            grabEmails,
            grabImages,
            maxResults,
            delay: 3000,
            headless: false, // Garantir que não seja headless
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Sucesso",
          description: "Campanha criada com sucesso",
        })

        setShowNewCampaignDialog(false)
        setCampaignName("")
        setSearchQueries("")
        setGrabEmails(false)
        setGrabImages(false)
        setMaxResults(50)
        loadCampaigns()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar campanha")
      }
    } catch (error) {
      console.error("Erro ao criar campanha:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar campanha",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startExtraction = async (campaignId: string) => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/gmaps-extractor/campaigns/${campaignId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          options: {
            grabEmails: true,
            grabImages: true,
            maxResults: 50,
            delay: 3000,
            headless: false, // Garantir que não seja headless
          },
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Extração iniciada com sucesso",
        })

        // Recarregar campanhas após um pequeno delay para dar tempo ao backend
        setTimeout(() => {
          loadCampaigns()
        }, 2000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao iniciar extração")
      }
    } catch (error) {
      console.error("Erro ao iniciar extração:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao iniciar extração",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const viewResults = async (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/gmaps-extractor/campaigns/${campaign.id}/results`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setExtractedData(data.results)
        setShowResultsDialog(true)
      }
    } catch (error) {
      console.error("Erro ao carregar resultados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar resultados",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportResults = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/gmaps-extractor/campaigns/${campaignId}/export`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `gmaps-results-${campaignId}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: "Sucesso",
          description: "Arquivo exportado com sucesso",
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao exportar resultados")
      }
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao exportar resultados",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const },
      running: { label: "Executando", variant: "default" as const },
      completed: { label: "Concluído", variant: "default" as const },
      failed: { label: "Falhou", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Google Maps Extractor</h1>
          <p className="text-gray-600">Extraia dados de empresas do Google Maps automaticamente</p>
        </div>

        <Dialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha de Extração</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Nome da Campanha</Label>
                <Input
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Ex: Restaurantes São Paulo"
                />
              </div>

              <div>
                <Label htmlFor="searchQueries">Termos de Busca (um por linha)</Label>
                <Textarea
                  id="searchQueries"
                  value={searchQueries}
                  onChange={(e) => setSearchQueries(e.target.value)}
                  placeholder="restaurante italiano são paulo&#10;pizzaria zona sul&#10;churrascaria centro"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxResults">Máximo de Resultados por Busca</Label>
                  <Input
                    id="maxResults"
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number.parseInt(e.target.value))}
                    min={1}
                    max={500}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="grabEmails"
                    checked={grabEmails}
                    onCheckedChange={(checked) => setGrabEmails(checked as boolean)}
                  />
                  <Label htmlFor="grabEmails">Extrair emails dos websites</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="grabImages"
                    checked={grabImages}
                    onCheckedChange={(checked) => setGrabImages(checked as boolean)}
                  />
                  <Label htmlFor="grabImages">Baixar imagens das empresas</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewCampaignDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={createCampaign} disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar Campanha"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campanhas */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas de Extração</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resultados</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>{campaign.total_results || 0}</TableCell>
                  <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {campaign.status === "pending" && (
                        <Button size="sm" onClick={() => startExtraction(campaign.id)} disabled={isLoading}>
                          <Play className="h-4 w-4" />
                        </Button>
                      )}

                      {campaign.total_results > 0 && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => viewResults(campaign)}>
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button size="sm" variant="outline" onClick={() => exportResults(campaign.id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Resultados */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Resultados: {selectedCampaign?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">Total de resultados: {extractedData.length}</div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extractedData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.mobileNumber && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {item.mobileNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      {item.rating > 0 && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-500" />
                          {item.rating} ({item.reviewCount})
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="truncate max-w-xs">{item.address}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.website && (
                        <a
                          href={item.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          Website
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {item.email}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
