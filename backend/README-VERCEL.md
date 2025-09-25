# 🚀 NewsTrust Backend - Deploy no Vercel

## 📋 Configuração para Deploy

### 1. **Preparar o Projeto**
```bash
cd backend
npm install
```

### 2. **Configurar Variáveis de Ambiente no Vercel**

No painel do Vercel, adicione estas variáveis:

```env
# Banco de dados (seu PostgreSQL local ou externo)
DATABASE_URL=postgresql://usuario:senha@seu-host:5432/newstrust

# Ou use variáveis individuais:
DB_HOST=seu-host-postgres
DB_PORT=5432
DB_NAME=newstrust
DB_USER=postgres
DB_PASSWORD=suasenha

# Configurações
NODE_ENV=production
CORS_ORIGIN=https://seu-frontend.vercel.app
JWT_SECRET=sua_chave_jwt_super_secreta
```

### 3. **Deploy no Vercel**

#### Opção A: Via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Opção B: Via GitHub
1. Conecte seu repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### 4. **Endpoints Disponíveis**

Após o deploy, você terá:

- `https://seu-backend.vercel.app/api/analysis/content` - Análise de conteúdo
- `https://seu-backend.vercel.app/api/analysis/source` - Análise de fonte  
- `https://seu-backend.vercel.app/api/analysis/dashboard` - Dados do dashboard
- `https://seu-backend.vercel.app/health` - Health check

### 5. **Configurar Frontend**

No seu frontend, atualize a variável:
```env
NEXT_PUBLIC_API_URL=https://seu-backend.vercel.app
```

### 6. **Banco de Dados**

O backend usará seu banco PostgreSQL local/externo. Certifique-se de que:

1. ✅ Banco está acessível externamente
2. ✅ Tabelas `fontes` e `noticias` existem
3. ✅ Credenciais estão corretas
4. ✅ Firewall permite conexões

### 7. **Teste**

```bash
# Health check
curl https://seu-backend.vercel.app/health

# Teste de análise
curl -X POST https://seu-backend.vercel.app/api/analysis/content \
  -H "Content-Type: application/json" \
  -d '{"title":"Teste","content":"Conteúdo de teste"}'
```

## 🔧 Estrutura do Projeto

```
backend/
├── server-vercel.js          # Servidor principal
├── config/
│   └── database-vercel.js    # Configuração do banco
├── routes/
│   └── analysis-vercel.js     # Rotas de análise
├── package-vercel.json       # Dependências
├── vercel.json              # Configuração Vercel
└── env.example              # Exemplo de variáveis
```

## 📊 Banco de Dados

O sistema usa as tabelas:
- `fontes` - Análises de fonte
- `noticias` - Análises de conteúdo
- `conexoes` - Conexões entre fontes

## 🚨 Limitações do Vercel

- ⏱️ **Timeout:** 30 segundos máximo
- 💾 **Memória:** 1GB máximo
- 🔗 **Conexões:** 10 conexões simultâneas
- 📁 **Arquivos:** 50MB máximo

## ✅ Vantagens

- 🚀 **Deploy rápido**
- 🔄 **Auto-deploy** com GitHub
- 📊 **Logs** integrados
- 🌍 **CDN global**
- 💰 **Gratuito** para projetos pequenos
