import { Router, type Request, type Response } from "express"
import { GMapExtractorService } from "../services/gmaps-extractor"
import { authMiddleware } from "../middleware/auth"

const router = Router()
const gmapService = new GMapExtractorService()

// Middleware de autenticação para todas as rotas
router.use(authMiddleware)

// GET /api/gmaps-extractor/campaigns - Listar campanhas
router.get("/campaigns", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    // Query para buscar campanhas do usuário
    const query = `
      SELECT id, name, status, total_results, created_at, updated_at, search_queries
      FROM gmap_campaigns 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `

    const result = await gmapService.db.query(query, [userId])

    const campaigns = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status || "pending",
      total_results: row.total_results || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      search_queries: row.search_queries,
    }))

    res.json({
      success: true,
      campaigns,
    })
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// POST /api/gmaps-extractor/campaigns - Criar nova campanha
router.post("/campaigns", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const { name, searchQueries, options } = req.body

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    if (!name || !searchQueries || !Array.isArray(searchQueries)) {
      return res.status(400).json({ error: "Dados inválidos para criação de campanha" })
    }

    // Criar campanha
    const campaignId = await gmapService.createCampaign(name, searchQueries, options, userId)

    // Buscar a campanha criada
    const query = `
      SELECT id, name, status, total_results, created_at, updated_at, search_queries
      FROM gmap_campaigns 
      WHERE id = $1
    `

    const result = await gmapService.db.query(query, [campaignId])
    const campaign = result.rows[0]

    res.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status || "pending",
        total_results: campaign.total_results || 0,
        created_at: campaign.created_at,
        updated_at: campaign.updated_at,
        search_queries: campaign.search_queries,
      },
    })
  } catch (error) {
    console.error("Erro ao criar campanha:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// POST /api/gmaps-extractor/campaigns/:id/start - Iniciar extração
router.post("/campaigns/:id/start", async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { options } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    // Verificar se a campanha pertence ao usuário
    const campaignQuery = `
      SELECT id, name, search_queries FROM gmap_campaigns 
      WHERE id = $1 AND user_id = $2
    `

    const campaignResult = await gmapService.db.query(campaignQuery, [id, userId])

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: "Campanha não encontrada" })
    }

    const campaign = campaignResult.rows[0]

    // Atualizar status para "running"
    await gmapService.updateCampaignStatus(id, "running")

    // Iniciar extração em background
    setImmediate(async () => {
      try {
        let totalResults = 0

        for (const query of campaign.search_queries) {
          const results = await gmapService.extractFromGoogleMaps(id, query, options)
          totalResults += results.length
        }

        // Atualizar status para "completed"
        await gmapService.updateCampaignStatus(id, "completed", totalResults)
      } catch (error) {
        console.error("Erro durante extração:", error)
        await gmapService.updateCampaignStatus(id, "failed")
      } finally {
        await gmapService.closeBrowser()
      }
    })

    res.json({
      success: true,
      message: "Extração iniciada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao iniciar extração:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// GET /api/gmaps-extractor/campaigns/:id/results - Obter resultados
router.get("/campaigns/:id/results", async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    // Verificar se a campanha pertence ao usuário
    const campaignQuery = `
      SELECT id FROM gmap_campaigns 
      WHERE id = $1 AND user_id = $2
    `

    const campaignResult = await gmapService.db.query(campaignQuery, [id, userId])

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: "Campanha não encontrada" })
    }

    // Obter resultados
    const results = await gmapService.getCampaignResults(id)

    res.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Erro ao obter resultados:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// GET /api/gmaps-extractor/campaigns/:id/export - Exportar resultados
router.get("/campaigns/:id/export", async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    // Verificar se a campanha pertence ao usuário
    const campaignQuery = `
      SELECT id FROM gmap_campaigns 
      WHERE id = $1 AND user_id = $2
    `

    const campaignResult = await gmapService.db.query(campaignQuery, [id, userId])

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: "Campanha não encontrada" })
    }

    // Exportar para Excel
    const filePath = await gmapService.exportToExcel(id)

    res.json({
      success: true,
      downloadUrl: filePath,
    })
  } catch (error) {
    console.error("Erro ao exportar resultados:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

export default router
