import express from "express"
import { DatabaseService } from "../services/database"

const router = express.Router()
const db = new DatabaseService()

// Listar todas as configurações
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT category, key, value, description, type
      FROM system_settings 
      ORDER BY category, key
    `)

    // Organizar por categoria
    const settings: Record<string, any> = {}
    result.rows.forEach((row) => {
      if (!settings[row.category]) {
        settings[row.category] = {}
      }
      
      let value = row.value
      // Converter tipos
      if (row.type === 'boolean') {
        value = row.value === 'true'
      } else if (row.type === 'number') {
        value = parseInt(row.value)
      }
      
      settings[row.category][row.key] = {
        value,
        description: row.description,
        type: row.type
      }
    })

    res.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    })
  }
})

// Buscar configurações por categoria
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params
    
    const result = await db.query(`
      SELECT key, value, description, type
      FROM system_settings 
      WHERE category = $1
      ORDER BY key
    `, [category])

    const settings: Record<string, any> = {}
    result.rows.forEach((row) => {
      let value = row.value
      if (row.type === 'boolean') {
        value = row.value === 'true'
      } else if (row.type === 'number') {
        value = parseInt(row.value)
      }
      
      settings[row.key] = {
        value,
        description: row.description,
        type: row.type
      }
    })

    res.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    })
  }
})

// Atualizar configurações
router.patch("/:category", async (req, res) => {
  try {
    const { category } = req.params
    const updates = req.body

    for (const [key, value] of Object.entries(updates)) {
      await db.query(`
        UPDATE system_settings 
        SET value = $1, updated_at = CURRENT_TIMESTAMP
        WHERE category = $2 AND key = $3
      `, [String(value), category, key])
    }

    res.json({
      success: true,
      message: "Configurações atualizadas com sucesso"
    })
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    })
  }
})

// Reset configurações para padrão
router.post("/:category/reset", async (req, res) => {
  try {
    const { category } = req.params
    
    // Aqui você pode definir valores padrão por categoria
    const defaults: Record<string, Record<string, string>> = {
      general: {
        company_name: 'Minha Empresa',
        company_email: 'contato@empresa.com',
        company_phone: '(11) 1234-5678',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR'
      },
      notifications: {
        email_enabled: 'true',
        push_enabled: 'true',
        sms_enabled: 'false',
        admin_email: 'admin@empresa.com'
      },
      whatsapp: {
        auto_welcome: 'true',
        welcome_message: 'Olá! Bem-vindo ao nosso atendimento.',
        away_message: 'No momento estamos ausentes. Retornaremos em breve.',
        message_limit: '100',
        auto_backup: 'true'
      },
      chatbot: {
        response_delay: '2',
        max_retries: '3',
        fallback_message: 'Desculpe, não entendi. Digite "menu" para ver as opções.',
        debug_mode: 'false'
      },
      security: {
        session_timeout: '24',
        max_login_attempts: '5',
        backup_frequency: 'daily',
        data_retention: '365'
      },
      interface: {
        theme: 'light',
        dashboard_refresh: '30',
        items_per_page: '20',
        show_tutorials: 'true'
      }
    }

    if (defaults[category]) {
      for (const [key, value] of Object.entries(defaults[category])) {
        await db.query(`
          UPDATE system_settings 
          SET value = $1, updated_at = CURRENT_TIMESTAMP
          WHERE category = $2 AND key = $3
        `, [value, category, key])
      }
    }

    res.json({
      success: true,
      message: "Configurações resetadas para o padrão"
    })
  } catch (error) {
    console.error("Erro ao resetar configurações:", error)
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    })
  }
})

export default router