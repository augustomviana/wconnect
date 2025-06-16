// backend/src/server.ts

import express from "express";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

import { io } from "./io"; // Importa a instância partilhada do io

// Importa todas as suas rotas
import authRoutes from "./routes/auth";
import whatsappRoutes from "./routes/whatsapp";
import contactRoutes from "./routes/contacts";
import messageRoutes from "./routes/messages";
import automationRoutes from "./routes/automation";
import chatbotRoutes from "./routes/chatbot";
import integrationsRoutes from "./routes/integrations";
import campanhaRoutes from "./routes/campanha";

// Importa as funções do serviço
import { initWhatsAppService, restartWhatsAppService } from "./services/whatsapp";
import { DatabaseService } from "./services/database";

dotenv.config();

const app = express();
const server = createServer(app);

// Ativa o servidor 'io' ligando-o ao servidor HTTP
io.attach(server);

// --- INÍCIO DA CORREÇÃO ---
// Lógica de conexão do Socket.IO que ouve os eventos do frontend.
io.on("connection", (socket) => {
  console.log(`🔌 Cliente conectado ao Socket.IO: ${socket.id}`);
  
  // Adiciona o ouvinte para o evento 'restart_whatsapp'
  socket.on('restart_whatsapp', async () => {
    console.log(`⚡ Evento 'restart_whatsapp' recebido do cliente: ${socket.id}`);
    try {
        await restartWhatsAppService();
    } catch (error) {
        console.error("Falha ao processar o reinício do WhatsApp via socket:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Cliente desconectado do Socket.IO: ${socket.id}`);
  });
});
// --- FIM DA CORREÇÃO ---

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/integrations", integrationsRoutes);
app.use("/api/campanha", campanhaRoutes);


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const dbService = new DatabaseService();
    await dbService.testConnection();
    console.log("✅ Banco de dados conectado");

    await initWhatsAppService();
    console.log("✅ Serviço WhatsApp inicializado no arranque.");

    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Erro fatal ao iniciar o servidor:", error);
    process.exit(1);
  }
};

startServer();
