import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/auth";
import contactRoutes from "./routes/contacts";
import messageRoutes from "./routes/messages";
import whatsappRoutes from "./routes/whatsapp";
import automationRoutes from "./routes/automation";
import chatbotRoutes from "./routes/chatbot";
import integrationsRoutes from "./routes/integrations";
import settingsRoutes from "./routes/settings";
import flowsRoutes from "./routes/flows";

// Services
import { initWhatsAppService, getWhatsAppService } from "./services/whatsapp";
import { DatabaseService } from "./services/database";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// ======================= INÍCIO DA VERSÃO DEFINITIVA =======================

// 🛡️ Informa ao Express que ele está atrás de um proxy. Essencial para o rate-limit.
// Deve vir antes dos middlewares que dependem disso.
app.set("trust proxy", 1); 

// 1. Configuração de CORS robusta e flexível para produção.
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL || 'http://185.217.126.180:3000', // Adiciona o IP do seu VPS como padrão
  ...(process.env.ALLOWED_ORIGINS?.split(",") || [])
].filter(Boolean) as string[]; // Filtra valores nulos/undefined e garante que é um array de strings

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const environment = process.env.NODE_ENV || "development";

    // Permite requisições sem origem (ex: Postman, apps mobile) ou se a origem estiver na lista.
    if (!origin || allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.error(`⛔ [CORS] Origem BLOQUEADA: ${origin}`);
      callback(new Error("Não permitido pela política de CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// 2. Aplicar o middleware CORS ANTES do Helmet. Esta é a correção de ordem.
app.use(cors(corsOptions));

// 3. Aplicar outros middlewares de segurança e de parse.
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// ======================== FIM DA VERSÃO DEFINITIVA =========================


const dbService = new DatabaseService();

// Rotas da aplicação
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/flows", flowsRoutes);

// Health check
app.get("/health", async (req, res) => {
  try {
    await dbService.query("SELECT 1");
    const whatsappService = getWhatsAppService();
    const whatsappStatus = whatsappService?.isReady ? "ready" : "not_ready";
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: "connected",
      whatsapp: whatsappStatus,
    });
  } catch (error) {
    res.status(500).json({ status: "ERROR", database: "disconnected" });
  }
});

// Endpoint de teste
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend funcionando" });
});

// WebSocket
io.on("connection", (socket) => {
  console.log("Cliente conectado:", socket.id);
  socket.on("disconnect", () => {
    console.log("Cliente desconectado:", socket.id);
  });
});

// Tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Erro no servidor:", err.stack);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : "Algo deu errado",
  });
});

// Inicialização
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("🚀 Iniciando servidor...");
    await dbService.query("SELECT NOW()");
    console.log("✅ Banco de dados conectado");
    try {
      console.log("📱 Inicializando WhatsApp Service...");
      await initWhatsAppService();
    } catch (error) {
      console.error("⚠️ WhatsApp Service não pôde ser iniciado:", error);
    }
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar o servidor:", error);
    process.exit(1);
  }
};

startServer();

export { app, io };
