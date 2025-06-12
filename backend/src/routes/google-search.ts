import express from "express"
import { DatabaseService } from "../services/database"
import { authMiddleware } from "../middleware/auth"

const router = express.Router()
const db = new DatabaseService()

// Rota para busca no Google
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const { query } = req.query

    if (!query) {
      return res.status(400).json({ error: "Parâmetro de busca não fornecido" })
    }

    // Aqui você implementaria a lógica de busca no Google
    // Por enquanto, retornamos um mock

    res.json({
      success: true,
      results: [
        { title: "Resultado 1", link: "https://exemplo.com/1", snippet: "Descrição do resultado 1" },
        { title: "Resultado 2", link: "https://exemplo.com/2", snippet: "Descrição do resultado 2" },
      ],
    })
  } catch (error) {
    console.error("Erro na busca do Google:", error)
    res.status(500).json({ error: "Erro ao processar a busca" })
  }
})

export default router
