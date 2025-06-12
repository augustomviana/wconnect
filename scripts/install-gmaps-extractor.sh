#!/bin/bash

# Script de instalação do módulo GMapExtractor
echo "Iniciando instalação do módulo GMapExtractor..."

# Verificar se está no diretório raiz do projeto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  echo "Erro: Execute este script no diretório raiz do projeto"
  exit 1
fi

# Instalar dependências do backend
echo "Instalando dependências do backend..."
cd backend
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth --save

# Criar tabelas no banco de dados
echo "Criando tabelas no banco de dados..."
psql -h ${DB_HOST:-localhost} -U ${DB_USER:-whatsapp_user} -d ${DB_NAME:-whatsapp_web} -f ../database/gmaps-extractor-schema.sql

# Voltar para o diretório raiz
cd ..

# Instalar dependências do frontend
echo "Instalando dependências do frontend..."
cd frontend
npm install react-query file-saver xlsx --save

# Voltar para o diretório raiz
cd ..

echo "Instalação do módulo GMapExtractor concluída com sucesso!"
echo "Acesse o módulo em: http://seu-dominio/dashboard/gmaps-extractor"
