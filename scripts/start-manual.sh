#!/bin/bash

echo "🚀 Iniciando WhatsApp Web System (Manual)..."
echo "============================================"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Função para verificar porta
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Parar processos existentes
echo "⏹️ Parando processos existentes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
sleep 2

# Verificar PostgreSQL
echo "🗄️ Verificando PostgreSQL..."
if ! sudo systemctl is-active postgresql &> /dev/null; then
    echo "🔄 Iniciando PostgreSQL..."
    sudo systemctl start postgresql
fi

# Testar conexão com banco
if ! PGPASSWORD=whatsapp_2024_secure psql -h localhost -U whatsapp_user -d whatsapp_web -c "SELECT 1;" &> /dev/null; then
    echo "❌ Erro na conexão com banco de dados"
    echo "Verifique se PostgreSQL está rodando e as credenciais estão corretas"
    exit 1
fi
echo "✅ Banco de dados OK"

# Iniciar backend
echo "🔧 Iniciando backend..."
cd backend
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

# Aguardar backend
echo "⏳ Aguardando backend inicializar..."
for i in {1..30}; do
    if curl -s http://localhost:5000/health > /dev/null; then
        echo "✅ Backend iniciado com sucesso"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Timeout ao iniciar backend"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Iniciar frontend
echo "🎨 Iniciando frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

# Aguardar frontend
echo "⏳ Aguardando frontend inicializar..."
for i in {1..20}; do
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Frontend iniciado com sucesso"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "⚠️ Frontend pode estar demorando para iniciar"
        break
    fi
    sleep 1
done

# Obter IP público
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "SEU_IP")

echo ""
echo "🎉 SISTEMA INICIADO COM SUCESSO!"
echo "==============================="
echo ""
echo "🌐 URLs de acesso:"
echo "   Local:    http://localhost:3000"
echo "   Público:  http://$PUBLIC_IP:3000"
echo ""
echo "🔧 APIs:"
echo "   Backend:  http://localhost:5000"
echo "   Health:   http://localhost:5000/health"
echo ""
echo "🔐 Credenciais padrão:"
echo "   Email: admin@whatsapp-web.com"
echo "   Senha: admin123"
echo ""
echo "📊 PIDs dos processos:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "⏹️ Para parar o sistema:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   ou execute: ./scripts/stop-system.sh"
echo ""

# Salvar PIDs
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

echo "✅ PIDs salvos em .backend.pid e .frontend.pid"
