// backend/src/routes/campanha.ts

import express from 'express';
import { DatabaseService } from '../services/database';
import { getWhatsAppService } from '../services/whatsapp';
import { LlmService } from '../services/llm';

const router = express.Router();
const dbService = new DatabaseService();
const llmService = new LlmService();

// Endpoint para receber novos leads
router.post('/novo-lead', async (req, res) => {
    const { nome, whatsapp, campanha, campos_personalizados } = req.body;

    // --- INÍCIO DA DEPURAÇÃO (Passo 1 Sugerido por Si) ---
    console.log("--- INICIANDO DEPURAÇÃO DO NOVO LEAD ---");
    console.log("📩 DADOS RECEBIDOS NO BODY:", req.body);
    console.log(`📲 NÚMERO DE WHATSAPP EXTRAÍDO: ${whatsapp}`);
    // --- FIM DA DEPURAÇÃO ---

    if (!nome || !whatsapp || !campanha) {
        return res.status(400).json({ error: 'Os campos nome, whatsapp e campanha são obrigatórios.' });
    }

    try {
        let campanhaId: string;
        const campanhaExistente = await dbService.query('SELECT id FROM campanhas WHERE nome = $1', [campanha]);

        if (campanhaExistente.rows.length > 0) {
            campanhaId = campanhaExistente.rows[0].id;
        } else {
            const novaCampanha = await dbService.query('INSERT INTO campanhas (nome) VALUES ($1) RETURNING id', [campanha]);
            campanhaId = novaCampanha.rows[0].id;
        }

        const novoLeadResult = await dbService.query(
            'INSERT INTO leads (nome, whatsapp, campanha_id, campos_personalizados, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, whatsapp, campanhaId, campos_personalizados ? JSON.stringify(campos_personalizados) : null, 'Novo']
        );
        const novoLead = novoLeadResult.rows[0];

        const whatsappService = getWhatsAppService();
        if (whatsappService && whatsappService.isReady) {
            const mensagemPersonalizada = await llmService.gerarMensagemBoasVindas({
                nome,
                campanha,
                campos_personalizados
            });
            
            // AQUI é o ponto crucial. Estamos a usar a variável 'whatsapp' que logámos acima.
            await whatsappService.sendMessage(whatsapp, mensagemPersonalizada);
            
            await dbService.query(
                'INSERT INTO mensagens (lead_id, mensagem, remetente) VALUES ($1, $2, $3)',
                [novoLead.id, mensagemPersonalizada, 'bot']
            );
        }

        console.log(`✅ Lead "${nome}" criado com sucesso para a campanha "${campanha}".`);
        res.status(201).json({ message: 'Lead criado com sucesso', lead: novoLead });

    } catch (error) {
        console.error('❌ Erro ao processar novo lead:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar o lead.' });
    }
});

// Outras rotas como /leads e /leads/:id/status
// ...

export default router;
