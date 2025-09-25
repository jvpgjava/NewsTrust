# 🔧 CONFIGURAÇÃO COMPLETA - API.NEWSTRUST.ME

## 📋 Variáveis de Ambiente para Vercel

### **1. CONFIGURAÇÕES BÁSICAS**
```env
NODE_ENV=production
PORT=3001
```

### **2. BANCO DE DADOS - OPÇÕES**

#### **Opção A: Seu Banco Local (Recomendado)**
```env
# Se seu banco está acessível externamente
DATABASE_URL=postgresql://usuario:senha@SEU_IP_PUBLICO:5432/newstrust

# Ou variáveis individuais
DB_HOST=SEU_IP_PUBLICO
DB_PORT=5432
DB_NAME=newstrust
DB_USER=postgres
DB_PASSWORD=suasenha
```

#### **Opção B: Banco na Nuvem (Alternativa)**
```env
# Railway, Supabase, ou outro provedor
DATABASE_URL=postgresql://usuario:senha@host:5432/database
```

### **3. CONFIGURAÇÕES DE SEGURANÇA**
```env
JWT_SECRET=sua_chave_jwt_super_secreta_para_producao
BCRYPT_ROUNDS=12
```

### **4. CONFIGURAÇÕES DE CORS**
```env
CORS_ORIGIN=https://newstrust.me
```

### **5. CONFIGURAÇÕES DE RATE LIMITING**
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### **6. CONFIGURAÇÕES DE LOG**
```env
LOG_LEVEL=info
```

## 🌐 CONFIGURAÇÃO DO DOMÍNIO

### **1. No Vercel Dashboard:**
1. Acesse seu projeto
2. Vá em **Settings** → **Domains**
3. Adicione: `api.newstrust.me`
4. Configure DNS conforme instruções

### **2. DNS Configuration:**
```
Type: CNAME
Name: api
Value: cname.vercel-dns.com
```

## 🗄️ OPÇÕES PARA BANCO DE DADOS

### **Opção 1: Banco Local Acessível Externamente**

#### **Configurar PostgreSQL para acesso externo:**

1. **Editar `postgresql.conf`:**
```bash
# Encontrar o arquivo (geralmente em /etc/postgresql/versao/main/)
listen_addresses = '*'
port = 5432
```

2. **Editar `pg_hba.conf`:**
```bash
# Adicionar linha para permitir conexões externas
host    all             all             0.0.0.0/0               md5
```

3. **Reiniciar PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

4. **Configurar Firewall:**
```bash
# Ubuntu/Debian
sudo ufw allow 5432

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

5. **Obter IP Público:**
```bash
curl ifconfig.me
```

### **Opção 2: Banco na Nuvem (Mais Fácil)**

#### **Railway (Recomendado):**
1. Acesse: https://railway.app
2. Conecte GitHub
3. Crie novo projeto
4. Adicione PostgreSQL
5. Copie a `DATABASE_URL`

#### **Supabase:**
1. Acesse: https://supabase.com
2. Crie novo projeto
3. Vá em Settings → Database
4. Copie a connection string

#### **Neon (PostgreSQL Serverless):**
1. Acesse: https://neon.tech
2. Crie conta gratuita
3. Crie novo projeto
4. Copie a connection string

## 🚀 DEPLOY NO VERCEL

### **1. Preparar Projeto:**
```bash
cd backend
npm install
```

### **2. Deploy via CLI:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### **3. Configurar Variáveis:**
No painel do Vercel:
1. Vá em **Settings** → **Environment Variables**
2. Adicione todas as variáveis acima
3. Marque para **Production**, **Preview**, **Development**

### **4. Configurar Domínio:**
1. Vá em **Settings** → **Domains**
2. Adicione `api.newstrust.me`
3. Configure DNS conforme instruções

## 🧪 TESTE APÓS DEPLOY

### **1. Health Check:**
```bash
curl https://api.newstrust.me/health
```

### **2. Teste de Análise:**
```bash
curl -X POST https://api.newstrust.me/api/analysis/content \
  -H "Content-Type: application/json" \
  -d '{"title":"Teste","content":"Conteúdo de teste"}'
```

### **3. Teste de Dashboard:**
```bash
curl https://api.newstrust.me/api/analysis/dashboard
```

## 📊 ESTRUTURA FINAL

```
Frontend: https://newstrust.me
Backend:  https://api.newstrust.me
Banco:    Seu PostgreSQL (local ou nuvem)
```

## 🔧 CONFIGURAÇÃO COMPLETA DO ENV

```env
# ========================================
# 🚀 CONFIGURAÇÕES COMPLETAS - API.NEWSTRUST.ME
# ========================================

# Configurações do Servidor
NODE_ENV=production
PORT=3001

# Banco de Dados (Escolha uma opção)
# Opção 1: Banco local acessível externamente
DATABASE_URL=postgresql://postgres:suasenha@SEU_IP_PUBLICO:5432/newstrust

# Opção 2: Banco na nuvem (Railway/Supabase/Neon)
# DATABASE_URL=postgresql://usuario:senha@host:5432/database

# Configurações de Segurança
JWT_SECRET=sua_chave_jwt_super_secreta_para_producao_2024
BCRYPT_ROUNDS=12

# Configurações de CORS
CORS_ORIGIN=https://newstrust.me

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configurações de Log
LOG_LEVEL=info
```

## ✅ CHECKLIST FINAL

- [ ] Banco PostgreSQL configurado e acessível
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Domínio `api.newstrust.me` configurado
- [ ] DNS configurado corretamente
- [ ] Deploy realizado com sucesso
- [ ] Testes de conectividade funcionando
- [ ] Frontend apontando para `https://api.newstrust.me`
