import { DatabaseService } from "./database"
import type { WhatsAppService } from "./whatsapp"

interface ChatbotConfig {
  id: number
  name: string
  welcome_message: string
  fallback_message: string
  is_active: boolean
}

interface AutoResponse {
  id: number
  trigger_type: string
  trigger_value: string
  response_text: string
  response_type: string
  media_url?: string
  priority: number
}

interface ConversationSession {
  id: number
  contact_id: string
  chatbot_id: number
  flow_id?: number
  current_step_id?: number
  session_data: any
  status: string
}

export class ChatbotService {
  private dbService: DatabaseService

  constructor() {
    this.dbService = new DatabaseService()
  }

  // Processar mensagem recebida
  async processMessage(contactId: string, message: string, whatsappService: WhatsAppService): Promise<void> {
    try {
      console.log(`🤖 [Chatbot] Processando mensagem de ${contactId}: "${message}"`)

      // Buscar chatbot ativo
      const chatbot = await this.getActiveChatbot()
      if (!chatbot) {
        console.log("🤖 [Chatbot] Nenhum chatbot ativo encontrado")
        return
      }

      // Buscar ou criar sessão de conversa
      let session = await this.getActiveSession(contactId, chatbot.id)

      // Se não há sessão ativa, verificar se é uma saudação ou criar nova sessão
      if (!session) {
        const isGreeting = this.isGreetingMessage(message)
        if (isGreeting) {
          // Enviar mensagem de boas-vindas
          await this.sendWelcomeMessage(contactId, chatbot, whatsappService)

          // Criar nova sessão
          session = await this.createSession(contactId, chatbot.id)
        } else {
          // Verificar respostas automáticas
          const autoResponse = await this.findAutoResponse(chatbot.id, message)
          if (autoResponse) {
            await this.sendAutoResponse(contactId, autoResponse, whatsappService)
            await this.logInteraction(contactId, chatbot.id, "auto_response", message, autoResponse.response_text)
          }
          return
        }
      }

      // Processar mensagem na sessão ativa
      await this.processSessionMessage(session, message, whatsappService)
    } catch (error) {
      console.error("🤖 [Chatbot] Erro ao processar mensagem:", error)
    }
  }

  // Buscar chatbot ativo
  private async getActiveChatbot(): Promise<ChatbotConfig | null> {
    try {
      const result = await this.dbService.query("SELECT * FROM chatbots WHERE is_active = true ORDER BY id LIMIT 1", [])
      return result.rows[0] || null
    } catch (error) {
      console.error("Erro ao buscar chatbot:", error)
      return null
    }
  }

  // Buscar sessão ativa
  private async getActiveSession(contactId: string, chatbotId: number): Promise<ConversationSession | null> {
    try {
      const result = await this.dbService.query(
        "SELECT * FROM conversation_sessions WHERE contact_id = $1 AND chatbot_id = $2 AND status = 'active' ORDER BY started_at DESC LIMIT 1",
        [contactId, chatbotId],
      )
      return result.rows[0] || null
    } catch (error) {
      console.error("Erro ao buscar sessão:", error)
      return null
    }
  }

  // Criar nova sessão
  private async createSession(contactId: string, chatbotId: number): Promise<ConversationSession> {
    try {
      const result = await this.dbService.query(
        "INSERT INTO conversation_sessions (contact_id, chatbot_id, session_data) VALUES ($1, $2, $3) RETURNING *",
        [contactId, chatbotId, JSON.stringify({})],
      )
      return result.rows[0]
    } catch (error) {
      console.error("Erro ao criar sessão:", error)
      throw error
    }
  }

  // Verificar se é mensagem de saudação
  private isGreetingMessage(message: string): boolean {
    const greetings = ["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "hello", "hi"]
    const normalizedMessage = message.toLowerCase().trim()

    return greetings.some((greeting) => normalizedMessage.includes(greeting) || normalizedMessage === greeting)
  }

  // Enviar mensagem de boas-vindas
  private async sendWelcomeMessage(
    contactId: string,
    chatbot: ChatbotConfig,
    whatsappService: WhatsAppService,
  ): Promise<void> {
    try {
      if (chatbot.welcome_message) {
        await whatsappService.sendMessage(contactId, chatbot.welcome_message)
        console.log(`🤖 [Chatbot] Mensagem de boas-vindas enviada para ${contactId}`)
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem de boas-vindas:", error)
    }
  }

  // Buscar resposta automática
  private async findAutoResponse(chatbotId: number, message: string): Promise<AutoResponse | null> {
    try {
      const normalizedMessage = message.toLowerCase().trim()

      // Buscar por palavra-chave exata
      let result = await this.dbService.query(
        `SELECT * FROM auto_responses 
         WHERE chatbot_id = $1 AND trigger_type = 'keyword' 
         AND LOWER(trigger_value) = $2 AND is_active = true 
         ORDER BY priority DESC LIMIT 1`,
        [chatbotId, normalizedMessage],
      )

      if (result.rows.length > 0) {
        return result.rows[0]
      }

      // Buscar por palavra-chave que contenha a mensagem
      result = await this.dbService.query(
        `SELECT * FROM auto_responses 
         WHERE chatbot_id = $1 AND trigger_type = 'keyword' 
         AND $2 ILIKE '%' || trigger_value || '%' AND is_active = true 
         ORDER BY priority DESC LIMIT 1`,
        [chatbotId, normalizedMessage],
      )

      if (result.rows.length > 0) {
        return result.rows[0]
      }

      // Buscar saudações
      result = await this.dbService.query(
        `SELECT * FROM auto_responses 
         WHERE chatbot_id = $1 AND trigger_type = 'greeting' AND is_active = true 
         ORDER BY priority DESC LIMIT 1`,
        [chatbotId],
      )

      if (result.rows.length > 0) {
        const greetingTriggers = result.rows[0].trigger_value.split(",")
        const hasGreeting = greetingTriggers.some((trigger: string) =>
          normalizedMessage.includes(trigger.trim().toLowerCase()),
        )

        if (hasGreeting) {
          return result.rows[0]
        }
      }

      return null
    } catch (error) {
      console.error("Erro ao buscar resposta automática:", error)
      return null
    }
  }

  // Enviar resposta automática
  private async sendAutoResponse(
    contactId: string,
    autoResponse: AutoResponse,
    whatsappService: WhatsAppService,
  ): Promise<void> {
    try {
      await whatsappService.sendMessage(contactId, autoResponse.response_text)
      console.log(`🤖 [Chatbot] Resposta automática enviada para ${contactId}`)
    } catch (error) {
      console.error("Erro ao enviar resposta automática:", error)
    }
  }

  // Processar mensagem na sessão
  private async processSessionMessage(
    session: ConversationSession,
    message: string,
    whatsappService: WhatsAppService,
  ): Promise<void> {
    try {
      // Se há um fluxo ativo, processar próximo passo
      if (session.flow_id && session.current_step_id) {
        await this.processFlowStep(session, message, whatsappService)
      } else {
        // Verificar se mensagem ativa algum fluxo
        const flow = await this.findMatchingFlow(session.chatbot_id, message)
        if (flow) {
          await this.startFlow(session, flow.id, whatsappService)
        } else {
          // Buscar resposta automática
          const autoResponse = await this.findAutoResponse(session.chatbot_id, message)
          if (autoResponse) {
            await this.sendAutoResponse(session.contact_id, autoResponse, whatsappService)
          } else {
            // Enviar mensagem de fallback
            await this.sendFallbackMessage(session, whatsappService)
          }
        }
      }

      // Atualizar sessão
      await this.updateSession(session.id, { updated_at: new Date() })
    } catch (error) {
      console.error("Erro ao processar mensagem da sessão:", error)
    }
  }

  // Buscar fluxo correspondente
  private async findMatchingFlow(chatbotId: number, message: string): Promise<any> {
    try {
      const result = await this.dbService.query(
        `SELECT * FROM automation_flows 
         WHERE chatbot_id = $1 AND is_active = true 
         AND $2 = ANY(trigger_keywords) 
         ORDER BY priority DESC LIMIT 1`,
        [chatbotId, message.toLowerCase().trim()],
      )
      return result.rows[0] || null
    } catch (error) {
      console.error("Erro ao buscar fluxo:", error)
      return null
    }
  }

  // Iniciar fluxo
  private async startFlow(
    session: ConversationSession,
    flowId: number,
    whatsappService: WhatsAppService,
  ): Promise<void> {
    try {
      // Buscar primeiro passo do fluxo
      const firstStep = await this.dbService.query(
        "SELECT * FROM flow_steps WHERE flow_id = $1 ORDER BY step_order LIMIT 1",
        [flowId],
      )

      if (firstStep.rows.length > 0) {
        const step = firstStep.rows[0]

        // Atualizar sessão com fluxo ativo
        await this.updateSession(session.id, {
          flow_id: flowId,
          current_step_id: step.id,
        })

        // Executar primeiro passo
        await this.executeFlowStep(session.contact_id, step, whatsappService)
      }
    } catch (error) {
      console.error("Erro ao iniciar fluxo:", error)
    }
  }

  // Processar passo do fluxo
  private async processFlowStep(
    session: ConversationSession,
    message: string,
    whatsappService: WhatsAppService,
  ): Promise<void> {
    try {
      // Buscar passo atual
      const currentStep = await this.dbService.query("SELECT * FROM flow_steps WHERE id = $1", [
        session.current_step_id,
      ])

      if (currentStep.rows.length === 0) return

      const step = currentStep.rows[0]

      // Processar resposta baseada no tipo do passo
      if (step.step_type === "question") {
        // Salvar resposta nos dados da sessão
        const sessionData = { ...session.session_data }
        sessionData[`step_${step.id}_response`] = message

        await this.updateSession(session.id, { session_data: sessionData })

        // Ir para próximo passo
        if (step.next_step_id) {
          const nextStep = await this.dbService.query("SELECT * FROM flow_steps WHERE id = $1", [step.next_step_id])

          if (nextStep.rows.length > 0) {
            await this.updateSession(session.id, { current_step_id: step.next_step_id })
            await this.executeFlowStep(session.contact_id, nextStep.rows[0], whatsappService)
          } else {
            // Finalizar fluxo
            await this.completeSession(session.id)
          }
        } else {
          // Finalizar fluxo
          await this.completeSession(session.id)
        }
      }
    } catch (error) {
      console.error("Erro ao processar passo do fluxo:", error)
    }
  }

  // Executar passo do fluxo
  private async executeFlowStep(contactId: string, step: any, whatsappService: WhatsAppService): Promise<void> {
    try {
      switch (step.step_type) {
        case "message":
          await whatsappService.sendMessage(contactId, step.content)
          break

        case "question":
          let questionText = step.content

          // Adicionar opções se existirem
          if (step.options && step.options.length > 0) {
            questionText += "\n\nOpções:"
            step.options.forEach((option: any, index: number) => {
              questionText += `\n${index + 1}. ${option.text}`
            })
          }

          await whatsappService.sendMessage(contactId, questionText)
          break

        case "action":
          // Executar ações específicas (transferir, agendar, etc.)
          await this.executeAction(contactId, step.actions, whatsappService)
          break
      }
    } catch (error) {
      console.error("Erro ao executar passo do fluxo:", error)
    }
  }

  // Executar ação
  private async executeAction(contactId: string, actions: any, whatsappService: WhatsAppService): Promise<void> {
    try {
      if (actions.transfer_to_human) {
        await whatsappService.sendMessage(
          contactId,
          "Transferindo você para um atendente humano. Aguarde um momento...",
        )
      }

      if (actions.schedule_callback) {
        await whatsappService.sendMessage(
          contactId,
          "Agendamento realizado! Entraremos em contato no horário solicitado.",
        )
      }
    } catch (error) {
      console.error("Erro ao executar ação:", error)
    }
  }

  // Enviar mensagem de fallback
  private async sendFallbackMessage(session: ConversationSession, whatsappService: WhatsAppService): Promise<void> {
    try {
      const chatbot = await this.dbService.query("SELECT fallback_message FROM chatbots WHERE id = $1", [
        session.chatbot_id,
      ])

      if (chatbot.rows.length > 0) {
        await whatsappService.sendMessage(session.contact_id, chatbot.rows[0].fallback_message)
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem de fallback:", error)
    }
  }

  // Atualizar sessão
  private async updateSession(sessionId: number, updates: any): Promise<void> {
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(", ")
      const values = [sessionId, ...Object.values(updates)]

      await this.dbService.query(
        `UPDATE conversation_sessions SET ${setClause}, updated_at = NOW() WHERE id = $1`,
        values,
      )
    } catch (error) {
      console.error("Erro ao atualizar sessão:", error)
    }
  }

  // Completar sessão
  private async completeSession(sessionId: number): Promise<void> {
    try {
      await this.dbService.query(
        "UPDATE conversation_sessions SET status = 'completed', completed_at = NOW() WHERE id = $1",
        [sessionId],
      )
    } catch (error) {
      console.error("Erro ao completar sessão:", error)
    }
  }

  // Log de interação
  private async logInteraction(
    contactId: string,
    chatbotId: number,
    actionTaken: string,
    inputMessage: string,
    responseMessage: string,
  ): Promise<void> {
    try {
      await this.dbService.query(
        `INSERT INTO automation_logs (contact_id, chatbot_id, action_taken, input_message, response_message) 
         VALUES ($1, $2, $3, $4, $5)`,
        [contactId, chatbotId, actionTaken, inputMessage, responseMessage],
      )
    } catch (error) {
      console.error("Erro ao salvar log:", error)
    }
  }

  // Métodos para gerenciamento via API

  // Buscar todos os chatbots
  async getChatbots(): Promise<any[]> {
    try {
      const result = await this.dbService.query("SELECT * FROM chatbots ORDER BY created_at DESC", [])
      return result.rows
    } catch (error) {
      console.error("Erro ao buscar chatbots:", error)
      return []
    }
  }

  // Buscar respostas automáticas
  async getAutoResponses(chatbotId: number): Promise<any[]> {
    try {
      const result = await this.dbService.query(
        "SELECT * FROM auto_responses WHERE chatbot_id = $1 ORDER BY priority DESC, created_at DESC",
        [chatbotId],
      )
      return result.rows
    } catch (error) {
      console.error("Erro ao buscar respostas automáticas:", error)
      return []
    }
  }

  // Criar resposta automática
  async createAutoResponse(data: any): Promise<any> {
    try {
      const result = await this.dbService.query(
        `INSERT INTO auto_responses (chatbot_id, trigger_type, trigger_value, response_text, response_type, priority) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          data.chatbot_id,
          data.trigger_type,
          data.trigger_value,
          data.response_text,
          data.response_type || "text",
          data.priority || 1,
        ],
      )
      return result.rows[0]
    } catch (error) {
      console.error("Erro ao criar resposta automática:", error)
      throw error
    }
  }

  // Buscar estatísticas
  async getStats(): Promise<any> {
    try {
      const stats = await Promise.all([
        this.dbService.query("SELECT COUNT(*) as total FROM chatbots WHERE is_active = true"),
        this.dbService.query("SELECT COUNT(*) as total FROM auto_responses WHERE is_active = true"),
        this.dbService.query("SELECT COUNT(*) as total FROM conversation_sessions WHERE status = 'active'"),
        this.dbService.query("SELECT COUNT(*) as total FROM automation_logs WHERE DATE(created_at) = CURRENT_DATE"),
      ])

      return {
        active_chatbots: Number.parseInt(stats[0].rows[0].total),
        active_responses: Number.parseInt(stats[1].rows[0].total),
        active_sessions: Number.parseInt(stats[2].rows[0].total),
        interactions_today: Number.parseInt(stats[3].rows[0].total),
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
      return {
        active_chatbots: 0,
        active_responses: 0,
        active_sessions: 0,
        interactions_today: 0,
      }
    }
  }
}
