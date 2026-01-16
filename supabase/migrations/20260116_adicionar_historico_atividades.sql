-- =====================================================
-- Adicionar Histórico de Atividades (Andamento)
-- Data: 16/01/2026
-- =====================================================

-- Tabela de Histórico de Atividades (apenas andamento)
CREATE TABLE IF NOT EXISTS public.historico_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES public.metas_base(id) ON DELETE CASCADE,
  atividade_id TEXT NOT NULL,
  acao_descricao TEXT NOT NULL,
  usuario_nome TEXT NOT NULL,
  andamento_anterior TEXT,
  andamento_novo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_historico_atividades_meta ON public.historico_atividades(meta_id);
CREATE INDEX IF NOT EXISTS idx_historico_atividades_created ON public.historico_atividades(created_at DESC);

-- Comentários
COMMENT ON TABLE public.historico_atividades IS 'Rastreamento de alterações no campo andamento das atividades';
COMMENT ON COLUMN public.historico_atividades.usuario_nome IS 'Nome de quem realizou a alteração';
COMMENT ON COLUMN public.historico_atividades.acao_descricao IS 'Descrição da atividade';
COMMENT ON COLUMN public.historico_atividades.andamento_anterior IS 'Valor anterior do andamento';
COMMENT ON COLUMN public.historico_atividades.andamento_novo IS 'Novo valor do andamento';

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela historico_atividades criada com sucesso!';
END $$;
