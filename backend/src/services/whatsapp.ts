import { Client, LocalAuth, type Message as WWebMessage } from "whatsapp-web.js"
import qrcode from "qrcode-terminal"
import fs from "fs"
import path from "path"
import { ChatbotService } from "./chatbot"

// Interface para o serviço WhatsApp
export interface WhatsAppService {
  client: Client
  isReady: boolean
  sendMessage: (to: string, message: string) => Promise<any>
  getContacts: () => Promise<any[]>
  getChats: () => Promise<any[]>
}

// Instância do serviço
let whatsappService: WhatsAppService | null = null

// Instância do serviço de chatbot
let chatbotService: ChatbotService | null = null

// Diretório para armazenar a sessão
const SESSION_DIR = path.join(process.cwd(), ".wwebjs_auth")

// Garantir que o diretório de sessão existe
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true })
}

// Função para inicializar o serviço WhatsApp
export const initWhatsAppService = async (): Promise<WhatsAppService> => {
  if (whatsappService) {
    return whatsappService
  }

  console.log("Inicializando WhatsApp Service...")

  // Inicializar ChatbotService se ainda não foi inicializado
  if (!chatbotService) {
    chatbotService = new ChatbotService()
  }

  // Criar cliente WhatsApp
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: "whatsapp-web-system" }),
    puppeteer: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
      executablePath: '/root/.cache/puppeteer/chrome/linux-137.0.7151.55/chrome-linux64/chrome'
    },
  })

  // Evento de QR Code
  client.on("qr", (qr) => {
    console.log("QR Code recebido, escaneie para autenticar:")
    qrcode.generate(qr, { small: true })

    // Salvar QR code em um arquivo para acesso via frontend
    fs.writeFileSync(path.join(process.cwd(), "qrcode.txt"), qr)
  })

  // Evento de autenticação
  client.on("authenticated", () => {
    console.log("WhatsApp autenticado!")
  })

  // Evento de pronto
  client.on("ready", () => {
    console.log("WhatsApp Client está pronto!")
    if (whatsappService) {
      whatsappService.isReady = true
    }
  })

  // Evento de desconexão
  client.on("disconnected", (reason) => {
    console.log("WhatsApp desconectado:", reason)
    if (whatsappService) {
      whatsappService.isReady = false
    }
  })

  // 🤖 Evento de mensagem para processamento do chatbot
  client.on("message", async (message: WWebMessage) => {
    try {
      // Ignorar mensagens próprias e de grupos (opcional)
      if (message.fromMe) return

      console.log(`📨 Mensagem recebida de ${message.from}: ${message.body}`)

      // Processar mensagem com o chatbot
      if (chatbotService && whatsappService?.isReady) {
        await chatbotService.processMessage(message.from, message.body, whatsappService)
      }
    } catch (error) {
      console.error("Erro ao processar mensagem no chatbot:", error)
    }
  })

  // Iniciar cliente
  await client.initialize().catch((err) => {
    console.error("Erro ao inicializar WhatsApp client:", err)
    throw err
  })

  // Criar e retornar o serviço
  whatsappService = {
    client,
    isReady: false,
    sendMessage: async (to: string, message: string) => {
      if (!whatsappService?.isReady) {
        throw new Error("WhatsApp client não está pronto")
      }

      // Formatar número se necessário
      const formattedNumber = to.includes("@c.us") ? to : `${to}@c.us`

      // Enviar mensagem
      return await client.sendMessage(formattedNumber, message)
    },
    getContacts: async () => {
      if (!whatsappService?.isReady) {
        throw new Error("WhatsApp client não está pronto")
      }
      const contacts = await client.getContacts()
      return contacts.map((contact) => ({
        id: contact.id._serialized,
        name: contact.name || contact.pushname,
        number: contact.number,
        isGroup: contact.isGroup,
      }))
    },
    getChats: async () => {
      if (!whatsappService?.isReady) {
        throw new Error("WhatsApp client não está pronto")
      }
      const chats = await client.getChats()
      return chats.map((chat) => ({
        id: chat.id._serialized,
        name: chat.name,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
      }))
    },
  }

  return whatsappService
}

// Função para obter o serviço WhatsApp
export const getWhatsAppService = (): WhatsAppService | null => {
  return whatsappService
}

// Função para verificar status do WhatsApp
export const getWhatsAppStatus = (): { isReady: boolean } => {
  return {
    isReady: whatsappService?.isReady || false,
  }
}

// Função para reiniciar o serviço WhatsApp
export const restartWhatsAppService = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (whatsappService?.client) {
      await whatsappService.client.destroy()
      whatsappService = null
    }

    await initWhatsAppService()
    return { success: true, message: "WhatsApp Service reiniciado com sucesso" }
  } catch (error) {
    console.error("Erro ao reiniciar WhatsApp Service:", error)
    return { success: false, message: `Erro ao reiniciar: ${error}` }
  }
}

// Função para compatibilidade com código antigo
export const setWhatsAppService = (service: WhatsAppService) => {
  whatsappService = service
}
