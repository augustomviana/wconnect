-- Tabela para armazenar campanhas de extração
CREATE TABLE IF NOT EXISTS gmap_campaigns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    search_queries JSONB NOT NULL,
    options JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total_results INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela para armazenar resultados das extrações
CREATE TABLE IF NOT EXISTS gmap_results (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL,
    search_query TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    category VARCHAR(255),
    rating DECIMAL(3,1),
    review_count INTEGER,
    phone VARCHAR(50),
    website TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (campaign_id) REFERENCES gmap_campaigns(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_gmap_campaigns_user_id ON gmap_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_gmap_results_campaign_id ON gmap_results(campaign_id);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_gmaps_results_mobile_number ON gmaps_results(mobile_number);
CREATE INDEX IF NOT EXISTS idx_gmaps_results_email ON gmaps_results(email);

-- Configurações do usuário para o extrator
CREATE TABLE IF NOT EXISTS gmaps_user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    grab_email BOOLEAN DEFAULT true,
    grab_images BOOLEAN DEFAULT true,
    max_results_per_query INTEGER DEFAULT 100,
    default_options JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
