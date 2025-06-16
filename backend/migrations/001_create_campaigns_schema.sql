-- Migration 001: Cria a estrutura inicial para o módulo de campanhas e chatbot.

CREATE TABLE IF NOT EXISTS campanhas (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20),
    campanha_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'Novo',
    campos_personalizados JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campanha_id) REFERENCES campanhas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mensagens (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    mensagem TEXT NOT NULL,
    remetente VARCHAR(50) NOT NULL DEFAULT 'bot', -- 'bot' ou 'cliente'
    enviado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Trigger para atualizar o campo 'updated_at' automaticamente nos leads
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Concede as permissões necessárias para o utilizador da aplicação
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO whatsapp_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON campanhas, leads, mensagens TO whatsapp_user;

-- Confirmação de execução para o terminal psql
\echo 'Migration 001 executada com sucesso.'