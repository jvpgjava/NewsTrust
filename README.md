# 🛡️ NewsTrust - Sistema de Detecção de Fake News

Sistema inteligente para análise e detecção de fake news utilizando análise automática de credibilidade de fontes.

```bash
# Clone o repositório
git clone <seu-repositorio>
cd FakeNews-Detector

# Configure e execute
cp backend/env.config backend/.env
cp frontend/env.config frontend/.env.local
docker-compose up -d --build
```

**Acesso:** http://localhost:3000

## 📋 Funcionalidades

- ✅ **Análise Automática** via ScamAdviser API
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
                         ScamAdviser API
```

## 💡 Como Usar

1. **Acesse** o sistema via browser
2. **Insira** título, conteúdo e URL da notícia
3. **Analise** automaticamente - a fonte é adicionada ao banco
4. **Visualize** a rede de confiança atualizada em tempo real

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

