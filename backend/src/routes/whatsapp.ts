import express from "express";
import { 
  getWhatsAppService, 
  getWhatsAppStatus, 
  restartWhatsAppService 
} from "../services/whatsapp";

const router = express.Router();

// Rota para verificar o status da conexão
router.get("/status", (req, res) => {
  const status = getWhatsAppStatus();
  res.status(200).json(status);
});

// Rota para reiniciar o serviço do WhatsApp
router.post("/restart", async (req, res) => {
  try {
    const result = await restartWhatsAppService();
    res.status(200).json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    res.status(500).json({ success: false, message: errorMessage });
  }
});

// Adicionando as rotas que estavam no arquivo original para garantir compatibilidade
router.post('/send', async (req, res) => {
    const { to, message } = req.body;
    const service = getWhatsAppService();
    if (service && service.isReady) {
        await service.sendMessage(to, message);
        res.status(200).json({ success: true });
    } else {
        res.status(503).json({ error: 'WhatsApp não está pronto' });
    }
});

router.get('/contacts', async (req, res) => {
    const service = getWhatsAppService();
    if (service && service.isReady) {
        const contacts = await service.getContacts();
        res.status(200).json(contacts);
    } else {
        res.status(503).json({ error: 'WhatsApp não está pronto' });
    }
});

router.get('/chats', async (req, res) => {
    const service = getWhatsAppService();
    if (service && service.isReady) {
        const chats = await service.getChats();
        res.status(200).json(chats);
    } else {
        res.status(503).json({ error: 'WhatsApp não está pronto' });
    }
});


export default router;
