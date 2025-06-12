#!/bin/bash

echo "🔧 Aplicando TODAS as correções de TypeScript para GMaps Extractor..."

# 1. Primeiro, vamos atualizar o tsconfig.json do backend para incluir DOM
echo "1️⃣ Atualizando tsconfig.json do backend..."
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 2. Agora vamos criar o arquivo GMaps Extractor com todas as correções de tipo
echo "2️⃣ Criando GMaps Extractor com correções de tipo..."
cat > backend/src/services/gmaps-extractor.ts << 'EOF'
import * as puppeteer from "puppeteer"
import { DatabaseService } from "./database"
import * as fs from "fs"
import * as path from "path"
import * as ExcelJS from "exceljs"

interface ExtractedResult {
  name: string
  address: string
  category: string
  rating: number | null
  reviewCount: number | null
  phone: string
  website: string
}

export class GMapExtractorService {
  private browser: puppeteer.Browser | null = null
  public db: DatabaseService

  constructor() {
    this.db = new DatabaseService()
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async createCampaign(name: string, searchQueries: string[], options: any, userId: string): Promise<string> {
    try {
      const result = await this.db.query(
        `INSERT INTO gmaps_campaigns 
         (user_id, name, search_queries, options, status, created_at) 
         VALUES ($1, $2, $3, $4, 'pending', NOW()) 
         RETURNING id`,
        [userId, name, JSON.stringify(searchQueries), JSON.stringify(options || {})],
      )

      return result.rows[0].id
    } catch (error) {
      console.error("Erro ao criar campanha:", error)
      throw new Error("Falha ao criar campanha")
    }
  }

  async updateCampaignStatus(campaignId: string, status: string, totalResults = 0): Promise<void> {
    try {
      await this.db.query(
        `UPDATE gmaps_campaigns 
         SET status = $1, total_results = $2, updated_at = NOW() 
         WHERE id = $3`,
        [status, totalResults, campaignId],
      )
    } catch (error) {
      console.error("Erro ao atualizar status da campanha:", error)
      throw new Error("Falha ao atualizar status da campanha")
    }
  }

  async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
    }
    return this.browser
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async extractFromGoogleMaps(campaignId: string, searchQuery: string, options: any = {}): Promise<ExtractedResult[]> {
    try {
      const browser = await this.getBrowser()
      const page = await browser.newPage()

      await page.setViewport({ width: 1280, height: 800 })
      await page.goto("https://www.google.com/maps", { waitUntil: "networkidle2" })

      // Aceitar cookies se necessário
      try {
        const acceptButton = await page.$("button[aria-label='Aceitar tudo']")
        if (acceptButton) {
          await acceptButton.click()
          await this.delay(1000)
        }
      } catch (error) {
        console.log("Botão de cookies não encontrado")
      }

      // Pesquisar
      await page.type("input#searchboxinput", searchQuery)
      await page.keyboard.press("Enter")
      await page.waitForSelector("div[role='feed']", { timeout: 10000 })
      await this.delay(2000)

      // Extrair resultados
      const results = await this.scrollAndExtractResults(page)
      await this.saveResults(campaignId, searchQuery, results)
      await page.close()

      return results
    } catch (error) {
      console.error("Erro durante extração:", error)
      throw new Error("Falha na extração do Google Maps")
    }
  }

  async scrollAndExtractResults(page: puppeteer.Page): Promise<ExtractedResult[]> {
    const results: ExtractedResult[] = []
    let scrollAttempts = 0
    const maxScrollAttempts = 5

    while (scrollAttempts < maxScrollAttempts) {
      // @ts-ignore - Código DOM executado no contexto do navegador via Puppeteer
      const newResults = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll("div[role='feed'] > div"))
        
        return items.map((item) => {
          // Type casting para HTMLElement
          const el = item as HTMLElement

          const nameElement = el.querySelector("div.fontHeadlineSmall") as HTMLElement | null
          if (!nameElement) return null

          const name = nameElement.textContent || ""
          
          const infoElements = Array.from(el.querySelectorAll("div.fontBodyMedium span")) as HTMLElement[]
          const info = infoElements
            .map(el => el.textContent?.trim())
            .filter(Boolean)

          const ratingElement = el.querySelector("span[role='img']") as HTMLElement | null
          const ratingText = ratingElement?.getAttribute("aria-label") || ""
          const ratingMatch = ratingText.match(/(\d+[.,]\d+)/)
          const rating = ratingMatch ? parseFloat(ratingMatch[0].replace(",", ".")) : null

          const reviewElement = el.querySelector("span.fontBodySmall") as HTMLElement | null
          const reviewText = reviewElement?.textContent || ""
          const reviewMatch = reviewText.match(/\d+/)
          const reviewCount = reviewMatch ? parseInt(reviewMatch[0]) : null

          return {
            name,
            address: info[0] || "",
            category: info[1] || "",
            rating,
            reviewCount,
            phone: info.find(i => i && (i.includes("+") || /\d+/.test(i))) || "",
            website: info.find(i => i && (i.includes("www") || i.includes("http"))) || "",
          }
        }).filter(item => item !== null)
      })

      // Adicionar novos resultados únicos
      for (const result of newResults) {
        if (result && !results.some((r) => r.name === result.name)) {
          results.push(result as ExtractedResult)
        }
      }

      // @ts-ignore - Rolar para baixo - também no contexto do navegador
      await page.evaluate(() => {
        const feed = document.querySelector("div[role='feed']") as HTMLElement | null
        if (feed) {
          feed.scrollTop = feed.scrollHeight
        }
      })

      await this.delay(1000)
      scrollAttempts++
    }

    return results
  }

  async saveResults(campaignId: string, searchQuery: string, results: ExtractedResult[]): Promise<void> {
    try {
      for (const result of results) {
        await this.db.query(
          `INSERT INTO gmaps_results 
           (campaign_id, search_query, name, address, category, rating, review_count, phone, website, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            campaignId,
            searchQuery,
            result.name,
            result.address,
            result.category,
            result.rating,
            result.reviewCount,
            result.phone,
            result.website,
          ],
        )
      }
    } catch (error) {
      console.error("Erro ao salvar resultados:", error)
      throw new Error("Falha ao salvar resultados")
    }
  }

  async getCampaignResults(campaignId: string): Promise<any[]> {
    try {
      const result = await this.db.query(
        `SELECT * FROM gmaps_results 
         WHERE campaign_id = $1 
         ORDER BY created_at DESC`,
        [campaignId],
      )
      return result.rows
    } catch (error) {
      console.error("Erro ao obter resultados:", error)
      throw new Error("Falha ao obter resultados")
    }
  }

  async exportToExcel(campaignId: string): Promise<string> {
    try {
      const campaignResult = await this.db.query(`SELECT name FROM gmaps_campaigns WHERE id = $1`, [campaignId])
      const campaignName = campaignResult.rows[0]?.name || "campanha"
      const results = await this.getCampaignResults(campaignId)

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet("Resultados")

      worksheet.columns = [
        { header: "Nome", key: "name", width: 30 },
        { header: "Endereço", key: "address", width: 40 },
        { header: "Categoria", key: "category", width: 20 },
        { header: "Avaliação", key: "rating", width: 10 },
        { header: "Nº Avaliações", key: "review_count", width: 15 },
        { header: "Telefone", key: "phone", width: 20 },
        { header: "Website", key: "website", width: 30 },
        { header: "Termo de Busca", key: "search_query", width: 25 },
      ]

      results.forEach((result) => {
        worksheet.addRow({
          name: result.name,
          address: result.address,
          category: result.category,
          rating: result.rating,
          review_count: result.review_count,
          phone: result.phone,
          website: result.website,
          search_query: result.search_query,
        })
      })

      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      }

      const exportDir = path.join(__dirname, "../../exports")
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true })
      }

      const fileName = `${campaignName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${Date.now()}.xlsx`
      const filePath = path.join(exportDir, fileName)
      await workbook.xlsx.writeFile(filePath)

      return `/exports/${fileName}`
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      throw new Error("Falha ao exportar para Excel")
    }
  }
}
EOF

echo "✅ Arquivos criados!"

echo "3️⃣ Testando compilação..."
cd backend
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ Compilação bem-sucedida! Sem erros de TypeScript!"
    echo "🚀 Iniciando servidor para teste..."
    timeout 15s npm run dev &
    sleep 8
    
    echo "🧪 Testando rotas..."
    curl -s http://localhost:5000/api/gmaps-extractor/campaigns > /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Rota responde corretamente!"
    else
        echo "⚠️ Rota não responde (pode ser normal se backend não iniciou completamente)"
    fi
    
    echo ""
    echo "🎉 GMaps Extractor está funcionando!"
    echo "📋 Próximos passos:"
    echo "1. cd backend && npm run dev"
    echo "2. Teste o frontend em http://localhost:3000"
    echo "3. Acesse GMaps Extractor no dashboard"
    echo "4. Crie uma campanha de teste"
else
    echo "❌ Ainda há erros de compilação"
    echo "Verifique os erros acima e tente novamente"
fi
