-- =====================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO DO BANCO DE DADOS
-- NewsTrust - Sistema de Detecção de Fake News
-- =====================================================

-- Criar banco de dados se não existir
-- CREATE DATABASE newstrust_production;

-- Conectar ao banco
-- \c newstrust_production;

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de fontes (sites de notícias)
CREATE TABLE IF NOT EXISTS fontes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    site VARCHAR(500) NOT NULL UNIQUE,
    peso DECIMAL(3,2) DEFAULT 0.5,
    tipo VARCHAR(100) DEFAULT 'Site de Notícias',
    descricao TEXT,
    external_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de notícias
CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,
    texto TEXT NOT NULL,
    link VARCHAR(500),
    id_fonte INTEGER REFERENCES fontes(id),
    confiabilidade DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de conexões entre fontes
CREATE TABLE IF NOT EXISTS conexoes (
    id SERIAL PRIMARY KEY,
    fonte_origem INTEGER REFERENCES fontes(id),
    fonte_destino INTEGER REFERENCES fontes(id),
    peso DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(fonte_origem, fonte_destino)
);

-- =====================================================
-- TABELAS DE ANÁLISE EM TEMPO REAL
-- =====================================================

-- Tabela para análises de conteúdo
CREATE TABLE IF NOT EXISTS analises_conteudo (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    is_fake_news BOOLEAN NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    reasons TEXT[],
    recommendations TEXT[],
    detailed_analysis TEXT,
    score DECIMAL(3,2),
    web_results JSONB,
    ai_analysis JSONB,
    search_coverage TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela para conexões de confiança entre fontes (tempo real)
CREATE TABLE IF NOT EXISTS conexoes_confianca (
    id SERIAL PRIMARY KEY,
    fonte_origem_id INTEGER REFERENCES fontes(id),
    fonte_destino_id INTEGER REFERENCES fontes(id),
    peso_conexao DECIMAL(3,2) NOT NULL,
    tipo_conexao VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(fonte_origem_id, fonte_destino_id)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para tabela fontes
CREATE INDEX IF NOT EXISTS idx_fontes_site ON fontes(site);
CREATE INDEX IF NOT EXISTS idx_fontes_tipo ON fontes(tipo);
CREATE INDEX IF NOT EXISTS idx_fontes_peso ON fontes(peso);
CREATE INDEX IF NOT EXISTS idx_fontes_created_at ON fontes(created_at);

-- Índices para tabela noticias
CREATE INDEX IF NOT EXISTS idx_noticias_id_fonte ON noticias(id_fonte);
CREATE INDEX IF NOT EXISTS idx_noticias_confiabilidade ON noticias(confiabilidade);
CREATE INDEX IF NOT EXISTS idx_noticias_created_at ON noticias(created_at);

-- Índices para tabela conexoes
CREATE INDEX IF NOT EXISTS idx_conexoes_fonte_origem ON conexoes(fonte_origem);
CREATE INDEX IF NOT EXISTS idx_conexoes_fonte_destino ON conexoes(fonte_destino);
CREATE INDEX IF NOT EXISTS idx_conexoes_peso ON conexoes(peso);

-- Índices para análises de conteúdo
CREATE INDEX IF NOT EXISTS idx_analises_conteudo_created_at ON analises_conteudo(created_at);
CREATE INDEX IF NOT EXISTS idx_analises_conteudo_is_fake_news ON analises_conteudo(is_fake_news);
CREATE INDEX IF NOT EXISTS idx_analises_conteudo_risk_level ON analises_conteudo(risk_level);
CREATE INDEX IF NOT EXISTS idx_analises_conteudo_confidence ON analises_conteudo(confidence);

-- Índices para conexões de confiança
CREATE INDEX IF NOT EXISTS idx_conexoes_confianca_fonte_origem ON conexoes_confianca(fonte_origem_id);
CREATE INDEX IF NOT EXISTS idx_conexoes_confianca_fonte_destino ON conexoes_confianca(fonte_destino_id);
CREATE INDEX IF NOT EXISTS idx_conexoes_confianca_peso ON conexoes_confianca(peso_conexao);

-- =====================================================
-- TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_fontes_updated_at 
    BEFORE UPDATE ON fontes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_noticias_updated_at 
    BEFORE UPDATE ON noticias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analises_conteudo_updated_at 
    BEFORE UPDATE ON analises_conteudo 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
SELECT '=== TABELAS CRIADAS ===' as status;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar índices criados
SELECT '=== ÍNDICES CRIADOS ===' as status;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Verificar dados iniciais
SELECT '=== FONTES CADASTRADAS ===' as status;
SELECT nome, site, peso, tipo FROM fontes ORDER BY nome;

SELECT '=== CONEXÕES DE CONFIANÇA ===' as status;
SELECT 
    f1.nome as fonte_origem,
    f2.nome as fonte_destino,
    cc.peso_conexao,
    cc.tipo_conexao
FROM conexoes_confianca cc
JOIN fontes f1 ON cc.fonte_origem_id = f1.id
JOIN fontes f2 ON cc.fonte_destino_id = f2.id
ORDER BY cc.peso_conexao DESC;

-- =====================================================
-- MENSAGEM DE SUCESSO
-- =====================================================
SELECT '✅ BANCO DE DADOS CONFIGURADO COM SUCESSO!' as status;
SELECT '📊 Sistema NewsTrust pronto para uso' as info;
SELECT '🔗 Conecte o backend e frontend para começar' as next_step;
