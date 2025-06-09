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

// 🛡️ Corrige problema do Express com proxies (rate-limit)
app.set("trust proxy", true);


const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS?.split(",") || [])
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const environment = process.env.NODE_ENV || "development";

    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) =>
      origin.startsWith(allowed)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      if (environment === "development") {
        console.warn(`⚠️ [CORS] Origem não permitida, mas aceita em DEV: ${origin}`);
        callback(null, true);
      } else {
        console.error(`⛔ [CORS] Origem BLOQUEADA: ${origin}`);
        callback(new Error("Não permitido pela política de CORS"));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
};

// Aplicar CORS primeiro
app.use(cors(corsOptions));


// Segurança HTTP
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Payload parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database
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
    const whatsappStatus = whatsappService ? "ready" : "not_ready";

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: "connected",
      whatsapp: whatsappStatus,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      whatsapp: "not_ready"
    });
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
      console.log("✅ WhatsApp Service iniciado");
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

