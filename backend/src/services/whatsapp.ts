import { Client, LocalAuth, type Message as WWebMessage } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { ChatbotService } from "./chatbot";

// --- Interfaces e instâncias de serviço ---
export interface WhatsAppService {
  client: Client;
  isReady: boolean;
  sendMessage: (to: string, message: string) => Promise<any>;
  getContacts: () => Promise<any[]>;
  getChats: () => Promise<any[]>;
}

let whatsappService: WhatsAppService | null = null;
let chatbotService: ChatbotService | null = null;

const SESSION_DIR = path.join(process.cwd(), ".wwebjs_auth");
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// ======================= INÍCIO DA CORREÇÃO =======================
// Lógica para definir as opções do Puppeteer de forma dinâmica

const getPuppeteerOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const options = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- Este pode ajudar em ambientes com poucos recursos
      '--disable-gpu'
    ]
  };

  // Se estiver em produção (no VPS Linux), especifica o caminho do executável.
  // Em desenvolvimento (Windows), deixa o Puppeteer encontrar o browser automaticamente.
  if (isProduction) {
    return {
      ...options,
      executablePath: '/root/.cache/puppeteer/chrome/linux-137.0.7151.55/chrome-linux64/chrome'
    };
  }

  return options;
};
// ======================== FIM DA CORREÇÃO =========================


export const initWhatsAppService = async (): Promise<WhatsAppService> => {
  if (whatsappService) {
    return whatsappService;
  }

  console.log("Inicializando WhatsApp Service...");

  if (!chatbotService) {
    chatbotService = new ChatbotService();
  }

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: "whatsapp-web-system" }),
    puppeteer: getPuppeteerOptions() // <-- USA A FUNÇÃO DINÂMICA
  });

  client.on("qr", (qr) => {
    console.log("QR Code recebido, escaneie para autenticar:");
    qrcode.generate(qr, { small: true });
    // Salva o QR code em um arquivo para acesso via frontend
    fs.writeFileSync(path.join(process.cwd(), "qrcode.txt"), qr);
  });

  client.on("authenticated", () => {
    console.log("WhatsApp autenticado!");
  });

  client.on("ready", () => {
    console.log("WhatsApp Client está pronto!");
    if (whatsappService) {
      whatsappService.isReady = true;
    }
  });

  client.on("disconnected", (reason) => {
    console.log("WhatsApp desconectado:", reason);
    if (whatsappService) {
      whatsappService.isReady = false;
    }
  });

  client.on("message", async (message: WWebMessage) => {
    try {
      if (message.fromMe) return;
      console.log(`📨 Mensagem recebida de ${message.from}: ${message.body}`);
      if (chatbotService && whatsappService?.isReady) {
        await chatbotService.processMessage(message.from, message.body, whatsappService);
      }
    } catch (error) {
      console.error("Erro ao processar mensagem no chatbot:", error);
    }
  });

  await client.initialize().catch((err) => {
    console.error("Erro ao inicializar WhatsApp client:", err);
    throw err;
  });

  whatsappService = {
    client,
    isReady: false,
    // ... o resto do seu objeto de serviço ...
    sendMessage: async (to, message) => {
        if (!whatsappService?.isReady) throw new Error("WhatsApp client não está pronto");
        const formattedNumber = to.includes("@c.us") ? to : `${to}@c.us`;
        return await client.sendMessage(formattedNumber, message);
    },
    getContacts: async () => {
        if (!whatsappService?.isReady) throw new Error("WhatsApp client não está pronto");
        const contacts = await client.getContacts();
        return contacts.map(contact => ({
            id: contact.id._serialized,
            name: contact.name || contact.pushname,
            number: contact.number,
            isGroup: contact.isGroup,
        }));
    },
    getChats: async () => {
        if (!whatsappService?.isReady) throw new Error("WhatsApp client não está pronto");
        const chats = await client.getChats();
        return chats.map(chat => ({
            id: chat.id._serialized,
            name: chat.name,
            isGroup: chat.isGroup,
            unreadCount: chat.unreadCount,
        }));
    },
  };

  return whatsappService;
};

// ... o resto do seu ficheiro (getWhatsAppService, etc.) ...
export const getWhatsAppService = (): WhatsAppService | null => {
  return whatsappService;
};

export const getWhatsAppStatus = (): { isReady: boolean } => {
  return {
    isReady: whatsappService?.isReady || false,
  };
};

export const restartWhatsAppService = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (whatsappService?.client) {
      await whatsappService.client.destroy();
      whatsappService = null;
    }
    await initWhatsAppService();
    return { success: true, message: "WhatsApp Service reiniciado com sucesso" };
  } catch (error) {
    console.error("Erro ao reiniciar WhatsApp Service:", error);
    return { success: false, message: `Erro ao reiniciar: ${error}` };
  }
};

export const setWhatsAppService = (service: WhatsAppService) => {
  whatsappService = service;
};
