# ========================================
# 🔧 SCRIPT PARA CONFIGURAR BANCO LOCAL (WINDOWS)
# ========================================

Write-Host "🚀 Configurando banco PostgreSQL para acesso externo..." -ForegroundColor Green

# 1. Verificar se PostgreSQL está rodando
Write-Host "📊 Verificando PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService -and $pgService.Status -eq "Running") {
    Write-Host "✅ PostgreSQL está rodando" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL não está rodando. Iniciando..." -ForegroundColor Red
    Start-Service -Name "postgresql*"
}

# 2. Obter IP público
Write-Host "🌐 Obtendo IP público..." -ForegroundColor Yellow
try {
    $publicIP = Invoke-RestMethod -Uri "https://ifconfig.me" -TimeoutSec 10
    Write-Host "📍 Seu IP público: $publicIP" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Não foi possível obter IP público" -ForegroundColor Red
    $publicIP = "SEU_IP_PUBLICO"
}

# 3. Localizar arquivos de configuração
Write-Host "⚙️ Localizando arquivos de configuração..." -ForegroundColor Yellow

# Procurar postgresql.conf
$postgresConf = Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Recurse -Name "postgresql.conf" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($postgresConf) {
    $postgresConfPath = "C:\Program Files\PostgreSQL\$($postgresConf.Split('\')[2])\data\postgresql.conf"
    Write-Host "📁 postgresql.conf encontrado: $postgresConfPath" -ForegroundColor Green
} else {
    Write-Host "❌ postgresql.conf não encontrado" -ForegroundColor Red
    Write-Host "📝 Configure manualmente: listen_addresses = '*'" -ForegroundColor Yellow
}

# Procurar pg_hba.conf
$pgHbaConf = Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Recurse -Name "pg_hba.conf" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($pgHbaConf) {
    $pgHbaConfPath = "C:\Program Files\PostgreSQL\$($pgHbaConf.Split('\')[2])\data\pg_hba.conf"
    Write-Host "📁 pg_hba.conf encontrado: $pgHbaConfPath" -ForegroundColor Green
} else {
    Write-Host "❌ pg_hba.conf não encontrado" -ForegroundColor Red
    Write-Host "📝 Adicione manualmente: host    all             all             0.0.0.0/0               md5" -ForegroundColor Yellow
}

# 4. Configurar Windows Firewall
Write-Host "🔥 Configurando Windows Firewall..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow -ErrorAction SilentlyContinue
    Write-Host "✅ Regra de firewall criada" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao configurar firewall. Configure manualmente a porta 5432" -ForegroundColor Yellow
}

# 5. Reiniciar PostgreSQL
Write-Host "🔄 Reiniciando PostgreSQL..." -ForegroundColor Yellow
try {
    Restart-Service -Name "postgresql*" -Force
    Start-Sleep -Seconds 3
    Write-Host "✅ PostgreSQL reiniciado" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao reiniciar PostgreSQL" -ForegroundColor Red
}

# 6. Gerar instruções
Write-Host ""
Write-Host "🎉 CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Use esta DATABASE_URL no Vercel:" -ForegroundColor Cyan
Write-Host "DATABASE_URL=postgresql://postgres:SUA_SENHA@$publicIP:5432/newstrust" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Variáveis de ambiente para Vercel:" -ForegroundColor Cyan
Write-Host "DATABASE_URL=postgresql://postgres:SUA_SENHA@$publicIP:5432/newstrust" -ForegroundColor White
Write-Host "NODE_ENV=production" -ForegroundColor White
Write-Host "CORS_ORIGIN=https://newstrust.me" -ForegroundColor White
Write-Host "JWT_SECRET=sua_chave_jwt_super_secreta" -ForegroundColor White
Write-Host ""
Write-Host "⚠️ IMPORTANTE:" -ForegroundColor Yellow
Write-Host "1. Substitua SUA_SENHA pela senha real do PostgreSQL" -ForegroundColor White
Write-Host "2. Certifique-se de que o banco 'newstrust' existe" -ForegroundColor White
Write-Host "3. Teste a conexão antes do deploy" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Para testar a conexão:" -ForegroundColor Cyan
Write-Host "psql -h $publicIP -U postgres -d newstrust" -ForegroundColor White
Write-Host ""
Write-Host "📝 CONFIGURAÇÃO MANUAL NECESSÁRIA:" -ForegroundColor Yellow
Write-Host "1. Edite postgresql.conf e adicione: listen_addresses = '*'" -ForegroundColor White
Write-Host "2. Edite pg_hba.conf e adicione: host    all             all             0.0.0.0/0               md5" -ForegroundColor White
Write-Host "3. Reinicie o PostgreSQL" -ForegroundColor White
