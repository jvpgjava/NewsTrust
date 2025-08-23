# 🤖 Configuração do Ollama (IA Gratuita Local)

## O que é o Ollama?

Ollama é uma ferramenta gratuita que permite rodar modelos de IA localmente no seu computador, **sem precisar de tokens ou APIs pagas**.

## 🚀 Instalação

### Windows:
1. Baixe o Ollama em: https://ollama.ai/download
2. Execute o instalador
3. Abra o terminal e execute:
```bash
ollama pull llama2
```

### macOS:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama2
```

### Linux:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama2
```

## 🔧 Configuração

1. **Inicie o Ollama:**
```bash
ollama serve
```

2. **Teste se está funcionando:**
```bash
ollama run llama2 "Olá, como você está?"
```

3. **O sistema automaticamente detectará o Ollama** na porta `http://localhost:11434`

## 📋 Modelos Disponíveis

- **llama2** - Modelo principal (gratuito)
- **mistral** - Modelo mais rápido
- **codellama** - Para análise de código

Para baixar outros modelos:
```bash
ollama pull mistral
ollama pull codellama
```

## 🎯 Como Funciona no Sistema

1. **Primeiro:** O sistema busca na web usando DuckDuckGo
2. **Segundo:** Envia os resultados + notícia para o Ollama
3. **Terceiro:** Ollama analisa e retorna se é fake news
4. **Fallback:** Se Ollama não estiver disponível, usa análise baseada em regras

## 💡 Vantagens

✅ **100% Gratuito** - Sem tokens ou APIs pagas
✅ **Local** - Dados não saem do seu computador
✅ **Offline** - Funciona sem internet (após download)
✅ **Privado** - Suas análises ficam no seu PC
✅ **Rápido** - Sem latência de rede

## 🔄 Alternativas

Se o Ollama não estiver disponível, o sistema usa:
1. **APIs gratuitas** (se disponíveis)
2. **Análise baseada em regras** (fallback)

## 🚨 Solução de Problemas

### Ollama não inicia:
```bash
# Reiniciar o serviço
ollama serve

# Verificar se está rodando
curl http://localhost:11434/api/tags
```

### Modelo não encontrado:
```bash
# Baixar o modelo novamente
ollama pull llama2
```

### Porta ocupada:
```bash
# Verificar o que está usando a porta 11434
netstat -ano | findstr :11434
```

## 📊 Performance

- **Primeira execução:** ~30 segundos (baixa o modelo)
- **Execuções seguintes:** ~5-10 segundos
- **Memória:** ~4GB RAM necessários
- **Espaço:** ~4GB no disco

---

**🎉 Pronto! Agora você tem IA gratuita rodando localmente!**
