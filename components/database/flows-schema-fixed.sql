-- Remover tabelas conflitantes se existirem
DROP TABLE IF EXISTS flow_executions CASCADE;
DROP TABLE IF EXISTS flow_steps CASCADE;
DROP TABLE IF EXISTS conversation_flows CASCADE;

-- Tabela para fluxos de conversa
CREATE TABLE conversation_flows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL, -- 'keyword', 'greeting', 'fallback', 'manual'
    trigger_value TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para etapas dos fluxos
CREATE TABLE flow_steps (
    id SERIAL PRIMARY KEY,
    flow_id INTEGER REFERENCES conversation_flows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- 'message', 'question', 'condition', 'action', 'delay'
    content TEXT,
    options JSONB, -- Para opções de múltipla escolha
    conditions JSONB, -- Para condições lógicas
    actions JSONB, -- Para ações (transferir, agendar, etc)
    next_step_id INTEGER REFERENCES flow_steps(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para execuções de fluxos
CREATE TABLE flow_executions (
    id SERIAL PRIMARY KEY,
    flow_id INTEGER REFERENCES conversation_flows(id),
    contact_phone VARCHAR(50) NOT NULL,
    current_step_id INTEGER REFERENCES flow_steps(id),
    variables JSONB, -- Variáveis coletadas durante o fluxo
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_flows_trigger ON conversation_flows(trigger_type, trigger_value);
CREATE INDEX idx_flows_active ON conversation_flows(is_active);
CREATE INDEX idx_steps_flow ON flow_steps(flow_id, step_order);
CREATE INDEX idx_executions_contact ON flow_executions(contact_phone, status);

-- Inserir fluxos de exemplo
INSERT INTO conversation_flows (name, description, trigger_type, trigger_value, is_active, priority) VALUES
('Atendimento Inicial', 'Fluxo de boas-vindas e direcionamento', 'greeting', 'oi,olá,ola,bom dia,boa tarde,boa noite', true, 10),
('Suporte Técnico', 'Fluxo para problemas técnicos', 'keyword', 'problema,erro,bug,não funciona', true, 8),
('Vendas', 'Fluxo para interessados em compras', 'keyword', 'preço,comprar,produto,valor', true, 9),
('Agendamento', 'Fluxo para agendar atendimento', 'keyword', 'agendar,marcar,horário', true, 7);

-- Inserir etapas de exemplo para o fluxo de Atendimento Inicial (ID = 1)
INSERT INTO flow_steps (flow_id, step_order, step_type, content, options) VALUES
(1, 1, 'message', 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudar você hoje?', NULL),
(1, 2, 'question', 'Escolha uma das opções abaixo:', '{"options": [{"id": "1", "text": "Informações sobre produtos"}, {"id": "2", "text": "Suporte técnico"}, {"id": "3", "text": "Falar com atendente"}]}'),
(1, 3, 'condition', 'Verificar resposta do usuário', '{"conditions": [{"if": "user_input == 1", "then": "next_step_id = 4"}, {"if": "user_input == 2", "then": "next_step_id = 5"}, {"if": "user_input == 3", "then": "next_step_id = 6"}]}'),
(1, 4, 'message', 'Ótimo! Vou te mostrar nossos produtos. Acesse nosso catálogo: www.exemplo.com/produtos', NULL),
(1, 5, 'message', 'Entendi que você precisa de suporte técnico. Vou transferir você para nossa equipe especializada.', NULL),
(1, 6, 'action', 'Transferir para atendente humano', '{"action": "transfer_to_human", "department": "atendimento"}');

-- Inserir etapas para o fluxo de Vendas (ID = 3)
INSERT INTO flow_steps (flow_id, step_order, step_type, content, options) VALUES
(3, 1, 'message', 'Ótimo! Vejo que você tem interesse em nossos produtos.', NULL),
(3, 2, 'question', 'Qual categoria de produto te interessa?', '{"options": [{"id": "1", "text": "Eletrônicos"}, {"id": "2", "text": "Roupas"}, {"id": "3", "text": "Casa e Jardim"}]}'),
(3, 3, 'message', 'Perfeito! Vou te enviar nosso catálogo com os melhores preços. Um consultor entrará em contato em breve.', NULL);