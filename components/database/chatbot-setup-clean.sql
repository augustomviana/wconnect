-- Tabelas para sistema de automação e chatbot (versão limpa)

-- Conceder permissões ao usuário whatsapp_user
GRANT ALL PRIVILEGES ON SCHEMA public TO whatsapp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO whatsapp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO whatsapp_user;

-- Tabela de chatbots
CREATE TABLE IF NOT EXISTS chatbots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    welcome_message TEXT,
    fallback_message TEXT DEFAULT 'Desculpe, nao entendi. Digite "menu" para ver as opcoes.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de fluxos de automação
CREATE TABLE IF NOT EXISTS automation_flows (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_keywords TEXT[],
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
    step_type VARCHAR(50) NOT NULL,
    content TEXT,
    options JSONB,
    conditions JSONB,
    actions JSONB,
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
    session_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Tabela de respostas automáticas
CREATE TABLE IF NOT EXISTS auto_responses (
    id SERIAL PRIMARY KEY,
    chatbot_id INTEGER REFERENCES chatbots(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_value TEXT,
    response_text TEXT NOT NULL,
    response_type VARCHAR(50) DEFAULT 'text',
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

-- Conceder permissões nas novas tabelas
GRANT ALL PRIVILEGES ON chatbots TO whatsapp_user;
GRANT ALL PRIVILEGES ON automation_flows TO whatsapp_user;
GRANT ALL PRIVILEGES ON flow_steps TO whatsapp_user;
GRANT ALL PRIVILEGES ON conversation_sessions TO whatsapp_user;
GRANT ALL PRIVILEGES ON auto_responses TO whatsapp_user;
GRANT ALL PRIVILEGES ON automation_logs TO whatsapp_user;

-- Conceder permissões nas sequences
GRANT ALL PRIVILEGES ON SEQUENCE chatbots_id_seq TO whatsapp_user;
GRANT ALL PRIVILEGES ON SEQUENCE automation_flows_id_seq TO whatsapp_user;
GRANT ALL PRIVILEGES ON SEQUENCE flow_steps_id_seq TO whatsapp_user;
GRANT ALL PRIVILEGES ON SEQUENCE conversation_sessions_id_seq TO whatsapp_user;
GRANT ALL PRIVILEGES ON SEQUENCE auto_responses_id_seq TO whatsapp_user;
GRANT ALL PRIVILEGES ON SEQUENCE automation_logs_id_seq TO whatsapp_user;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_contact ON conversation_sessions(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_status ON conversation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_contact ON automation_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON automation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auto_responses_trigger ON auto_responses(trigger_type, trigger_value);

-- Inserir chatbot padrão
INSERT INTO chatbots (name, description, welcome_message) VALUES 
('Assistente Principal', 'Chatbot principal para atendimento automatico', 
'Ola! Bem-vindo ao nosso atendimento automatico. Como posso ajuda-lo hoje?

Digite uma das opcoes:
- menu - Ver todas as opcoes
- contato - Falar com atendente
- horario - Horario de funcionamento
- endereco - Nossa localizacao')
ON CONFLICT DO NOTHING;

-- Inserir respostas automáticas padrão
INSERT INTO auto_responses (chatbot_id, trigger_type, trigger_value, response_text) VALUES 
(1, 'keyword', 'menu', 'MENU PRINCIPAL

Escolha uma das opcoes abaixo:

1 - produtos - Nossos produtos e servicos
2 - precos - Informacoes sobre precos
3 - suporte - Suporte tecnico
4 - vendas - Falar com vendas
5 - contato - Falar com atendente
6 - horario - Horario de funcionamento

Digite o numero ou palavra-chave da opcao desejada.'),

(1, 'keyword', 'horario', 'HORARIO DE FUNCIONAMENTO

Segunda a Sexta: 8h as 18h
Sabado: 8h as 12h
Domingo: Fechado

Fora do horario comercial, deixe sua mensagem que retornaremos assim que possivel!'),

(1, 'keyword', 'contato', 'FALAR COM ATENDENTE

Aguarde um momento, vou transferir voce para um de nossos atendentes.

Tempo medio de espera: 2-5 minutos

Se preferir, voce pode:
Email: contato@empresa.com
WhatsApp: (11) 99999-9999'),

(1, 'greeting', 'oi,ola,bom dia,boa tarde,boa noite', 'Ola! Seja bem-vindo!

Como posso ajuda-lo hoje? Digite "menu" para ver todas as opcoes disponiveis.'),

(1, 'keyword', 'obrigado,obrigada,valeu,thanks', 'Por nada! Fico feliz em ajudar!

Se precisar de mais alguma coisa, e so chamar. Digite "menu" para ver outras opcoes.')
ON CONFLICT DO NOTHING;
