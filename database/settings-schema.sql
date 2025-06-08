-- Tabela para configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    description TEXT,
    type VARCHAR(20) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(category, key);

-- Inserir configurações padrão
INSERT INTO system_settings (category, key, value, description, type) VALUES
-- Configurações Gerais
('general', 'company_name', 'Minha Empresa', 'Nome da empresa', 'string'),
('general', 'company_email', 'contato@empresa.com', 'Email da empresa', 'email'),
('general', 'company_phone', '(11) 1234-5678', 'Telefone da empresa', 'string'),
('general', 'timezone', 'America/Sao_Paulo', 'Fuso horário', 'string'),
('general', 'language', 'pt-BR', 'Idioma do sistema', 'string'),

-- Notificações
('notifications', 'email_enabled', 'true', 'Habilitar notificações por email', 'boolean'),
('notifications', 'push_enabled', 'true', 'Habilitar notificações push', 'boolean'),
('notifications', 'sms_enabled', 'false', 'Habilitar notificações SMS', 'boolean'),
('notifications', 'admin_email', 'admin@empresa.com', 'Email do administrador', 'email'),

-- WhatsApp
('whatsapp', 'auto_welcome', 'true', 'Mensagem de boas-vindas automática', 'boolean'),
('whatsapp', 'welcome_message', 'Olá! Bem-vindo ao nosso atendimento.', 'Mensagem de boas-vindas', 'text'),
('whatsapp', 'away_message', 'No momento estamos ausentes. Retornaremos em breve.', 'Mensagem de ausência', 'text'),
('whatsapp', 'message_limit', '100', 'Limite de mensagens por hora', 'number'),
('whatsapp', 'auto_backup', 'true', 'Backup automático de conversas', 'boolean'),

-- Chatbot
('chatbot', 'response_delay', '2', 'Delay entre respostas (segundos)', 'number'),
('chatbot', 'max_retries', '3', 'Máximo de tentativas', 'number'),
('chatbot', 'fallback_message', 'Desculpe, não entendi. Digite "menu" para ver as opções.', 'Mensagem padrão', 'text'),
('chatbot', 'debug_mode', 'false', 'Modo debug ativo', 'boolean'),

-- Segurança
('security', 'session_timeout', '24', 'Timeout da sessão (horas)', 'number'),
('security', 'max_login_attempts', '5', 'Máximo de tentativas de login', 'number'),
('security', 'backup_frequency', 'daily', 'Frequência de backup', 'string'),
('security', 'data_retention', '365', 'Retenção de dados (dias)', 'number'),

-- Interface
('interface', 'theme', 'light', 'Tema da interface', 'string'),
('interface', 'dashboard_refresh', '30', 'Atualização do dashboard (segundos)', 'number'),
('interface', 'items_per_page', '20', 'Itens por página', 'number'),
('interface', 'show_tutorials', 'true', 'Mostrar tutoriais', 'boolean')

ON CONFLICT (category, key) DO NOTHING;