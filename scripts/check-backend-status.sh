#!/bin/bash

echo "🔍 Verificando status do backend..."

# Verificar se o processo do backend está rodando
echo "1️⃣ Verificando processo do backend..."
if pgrep -f "node.*backend" > /dev/null; then
    echo "✅ Backend está rodando"
    BACKEND_RUNNING=true
else
    echo "❌ Backend não está rodando"
    BACKEND_RUNNING=false
fi

# Verificar se o servidor está respondendo
echo "2️⃣ Verificando se o servidor responde..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Servidor responde na porta 5000"
    SERVER_RESPONDING=true
else
    echo "❌ Servidor não responde na porta 5000"
    SERVER_RESPONDING=false
fi

# Verificar se a rota do GMaps Extractor existe
echo "3️⃣ Verificando rota do GMaps Extractor..."
if curl -s http://localhost:5000/api/gmaps-extractor/campaigns > /dev/null; then
    echo "✅ Rota do GMaps Extractor responde"
    GMAPS_ROUTE_EXISTS=true
else
    echo "❌ Rota do GMaps Extractor não responde"
    GMAPS_ROUTE_EXISTS=false
fi

# Verificar se o arquivo de rota existe
echo "4️⃣ Verificando arquivo de rota..."
if [ -f "backend/src/routes/gmaps-extractor.ts" ]; then
    echo "✅ Arquivo de rota existe"
    ROUTE_FILE_EXISTS=true
else
    echo "❌ Arquivo de rota não existe"
    ROUTE_FILE_EXISTS=false
    
    # Criar arquivo de rota se não existir
    echo "📝 Criando arquivo de rota..."
    mkdir -p backend/src/routes
    cat > backend/src/routes/gmaps-extractor.ts << 'EOF'
import { Router } from "express"
import { GMapExtractorService } from "../services/gmaps-extractor"
import { authenticateToken } from "../middleware/auth"

const router = Router()
const gmapsService = new GMapExtractorService()

// Criar nova campanha
router.post("/campaigns", authenticateToken, async (req, res) => {
  try {
    const { name, searchQueries, options } = req.body
    const userId = req.user.id

    if (!name || !searchQueries || !Array.isArray(searchQueries) || searchQueries.length === 0) {
      return res.status(400).json({ error: "Nome e termos de busca são obrigatórios" })
    }

    const campaignId = await gmapsService.createCampaign(name, searchQueries, options, userId)
    res.status(201).json({ id: campaignId, message: "Campanha criada com sucesso" })
  } catch (error) {
    console.error("Erro ao criar campanha:", error)
    res.status(500).json({ error: "Erro ao criar campanha" })
  }
})

// Listar campanhas
router.get("/campaigns", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const result = await gmapsService.db.query(
      "SELECT * FROM gmaps_campaigns WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    )
    res.json(result.rows)
  } catch (error) {
    console.error("Erro ao listar campanhas:", error)
    res.status(500).json({ error: "Erro ao listar campanhas" })
  }
})

// Obter detalhes da campanha
router.get("/campaigns/:id", authenticateToken, async (req, res) => {
  try {
    const campaignId = req.params.id
    const userId = req.user.id

    const result = await gmapsService.db.query(
      "SELECT * FROM gmaps_campaigns WHERE id = $1 AND user_id = $2",
      [campaignId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Campanha não encontrada" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Erro ao obter detalhes da campanha:", error)
    res.status(500).json({ error: "Erro ao obter detalhes da campanha" })
  }
})

// Iniciar extração
router.post("/campaigns/:id/start", authenticateToken, async (req, res) => {
  try {
    const campaignId = req.params.id
    const userId = req.user.id

    // Verificar se a campanha existe e pertence ao usuário
    const campaignResult = await gmapsService.db.query(
      "SELECT * FROM gmaps_campaigns WHERE id = $1 AND user_id = $2",
      [campaignId, userId]
    )

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: "Campanha não encontrada" })
    }

    const campaign = campaignResult.rows[0]
    
    // Atualizar status para "em andamento"
    await gmapsService.updateCampaignStatus(campaignId, "in_progress")
    
    // Iniciar extração em background
    const searchQueries = campaign.search_queries
    const options = campaign.options || {}
    
    // Não aguardar a conclusão para responder ao cliente
    res.json({ message: "Extração iniciada com sucesso" })
    
    // Executar extração em background
    try {
      let totalResults = 0
      
      for (const query of searchQueries) {
        const results = await gmapsService.extractFromGoogleMaps(campaignId, query, options)
        totalResults += results.length
      }
      
      // Atualizar status para "concluído"
      await gmapsService.updateCampaignStatus(campaignId, "completed", totalResults)
    } catch (error) {
      console.error("Erro durante extração:", error)
      await gmapsService.updateCampaignStatus(campaignId, "failed")
      await gmapsService.db.query(
        "UPDATE gmaps_campaigns SET error_message = $1 WHERE id = $2",
        [error.message || "Erro desconhecido", campaignId]
      )
    }
  } catch (error) {
    console.error("Erro ao iniciar extração:", error)
    res.status(500).json({ error: "Erro ao iniciar extração" })
  }
})

// Obter resultados da campanha
router.get("/campaigns/:id/results", authenticateToken, async (req, res) => {
  try {
    const campaignId = req.params.id
    const userId = req.user.id

    // Verificar se a campanha existe e pertence ao usuário
    const campaignResult = await gmapsService.db.query(
      "SELECT * FROM gmaps_campaigns WHERE id = $1 AND user_id = $2",
      [campaignId, userId]
    )

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: "Campanha não encontrada" })
    }

    const results = await gmapsService.getCampaignResults(campaignId)
    res.json(results)
  } catch (error) {
    console.error("Erro ao obter resultados:", error)
    res.status(500).json({ error: "Erro ao obter resultados" })
  }
})

// Exportar resultados para Excel
router.get("/campaigns/:id/export", authenticateToken, async (req, res) => {
  try {
    const campaignId = req.params.id
    const userId = req.user.id

    // Verificar se a campanha existe e pertence ao usuário
    const campaignResult = await gmapsService.db.query(
      "SELECT * FROM gmaps_campaigns WHERE id = $1 AND user_id = $2",
      [campaignId, userId]
    )

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: "Campanha não encontrada" })
    }

    const filePath = await gmapsService.exportToExcel(campaignId)
    res.json({ filePath })
  } catch (error) {
    console.error("Erro ao exportar resultados:", error)
    res.status(500).json({ error: "Erro ao exportar resultados" })
  }
})

export default router
EOF
    echo "✅ Arquivo de rota criado"
fi

# Verificar se o arquivo de serviço existe
echo "5️⃣ Verificando arquivo de serviço..."
if [ -f "backend/src/services/gmaps-extractor.ts" ]; then
    echo "✅ Arquivo de serviço existe"
    SERVICE_FILE_EXISTS=true
else
    echo "❌ Arquivo de serviço não existe"
    SERVICE_FILE_EXISTS=false
fi

# Verificar se o arquivo server.ts carrega a rota
echo "6️⃣ Verificando se server.ts carrega a rota..."
if grep -q "gmaps-extractor" "backend/src/server.ts"; then
    echo "✅ Rota está sendo carregada no server.ts"
    ROUTE_LOADED=true
else
    echo "❌ Rota não está sendo carregada no server.ts"
    ROUTE_LOADED=false
    
    # Adicionar rota ao server.ts
    echo "📝 Adicionando rota ao server.ts..."
    sed -i '/import authRoutes/a import gmapsExtractorRoutes from "./routes/gmaps-extractor"' backend/src/server.ts
    sed -i '/app.use("\/api\/auth", authRoutes)/a app.use("\/api\/gmaps-extractor", gmapsExtractorRoutes)' backend/src/server.ts
    echo "✅ Rota adicionada ao server.ts"
fi

# Verificar se as tabelas existem no banco de dados
echo "7️⃣ Verificando tabelas no banco de dados..."
echo "⚠️ Não é possível verificar tabelas sem senha do banco"
echo "⚠️ Execute manualmente: psql -U whatsapp_user -d whatsapp_db -c '\dt gmaps_*'"

# Resumo
echo ""
echo "📊 Resumo do diagnóstico:"
echo "- Backend rodando: $BACKEND_RUNNING"
echo "- Servidor respondendo: $SERVER_RESPONDING"
echo "- Rota GMaps responde: $GMAPS_ROUTE_EXISTS"
echo "- Arquivo de rota existe: $ROUTE_FILE_EXISTS"
echo "- Arquivo de serviço existe: $SERVICE_FILE_EXISTS"
echo "- Rota carregada no server.ts: $ROUTE_LOADED"

# Recomendações
echo ""
echo "📋 Recomendações:"
if [ "$BACKEND_RUNNING" = false ]; then
    echo "1. Inicie o backend: cd backend && npm run dev"
fi

if [ "$ROUTE_FILE_EXISTS" = false ] || [ "$SERVICE_FILE_EXISTS" = false ]; then
    echo "2. Execute o script de correção: ./scripts/fix-all-typescript-errors.sh"
fi

if [ "$ROUTE_LOADED" = false ]; then
    echo "3. Reinicie o backend após as correções"
fi

echo "4. Verifique se as tabelas do banco existem: psql -U whatsapp_user -d whatsapp_db -c '\dt gmaps_*'"
echo "5. Se as tabelas não existirem, execute: psql -U whatsapp_user -d whatsapp_db -f database/gmaps-extractor-schema.sql"

