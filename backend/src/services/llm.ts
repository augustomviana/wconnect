// backend/src/services/llm.ts

import dotenv from 'dotenv';

dotenv.config();

export class LlmService {
    private apiKey: string;
    private apiUrl: string;

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';
        if (!this.apiKey) {
            console.error('❌ Chave da API do Gemini não encontrada no .env');
        }
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    }

    private async callGeminiAPI(prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Chave da API da LLM não configurada.');
        }

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
        };

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('❌ Erro na API da LLM:', errorBody);
            throw new Error('Falha ao comunicar com a LLM.');
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            const mensagemGerada = data.candidates[0].content.parts[0].text.trim();
            console.log(`🤖 Mensagem gerada pela LLM: "${mensagemGerada}"`);
            return mensagemGerada;
        } else {
             throw new Error('Resposta da LLM inválida.');
        }
    }

    async gerarMensagemBoasVindas(leadData: { nome: string; campanha: string; campos_personalizados?: any }): Promise<string> {
        const prompt = `
            Você é um assistente de vendas amigável para a empresa WConect.
            Sua tarefa é criar uma mensagem de boas-vindas curta e calorosa para um novo lead do WhatsApp.
            Use os dados abaixo para personalizar a mensagem. Termine de forma convidativa.

            - Nome: ${leadData.nome}
            - Campanha: ${leadData.campanha}
            - Info Adicional: ${JSON.stringify(leadData.campos_personalizados || {})}

            Gere apenas o texto da mensagem.
        `;
        
        try {
            return await this.callGeminiAPI(prompt);
        } catch (error) {
            console.error('❌ Erro ao gerar mensagem de boas-vindas:', error);
            return `Olá, ${leadData.nome}! Boas-vindas à campanha "${leadData.campanha}". Em breve entraremos em contato.`;
        }
    }

    // --- NOVA FUNÇÃO PARA CONVERSA ---
    async gerarRespostaConversacional(mensagemRecebida: string, historico: { remetente: string, mensagem: string }[] = []): Promise<string> {
        const historicoFormatado = historico
            .map(msg => `- ${msg.remetente === 'bot' ? 'Assistente' : 'Cliente'}: ${msg.mensagem}`)
            .join('\n');
            
        const prompt = `
            Você é um assistente de vendas inteligente e prestativo da WConect.
            Continue a conversa com o cliente de forma natural e útil.
            Seja conciso e profissional. Se não souber a resposta, diga que vai verificar com um especialista.

            **Histórico da Conversa:**
            ${historicoFormatado}

            **Última Mensagem do Cliente:**
            - Cliente: "${mensagemRecebida}"

            Sua Resposta (gere apenas o texto):
        `;

        try {
            return await this.callGeminiAPI(prompt);
        } catch (error) {
            console.error('❌ Erro ao gerar resposta conversacional:', error);
            return "Desculpe, estou com uma dificuldade técnica no momento. Um de nossos consultores irá responder em breve.";
        }
    }
}
