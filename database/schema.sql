-- Criação do banco de dados e usuário
-- Execute como superuser do PostgreSQL

CREATE DATABASE whatsapp_web;
CREATE USER whatsapp_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE whatsapp_web TO whatsapp_user;

-- Conecte ao banco whatsapp_web e execute o resto

-- Tabela de usuários do sistema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de contatos do WhatsApp
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    whatsapp_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone_number VARCHAR(50),
    profile_pic_url TEXT,
    is_group BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de mensagens
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    whatsapp_id VARCHAR(255) UNIQUE NOT NULL,
    from_contact VARCHAR(255) NOT NULL,
    to_contact VARCHAR(255) NOT NULL,
    message_body TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    timestamp BIGINT NOT NULL,
    is_group_message BOOLEAN DEFAULT false,
    is_forwarded BOOLEAN DEFAULT false,
    media_url TEXT,
    media_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_contact) REFERENCES contacts(whatsapp_id),
    FOREIGN KEY (to_contact) REFERENCES contacts(whatsapp_id)
);

-- Tabela de chats/conversas
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    whatsapp_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    is_group BOOLEAN DEFAULT false,
    unread_count INTEGER DEFAULT 0,
    last_message_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (last_message_id) REFERENCES messages(id)
);

-- Tabela de configurações do sistema
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs do sistema
CREATE TABLE system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_from_contact ON messages(from_contact);
CREATE INDEX idx_messages_to_contact ON messages(to_contact);
CREATE INDEX idx_contacts_whatsapp_id ON contacts(whatsapp_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);

-- Inserir configurações padrão
INSERT INTO settings (key, value, description) VALUES
('auto_reply_enabled', 'false', 'Habilitar respostas automáticas'),
('max_message_length', '4096', 'Tamanho máximo de mensagem'),
('session_timeout', '3600', 'Timeout da sessão em segundos'),
('backup_enabled', 'true', 'Habilitar backup automático'),
('log_level', 'info', 'Nível de log do sistema');

-- Criar usuário admin padrão (senha: admin123)
INSERT INTO users (name, email, password_hash) VALUES
('Administrador', 'admin@whatsapp-web.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
