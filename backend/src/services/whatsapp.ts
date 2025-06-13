import { Client, LocalAuth, type Message as WWebMessage } from "whatsapp-web.js";
import { io } from "../server";
import qrcode from "qrcode";
import os from "os";
import path from "path";
import { ChatbotService } from "./chatbot";

export interface WhatsAppService {
  client: Client;
  isReady: boolean;
  sendMessage: (to: string, message: string) => Promise<any>;
  getContacts: () => Promise<any[]>;
  getChats: () => Promise<any[]>;
}

let whatsappService: WhatsAppService | null = null;
let chatbotService: ChatbotService | null = null;

// Usando o diretório temporário do sistema operacional para maior compatibilidade
const SESSION_DATA_PATH = path.join(os.tmpdir(), 'wwebjs_auth_wconnect');

const getPuppeteerOptions = () => {
  // Detecta a plataforma (win32 para Windows)
  const isWindows = process.platform === 'win32';

  const options = {
    headless: 'new' as const,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--user-data-dir=${SESSION_DATA_PATH}`,
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    // Define o caminho do executável baseado no sistema operacional
    executablePath: isWindows
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : '/usr/bin/google-chrome-stable',
  };
  return options;
};

export const initWhatsAppService = async (): Promise<WhatsAppService> => {
  if (whatsappService) { return whatsappService; }
  console.log("🚀 INICIANDO WHATSAPP SERVICE REAL...");
  io.emit("status_change", { status: "connecting", message: "Inicializando cliente..." });
  if (!chatbotService) { chatbotService = new ChatbotService(); }

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: "wconnect-session", dataPath: SESSION_DATA_PATH }),
    puppeteer: getPuppeteerOptions() as any
  });

  client.on("qr", async (qr) => {
    console.log("✅ QR Code REAL recebido. Enviando para o frontend.");
    try {
      const qrCodeUrl = await qrcode.toDataURL(qr);
      io.emit("qr_code", qrCodeUrl);
      io.emit("status_change", { status: "qr_code", message: "Escaneie o QR Code para conectar." });
    } catch (err) { console.error('Falha ao gerar QR code data URL:', err); }
  });

  client.on("authenticated", () => {
    console.log("✅ WhatsApp autenticado!");
    io.emit("status_change", { status: "authenticated", message: "Autenticado com sucesso." });
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp Client está pronto!");
    if (whatsappService) { whatsappService.isReady = true; }
    io.emit("status_change", { status: "connected", message: "Conectado e pronto!" });
  });

  client.on("disconnected", (reason) => {
    console.log("❌ WhatsApp desconectado:", reason);
    if (whatsappService) { whatsappService.isReady = false; }
    io.emit("status_change", { status: "disconnected", message: `Desconectado: ${reason}` });
  });

  try {
    await client.initialize();
  } catch (err) {
    console.error("❌ Erro CRÍTICO ao inicializar WhatsApp client:", err);
    io.emit("status_change", { status: "disconnected", message: `Erro na inicialização: ${err}` });
    throw err;
  }

  whatsappService = {
    client,
    isReady: false,
    sendMessage: async (to, message) => {
        if (!whatsappService?.isReady) throw new Error("WhatsApp client não está pronto");
        const formattedNumber = to.includes("@c.us") ? to : `${to}@c.us`;
        return await client.sendMessage(formattedNumber, message);
    },
    getContacts: async () => {
        if (!whatsappService?.isReady) throw new Error("WhatsApp client não está pronto");
        return await client.getContacts();
    },
    getChats: async () => {
        if (!whatsappService?.isReady) throw new Error("WhatsApp client não está pronto");
        return await client.getChats();
    },
  };
  return whatsappService;
};

// As outras funções de suporte
export const getWhatsAppService = (): WhatsAppService | null => { return whatsappService; };
export const getWhatsAppStatus = (): { isReady: boolean } => { return { isReady: whatsappService?.isReady || false, }; };
export const restartWhatsAppService = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (whatsappService?.client) { await whatsappService.client.destroy(); }
    whatsappService = null;
    await initWhatsAppService();
    return { success: true, message: "WhatsApp Service reiniciado com sucesso" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erro ao reiniciar WhatsApp Service:", errorMessage);
    return { success: false, message: `Erro ao reiniciar: ${errorMessage}` };
  }
};
