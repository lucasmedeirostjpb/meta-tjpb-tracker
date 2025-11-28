-- =====================================================
-- Sistema de Prestação de Contas
-- =====================================================

-- Adicionar novos campos à tabela updates
ALTER TABLE public.updates
ADD COLUMN IF NOT EXISTS estimativa_cumprimento TEXT CHECK (estimativa_cumprimento IN ('Totalmente Cumprido', 'Parcialmente Cumprido', 'Não Cumprido', 'Não se Aplica')),
ADD COLUMN IF NOT EXISTS pontos_estimados NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS percentual_cumprimento NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS acoes_planejadas TEXT,
ADD COLUMN IF NOT EXISTS justificativa_parcial TEXT,
ADD COLUMN IF NOT EXISTS data_prestacao TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Comentários
COMMENT ON COLUMN public.updates.estimativa_cumprimento IS 'Estimativa de cumprimento da meta';
COMMENT ON COLUMN public.updates.pontos_estimados IS 'Pontos estimados para cumprimento parcial';
COMMENT ON COLUMN public.updates.percentual_cumprimento IS 'Percentual de cumprimento (0-100)';
COMMENT ON COLUMN public.updates.acoes_planejadas IS 'Descrição das ações planejadas ou executadas';
COMMENT ON COLUMN public.updates.justificativa_parcial IS 'Justificativa para cumprimento parcial';
COMMENT ON COLUMN public.updates.data_prestacao IS 'Data da prestação de contas';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_updates_estimativa ON public.updates(estimativa_cumprimento);
CREATE INDEX IF NOT EXISTS idx_updates_data_prestacao ON public.updates(data_prestacao);

-- Função para calcular pontos recebidos baseado em percentual
CREATE OR REPLACE FUNCTION public.fn_calcular_pontos_recebidos(
  p_meta_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_pontos_aplicaveis NUMERIC;
  v_percentual NUMERIC;
  v_pontos_recebidos NUMERIC;
BEGIN
  SELECT 
    mb.pontos_aplicaveis,
    COALESCE(u.percentual_cumprimento, 0)
  INTO v_pontos_aplicaveis, v_percentual
  FROM public.metas_base mb
  LEFT JOIN public.updates u ON u.meta_id = mb.id
  WHERE mb.id = p_meta_id;
  
  v_pontos_recebidos := (v_pontos_aplicaveis * v_percentual) / 100;
  
  RETURN ROUND(v_pontos_recebidos, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_calcular_pontos_recebidos IS 'Calcula pontos recebidos baseado no percentual de cumprimento';

-- View para facilitar consultas de prestação de contas
CREATE OR REPLACE VIEW public.vw_prestacao_contas AS
SELECT 
  mb.id,
  mb.eixo,
  mb.item,
  mb.artigo,
  mb.requisito,
  mb.descricao,
  mb.pontos_aplicaveis,
  mb.setor_executor,
  mb.coordenador,
  mb.deadline,
  mb.linha_planilha,
  u.status,
  u.estimativa_cumprimento,
  u.pontos_estimados,
  u.percentual_cumprimento,
  ROUND((mb.pontos_aplicaveis * COALESCE(u.percentual_cumprimento, 0)) / 100, 2) as pontos_recebidos,
  u.acoes_planejadas,
  u.justificativa_parcial,
  u.link_evidencia,
  u.observacoes,
  u.data_prestacao,
  u.updated_at
FROM public.metas_base mb
LEFT JOIN public.updates u ON u.meta_id = mb.id
ORDER BY mb.linha_planilha NULLS LAST, mb.eixo, mb.artigo, mb.requisito;

-- Garantir RLS na view
ALTER VIEW public.vw_prestacao_contas OWNER TO postgres;
GRANT SELECT ON public.vw_prestacao_contas TO anon, authenticated;

COMMENT ON VIEW public.vw_prestacao_contas IS 'View consolidada com informações de prestação de contas';
