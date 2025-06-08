# WhatsApp Web System - Estrutura Completa

## 📁 Estrutura do Projeto

\`\`\`
whatsapp-web-system/
├── frontend/                 # Next.js Frontend
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   ├── contacts/
│   │   ├── messages/
│   │   └── api/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── public/
├── backend/                  # Node.js Backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── utils/
│   ├── config/
│   └── uploads/
├── database/                 # Scripts SQL
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
├── shared/                   # Tipos compartilhados
│   └── types/
└── docs/                    # Documentação
\`\`\`

## 🚀 Como Testar Localmente

### 1. Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 2. Configuração do Banco
\`\`\`bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Criar banco
sudo -u postgres createdb whatsapp_web
sudo -u postgres createuser whatsapp_user
sudo -u postgres psql -c "ALTER USER whatsapp_user PASSWORD 'sua_senha';"
\`\`\`

### 3. Configuração Backend
\`\`\`bash
cd backend
npm install
cp .env.example .env
# Editar .env com suas configurações
npm run dev
\`\`\`

### 4. Configuração Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### 5. Acessar Sistema
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Banco: localhost:5432
