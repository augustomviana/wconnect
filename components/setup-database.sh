#!/bin/bash

echo "🗄️ Configurando Banco de Dados PostgreSQL"
echo "=========================================="

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "📦 Instalando PostgreSQL..."
    sudo apt update
    sudo apt install postgresql postgresql-contrib -y
fi

# Configurar banco
echo "🔧 Configurando banco de dados..."
sudo -u postgres createdb whatsapp_web 2>/dev/null || echo "✅ Banco já existe"
sudo -u postgres createuser whatsapp_user 2>/dev/null || echo "✅ Usuário já existe"
sudo -u postgres psql -c "ALTER USER whatsapp_user PASSWORD 'sua_senha';" 2>/dev/null

# Schema SQL
cat > database/schema.sql << 'EOF'
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_from_contact ON messages(from_contact);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_id ON contacts(whatsapp_id);
EOF

# Executar schema
sudo -u postgres psql -d whatsapp_web -f database/schema.sql

echo "✅ Banco de dados configurado!"
echo "📊 Banco: whatsapp_web"
echo "👤 Usuário: whatsapp_user"
echo "🔑 Senha: sua_senha"
