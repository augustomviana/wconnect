-- Tabela para armazenar as diferentes campanhas
-- Cada campanha terá um nome único.
CREATE TABLE IF NOT EXISTS campanhas (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela principal para armazenar os leads recebidos
-- Cada lead está associado a uma campanha e tem um status no Kanban.
CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20),
    campanha_id BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'Novo', -- Coluna do Kanban: Novo, Em Contato, etc.
    campos_personalizados JSONB, -- Usamos JSONB que é mais eficiente para consultas no PostgreSQL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campanha_id) REFERENCES campanhas(id) ON DELETE CASCADE
);

-- Tabela para guardar o histórico de mensagens enviadas a cada lead
-- Isso é crucial para auditoria e para fornecer contexto à LLM no futuro.
CREATE TABLE IF NOT EXISTS mensagens (
    id BIGSERIAL PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    mensagem TEXT NOT NULL,
    enviado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Opcional: Trigger para atualizar automaticamente o campo 'updated_at' na tabela de leads
-- Isso garante que a data de modificação esteja sempre correta quando um lead for alterado.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- A linha abaixo foi transformada em um comentário padrão de SQL para ser compatível com todas as ferramentas.
-- Tabelas campanhas, leads e mensagens criadas com sucesso (se não existiam).

