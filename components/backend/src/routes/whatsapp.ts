import express from "express"
import { getWhatsAppService, getWhatsAppStatus } from "../services/whatsapp"
import { DatabaseService } from "../services/database"
import { authMiddleware } from "../middleware/auth"

const router = express.Router()
const dbService = new DatabaseService()

// Get WhatsApp status (PUBLIC - sem autenticação)
router.get("/status", (req, res) => {
  try {
    console.log("Requisição para /status recebida")
    const status = getWhatsAppStatus()
    console.log("Status retornado:", status)
    res.json(status)
  } catch (error) {
    console.error("Erro ao buscar status:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    })
  }
})

// Restart WhatsApp connection (PUBLIC - sem autenticação)
router.post("/restart", async (req, res) => {
  try {
    console.log("Requisição para /restart recebida")
    const whatsappService = getWhatsAppService()

    if (whatsappService?.client) {
      await whatsappService.client.destroy()
      console.log("WhatsApp destruído, reinicializando...")
    }

    // Reinicializar será feito automaticamente pelo sistema
    console.log("WhatsApp reinicializado com sucesso")

    res.json({
      message: "Conexão WhatsApp reiniciada",
    })
  } catch (error) {
    console.error("Erro ao reiniciar WhatsApp:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    })
  }
})

// Get QR Code (PUBLIC - sem autenticação)
router.get("/qr", (req, res) => {
  try {
    console.log("Requisição para /qr recebida")
    res.json({
      message: "QR Code será enviado via WebSocket quando gerado",
    })
  } catch (error) {
    console.error("Erro ao solicitar QR:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    })
  }
})

// Get contacts from WhatsApp (PUBLIC - sem autenticação)
router.get("/contacts", async (req, res) => {
  try {
    console.log("Requisição para sincronizar contatos recebida")
    const whatsappService = getWhatsAppService()

    if (!whatsappService || !whatsappService.isReady) {
      return res.status(400).json({
        error: "WhatsApp não está conectado",
        message: "Conecte o WhatsApp primeiro",
      })
    }

    const contacts = await whatsappService.getContacts()
    console.log(`Obtidos ${contacts.length} contatos do WhatsApp`)

    let savedCount = 0
    for (const contact of contacts) {
      await dbService.saveContact({
        whatsapp_id: contact.id,
        name: contact.name,
        phone_number: contact.number,
        profile_pic_url: "",
        is_group: contact.isGroup,
      })
      savedCount++
    }

    console.log(`Salvos ${savedCount} contatos no banco de dados`)

    res.json({
      message: "Contatos sincronizados com sucesso",
      contacts,
      count: contacts.length,
    })
  } catch (error) {
    console.error("Erro ao buscar contatos:", error)
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro interno do servidor",
      details: error instanceof Error ? error.stack : "Erro desconhecido",
    })
  }
})

// Get chats from WhatsApp (PUBLIC - sem autenticação)
router.get("/chats", async (req, res) => {
  try {
    const whatsappService = getWhatsAppService()

    if (!whatsappService || !whatsappService.isReady) {
      return res.status(400).json({
        error: "WhatsApp não está conectado",
        message: "Conecte o WhatsApp primeiro",
      })
    }

    const chats = await whatsappService.getChats()
    res.json({
      chats,
    })
  } catch (error) {
    console.error("Erro ao buscar chats:", error)
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
})

// Send message (PROTEGIDO - com autenticação)
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { to, message } = req.body
    const decodedTo = decodeURIComponent(to)

    console.log(
      `[API /whatsapp/send] Recebido pedido. Original 'to': ${to}, Decodificado 'to': ${decodedTo}, mensagem: "${message}"`,
    )

    if (!to || !message) {
      return res.status(400).json({
        error: "Destinatário e mensagem são obrigatórios",
      })
    }

    const whatsappService = getWhatsAppService()

    if (!whatsappService || !whatsappService.isReady) {
      return res.status(400).json({
        error: "WhatsApp não está conectado",
        message: "Conecte o WhatsApp primeiro",
      })
    }

    const sentMessage = await whatsappService.sendMessage(decodedTo, message)

    await dbService.saveMessage({
      whatsapp_id: sentMessage.id._serialized,
      from_contact: sentMessage.from,
      to_contact: sentMessage.to,
      message_body: message,
      message_type: "text",
      timestamp: sentMessage.timestamp,
      is_group_message: false,
    })

    res.json({
      message: "Mensagem enviada com sucesso",
      data: {
        id: sentMessage.id._serialized,
        timestamp: sentMessage.timestamp,
      },
    })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    })
  }
})

// Logout from WhatsApp (PUBLIC - sem autenticação)
router.post("/logout", async (req, res) => {
  try {
    const whatsappService = getWhatsAppService()

    if (whatsappService?.client) {
      await whatsappService.client.destroy()
    }

    res.json({
      message: "Logout do WhatsApp realizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao fazer logout:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
    })
  }
})

export default router
