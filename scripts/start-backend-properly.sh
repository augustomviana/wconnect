#!/bin/bash

echo "🚀 Iniciando backend corretamente..."

# Verificar se o backend já está rodando
if pgrep -f "node.*backend" > /dev/null; then
    echo "⚠️ Backend já está rodando. Parando primeiro..."
    pkill -f "node.*backend"
    sleep 2
fi

# Verificar se o arquivo de rota existe
if [ ! -f "backend/src/routes/gmaps-extractor.ts" ]; then
    echo "❌ Arquivo de rota não existe. Executando script de verificação..."
    ./scripts/check-backend-status.sh
fi

# Verificar se o arquivo de serviço existe
if [ ! -f "backend/src/services/gmaps-extractor.ts" ]; then
    echo "❌ Arquivo de serviço não existe. Executando script de correção..."
    ./scripts/fix-all-typescript-errors.sh
fi

# Verificar se as tabelas existem
echo "🗄️ Verificando tabelas do banco de dados..."
echo "⚠️ Você precisará digitar a senha do banco de dados"

# Criar arquivo SQL temporário
cat > temp_check_tables.sql << 'EOF'
\dt gmaps_campaigns
\dt gmaps_results
EOF

# Executar verificação
psql -U whatsapp_user -d whatsapp_db -f temp_check_tables.sql > /tmp/table_check.log 2>&1

# Verificar se as tabelas existem
if grep -q "0 rows" /tmp/table_check.log; then
    echo "❌ Tabelas não existem. Criando..."
    
    # Criar arquivo SQL temporário
    cat > temp_create_tables.sql << 'EOF'
CREATE TABLE IF NOT EXISTS gmaps_campaigns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    search_queries JSONB NOT NULL,
    options JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_results INTEGER DEFAULT 0,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_gmaps_campaigns_user_id ON gmaps_campaigns(user_id);

CREATE TABLE IF NOT EXISTS gmaps_results (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES gmaps_campaigns(id) ON DELETE CASCADE,
    search_query VARCHAR(255),
    name VARCHAR(255),
    address TEXT,
    category VARCHAR(255),
    rating NUMERIC,
    review_count INTEGER,
    phone VARCHAR(50),
    website VARCHAR(255),
    email VARCHAR(255),
    instagram_profile VARCHAR(255),
    facebook_profile VARCHAR(255),
    linkedin_profile VARCHAR(255),
    twitter_profile VARCHAR(255),
    images_folder VARCHAR(255),
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gmaps_results_campaign_id ON gmaps_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_gmaps_results_email ON gmaps_results(email);
CREATE INDEX IF NOT EXISTS idx_gmaps_results_phone ON gmaps_results(phone);
EOF

    # Executar criação
    psql -U whatsapp_user -d whatsapp_db -f temp_create_tables.sql
    
    # Limpar arquivos temporários
    rm temp_create_tables.sql
else
    echo "✅ Tabelas existem"
fi

# Limpar arquivos temporários
rm temp_check_tables.sql
rm -f /tmp/table_check.log

# Compilar TypeScript
echo "🔧 Compilando TypeScript..."
cd backend
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo "❌ Erro de compilação. Executando script de correção..."
    cd ..
    ./scripts/fix-all-typescript-errors.sh
    cd backend
fi

# Iniciar backend
echo "🚀 Iniciando backend..."
npm run dev &

# Aguardar inicialização
echo "⏳ Aguardando inicialização do servidor..."
sleep 5

# Verificar se o servidor está respondendo
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Servidor iniciado com sucesso!"
else
    echo "⚠️ Servidor não está respondendo. Verifique os logs."
fi

echo "📋 Próximos passos:"
echo "1. Teste o frontend em http://localhost:3000"
echo "2. Acesse GMaps Extractor no dashboard"
echo "3. Crie uma campanha de teste"
