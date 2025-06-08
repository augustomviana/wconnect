-- Tabelas para sistema de automação e chatbot

-- Tabela de chatbots
CREATE TABLE IF NOT EXISTS chatbots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    welcome_message TEXT,
    fallback_message TEXT DEFAULT 'Desculpe, não entendi. Digite "menu" para ver as opções.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de fluxos de automação
CREATE TABLE IF NOT EXISTS automation_flows (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_keywords TEXT[], -- Array de palavras-chave que ativam o fluxo
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de etapas do fluxo
CREATE TABLE IF NOT EXISTS flow_steps (
    id SERIAL PRIMARY KEY,
    flow_id INTEGER REFERENCES automation_flows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- 'message', 'question', 'condition', 'action'
    content TEXT,
    options JSONB, -- Para múltipla escolha
    conditions JSONB, -- Para condições
    actions JSONB, -- Para ações (transferir, agendar, etc.)
    next_step_id INTEGER REFERENCES flow_steps(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sessões de conversa
CREATE TABLE IF NOT EXISTS conversation_sessions (
    id SERIAL PRIMARY KEY,
    contact_id VARCHAR(255) NOT NULL,
    chatbot_id INTEGER REFERENCES chatbots(id),
    flow_id INTEGER REFERENCES automation_flows(id),
    current_step_id INTEGER REFERENCES flow_steps(id),
    session_data JSONB DEFAULT '{}', -- Dados coletados durante a conversa
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'abandoned'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Tabela de respostas automáticas
CREATE TABLE IF NOT EXISTS auto_responses (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL, -- 'keyword', 'time', 'greeting', 'farewell'
    trigger_value TEXT,
    response_text TEXT NOT NULL,
    response_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'document'
    media_url TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de automação
CREATE TABLE IF NOT EXISTS automation_logs (
    id SERIAL PRIMARY KEY,
    contact_id VARCHAR(255) NOT NULL,
    chatbot_id INTEGER REFERENCES chatbots(id),
    flow_id INTEGER REFERENCES automation_flows(id),
    step_id INTEGER REFERENCES flow_steps(id),
    trigger_type VARCHAR(100),
    action_taken VARCHAR(255),
    input_message TEXT,
    response_message TEXT,
    session_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_contact ON conversation_sessions(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_status ON conversation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_contact ON automation_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON automation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auto_responses_trigger ON auto_responses(trigger_type, trigger_value);

-- Inserir chatbot padrão
INSERT INTO chatbots (name, description, welcome_message) VALUES 
('Assistente Principal', 'Chatbot principal para atendimento automático', 
'Olá! 👋 Bem-vindo ao nosso atendimento automático. Como posso ajudá-lo hoje?

Digite uma das opções:
📋 *menu* - Ver todas as opções
📞 *contato* - Falar com atendente
⏰ *horario* - Horário de funcionamento
📍 *endereco* - Nossa localização')
ON CONFLICT DO NOTHING;

-- Inserir respostas automáticas padrão
INSERT INTO auto_responses (chatbot_id, trigger_type, trigger_value, response_text) VALUES 
(1, 'keyword', 'menu', '📋 *MENU PRINCIPAL*

Escolha uma das opções abaixo:

1️⃣ *produtos* - Nossos produtos e serviços
2️⃣ *precos* - Informações sobre preços
3️⃣ *suporte* - Suporte técnico
4️⃣ *vendas* - Falar com vendas
5️⃣ *contato* - Falar com atendente
6️⃣ *horario* - Horário de funcionamento

Digite o número ou palavra-chave da opção desejada.'),

(1, 'keyword', 'horario', '⏰ *HORÁRIO DE FUNCIONAMENTO*

📅 Segunda a Sexta: 8h às 18h
📅 Sábado: 8h às 12h
📅 Domingo: Fechado

🕐 Fora do horário comercial, deixe sua mensagem que retornaremos assim que possível!'),

(1, 'keyword', 'contato', '📞 *FALAR COM ATENDENTE*

Aguarde um momento, vou transferir você para um de nossos atendentes.

⏱️ Tempo médio de espera: 2-5 minutos

Se preferir, você pode:
📧 Email: contato@empresa.com
📱 WhatsApp: (11) 99999-9999'),

(1, 'greeting', 'oi,olá,ola,bom dia,boa tarde,boa noite', 'Olá! 👋 Seja bem-vindo!

Como posso ajudá-lo hoje? Digite *menu* para ver todas as opções disponíveis.'),

(1, 'keyword', 'obrigado,obrigada,valeu,thanks', '😊 Por nada! Fico feliz em ajudar!

Se precisar de mais alguma coisa, é só chamar. Digite *menu* para ver outras opções.')
ON CONFLICT DO NOTHING;
