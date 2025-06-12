#!/bin/bash

# --- Variáveis com as configurações corretas do seu .env ---
DB_NAME="whatsapp_db"
DB_USER="whatsapp_user"
DB_PASS="romanos1"

echo "🗄️  Configurando Banco de Dados PostgreSQL"
echo "=========================================="

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "📦 Instalando PostgreSQL..."
    sudo apt update
    sudo apt install postgresql postgresql-contrib -y
fi

# Configurar banco com as variáveis corretas
echo "🔧 Configurando banco de dados..."
sudo -u postgres createdb ${DB_NAME} 2>/dev/null || echo "✅ Banco '${DB_NAME}' já existe."
sudo -u postgres createuser ${DB_USER} 2>/dev/null || echo "✅ Usuário '${DB_USER}' já existe."
sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

# Schema SQL Corrigido (com a tabela chatbots)
cat > database/schema.sql << 'SQL_EOF'
-- Criação das tabelas
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
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

CREATE TABLE IF NOT EXISTS messages (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela que estava faltando --
CREATE TABLE IF NOT EXISTS chatbots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_from_contact ON messages(from_contact);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_id ON contacts(whatsapp_id);
SQL_EOF

# Executar schema no banco correto
sudo -u postgres psql -d ${DB_NAME} -f database/schema.sql

echo "✅ Banco de dados configurado!"
echo "📊 Banco: ${DB_NAME}"
echo "👤 Usuário: ${DB_USER}"
