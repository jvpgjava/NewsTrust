# 🌐 CONFIGURAÇÃO DO DOMÍNIO newstrust.me NO VERCEL

## 📋 PASSO A PASSO COMPLETO

### 🔧 1. NO VERCEL (news-trust-backend):

#### ✅ Adicionar Domínio:
1. **Acesse:** https://vercel.com/jvpgjavas-projects/news-trust-backend
2. **Clique em:** "Domains" (na barra superior)
3. **Clique em:** "Add Domain"
4. **Digite:** `newstrust.me`
5. **Clique em:** "Add"

#### ✅ Configuração Automática:
- O Vercel irá gerar automaticamente os registros DNS
- Anote os valores que aparecerem na tela

### 🔧 2. NO NAMECHEAP (newstrust.me):

#### ❌ REMOVER REGISTROS ANTIGOS:
1. **Acesse:** https://ap.www.namecheap.com/Domains/DomainControlPanel/newstrust.me/advancedns
2. **Na seção "HOST RECORDS":**
3. **REMOVER estes registros:**
   - ❌ **A Record** `@` → `216.198.79.1`
   - ❌ **CNAME** `api` → `apinewstrust.netlify.app.`
   - ❌ **CNAME** `www` → `1fdff0d0724f167a.vercel-dns-017.com.`

#### ✅ ADICIONAR NOVOS REGISTROS:
**Após adicionar no Vercel, você receberá instruções como:**

1. **A Record:**
   - **Type:** A Record
   - **Host:** @
   - **Value:** `76.76.19.61` (IP do Vercel)
   - **TTL:** Automatic

2. **CNAME Record:**
   - **Type:** CNAME Record
   - **Host:** www
   - **Value:** `cname.vercel-dns.com.`
   - **TTL:** Automatic

### 🔧 3. CONFIGURAÇÃO DO FRONTEND:

#### ✅ Atualizar URLs:
```javascript
// frontend/src/config/env.js
const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

export const config = {
  API_URL: isDevelopment 
    ? 'http://localhost:3001' 
    : 'https://newstrust.me',  // ← MUDANÇA AQUI
  WS_URL: isDevelopment 
    ? 'ws://localhost:3001' 
    : 'wss://newstrust.me'     // ← MUDANÇA AQUI
};
```

### 🔧 4. CONFIGURAÇÃO DO BACKEND:

#### ✅ Atualizar CORS:
```javascript
// backend/server.js
const corsOptions = {
  origin: [
    'https://newstrust.me',     // ← SEU DOMÍNIO
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

## 🎯 RESULTADO FINAL:

### ✅ URLs de Produção:
- **Frontend:** `https://newstrust.me`
- **Backend:** `https://newstrust.me` (mesmo domínio)
- **API:** `https://newstrust.me/api/...`

### ✅ Funcionalidades:
- **Dashboard:** `https://newstrust.me/dashboard`
- **Análise de Notícias:** `https://newstrust.me/news-analysis`
- **Rede de Confiança:** `https://newstrust.me/network`
- **Contato:** `https://newstrust.me/contact`

## 🔍 VERIFICAÇÃO:

### ✅ Testar URLs:
1. **Frontend:** `https://newstrust.me`
2. **Health Check:** `https://newstrust.me/health`
3. **API Test:** `https://newstrust.me/api/test`

### ✅ Verificar DNS:
```bash
# Verificar se o domínio aponta para o Vercel
nslookup newstrust.me
```

## 🚨 TROUBLESHOOTING:

### ❌ Se não funcionar:
1. **Aguardar propagação DNS** (até 24h)
2. **Verificar registros no Namecheap**
3. **Verificar configuração no Vercel**
4. **Testar com `nslookup`**

### ✅ Se funcionar:
- **Deploy automático** a cada push
- **SSL automático** (HTTPS)
- **CDN global** do Vercel
- **Monitoramento** completo
