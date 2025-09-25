#!/bin/bash

# ========================================
# 🔧 SCRIPT PARA CONFIGURAR BANCO LOCAL
# ========================================

echo "🚀 Configurando banco PostgreSQL para acesso externo..."

# 1. Verificar se PostgreSQL está rodando
echo "📊 Verificando PostgreSQL..."
if ! systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL não está rodando. Iniciando..."
    sudo systemctl start postgresql
fi

# 2. Obter IP público
echo "🌐 Obtendo IP público..."
PUBLIC_IP=$(curl -s ifconfig.me)
echo "📍 Seu IP público: $PUBLIC_IP"

# 3. Configurar postgresql.conf
echo "⚙️ Configurando postgresql.conf..."
POSTGRES_CONF=$(sudo find /etc -name "postgresql.conf" 2>/dev/null | head -1)

if [ -n "$POSTGRES_CONF" ]; then
    echo "📁 Arquivo encontrado: $POSTGRES_CONF"
    
    # Backup
    sudo cp "$POSTGRES_CONF" "$POSTGRES_CONF.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Configurar listen_addresses
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$POSTGRES_CONF"
    sudo sed -i "s/listen_addresses = 'localhost'/listen_addresses = '*'/" "$POSTGRES_CONF"
    
    echo "✅ postgresql.conf configurado"
else
    echo "❌ Arquivo postgresql.conf não encontrado"
    echo "📝 Configure manualmente: listen_addresses = '*'"
fi

# 4. Configurar pg_hba.conf
echo "🔐 Configurando pg_hba.conf..."
PG_HBA_CONF=$(sudo find /etc -name "pg_hba.conf" 2>/dev/null | head -1)

if [ -n "$PG_HBA_CONF" ]; then
    echo "📁 Arquivo encontrado: $PG_HBA_CONF"
    
    # Backup
    sudo cp "$PG_HBA_CONF" "$PG_HBA_CONF.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Adicionar linha para permitir conexões externas
    echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a "$PG_HBA_CONF"
    
    echo "✅ pg_hba.conf configurado"
else
    echo "❌ Arquivo pg_hba.conf não encontrado"
    echo "📝 Adicione manualmente: host    all             all             0.0.0.0/0               md5"
fi

# 5. Configurar firewall
echo "🔥 Configurando firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 5432
    echo "✅ UFW configurado"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=5432/tcp
    sudo firewall-cmd --reload
    echo "✅ Firewalld configurado"
else
    echo "⚠️ Firewall não detectado. Configure manualmente a porta 5432"
fi

# 6. Reiniciar PostgreSQL
echo "🔄 Reiniciando PostgreSQL..."
sudo systemctl restart postgresql

# 7. Testar conexão
echo "🧪 Testando conexão..."
sleep 2
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL reiniciado com sucesso"
else
    echo "❌ Erro ao reiniciar PostgreSQL"
fi

# 8. Gerar DATABASE_URL
echo ""
echo "🎉 CONFIGURAÇÃO CONCLUÍDA!"
echo ""
echo "📋 Use esta DATABASE_URL no Vercel:"
echo "DATABASE_URL=postgresql://postgres:SUA_SENHA@$PUBLIC_IP:5432/newstrust"
echo ""
echo "🔧 Variáveis de ambiente para Vercel:"
echo "DATABASE_URL=postgresql://postgres:SUA_SENHA@$PUBLIC_IP:5432/newstrust"
echo "NODE_ENV=production"
echo "CORS_ORIGIN=https://newstrust.me"
echo "JWT_SECRET=sua_chave_jwt_super_secreta"
echo ""
echo "⚠️ IMPORTANTE:"
echo "1. Substitua SUA_SENHA pela senha real do PostgreSQL"
echo "2. Certifique-se de que o banco 'newstrust' existe"
echo "3. Teste a conexão antes do deploy"
echo ""
echo "🧪 Para testar a conexão:"
echo "psql -h $PUBLIC_IP -U postgres -d newstrust"
