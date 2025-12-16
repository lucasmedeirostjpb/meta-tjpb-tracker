-- =====================================================
-- Tabela de Coordenadores Autorizados
-- Controla quem pode fazer login e alterações
-- Data: 16/12/2025
-- =====================================================

-- Criar tabela de coordenadores autorizados
CREATE TABLE IF NOT EXISTS public.coordenadores_autorizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.coordenadores_autorizados IS 'Lista de coordenadores autorizados a acessar e modificar o sistema';
COMMENT ON COLUMN public.coordenadores_autorizados.nome IS 'Nome completo do coordenador';
COMMENT ON COLUMN public.coordenadores_autorizados.email IS 'Email institucional do coordenador';
COMMENT ON COLUMN public.coordenadores_autorizados.ativo IS 'Se o coordenador está ativo no sistema';

-- Índices
CREATE INDEX IF NOT EXISTS idx_coordenadores_email ON public.coordenadores_autorizados(email);
CREATE INDEX IF NOT EXISTS idx_coordenadores_ativo ON public.coordenadores_autorizados(ativo);

-- Políticas RLS
ALTER TABLE public.coordenadores_autorizados ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (para validação de login)
CREATE POLICY "Permitir leitura pública coordenadores_autorizados" 
ON public.coordenadores_autorizados FOR SELECT 
USING (true);

-- Permitir todas operações públicas (para importação sem autenticação)
CREATE POLICY "Permitir todas operações públicas coordenadores_autorizados" 
ON public.coordenadores_autorizados FOR ALL
USING (true)
WITH CHECK (true);

-- Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela coordenadores_autorizados criada com sucesso';
  RAISE NOTICE '📋 Execute a importação pela interface para adicionar coordenadores';
END $$;
