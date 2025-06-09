#!/bin/bash

# ==============================================================================
# SCRIPT DE INSTALAÇÃO E DEPLOY MANUAL PARA WHATSAPP-WEB NO UBUNTU
# ==============================================================================
# Este script irá automatizar todos os passos do guia de instalação.
# Execute-o como root no seu servidor VPS.

# --- Cores para o output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}---> Início do Script de Instalação <---${NC}"

# --- PASSO 1: PREPARAR O SERVIDOR E O AMBIENTE ---
echo -e "\n${YELLOW}### PASSO 1: Preparando o Servidor e o Ambiente ###${NC}"

echo -e "\n${GREEN}--> 1a. Atualizando o Sistema...${NC}"
apt update && apt upgrade -y

echo -e "\n${GREEN}--> 1b. Instalando o NVM (Node Version Manager) e o Node.js...${NC}"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

echo -e "${YELLOW}!!! AÇÃO NECESSÁRIA: Recarregando o shell para ativar o NVM...${NC}"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
source ~/.bashrc

echo -e "\n${GREEN}--> Instalando o Node.js v20...${NC}"
nvm install 20
nvm use 20

echo -e "\n${GREEN}--> 1c. Instalando PNPM e PM2 globalmente...${NC}"
npm install -g pnpm pm2

echo -e "\n${CYAN}---> Verificação do Ambiente:${NC}"
echo -n "Versão do Node: " && node -v
echo -n "Versão do PNPM: " && pnpm -v

# --- PASSO 2: INSTALAR E CONFIGURAR O BANCO DE DADOS ---
echo -e "\n${YELLOW}### PASSO 2: Instalando e Configurando o PostgreSQL ###${NC}"

echo -e "\n${GREEN}--> 2a. Instalando o PostgreSQL...${NC}"
apt install postgresql postgresql-contrib -y

echo -e "\n${GREEN}--> 2b. Criando o Usuário e o Banco de Dados...${NC}"
echo -e "${YELLOW}!!! AÇÃO NECESSÁRIA: Por favor, digite uma senha segura para o novo usuário do banco ('whatsapp_user') e pressione Enter.${NC}"
read -p "Digite a senha para o banco de dados: " DB_PASSWORD

sudo -u postgres psql -c "CREATE DATABASE whatsapp_web;"
sudo -u postgres psql -c "CREATE USER whatsapp_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE whatsapp_web TO whatsapp_user;"
sudo -u postgres psql -c "ALTER USER whatsapp_user WITH LOGIN;" # Garante a permissão de Login

echo -e "${GREEN}--> Usuário e banco de dados criados com sucesso!${NC}"

# --- PASSO 3: PREPARAR OS ARQUIVOS DO PROJETO ---
echo -e "\n${YELLOW}### PASSO 3: Preparando os Arquivos do Projeto ###${NC}"

# Navega para a pasta root e clona o projeto se não existir
cd /root/
if [ ! -d "whatsapp-web" ]; then
    echo -e "\n${GREEN}--> Clonando o repositório do projeto...${NC}"
    git clone https://github.com/augustomviana/whatsapp-web.git
fi

echo -e "\n${GREEN}--> Navegando para o diretório do projeto...${NC}"
cd /root/whatsapp-web

echo -e "\n${GREEN}--> Atualizando o código com a versão mais recente do GitHub...${NC}"
git pull origin main

echo -e "\n${GREEN}--> Instalando todas as dependências com PNPM...${NC}"
pnpm install

# --- PASSO 4: POPULAR O BANCO DE DADOS ---
echo -e "\n${YELLOW}### PASSO 4: Populando o Banco de Dados com os Scripts SQL ###${NC}"

echo -e "\n${GREEN}--> Navegando para a pasta 'database'...${NC}"
cd /root/whatsapp-web/database

echo -e "\n${GREEN}--> Executando os scripts SQL... A senha que você criou será usada.${NC}"
export PGPASSWORD=$DB_PASSWORD
psql -h localhost -U whatsapp_user -d whatsapp_web -f schema.sql
psql -h localhost -U whatsapp_user -d whatsapp_web -f automation-tables.sql
psql -h localhost -U whatsapp_user -d whatsapp_web -f chatbot-setup-clean.sql
psql -h localhost -U whatsapp_user -d whatsapp_web -f flows-schema-fixed.sql
psql -h localhost -U whatsapp_user -d whatsapp_web -f integrations-schema.sql
psql -h localhost -U whatsapp_user -d whatsapp_web -f settings-schema.sql
unset PGPASSWORD
echo -e "${GREEN}--> Scripts do banco de dados executados!${NC}"
cd /root/whatsapp-web # Volta para a raiz do projeto

# --- PASSO 5: CRIAR ARQUIVOS DE AMBIENTE ---
echo -e "\n${YELLOW}### PASSO 5: Criando Arquivos de Ambiente (.env) ###${NC}"

echo -e "\n${GREEN}--> 5a. Criando o arquivo backend/.env...${NC}"
cat > backend/.env << EOF
DB_HOST=localhost
DB_USER=whatsapp_user
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=whatsapp_web
DB_PORT=5432
JWT_SECRET=este_e_um_segredo_muito_forte_e_voce_deve_troca-lo
EOF

echo -e "\n${GREEN}--> 5b. Criando o arquivo frontend/.env.local...${NC}"
SERVER_IP=$(hostname -I | awk '{print $1}')
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:3001
EOF

echo -e "${GREEN}--> Arquivos .env criados com sucesso!${NC}"
echo "Backend .env:"
cat backend/.env
echo -e "\nFrontend .env.local:"
cat frontend/.env.local

# --- PASSO 6: BUILDAR OS PROJETOS ---
echo -e "\n${YELLOW}### PASSO 6: Compilando os Projetos para Produção ###${NC}"

echo -e "\n${GREEN}--> Build do Backend...${NC}"
pnpm --filter backend run build

echo -e "\n${GREEN}--> Build do Frontend...${NC}"
pnpm --filter frontend run build

# --- PASSO 7: INICIAR A APLICAÇÃO COM PM2 ---
echo -e "\n${YELLOW}### PASSO 7: Iniciando a Aplicação com PM2 ###${NC}"

echo -e "\n${GREEN}--> Parando qualquer processo antigo com o mesmo nome...${NC}"
pm2 delete whatsapp-backend || true
pm2 delete whatsapp-frontend || true

echo -e "\n${GREEN}--> Iniciando o servidor Backend...${NC}"
pm2 start "pnpm --filter backend run start" --name "whatsapp-backend"

echo -e "\n${GREEN}--> Iniciando o servidor Frontend...${NC}"
pm2 start "pnpm --filter frontend run start" --name "whatsapp-frontend"

# --- PASSO 8: FINALIZAÇÃO ---
echo -e "\n${YELLOW}### PASSO 8: Verificação Final ###${NC}"
pm2 list

echo -e "\n${GREEN}--> Salvando a lista de processos para reiniciar automaticamente...${NC}"
pm2 save
# Tenta configurar o startup script automaticamente
pm2 startup -u root --hp /root || echo "Não foi possível configurar o startup script automaticamente. Execute o comando fornecido pelo 'pm2 save' manualmente."


echo -e "\n\n${CYAN}==================================================================${NC}"
echo -e "${GREEN}      INSTALAÇÃO CONCLUÍDA! O SISTEMA ESTÁ NO AR.      ${NC}"
echo -e "${CYAN}==================================================================${NC}"
echo -e "Use '${YELLOW}pm2 logs whatsapp-backend${NC}' ou '${YELLOW}pm2 logs whatsapp-frontend${NC}' para ver os logs."
echo -e "Use '${YELLOW}pm2 list${NC}' para verificar o status dos processos."
echo -e "${CYAN}------------------------------------------------------------------${NC}"

