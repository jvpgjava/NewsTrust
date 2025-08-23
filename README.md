# 🛡️ NewsTrust - Sistema de Detecção de Fake News

Sistema inteligente para análise e detecção de fake news utilizando análise automática de credibilidade de fontes.

```bash
# Clone o repositório
git clone

# Configure e execute
cp backend/env.config backend/.env
cp frontend/env.config frontend/.env.local
Crie os arquivos envs locais na raíz do frotend e do backend:
.env.local(frontend):
# ========================================
# 🚀 CONFIGURAÇÕES DE DESENVOLVIMENTO - FRONTEND
# ========================================

# URL da API Backend (Local)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Configurações da Aplicação
NEXT_PUBLIC_APP_NAME=NewsTrust
NEXT_PUBLIC_APP_VERSION=1.0.0


.env.local(backend):
# ========================================
# 🚀 CONFIGURAÇÕES DE DESENVOLVIMENTO - BACKEND
# ========================================

# Configurações do Servidor
PORT=3001
NODE_ENV=development

# Configurações do PostgreSQL (Local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=newstrust
DB_USER=seuusuario
DB_PASSWORD=suasenha

# Configurações de Segurança
JWT_SECRET=dev_jwt_secret_2024_local_development
BCRYPT_ROUNDS=12

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de CORS (Local)
CORS_ORIGIN=http://localhost:3000

# Configurações de Log
LOG_LEVEL=debug

Após envs, instale o postgresql, coloque o arquivo script-databse.sql na raíz do projeto em si, e conecte através do terminal da IDE:
   psql -U postgres
insira sua senha do postgres que definiu, e então CREATE DATABASE newstrust; 
depois saia, entre novamente no terminal e use os comandos:
   psql -U postgres -d newstrust -f script_database.sql

Após isso, abra o terminal da IDE(VS Code ou a que estiver usando) e use os seguintes comandos passo a passo:
cd backend,
npm install,
e para executar: npm run dev.

cd frontend,
npm install, 
para executar: npm run dev

e então pode utilizar 
```

**Acesso:** http://localhost:3000

## 🔧 Configuração das APIs

Para usar as funcionalidades de análise, configure as APIs externas:

1. **🤖 Ollama (IA Gratuita Local)**: https://ollama.ai/download
2. **ScamAdviser** (Gratuita - sem API key): Funciona automaticamente

Veja o arquivo `setup-ollama.md` para instruções detalhadas de configuração da IA gratuita.

## 📋 Funcionalidades

- 🤖 **Análise de Conteúdo com IA Gratuita** - Ollama (local) + APIs gratuitas para detectar fake news
- 🌐 **Busca Completa na Web** - Múltiplos motores de busca, redes sociais, sites acadêmicos e governamentais
- ✅ **Análise de Fonte** via ScamAdviser API (credibilidade de domínios)
- ✅ **Interface com Abas** - análise separada de conteúdo e fonte
- ✅ **Fontes Automáticas** - adicionadas automaticamente ao analisar notícias
- ✅ **Rede de Confiança** com visualização D3.js em tempo real
- ✅ **Interface Moderna** em React/Next.js
- ✅ **API RESTful** em Node.js
- ✅ **Banco PostgreSQL** para persistência
- ✅ **Deploy Docker** containerizado
- ✅ **CI/CD Jenkins** automatizado

## 🐳 Tecnologias

- **Frontend:** Next.js, React, Tailwind CSS, D3.js
- **Backend:** Node.js, Express, PostgreSQL
- **Deploy:** Docker, Docker Compose, Nginx
- **CI/CD:** Jenkins Pipeline

## 🏗️ Arquitetura

```
Frontend (React/Next.js) → Nginx → Backend (Node.js) → PostgreSQL
                                ↓
                    DeepSeek API + ScamAdviser API
```

## 💡 Como Usar

### Análise de Conteúdo (DeepSeek)
1. **Acesse** a aba "Análise de Conteúdo"
2. **Insira** título e conteúdo da notícia
3. **Analise** com IA - detecta fake news automaticamente
4. **Veja** análise detalhada com razões e recomendações

### Análise de Fonte (ScamAdviser)
1. **Acesse** a aba "Análise de Fonte"
2. **Insira** URL do site/domínio
3. **Analise** credibilidade da fonte
4. **Veja** dados de reputação e confiança

## 🔄 Sistema Automático

- **🔄 Fontes:** Adicionadas automaticamente ao analisar notícias
- **📊 Dashboard:** Atualizado em tempo real via WebSocket
- **🌐 Grafo:** Rede de confiança atualizada automaticamente
- **📈 Estatísticas:** Números atualizados em tempo real

## 📊 Status

- **Backend:** ✅ Funcional
- **Frontend:** ✅ Funcional  
- **Database:** ✅ Configurado
- **Docker:** ✅ Pronto para produção
- **Jenkins:** ✅ Pipeline configurado
- **Sistema Automático:** ✅ Fontes automáticas
- **DeepSeek API:** ✅ Integrada
- **ScamAdviser API:** ✅ Integrada

