// Versão de teste completa do ChatbotService para satisfazer o compilador

console.log("Chatbot service carregado em modo de compatibilidade de teste.");

export class ChatbotService {
  /**
   * Simula o processamento de uma mensagem.
   */
  public async processMessage(contactId: string, message: string, whatsappService: any): Promise<void> {
    console.log(`[MODO TESTE] Chatbot processaria mensagem de ${contactId}: "${message}"`);
    // A lógica real do chatbot estaria aqui, mas está desativada.
  }

  /**
   * Simula a busca de chatbots para satisfazer a rota.
   */
  public async getChatbots(): Promise<any[]> {
    console.log("[MODO TESTE] Rota chamada: getChatbots");
    return []; // Retorna um array vazio
  }

  /**
   * Simula a busca de respostas automáticas.
   */
  public async getAutoResponses(chatbotId: number): Promise<any[]> {
    console.log(`[MODO TESTE] Rota chamada: getAutoResponses para o chatbot ID: ${chatbotId}`);
    return []; // Retorna um array vazio
  }

  /**
   * Simula a criação de uma resposta automática.
   */
  public async createAutoResponse(responseData: any): Promise<any> {
    console.log("[MODO TESTE] Rota chamada: createAutoResponse com dados:", responseData);
    return { id: Math.floor(Math.random() * 1000), ...responseData }; // Retorna o objeto criado com um ID falso
  }

  /**
   * Simula a busca de estatísticas.
   */
  public async getStats(): Promise<any> {
    console.log("[MODO TESTE] Rota chamada: getStats");
    return { messagesProcessed: 0, responsesSent: 0 }; // Retorna um objeto de estatísticas falso
  }
}
