import express from "express"
import { DatabaseService } from "../services/database"
import { authMiddleware } from "../middleware/auth"

const router = express.Router()
const dbService = new DatabaseService()

// Get messages (PROTEGIDO)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, contact_id, search, type } = req.query

    const offset = (Number(page) - 1) * Number(limit)
    let query = `
      SELECT m.*, 
             c1.name as from_name,
             c2.name as to_name
      FROM messages m
      LEFT JOIN contacts c1 ON m.from_contact = c1.whatsapp_id
      LEFT JOIN contacts c2 ON m.to_contact = c2.whatsapp_id
      WHERE 1=1
    `
    const params: any[] = []

    if (contact_id) {
      query += ` AND (m.from_contact = $${params.length + 1} OR m.to_contact = $${params.length + 1})`
      params.push(contact_id)
    }

    if (search) {
      query += ` AND m.message_body ILIKE $${params.length + 1}`
      params.push(`%${search}%`)
    }

    if (type) {
      query += ` AND m.message_type = $${params.length + 1}`
      params.push(type)
    }

    query += ` ORDER BY m.timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(Number(limit), offset)

    const messages = await dbService.query(query, params)

    // Get total count
    let countQuery = "SELECT COUNT(*) FROM messages m WHERE 1=1"
    const countParams: any[] = []

    if (contact_id) {
      countQuery += ` AND (m.from_contact = $${countParams.length + 1} OR m.to_contact = $${countParams.length + 1})`
      countParams.push(contact_id)
    }

    if (search) {
      countQuery += ` AND m.message_body ILIKE $${countParams.length + 1}`
      countParams.push(`%${search}%`)
    }

    if (type) {
      countQuery += ` AND m.message_type = $${countParams.length + 1}`
      countParams.push(type)
    }

    const totalResult = await dbService.query(countQuery, countParams)
    const total = Number.parseInt(totalResult.rows[0].count)

    res.json({
      messages: messages.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
    })
  }
})

// Get message by ID (PROTEGIDO)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const message = await dbService.query(
      `
      SELECT m.*, 
             c1.name as from_name,
             c2.name as to_name
      FROM messages m
      LEFT JOIN contacts c1 ON m.from_contact = c1.whatsapp_id
      LEFT JOIN contacts c2 ON m.to_contact = c2.whatsapp_id
      WHERE m.id = $1
    `,
      [id],
    )

    if (message.rows.length === 0) {
      return res.status(404).json({
        error: "Mensagem não encontrada",
      })
    }

    res.json({
      message: message.rows[0],
    })
  } catch (error) {
    console.error("Erro ao buscar mensagem:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
    })
  }
})

// Save message (PROTEGIDO)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { whatsapp_id, from_contact, to_contact, message_body, message_type, timestamp, is_group_message } = req.body

    if (!whatsapp_id || !from_contact || !to_contact || !message_body) {
      return res.status(400).json({
        error: "Campos obrigatórios: whatsapp_id, from_contact, to_contact, message_body",
      })
    }

    const message = await dbService.saveMessage({
      whatsapp_id,
      from_contact,
      to_contact,
      message_body,
      message_type: message_type || "text",
      timestamp: timestamp || Date.now(),
      is_group_message: is_group_message || false,
    })

    res.status(201).json({
      message: "Mensagem salva com sucesso",
      data: message,
    })
  } catch (error) {
    console.error("Erro ao salvar mensagem:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
    })
  }
})

// Get conversation between two contacts (PROTEGIDO)
router.get("/conversation/:contact1/:contact2", authMiddleware, async (req, res) => {
  try {
    const { contact1, contact2 } = req.params
    const { page = 1, limit = 50 } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    const messages = await dbService.query(
      `
      SELECT m.*, 
             c1.name as from_name,
             c2.name as to_name
      FROM messages m
      LEFT JOIN contacts c1 ON m.from_contact = c1.whatsapp_id
      LEFT JOIN contacts c2 ON m.to_contact = c2.whatsapp_id
      WHERE (m.from_contact = $1 AND m.to_contact = $2) 
         OR (m.from_contact = $2 AND m.to_contact = $1)
      ORDER BY m.timestamp DESC
      LIMIT $3 OFFSET $4
    `,
      [contact1, contact2, Number(limit), offset],
    )

    res.json({
      messages: messages.rows,
    })
  } catch (error) {
    console.error("Erro ao buscar conversa:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
    })
  }
})

// Get message statistics (PÚBLICO - sem autenticação para dashboard)
router.get("/stats/summary", async (req, res) => {
  try {
    const stats = await Promise.all([
      dbService.query("SELECT COUNT(*) as total FROM messages"),
      dbService.query("SELECT COUNT(*) as today FROM messages WHERE DATE(created_at) = CURRENT_DATE"),
      dbService.query("SELECT COUNT(*) as this_week FROM messages WHERE created_at >= NOW() - INTERVAL '7 days'"),
      dbService.query("SELECT COUNT(*) as groups FROM messages WHERE is_group_message = true"),
      dbService.query(`
        SELECT message_type, COUNT(*) as count 
        FROM messages 
        GROUP BY message_type 
        ORDER BY count DESC
      `),
    ])

    res.json({
      total: Number.parseInt(stats[0].rows[0].total),
      today: Number.parseInt(stats[1].rows[0].today),
      thisWeek: Number.parseInt(stats[2].rows[0].this_week),
      groups: Number.parseInt(stats[3].rows[0].groups),
      byType: stats[4].rows,
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
    })
  }
})

// Delete message (PROTEGIDO)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    const result = await dbService.query("DELETE FROM messages WHERE id = $1 RETURNING *", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Mensagem não encontrada",
      })
    }

    res.json({
      message: "Mensagem excluída com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir mensagem:", error)
    res.status(500).json({
      error: "Erro interno do servidor",
    })
  }
})

export default router
