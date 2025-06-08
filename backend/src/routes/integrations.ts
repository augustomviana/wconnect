import express from "express"
import { DatabaseService } from "../services/database"

const router = express.Router()
const db = new DatabaseService()

// Listar integrações
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        description,
        type,
        status,
        config,
        last_sync,
        created_at
      FROM integrations 
      ORDER BY created_at DESC
    `)

    res.json({
      success: true,
      integrations: result.rows,
    })
  } catch (error) {
    console.error("Erro ao buscar integrações:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
      integrations: [],
    })
  }
})

// Criar integração
router.post("/", async (req, res) => {
  try {
    const { name, description, type, config, isActive } = req.body

    const result = await db.query(
      `
      INSERT INTO integrations (name, description, type, config, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [name, description, type, JSON.stringify(config), isActive ? "active" : "inactive"],
    )

    res.json({
      success: true,
      integration: result.rows[0],
    })
  } catch (error) {
    console.error("Erro ao criar integração:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    })
  }
})

// Atualizar integração
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { isActive, ...updateData } = req.body

    let query = "UPDATE integrations SET "
    const values = []
    const updates = []

    if (isActive !== undefined) {
      updates.push(`status = $${values.length + 1}`)
      values.push(isActive ? "active" : "inactive")
    }

    if (updateData.name) {
      updates.push(`name = $${values.length + 1}`)
      values.push(updateData.name)
    }

    if (updateData.description) {
      updates.push(`description = $${values.length + 1}`)
      values.push(updateData.description)
    }

    if (updateData.config) {
      updates.push(`config = $${values.length + 1}`)
      values.push(JSON.stringify(updateData.config))
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`)
    query += updates.join(", ") + ` WHERE id = $${values.length + 1} RETURNING *`
    values.push(id)

    const result = await db.query(query, values)

    res.json({
      success: true,
      integration: result.rows[0],
    })
  } catch (error) {
    console.error("Erro ao atualizar integração:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    })
  }
})

// Excluir integração
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params

    await db.query("DELETE FROM integrations WHERE id = $1", [id])

    res.json({
      success: true,
      message: "Integração excluída com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir integração:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    })
  }
})

export default router
