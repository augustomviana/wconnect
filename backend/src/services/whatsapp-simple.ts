import {
  Client,
  LocalAuth,
  Message as WWebMessage, // Renomeado para evitar conflito
  Contact as WWebContact,
  Chat as WWebChat,
} from "whatsapp-web.js";
import QRCode from "qrcode";
import type { Server as SocketIOServer } from "socket.io"; // Renomeado para clareza

// Interfaces para padronizar os retornos (similar ao whatsapp_service_ts_corrected)
export interface WhatsAppClientStatus {
  status: 'initializing' | 'qr' | 'ready' | 'authenticated' | 'auth_failure' | 'disconnected' | 'error' | 'unknown';
  message?: string;
  qrDataURL?: string;
  wid?: string;
}

export interface ContactInfo {
  id: string;
  name?: string;
  number?: string;
  isGroup: boolean;
  profilePicUrl?: string;
}

export interface ChatInfo {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  timestamp: number;
}

export class WhatsAppService {
  private client: Client;
  private io: SocketIOServer;
  private currentStatus: WhatsAppClientStatus['status'] = 'initializing';
  private currentQrCode: string | null = null; // Para armazenar o QR code em texto

  constructor(io: SocketIOServer) {
    this.io = io;

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: "./sessions_simple", // Usar um dataPath diferente para não conflitar com outra instância
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          // "--single-process", // Pode ser instável, remover se houver problemas
          // "--no-zygote", // Pode ser instável
          "--disable-gpu",
          "--disable-dev-shm-usage", // Importante para ambientes com memória limitada
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
        ],
      },
      // Considerar adicionar webVersionCache como no outro serviço para consistência
    });

    this.setupEventHandlers();
  }

  private updateStatus(status: WhatsAppClientStatus['status'], message?: string, qrDataURL?: string) {
    this.currentStatus = status;
    const statusPayload: WhatsAppClientStatus = { status, message, wid: this.client.info?.wid?._serialized };
    if (qrDataURL) statusPayload.qrDataURL = qrDataURL;
    
    this.io.emit("status_update", statusPayload); // Emitir um evento de status genérico
    console.log(`WhatsApp (Simple) Status Update: ${status}`, message || '');
  }

  private setupEventHandlers() {
    this.client.on("qr", async (qr) => {
      console.log("(Simple) QR Code gerado");
      this.currentQrCode = qr;
      try {
        const qrCodeDataURL = await QRCode.toDataURL(qr);
        console.log("(Simple) QR Code convertido para DataURL");
        this.io.emit("qr", qrCodeDataURL); // Envia o QR code como Data URL para o frontend
        this.updateStatus('qr', 'QR Code gerado, escaneie por favor.', qrCodeDataURL);
        console.log("(Simple) QR Code enviado via WebSocket");
      } catch (error) {
        console.error("(Simple) Erro ao gerar QR Code Data URL:", error);
        this.updateStatus('error', 'Falha ao processar QR Code.');
      }
    });

    this.client.on("ready", () => {
      console.log("(Simple) WhatsApp Client está pronto!");
      this.currentQrCode = null;
      this.updateStatus('ready', 'Cliente pronto e conectado.');
      this.io.emit("ready", { status: "connected", wid: this.client.info?.wid });
    });

    this.client.on("authenticated", () => {
      console.log("(Simple) WhatsApp autenticado");
      this.currentQrCode = null;
      this.updateStatus('authenticated', 'Cliente autenticado com sucesso.');
      this.io.emit("authenticated");
    });

    this.client.on("auth_failure", (msg) => {
      console.error("(Simple) Falha na autenticação:", msg);
      this.currentQrCode = null;
      this.updateStatus('auth_failure', `Falha na autenticação: ${msg}`);
      this.io.emit("auth_failure", msg);
    });

    this.client.on("disconnected", (reason) => {
      console.log("(Simple) WhatsApp desconectado:", reason);
      this.currentQrCode = null;
      this.updateStatus('disconnected', `Cliente desconectado: ${reason}`);
      this.io.emit("disconnected", reason);
    });

    this.client.on("message", async (message: WWebMessage) => {
      console.log("(Simple) Nova mensagem recebida:", message.body);
      const chat = await message.getChat();
      this.io.emit("message", {
        id: message.id._serialized,
        whatsapp_id: message.id._serialized,
        body: message.body,
        from: message.from,
        to: message.to,
        timestamp: message.timestamp, // Este é um número (timestamp Unix em segundos)
        type: message.type,
        isGroupMsg: chat.isGroup,
        fromMe: message.fromMe,
      });

      if (message.body.trim().toLowerCase() === "ping") {
        await message.reply("pong");
      }
    });

    this.client.on('error', (err) => {
        console.error('(Simple) Erro no cliente WhatsApp:', err);
        this.updateStatus('error', `Erro no cliente: ${err.message}`);
    });
  }

  async initialize(): Promise<void> {
    if (this.currentStatus === 'ready' || this.currentStatus === 'authenticated') {
        console.log("(Simple) WhatsApp Client já está inicializado.");
        return;
    }
    this.updateStatus('initializing', 'Inicializando cliente WhatsApp (Simple)...');
    try {
      console.log("(Simple) Inicializando WhatsApp Client...");
      await this.client.initialize();
      console.log("(Simple) WhatsApp Client inicializado (aguardando eventos ready/auth).");
    } catch (error) {
      console.error("(Simple) Erro ao inicializar WhatsApp Client:", error);
      this.updateStatus('error', `Falha na inicialização: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  // --- MÉTODOS ADICIONADOS/COMPLETADOS ---

  public getStatus(): WhatsAppClientStatus {
    return {
        status: this.currentStatus,
        wid: this.client.info?.wid?._serialized,
        // Para simplificar, não vamos gerar a URL do QR aqui, o frontend deve usar o qrDataURL emitido.
        message: this.currentStatus === 'qr' && this.currentQrCode ? 'Escaneie o QR Code' : `Status atual: ${this.currentStatus}`
    };
  }

  async destroy(): Promise<void> {
    console.log("(Simple) Destruindo cliente WhatsApp...");
    if (this.client) {
        try {
            await this.client.destroy();
            this.updateStatus('disconnected', 'Cliente destruído manualmente.');
            console.log("(Simple) Cliente WhatsApp destruído.");
        } catch (error) {
            console.error("(Simple) Erro ao destruir cliente:", error);
            this.updateStatus('error', `Erro ao destruir: ${error instanceof Error ? error.message : String(error)}`);
        }
    } else {
        this.updateStatus('disconnected', 'Cliente já não existia ou não inicializado.');
    }
  }

  async sendMessage(to: string, messageBody: string): Promise<WWebMessage> {
    if (this.currentStatus !== "ready" && this.currentStatus !== "authenticated") {
      throw new Error(`(Simple) WhatsApp client não está pronto. Status: ${this.currentStatus}`);
    }

    try {
      // A biblioteca whatsapp-web.js lida com a formatação do ID (ex: adicionando @c.us ou @g.us se for um número)
      // mas é mais seguro garantir que o formato esteja correto se você souber.
      const chatId = to; // Ex: "xxxxxxxxxxx@c.us" ou "xxxxxxxxxxx-yyyyyyyyyy@g.us"
      console.log(`(Simple) Enviando mensagem para ${chatId}: ${messageBody}`);
      const sentMessage = await this.client.sendMessage(chatId, messageBody);
      
      // Emitir a mensagem enviada via Socket.IO
      const chat = await sentMessage.getChat();
      this.io.emit("message", {
        id: sentMessage.id._serialized,
        whatsapp_id: sentMessage.id._serialized,
        body: sentMessage.body,
        from: sentMessage.from,
        to: sentMessage.to,
        timestamp: sentMessage.timestamp,
        type: sentMessage.type,
        isGroupMsg: chat.isGroup,
        fromMe: sentMessage.fromMe,
      });
      return sentMessage;
    } catch (error) {
      console.error("(Simple) Erro ao enviar mensagem:", error);
      throw error;
    }
  }

  async getContacts(): Promise<ContactInfo[]> {
    if (this.currentStatus !== "ready" && this.currentStatus !== "authenticated") {
      console.warn(`(Simple) Tentativa de buscar contatos com status: ${this.currentStatus}`);
      return [];
    }
    try {
      const wwebContacts: WWebContact[] = await this.client.getContacts();
      const contactsInfo: ContactInfo[] = await Promise.all(
        wwebContacts.map(async (contact: WWebContact) => {
          let profilePicUrl: string | undefined;
          try {
            profilePicUrl = await contact.getProfilePicUrl();
          } catch (picError) {
            profilePicUrl = undefined;
          }
          return {
            id: contact.id._serialized,
            name: contact.name || contact.pushname || contact.shortName,
            number: contact.number,
            isGroup: contact.isGroup,
            profilePicUrl: profilePicUrl,
          };
        })
      );
      return contactsInfo;
    } catch (error) {
      console.error("(Simple) Erro ao buscar contatos do WhatsApp:", error);
      return [];
    }
  }

  async getChats(): Promise<ChatInfo[]> {
    if (this.currentStatus !== "ready" && this.currentStatus !== "authenticated") {
      console.warn(`(Simple) Tentativa de buscar chats com status: ${this.currentStatus}`);
      return [];
    }
    try {
      const wwebChats: WWebChat[] = await this.client.getChats();
      const chatsInfo: ChatInfo[] = wwebChats.map((chat: WWebChat) => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        timestamp: chat.timestamp,
      }));
      return chatsInfo;
    } catch (error) {
      console.error("(Simple) Erro ao buscar chats do WhatsApp:", error);
      return [];
    }
  }
}
