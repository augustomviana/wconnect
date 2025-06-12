#!/bin/bash

echo "🔧 Corrigindo erros de tipagem JWT/TypeScript..."

# Criar diretório de tipos se não existir
mkdir -p backend/src/types

# Criar arquivo de tipos personalizados
cat > backend/src/types/express.d.ts << 'EOF'
import type { JwtPayload } from "jsonwebtoken"

declare global {
  namespace Express {
    interface Request {
      user?: CustomJwtPayload
    }
  }
}

export interface CustomJwtPayload extends JwtPayload {
  id: string
  email: string
  name: string
}

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
}
EOF

# Atualizar middleware de autenticação
cat > backend/src/middleware/auth.ts << 'EOF'
import jwt from "jsonwebtoken"
import type { Request, Response, NextFunction } from "express"
import type { CustomJwtPayload } from "../types/express"

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Token de acesso requerido" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as CustomJwtPayload

    // Garantir que o token decodificado tem as propriedades necessárias
    if (!decoded.id || !decoded.email) {
      return res.status(401).json({ error: "Token inválido" })
    }

    req.user = decoded
    next()
  } catch (error) {
    console.error("Erro na autenticação:", error)
    res.status(401).json({ error: "Token inválido" })
  }
}
EOF

# Atualizar arquivo whatsapp-group.ts
cat > backend/src/routes/whatsapp-group.ts << 'EOF'
import express from "express"
import { DatabaseService } from "../services/database"
import { authMiddleware } from "../middleware/auth"
import type { CustomJwtPayload } from "../types/express"

const router = express.Router()
const db = new DatabaseService()

// Rota para listar grupos
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user as CustomJwtPayload

    if (!user || !user.id) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    const userId = user.id

    // Aqui você implementaria a lógica para buscar grupos do WhatsApp
    // Por enquanto, retornamos um mock

    res.json({
      success: true,
      groups: [
        { id: "group1", name: "Grupo de Teste 1", participants: 10 },
        { id: "group2", name: "Grupo de Teste 2", participants: 25 },
      ],
    })
  } catch (error) {
    console.error("Erro ao listar grupos:", error)
    res.status(500).json({ error: "Erro ao listar grupos" })
  }
})

// Rota para criar grupo
router.post("/", authMiddleware, async (req, res) => {
  try {
    const user = req.user as CustomJwtPayload

    if (!user || !user.id) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    const { name, participants } = req.body

    if (!name || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ error: "Dados inválidos para criação de grupo" })
    }

    // Aqui você implementaria a lógica para criar um grupo
    // Por enquanto, retornamos um mock

    res.json({
      success: true,
      group: {
        id: "new-group-" + Date.now(),
        name,
        participants: participants.length,
      },
    })
  } catch (error) {
    console.error("Erro ao criar grupo:", error)
    res.status(500).json({ error: "Erro ao criar grupo" })
  }
})

export default router
EOF

# Atualizar arquivo gmaps-extractor.ts
cat > backend/src/routes/gmaps-extractor.ts << 'EOF'
import express from "express"
import { DatabaseService } from "../services/database"
import { authMiddleware } from "../middleware/auth"
import type { CustomJwtPayload } from "../types/express"

const router = express.Router()
const db = new DatabaseService()

// Rota para listar campanhas
router.get("/campaigns", authMiddleware, async (req, res) => {
  try {
    const user = req.user as CustomJwtPayload

    if (!user || !user.id) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    const userId = user.id

    const campaigns = await db.query("SELECT * FROM gmaps_campaigns WHERE user_id = $1 ORDER BY created_at DESC", [
      userId,
    ])

    res.json({
      success: true,
      campaigns: campaigns.rows || [],
    })
  } catch (error) {
    console.error("Erro ao listar campanhas:", error)
    res.status(500).json({ error: "Erro ao listar campanhas" })
  }
})

// Rota para criar campanha
router.post("/campaigns", authMiddleware, async (req, res) => {
  try {
    const user = req.user as CustomJwtPayload

    if (!user || !user.id) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    const { name, searchQueries, options } = req.body
    const userId = user.id

    if (!name || !searchQueries || !Array.isArray(searchQueries)) {
      return res.status(400).json({ error: "Dados inválidos para criação de campanha" })
    }

    const result = await db.query(
      `INSERT INTO gmaps_campaigns 
       (user_id, name, search_queries, options, status) 
       VALUES ($1, $2, $3, $4, 'pending') 
       RETURNING id`,
      [userId, name, JSON.stringify(searchQueries), JSON.stringify(options || {})],
    )

    const campaignId = result.rows[0]?.id

    if (!campaignId) {
      throw new Error("Falha ao criar campanha")
    }

    res.json({
      success: true,
      campaign: {
        id: campaignId,
        name,
        status: "pending",
        created_at: new Date(),
      },
    })
  } catch (error) {
    console.error("Erro ao criar campanha:", error)
    res.status(500).json({ error: "Erro ao criar campanha" })
  }
})

// Rota para iniciar extração
router.post("/campaigns/:id/start", authMiddleware, async (req, res) => {
  try {
    const user = req.user as CustomJwtPayload

    if (!user || !user.id) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    const campaignId = req.params.id
    const userId = user.id

    // Verificar se a campanha pertence ao usuário
    const campaign = await db.query("SELECT * FROM gmaps_campaigns WHERE id = $1 AND user_id = $2", [
      campaignId,
      userId,
    ])

    if (!campaign.rows || campaign.rows.length === 0) {
      return res.status(404).json({ error: "Campanha não encontrada" })
    }

    // Atualizar status da campanha
    await db.query("UPDATE gmaps_campaigns SET status = 'running', started_at = NOW() WHERE id = $1", [campaignId])

    // Aqui você iniciaria o processo de extração em background
    // Por enquanto, apenas simulamos que está em execução

    res.json({
      success: true,
      message: "Extração iniciada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao iniciar extração:", error)
    res.status(500).json({ error: "Erro ao iniciar extração" })
  }
})

// Rota para obter resultados
router.get("/campaigns/:id/results", authMiddleware, async (req, res) => {
  try {
    const user = req.user as CustomJwtPayload

    if (!user || !user.id) {
      return res.status(401).json({ error: "Usuário não autenticado" })
    }

    const campaignId = req.params.id
    const userId = user.id

    // Verificar se a campanha pertence ao usuário
    const campaign = await db.query("SELECT * FROM gmaps_campaigns WHERE id = $1 AND user_id = $2", [
      campaignId,
      userId,
    ])

    if (!campaign.rows || campaign.rows.length === 0) {
      return res.status(404).json({ error: "Campanha não encontrada" })
    }

    // Buscar resultados
    const results = await db.query("SELECT * FROM gmaps_results WHERE campaign_id = $1 ORDER BY created_at DESC", [
      campaignId,
    ])

    res.json({
      success: true,
      results: results.rows || [],
    })
  } catch (error) {
    console.error("Erro ao obter resultados:", error)
    res.status(500).json({ error: "Erro ao obter resultados" })
  }
})

export default router
EOF

echo "✅ Arquivos de tipagem JWT corrigidos!"
echo "✅ Middleware de autenticação atualizado!"
echo "✅ Rotas whatsapp-group e gmaps-extractor corrigidas!"
echo ""
echo "🚀 Agora execute: cd backend && npm run dev"
