#!/bin/bash

echo "🗄️ Configurando banco de dados para GMaps Extractor..."

# Verificar se PostgreSQL está rodando
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL não está rodando"
    exit 1
fi

echo "1️⃣ Conectando ao banco de dados..."

# Executar script SQL
psql -h localhost -p 5432 -U whatsapp_user -d whatsapp_web << 'EOF'
-- Criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS gmaps_campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    search_queries TEXT[] NOT NULL,
    options JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    user_id INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS gmaps_results (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES gmaps_campaigns(id) ON DELETE CASCADE,
    business_name VARCHAR(500),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    rating DECIMAL(3,2),
    reviews_count INTEGER,
    image_url TEXT,
    google_maps_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Verificar se as tabelas foram criadas
\dt gmaps_*

-- Mostrar estrutura das tabelas
\d gmaps_campaigns
\d gmaps_results

EOF

echo "✅ Banco de dados configurado!"
