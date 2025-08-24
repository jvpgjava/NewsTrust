# Script para configurar Git no PowerShell
Write-Host "Configurando Git..." -ForegroundColor Green

# Adicionar Git ao PATH
$gitPath = "C:\Git\bin"
$currentPath = $env:PATH

if ($currentPath -notlike "*$gitPath*") {
    $env:PATH = "$currentPath;$gitPath"
    Write-Host "Git adicionado ao PATH temporariamente" -ForegroundColor Green
} else {
    Write-Host "Git ja esta no PATH" -ForegroundColor Green
}

# Testar Git
try {
    $gitVersion = git --version
    Write-Host "Git funcionando: $gitVersion" -ForegroundColor Green
    
    # Configurar Git (se necessario)
    Write-Host "Configurando Git..." -ForegroundColor Yellow
    
    # Verificar se ja tem configuracao
    $userName = git config --global user.name
    $userEmail = git config --global user.email
    
    if (-not $userName) {
        Write-Host "Nome de usuario nao configurado" -ForegroundColor Yellow
        $name = Read-Host "Digite seu nome para o Git"
        git config --global user.name $name
    }
    
    if (-not $userEmail) {
        Write-Host "Email nao configurado" -ForegroundColor Yellow
        $email = Read-Host "Digite seu email para o Git"
        git config --global user.email $email
    }
    
    Write-Host "Git configurado com sucesso!" -ForegroundColor Green
    Write-Host "Para tornar permanente, adicione C:\Git\bin ao PATH do sistema" -ForegroundColor Cyan
    
} catch {
    Write-Host "Erro ao configurar Git: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nComandos Git uteis:" -ForegroundColor Cyan
Write-Host "   git status          - Ver status do repositorio" -ForegroundColor White
Write-Host "   git add .           - Adicionar todos os arquivos" -ForegroundColor White
Write-Host "   git commit -m 'msg' - Fazer commit" -ForegroundColor White
Write-Host "   git log             - Ver historico" -ForegroundColor White
