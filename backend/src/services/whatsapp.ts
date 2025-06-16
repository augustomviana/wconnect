// backend/src/services/whatsapp.ts

import { Client, LocalAuth, type Message as WWebMessage } from "whatsapp-web.js";
import qrcode from "qrcode";
import os from "os";
import path from "path";
import fs from "fs";
import { LlmService } from "./llm";
import { DatabaseService } from "./database";
import { io } from "../io";

let whatsappService: WhatsAppService | null = null;
let isRestarting = false;

const SESSION_DATA_PATH = path.join(process.cwd(), 'wwebjs_auth_session');

export interface WhatsAppService {
  client: Client;
  isReady: boolean;
  sendMessage: (to: string, message: string) => Promise<any>;
  getContacts: () => Promise<any[]>;
  getChats: () => Promise<any[]>;
}

const getPuppeteerOptions = () => {
    const isWindows = process.platform === 'win32';
    return {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote',
            '--disable-gpu',
            '--ignore-certificate-errors'
        ],
        executablePath: isWindows ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined,
    };
};

export const initWhatsAppService = async (): Promise<WhatsAppService> => {
  if (whatsappService?.client) return whatsappService;

  console.log("🚀 INICIANDO WHATSAPP SERVICE...");
  io.emit("status_change", { status: "connecting", message: "Inicializando cliente..." });

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: "wconnect-session", dataPath: SESSION_DATA_PATH }),
    puppeteer: getPuppeteerOptions()
  });

  const llmService = new LlmService();
  const dbService = new DatabaseService();

  client.on("qr", async (qr) => {
    try {
      const qrCodeUrl = await qrcode.toDataURL(qr);
      io.emit("qr_code", qrCodeUrl);
      io.emit("status_change", { status: "qr_code", message: "Escaneie o QR Code." });
    } catch (err) { console.error('❌ Falha ao gerar QR code:', err); }
  });

  client.on("ready", () => {
    console.log("✅ WhatsApp Client está pronto!");
    if (whatsappService) whatsappService.isReady = true;
    io.emit("status_change", { status: "connected", message: "Conectado e pronto!" });
  });

  // --- OUVINTE DE MENSAGENS COM A QUERY CORRIGIDA ---
  client.on('message', async (msg: WWebMessage) => {
    try {
      const chat = await msg.getChat();
      if (msg.fromMe || chat.isGroup) {
          return;
      }

      console.log(`💬 Mensagem recebida de ${msg.from}: ${msg.body}`);
      const numeroLimpo = msg.from.replace('@c.us', '');
      
      // --- CORREÇÃO DEFINITIVA: Usa a query REGEXP_REPLACE correta ---
      // Remove todos os caracteres não numéricos ('\D') com um 'g' de "global".
      const queryText = "SELECT * FROM leads WHERE regexp_replace(whatsapp, '\\D', '', 'g') = $1 LIMIT 1";
      const leadResult = await dbService.query(queryText, [numeroLimpo]);

      if (leadResult.rows.length === 0) {
          console.log(`Lead não encontrado para o número ${msg.from}. Ignorando.`);
          return;
      }
      
      const lead = leadResult.rows[0];
      await dbService.query('INSERT INTO mensagens (lead_id, mensagem, remetente) VALUES ($1, $2, $3)', [lead.id, msg.body, 'cliente']);
      
      const historicoResult = await dbService.query('SELECT remetente, mensagem FROM mensagens WHERE lead_id = $1 ORDER BY enviado_em DESC LIMIT 5', [lead.id]);
      const respostaGerada = await llmService.gerarRespostaConversacional(msg.body, historicoResult.rows.reverse());

      await client.sendMessage(msg.from, respostaGerada);
      await dbService.query('INSERT INTO mensagens (lead_id, mensagem, remetente) VALUES ($1, $2, $3)', [lead.id, respostaGerada, 'bot']);
    } catch (error) {
        console.error(`❌ Falha no processamento da mensagem de ${msg.from}:`, error);
    }
   });

  client.on("disconnected", (reason) => {
    console.log("❌ WhatsApp desconectado:", reason);
    if (whatsappService) whatsappService.isReady = false;
    whatsappService = null;
    io.emit("status_change", { status: "disconnected", message: `Desconectado: ${reason}` });
  });
  
  try {
    await client.initialize();
  } catch (err) {
    console.error("❌ Erro CRÍTICO ao inicializar WhatsApp client:", err);
    io.emit("status_change", { status: "error", message: `Erro na inicialização.` });
    throw err;
  }

  whatsappService = {
    client,
    isReady: true,
    sendMessage: async (to, message) => {
        if (!whatsappService?.isReady) throw new Error("WhatsApp client não está pronto");
        const chatId = `${to.replace(/\D/g, '')}@c.us`;
        return await client.sendMessage(chatId, message);
    },
    getContacts: async () => { return client.getContacts(); },
    getChats: async () => { return client.getChats(); },
  };
  return whatsappService;
};

export const getWhatsAppService = (): WhatsAppService | null => { return whatsappService; };
export const getWhatsAppStatus = (): { isReady: boolean } => ({ isReady: whatsappService?.isReady || false });

export const restartWhatsAppService = async (): Promise<{ success: boolean; message: string }> => {
    if (isRestarting) {
        return { success: false, message: "Reinício já em andamento." };
    }
    isRestarting = true;
    console.log("🔄 A reiniciar o serviço do WhatsApp...");
    
    try {
        if (whatsappService?.client) await whatsappService.client.destroy();
        whatsappService = null;
        if (fs.existsSync(SESSION_DATA_PATH)) {
            console.log(`🧹 A limpar a pasta de sessão...`);
            fs.rmSync(SESSION_DATA_PATH, { recursive: true, force: true });
        }
        await initWhatsAppService();
        return { success: true, message: "WhatsApp Service reiniciado com sucesso" };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Erro ao reiniciar: ${errorMessage}` };
    } finally {
        isRestarting = false;
    }
};
