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

        // --- INÍCIO DA DEPURAÇÃO DETALHADA ---
        console.log(`[DEBUG] Passo 1/5: A iniciar o processo de envio para ${whatsapp}`);
        const whatsappService = getWhatsAppService();
        if (whatsappService && whatsappService.isReady) {
            console.log('[DEBUG] Passo 2/5: Serviço do WhatsApp está pronto. A gerar mensagem com a LLM...');
            
            const mensagemPersonalizada = await llmService.gerarMensagemBoasVindas({
                nome,
                campanha,
                campos_personalizados
            });
            
            console.log(`[DEBUG] Passo 3/5: Mensagem gerada: "${mensagemPersonalizada}". A formatar número...`);
            const numeroFormatado = `${whatsapp.replace(/\D/g, '')}@c.us`;
            
            console.log(`[DEBUG] Passo 4/5: A chamar whatsappService.sendMessage para o número ${numeroFormatado}`);
            const resultadoEnvio = await whatsappService.sendMessage(numeroFormatado, mensagemPersonalizada);
            console.log('[DEBUG] Passo 5/5: A chamada a sendMessage foi concluída. Resultado:', resultadoEnvio.id); // Mostra o ID da mensagem se o envio for bem-sucedido
            
            await dbService.query(
                'INSERT INTO mensagens (lead_id, mensagem, remetente) VALUES ($1, $2, $3)',
                [novoLead.id, mensagemPersonalizada, 'bot']
            );

        } else {
            console.warn('[DEBUG] Serviço do WhatsApp não está pronto ou disponível. A saltar o envio da mensagem.');
        }
        // --- FIM DA DEPURAÇÃO DETALHADA ---

        console.log(`✅ Lead "${nome}" criado com sucesso para a campanha "${campanha}".`);
        res.status(201).json({ message: 'Lead criado com sucesso', lead: novoLead });

    } catch (error) {
        // Agora, se houver um erro no envio, ele será capturado aqui.
        console.error('❌ [ERRO DETALHADO] Erro ao processar novo lead:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao processar o lead.' });
    }
});


// Rotas existentes de /leads e /leads/:id/status
router.get('/leads', async (req, res) => {
    try {
        const resultado = await dbService.query(`SELECT l.*, c.nome as nome_campanha FROM leads l JOIN campanhas c ON l.campanha_id = c.id ORDER BY l.created_at DESC`);
        res.status(200).json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor ao obter os leads.' });
    }
});
router.put('/leads/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'O campo status é obrigatório.' });
    try {
        const resultado = await dbService.query('UPDATE leads SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        if (resultado.rows.length === 0) return res.status(404).json({ error: 'Lead não encontrado.' });
        res.status(200).json(resultado.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor ao atualizar o lead.' });
    }
});

export default router;

