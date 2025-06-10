import express from "express"
import { DatabaseService } from "../services/database"

const router = express.Router()
const db = new DatabaseService()

// Listar todos os fluxos
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        f.id,
        f.name,
        f.description,
        f.trigger_type,
        f.trigger_value,
        f.is_active,
        f.priority,
        f.created_at,
        COUNT(s.id) as steps_count,
        COUNT(e.id) as executions_count
      FROM conversation_flows f
      LEFT JOIN flow_steps s ON f.id = s.flow_id
      LEFT JOIN flow_executions e ON f.id = e.flow_id AND e.status = 'active'
      GROUP BY f.id, f.name, f.description, f.trigger_type, f.trigger_value, f.is_active, f.priority, f.created_at
      ORDER BY f.priority DESC, f.created_at DESC
    `)

    res.json({
      success: true,
      flows: result.rows,
    })
  } catch (error) {
    console.error("Erro ao buscar fluxos:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      flows: [],
    })
  }
})

// Buscar fluxo específico com etapas
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    // Buscar fluxo
    const flowResult = await db.query(`
      SELECT * FROM conversation_flows WHERE id = $1
    `, [id])

    if (flowResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Fluxo não encontrado"
      })
    }

    // Buscar etapas
    const stepsResult = await db.query(`
      SELECT * FROM flow_steps 
      WHERE flow_id = $1 
      ORDER BY step_order
    `, [id])

    res.json({
      success: true,
      flow: {
        ...flowResult.rows[0],
        steps: stepsResult.rows
      }
    })
  } catch (error) {
    console.error("Erro ao buscar fluxo:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    })
  }
})

// Criar novo fluxo
router.post("/", async (req, res) => {
  try {
    const { name, description, trigger_type, trigger_value, priority, steps } = req.body

    // Criar fluxo
    const flowResult = await db.query(`
      INSERT INTO conversation_flows (name, description, trigger_type, trigger_value, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description, trigger_type, trigger_value, priority || 1])

    const flowId = flowResult.rows[0].id

    // Criar etapas se fornecidas
    if (steps && steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        await db.query(`
          INSERT INTO flow_steps (flow_id, step_order, step_type, content, options, conditions, actions)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          flowId,
          i + 1,
          step.step_type,
          step.content,
          step.options ? JSON.stringify(step.options) : null,
          step.conditions ? JSON.stringify(step.conditions) : null,
          step.actions ? JSON.stringify(step.actions) : null
        ])
      }
    }

    res.json({
      success: true,
      flow: flowResult.rows[0]
    })
  } catch (error) {
    console.error("Erro ao criar fluxo:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    })
  }
})

// Atualizar fluxo
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, trigger_type, trigger_value, priority, is_active } = req.body

    const result = await db.query(`
      UPDATE conversation_flows 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          trigger_type = COALESCE($3, trigger_type),
          trigger_value = COALESCE($4, trigger_value),
          priority = COALESCE($5, priority),
          is_active = COALESCE($6, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [name, description, trigger_type, trigger_value, priority, is_active, id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Fluxo não encontrado"
      })
    }

    res.json({
      success: true,
      flow: result.rows[0]
    })
  } catch (error) {
    console.error("Erro ao atualizar fluxo:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    })
  }
})

// Excluir fluxo
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params

    await db.query("DELETE FROM conversation_flows WHERE id = $1", [id])

    res.json({
      success: true,
      message: "Fluxo excluído com sucesso"
    })
  } catch (error) {
    console.error("Erro ao excluir fluxo:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    })
  }
})

// Estatísticas dos fluxos
router.get("/stats/summary", async (req, res) => {
  try {
    const totalFlows = await db.query("SELECT COUNT(*) as count FROM conversation_flows")
    const activeFlows = await db.query("SELECT COUNT(*) as count FROM conversation_flows WHERE is_active = true")
    const activeExecutions = await db.query("SELECT COUNT(*) as count FROM flow_executions WHERE status = 'active'")
    const completedToday = await db.query(`
      SELECT COUNT(*) as count FROM flow_executions 
      WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE
    `)

    res.json({
      success: true,
      stats: {
        total_flows: parseInt(totalFlows.rows[0].count),
        active_flows: parseInt(activeFlows.rows[0].count),
        active_executions: parseInt(activeExecutions.rows[0].count),
        completed_today: parseInt(completedToday.rows[0].count)
      }
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    })
  }
})

export default router