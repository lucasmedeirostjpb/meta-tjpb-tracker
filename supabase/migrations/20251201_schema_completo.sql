-- =====================================================
-- Sistema de Acompanhamento de Metas CNJ - TJPB 2026
-- Migration Completa - Schema e Políticas
-- Data: 01/12/2025
-- =====================================================

-- =====================================================
-- EXTENSÕES
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS
-- =====================================================

-- Tabela de Dados Base (estrutura das metas)
CREATE TABLE IF NOT EXISTS public.metas_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eixo TEXT NOT NULL,
  item TEXT NOT NULL,
  artigo TEXT NOT NULL,
  requisito TEXT NOT NULL,
  descricao TEXT,
  pontos_aplicaveis INTEGER NOT NULL,
  setor_executor TEXT NOT NULL,
  coordenador TEXT,
  deadline DATE NOT NULL,
  linha_planilha INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Acompanhamento (status, evidências e prestação de contas)
CREATE TABLE IF NOT EXISTS public.updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES public.metas_base(id) ON DELETE CASCADE,
  setor_executor TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluído')),
  estimativa_cumprimento TEXT CHECK (estimativa_cumprimento IN ('Totalmente Cumprido', 'Parcialmente Cumprido', 'Em Andamento', 'Não Cumprido', 'Não se Aplica')),
  pontos_estimados NUMERIC(5,2) DEFAULT 0,
  percentual_cumprimento NUMERIC(5,2) DEFAULT 0,
  acoes_planejadas TEXT,
  justificativa_parcial TEXT,
  link_evidencia TEXT,
  observacoes TEXT,
  data_prestacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(meta_id)
);

-- Tabela de Histórico de Alterações
CREATE TABLE IF NOT EXISTS public.historico_alteracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES public.metas_base(id) ON DELETE CASCADE,
  usuario_email TEXT NOT NULL,
  usuario_id UUID NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('criacao', 'atualizacao_status', 'adicao_evidencia', 'edicao_observacoes', 'atualizacao_completa')),
  status_anterior TEXT,
  status_novo TEXT,
  estimativa_cumprimento_anterior TEXT,
  estimativa_cumprimento_novo TEXT,
  pontos_estimados_anterior NUMERIC(5,2),
  pontos_estimados_novo NUMERIC(5,2),
  acoes_planejadas_anterior TEXT,
  acoes_planejadas_novo TEXT,
  justificativa_parcial_anterior TEXT,
  justificativa_parcial_novo TEXT,
  link_evidencia_anterior TEXT,
  link_evidencia_novo TEXT,
  observacoes_anterior TEXT,
  observacoes_novo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

-- metas_base
COMMENT ON TABLE public.metas_base IS 'Tabela base com as metas do Prêmio CNJ de Qualidade TJPB 2026';
COMMENT ON COLUMN public.metas_base.eixo IS 'Eixo temático da meta (ex: Governança, Produtividade)';
COMMENT ON COLUMN public.metas_base.item IS 'Descrição do item da meta';
COMMENT ON COLUMN public.metas_base.artigo IS 'Artigo específico da meta';
COMMENT ON COLUMN public.metas_base.requisito IS 'Requisito associado ao artigo';
COMMENT ON COLUMN public.metas_base.descricao IS 'Descrição detalhada da meta';
COMMENT ON COLUMN public.metas_base.pontos_aplicaveis IS 'Pontuação que pode ser obtida com a meta';
COMMENT ON COLUMN public.metas_base.setor_executor IS 'Setor responsável pela execução da meta';
COMMENT ON COLUMN public.metas_base.coordenador IS 'Coordenador responsável pela meta';
COMMENT ON COLUMN public.metas_base.deadline IS 'Prazo final para conclusão da meta';
COMMENT ON COLUMN public.metas_base.linha_planilha IS 'Número da linha na planilha original (para manter ordem de exportação)';

-- updates
COMMENT ON TABLE public.updates IS 'Tabela de acompanhamento do status, evidências e prestação de contas das metas';
COMMENT ON COLUMN public.updates.meta_id IS 'Referência para a meta na tabela metas_base';
COMMENT ON COLUMN public.updates.setor_executor IS 'Setor que realizou a atualização';
COMMENT ON COLUMN public.updates.status IS 'Status atual da meta: Pendente, Em Andamento ou Concluído';
COMMENT ON COLUMN public.updates.estimativa_cumprimento IS 'Estimativa de cumprimento da meta';
COMMENT ON COLUMN public.updates.pontos_estimados IS 'Pontos estimados para cumprimento parcial';
COMMENT ON COLUMN public.updates.percentual_cumprimento IS 'Percentual de cumprimento (0-100)';
COMMENT ON COLUMN public.updates.acoes_planejadas IS 'Descrição das ações planejadas ou executadas';
COMMENT ON COLUMN public.updates.justificativa_parcial IS 'Justificativa para cumprimento parcial';
COMMENT ON COLUMN public.updates.link_evidencia IS 'URL com evidências da execução da meta';
COMMENT ON COLUMN public.updates.observacoes IS 'Observações sobre o andamento da meta';
COMMENT ON COLUMN public.updates.data_prestacao IS 'Data da prestação de contas';
COMMENT ON COLUMN public.updates.updated_at IS 'Data e hora da última atualização';

-- historico_alteracoes
COMMENT ON TABLE public.historico_alteracoes IS 'Histórico completo de todas as alterações realizadas nas metas';
COMMENT ON COLUMN public.historico_alteracoes.meta_id IS 'Referência à meta alterada';
COMMENT ON COLUMN public.historico_alteracoes.usuario_email IS 'Email do usuário que realizou a alteração';
COMMENT ON COLUMN public.historico_alteracoes.usuario_id IS 'ID do usuário autenticado que realizou a alteração';
COMMENT ON COLUMN public.historico_alteracoes.acao IS 'Tipo de ação realizada';
COMMENT ON COLUMN public.historico_alteracoes.status_anterior IS 'Status antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.status_novo IS 'Status após a alteração';
COMMENT ON COLUMN public.historico_alteracoes.estimativa_cumprimento_anterior IS 'Estimativa de cumprimento antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.estimativa_cumprimento_novo IS 'Estimativa de cumprimento após a alteração';
COMMENT ON COLUMN public.historico_alteracoes.pontos_estimados_anterior IS 'Pontos estimados antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.pontos_estimados_novo IS 'Pontos estimados após a alteração';
COMMENT ON COLUMN public.historico_alteracoes.acoes_planejadas_anterior IS 'Ações planejadas antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.acoes_planejadas_novo IS 'Ações planejadas após a alteração';
COMMENT ON COLUMN public.historico_alteracoes.justificativa_parcial_anterior IS 'Justificativa antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.justificativa_parcial_novo IS 'Justificativa após a alteração';
COMMENT ON COLUMN public.historico_alteracoes.link_evidencia_anterior IS 'Link de evidência antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.link_evidencia_novo IS 'Link de evidência após a alteração';
COMMENT ON COLUMN public.historico_alteracoes.observacoes_anterior IS 'Observações antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.observacoes_novo IS 'Observações após a alteração';

-- =====================================================
-- ÍNDICES
-- =====================================================

-- metas_base
CREATE INDEX IF NOT EXISTS idx_metas_base_setor ON public.metas_base(setor_executor);
CREATE INDEX IF NOT EXISTS idx_metas_base_coordenador ON public.metas_base(coordenador);
CREATE INDEX IF NOT EXISTS idx_metas_base_eixo ON public.metas_base(eixo);
CREATE INDEX IF NOT EXISTS idx_metas_base_artigo ON public.metas_base(artigo);
CREATE INDEX IF NOT EXISTS idx_metas_base_requisito ON public.metas_base(requisito);
CREATE INDEX IF NOT EXISTS idx_metas_base_deadline ON public.metas_base(deadline);
CREATE INDEX IF NOT EXISTS idx_metas_base_linha_planilha ON public.metas_base(linha_planilha);

-- updates
CREATE INDEX IF NOT EXISTS idx_updates_meta_id ON public.updates(meta_id);
CREATE INDEX IF NOT EXISTS idx_updates_status ON public.updates(status);
CREATE INDEX IF NOT EXISTS idx_updates_estimativa ON public.updates(estimativa_cumprimento);
CREATE INDEX IF NOT EXISTS idx_updates_data_prestacao ON public.updates(data_prestacao);

-- historico_alteracoes
CREATE INDEX IF NOT EXISTS idx_historico_meta_id ON public.historico_alteracoes(meta_id);
CREATE INDEX IF NOT EXISTS idx_historico_usuario_id ON public.historico_alteracoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_created_at ON public.historico_alteracoes(created_at DESC);

-- =====================================================
-- FUNÇÕES
-- =====================================================

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS 'Atualiza automaticamente o campo updated_at quando um registro é modificado';

-- Função para registrar alterações no histórico
CREATE OR REPLACE FUNCTION public.registrar_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_email TEXT;
  v_acao TEXT;
BEGIN
  -- Obter email do usuário autenticado
  SELECT email INTO v_usuario_email FROM auth.users WHERE id = auth.uid();
  
  -- Determinar tipo de ação
  IF TG_OP = 'INSERT' THEN
    v_acao := 'criacao';
    
    INSERT INTO public.historico_alteracoes (
      meta_id,
      usuario_email,
      usuario_id,
      acao,
      status_novo,
      estimativa_cumprimento_novo,
      pontos_estimados_novo,
      acoes_planejadas_novo,
      justificativa_parcial_novo,
      link_evidencia_novo,
      observacoes_novo
    ) VALUES (
      NEW.meta_id,
      v_usuario_email,
      auth.uid(),
      v_acao,
      NEW.status,
      NEW.estimativa_cumprimento,
      NEW.pontos_estimados,
      NEW.acoes_planejadas,
      NEW.justificativa_parcial,
      NEW.link_evidencia,
      NEW.observacoes
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determinar o tipo específico de atualização
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_acao := 'atualizacao_status';
    ELSIF OLD.link_evidencia IS DISTINCT FROM NEW.link_evidencia THEN
      v_acao := 'adicao_evidencia';
    ELSIF OLD.observacoes IS DISTINCT FROM NEW.observacoes THEN
      v_acao := 'edicao_observacoes';
    ELSE
      v_acao := 'atualizacao_completa';
    END IF;
    
    INSERT INTO public.historico_alteracoes (
      meta_id,
      usuario_email,
      usuario_id,
      acao,
      status_anterior,
      status_novo,
      estimativa_cumprimento_anterior,
      estimativa_cumprimento_novo,
      pontos_estimados_anterior,
      pontos_estimados_novo,
      acoes_planejadas_anterior,
      acoes_planejadas_novo,
      justificativa_parcial_anterior,
      justificativa_parcial_novo,
      link_evidencia_anterior,
      link_evidencia_novo,
      observacoes_anterior,
      observacoes_novo
    ) VALUES (
      NEW.meta_id,
      v_usuario_email,
      auth.uid(),
      v_acao,
      OLD.status,
      NEW.status,
      OLD.estimativa_cumprimento,
      NEW.estimativa_cumprimento,
      OLD.pontos_estimados,
      NEW.pontos_estimados,
      OLD.acoes_planejadas,
      NEW.acoes_planejadas,
      OLD.justificativa_parcial,
      NEW.justificativa_parcial,
      OLD.link_evidencia,
      NEW.link_evidencia,
      OLD.observacoes,
      NEW.observacoes
    );
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.registrar_historico() IS 'Registra automaticamente todas as alterações nas metas no histórico';

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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at automaticamente em metas_base
DROP TRIGGER IF EXISTS update_metas_base_updated_at ON public.metas_base;
CREATE TRIGGER update_metas_base_updated_at
BEFORE UPDATE ON public.metas_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at automaticamente em updates
DROP TRIGGER IF EXISTS update_updates_updated_at ON public.updates;
CREATE TRIGGER update_updates_updated_at
BEFORE UPDATE ON public.updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para registrar histórico automaticamente
DROP TRIGGER IF EXISTS trigger_registrar_historico ON public.updates;
CREATE TRIGGER trigger_registrar_historico
AFTER INSERT OR UPDATE ON public.updates
FOR EACH ROW
EXECUTE FUNCTION public.registrar_historico();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.metas_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura pública metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir inserção pública metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir atualização pública metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir exclusão pública metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir inserção autenticada metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir atualização autenticada metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir exclusão autenticada metas_base" ON public.metas_base;

DROP POLICY IF EXISTS "Permitir leitura pública updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir inserção pública updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir atualização pública updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir exclusão pública updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir inserção autenticada updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir atualização autenticada updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir exclusão autenticada updates" ON public.updates;

DROP POLICY IF EXISTS "Permitir leitura histórico para autenticados" ON public.historico_alteracoes;
DROP POLICY IF EXISTS "Permitir inserção histórico para autenticados" ON public.historico_alteracoes;

-- Políticas para metas_base (leitura pública, escrita autenticada)
CREATE POLICY "Permitir leitura pública metas_base" 
ON public.metas_base FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção autenticada metas_base" 
ON public.metas_base FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização autenticada metas_base" 
ON public.metas_base FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir exclusão autenticada metas_base" 
ON public.metas_base FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Políticas para updates (leitura pública, escrita autenticada)
CREATE POLICY "Permitir leitura pública updates" 
ON public.updates FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção autenticada updates" 
ON public.updates FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização autenticada updates" 
ON public.updates FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir exclusão autenticada updates" 
ON public.updates FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Políticas para historico_alteracoes (apenas autenticados)
CREATE POLICY "Permitir leitura histórico para autenticados" 
ON public.historico_alteracoes FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir inserção histórico para autenticados" 
ON public.historico_alteracoes FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND usuario_id = auth.uid());

-- =====================================================
-- VIEWS
-- =====================================================

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

COMMENT ON VIEW public.vw_prestacao_contas IS 'View consolidada com informações de prestação de contas';

-- Garantir permissões na view
ALTER VIEW public.vw_prestacao_contas OWNER TO postgres;
GRANT SELECT ON public.vw_prestacao_contas TO anon, authenticated;

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Schema completo criado com sucesso!';
  RAISE NOTICE 'Tabelas: metas_base, updates, historico_alteracoes';
  RAISE NOTICE 'Políticas RLS: Leitura pública, escrita autenticada';
  RAISE NOTICE 'Triggers: updated_at e registrar_historico configurados';
END $$;
