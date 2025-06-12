#!/bin/bash

echo "🔍 Verificando tabelas do GMapExtractor..."

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo "❌ Variáveis de ambiente do banco não configuradas"
    echo "Configure: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD"
    exit 1
fi

# Verificar se as tabelas existem
echo "📋 Verificando tabela gmap_campaigns..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d gmap_campaigns" || {
    echo "❌ Tabela gmap_campaigns não existe"
    echo "Criando tabela..."
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
    CREATE TABLE IF NOT EXISTS gmap_campaigns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        search_queries JSONB NOT NULL,
        options JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        total_results INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );"
}

echo "📋 Verificando tabela gmap_results..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d gmap_results" || {
    echo "❌ Tabela gmap_results não existe"
    echo "Criando tabela..."
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
    CREATE TABLE IF NOT EXISTS gmap_results (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES gmap_campaigns(id),
        search_query VARCHAR(255),
        name VARCHAR(255),
        address TEXT,
        category VARCHAR(255),
        rating DECIMAL(2,1),
        review_count INTEGER,
        phone VARCHAR(50),
        website VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
    );"
}

echo "✅ Verificação de tabelas concluída"
