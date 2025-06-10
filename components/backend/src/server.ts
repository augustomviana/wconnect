import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { createServer } from "http"
import { Server } from "socket.io"
import dotenv from "dotenv"

// Routes
import authRoutes from "./routes/auth"
import contactRoutes from "./routes/contacts"
import messageRoutes from "./routes/messages"
import whatsappRoutes from "./routes/whatsapp"
import automationRoutes from "./routes/automation"
import chatbotRoutes from "./routes/chatbot"
import integrationsRoutes from "./routes/integrations"
import settingsRoutes from "./routes/settings"
import flowsRoutes from "./routes/flows"

// Services
import { initWhatsAppService, getWhatsAppService } from "./services/whatsapp"
import { DatabaseService } from "./services/database"

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Test database connection
const dbService = new DatabaseService()

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/contacts", contactRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/whatsapp", whatsappRoutes)
app.use("/api/automation", automationRoutes)
app.use("/api/chatbot", chatbotRoutes)
app.use("/api/integrations", integrationsRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/flows", flowsRoutes)

// Health check
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await dbService.query("SELECT 1")

    const whatsappService = getWhatsAppService()
    const whatsappStatus = whatsappService ? whatsappService.isReady : false

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
      whatsapp: whatsappStatus ? "ready" : "not_ready",
    })
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "disconnected",
      whatsapp: "not_ready",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

// Test automation routes
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend funcionando",
    routes: [
      "/api/auth",
      "/api/contacts",
      "/api/messages",
      "/api/whatsapp",
      "/api/automation",
      "/api/chatbot",
      "/api/integrations",
      "/api/flows"
    ],
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  })
})

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id)

  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id)
  })
})

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Erro no servidor:", err.stack)
  res.status(500).json({
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : "Algo deu errado",
  })
})

const PORT = process.env.PORT || 5000

// Iniciar o servidor
const startServer = async () => {
  try {
    console.log("🚀 Iniciando servidor...")

    // Test database on startup
    await dbService
      .query("SELECT NOW()")
      .then(() => {
        console.log("✅ Banco de dados conectado")
      })
      .catch((err) => {
        console.error("❌ Erro ao conectar banco:", err.message)
        // Não parar o servidor se o banco não estiver disponível
      })

    // Iniciar o serviço do WhatsApp
    try {
      console.log("📱 Inicializando WhatsApp Service...")
      await initWhatsAppService()
      console.log("✅ WhatsApp Service iniciado")
    } catch (error) {
      console.error("⚠️ WhatsApp Service não pôde ser iniciado:", error)
      // Continuar sem o WhatsApp por enquanto
    }

    // Iniciar o servidor
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`)
      console.log(`📱 WhatsApp Service: ${getWhatsAppService() ? "ativo" : "inativo"}`)
      console.log(`🤖 Sistema de Automação ativo`)
      console.log(`🗄️ Banco de dados: ${process.env.DB_NAME}@${process.env.DB_HOST}`)
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`)
    })
  } catch (error) {
    console.error("❌ Erro ao iniciar o servidor:", error)
    process.exit(1)
  }
}

startServer()

export { app, io }
