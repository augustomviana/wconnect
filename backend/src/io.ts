// backend/src/io.ts

import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

// Cria e exporta uma única instância partilhada do servidor Socket.IO.
// Outras partes da aplicação irão importar esta instância para comunicar em tempo real.
export const io = new Server({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
