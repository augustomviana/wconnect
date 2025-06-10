-- Tabela de integrações
CREATE TABLE IF NOT EXISTS integrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('webhook', 'api', 'database', 'email', 'chatbot', 'external')),
    status VARCHAR(20) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
    config JSONB DEFAULT '{}',
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON integrations(status);
CREATE INDEX IF NOT EXISTS idx_integrations_created_at ON integrations(created_at);

-- Inserir algumas integrações de exemplo
INSERT INTO integrations (name, description, type, status, config) VALUES
('Webhook de Vendas', 'Recebe notificações quando uma venda é realizada', 'webhook', 'active', '{"url": "https://api.exemplo.com/webhook", "method": "POST"}'),
('API do CRM', 'Sincroniza contatos com o sistema CRM', 'api', 'active', '{"url": "https://crm.exemplo.com/api", "apiKey": "***"}'),
('Notificações por Email', 'Envia emails para administradores', 'email', 'inactive', '{"smtp": "smtp.gmail.com", "port": 587}');
