import express from "express"
import { DatabaseService } from "../services/database"
import { authMiddleware } from "../middleware/auth"

const router = express.Router()
const dbService = new DatabaseService()

// Get automation rules (PROTEGIDO)
router.get("/rules", authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, active_only } = req.query

    const offset = (Number(page) - 1) * Number(limit)
    let query = "SELECT * FROM automation_rules WHERE 1=1"
    const params: any[] = []

    if (active_only === "true") {
      query += " AND is_active = true"
    }

    query += " ORDER BY priority DESC, created_at DESC LIMIT $1 OFFSET $2"
    params.push(Number(limit), offset)

    const rules = await dbService.query(query, params)

    // Get total count
    let countQuery = "SELECT COUNT(*) FROM automation_rules WHERE 1=1"
    if (active_only === "true") {
      countQuery += " AND is_active = true"
    }
    const totalResult = await dbService.query(countQuery, [])
    const total = Number.parseInt(totalResult.rows[0].count)

    res.json({
      rules: rules.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar regras de automação:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Create automation rule (PROTEGIDO)
router.post("/rules", authMiddleware, async (req, res) => {
  try {
    const { name, description, trigger_type, trigger_config, action_type, action_config, priority } = req.body

    if (!name || !trigger_type || !action_type || !trigger_config || !action_config) {
      return res.status(400).json({
        error: "Campos obrigatórios: name, trigger_type, action_type, trigger_config, action_config",
      })
    }

    const result = await dbService.query(
      `INSERT INTO automation_rules (name, description, trigger_type, trigger_config, action_type, action_config, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        name,
        description,
        trigger_type,
        JSON.stringify(trigger_config),
        action_type,
        JSON.stringify(action_config),
        priority || 1,
      ],
    )

    res.status(201).json({
      message: "Regra de automação criada com sucesso",
      rule: result.rows[0],
    })
  } catch (error) {
    console.error("Erro ao criar regra de automação:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Get automation statistics (PROTEGIDO)
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const stats = await Promise.all([
      dbService.query("SELECT COUNT(*) as total FROM automation_rules"),
      dbService.query("SELECT COUNT(*) as active FROM automation_rules WHERE is_active = true"),
      dbService.query("SELECT COUNT(*) as pending FROM scheduled_messages WHERE status = 'pending'"),
      dbService.query(
        "SELECT COUNT(*) as sent_today FROM scheduled_messages WHERE status = 'sent' AND DATE(sent_at) = CURRENT_DATE",
      ),
    ])

    res.json({
      total_rules: Number.parseInt(stats[0].rows[0]?.total || "0"),
      active_rules: Number.parseInt(stats[1].rows[0]?.active || "0"),
      pending_messages: Number.parseInt(stats[2].rows[0]?.pending || "0"),
      sent_today: Number.parseInt(stats[3].rows[0]?.sent_today || "0"),
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

export default router
