-- ========================================
-- 🚀 SCRIPT DE CONFIGURAÇÃO DO BANCO
-- Banco: newstrust
-- ========================================

-- Conectar ao banco
\c newstrust;

-- ========================================
-- 📋 CRIAÇÃO DAS TABELAS
-- ========================================

-- Tabela de fontes (sources)
CREATE TABLE IF NOT EXISTS fontes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL UNIQUE,
  site VARCHAR(500) NOT NULL UNIQUE,
  peso DECIMAL(3,2) DEFAULT 0.5 CHECK (peso >= 0 AND peso <= 1),
  tipo VARCHAR(50) DEFAULT 'general',
  descricao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de notícias (news)
CREATE TABLE IF NOT EXISTS noticias (
  id SERIAL PRIMARY KEY,
  texto TEXT NOT NULL,
  link VARCHAR(1000),
  id_fonte INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
  confiabilidade DECIMAL(3,2) DEFAULT 0.5 CHECK (confiabilidade >= 0 AND confiabilidade <= 1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de conexões (graph edges)
CREATE TABLE IF NOT EXISTS conexoes (
  id SERIAL PRIMARY KEY,
  fonte_origem INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
  fonte_destino INTEGER REFERENCES fontes(id) ON DELETE CASCADE,
  peso DECIMAL(3,2) DEFAULT 0.5 CHECK (peso >= 0 AND peso <= 1),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(fonte_origem, fonte_destino)
);

-- Tabela de feedback
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  id_noticia INTEGER REFERENCES noticias(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('confiavel', 'fake')),
  comentario TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 📊 CRIAÇÃO DOS ÍNDICES
-- ========================================

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_noticias_id_fonte ON noticias(id_fonte);
CREATE INDEX IF NOT EXISTS idx_conexoes_origem ON conexoes(fonte_origem);
CREATE INDEX IF NOT EXISTS idx_conexoes_destino ON conexoes(fonte_destino);
CREATE INDEX IF NOT EXISTS idx_fontes_site ON fontes(site);
CREATE INDEX IF NOT EXISTS idx_noticias_link ON noticias(link);

-- ========================================
-- 🔄 FUNÇÃO PARA ATUALIZAR updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ========================================
-- ⚡ CRIAÇÃO DOS TRIGGERS
-- ========================================

-- Trigger para atualizar updated_at na tabela fontes
DROP TRIGGER IF EXISTS update_fontes_updated_at ON fontes;
CREATE TRIGGER update_fontes_updated_at
  BEFORE UPDATE ON fontes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at na tabela noticias
DROP TRIGGER IF EXISTS update_noticias_updated_at ON noticias;
CREATE TRIGGER update_noticias_updated_at
  BEFORE UPDATE ON noticias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at na tabela conexoes
DROP TRIGGER IF EXISTS update_conexoes_updated_at ON conexoes;
CREATE TRIGGER update_conexoes_updated_at
  BEFORE UPDATE ON conexoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ✅ VERIFICAÇÃO FINAL
-- ========================================

-- Verificar se todas as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('fontes', 'noticias', 'conexoes', 'feedback')
ORDER BY table_name;

-- Verificar se todos os índices foram criados
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('fontes', 'noticias', 'conexoes', 'feedback')
ORDER BY tablename, indexname;

-- Verificar se a função foi criada
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- Verificar se os triggers foram criados
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table IN ('fontes', 'noticias', 'conexoes')
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 🎉 SCRIPT CONCLUÍDO
-- ========================================

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Banco de produção newstrust_production configurado com sucesso!';
  RAISE NOTICE '📋 Tabelas criadas: fontes, noticias, conexoes, feedback';
  RAISE NOTICE '📊 Índices criados para otimização de performance';
  RAISE NOTICE '🔄 Triggers configurados para atualização automática de timestamps';
  RAISE NOTICE '🚀 Sistema pronto para produção!';
END $$;