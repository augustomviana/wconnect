import express from "express"
import { ChatbotService } from "../services/chatbot"
import { authMiddleware } from "../middleware/auth"

const router = express.Router()
const chatbotService = new ChatbotService()

// Buscar todos os chatbots
router.get("/", authMiddleware, async (req, res) => {
  try {
    const chatbots = await chatbotService.getChatbots()
    res.json({ chatbots })
  } catch (error) {
    console.error("Erro ao buscar chatbots:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Buscar respostas automáticas
router.get("/:chatbotId/responses", authMiddleware, async (req, res) => {
  try {
    const { chatbotId } = req.params
    const responses = await chatbotService.getAutoResponses(Number.parseInt(chatbotId))
    res.json({ responses })
  } catch (error) {
    console.error("Erro ao buscar respostas automáticas:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Criar resposta automática
router.post("/:chatbotId/responses", authMiddleware, async (req, res) => {
  try {
    const { chatbotId } = req.params
    const responseData = {
      ...req.body,
      chatbot_id: Number.parseInt(chatbotId),
    }

    const response = await chatbotService.createAutoResponse(responseData)
    res.status(201).json({
      message: "Resposta automática criada com sucesso",
      response,
    })
  } catch (error) {
    console.error("Erro ao criar resposta automática:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Buscar estatísticas do chatbot
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const stats = await chatbotService.getStats()
    res.json(stats)
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

export default router
