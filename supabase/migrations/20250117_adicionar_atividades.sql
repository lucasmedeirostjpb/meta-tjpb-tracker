-- =====================================================
-- Adicionar campo de atividades estruturadas
-- Data: 17/01/2026
-- =====================================================

-- Adicionar coluna para armazenar atividades em formato JSON
ALTER TABLE public.updates
ADD COLUMN IF NOT EXISTS atividades JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.updates.atividades IS 'Array de atividades estruturadas: [{id, acao, responsavel, prazo, status}]';

-- Atualizar tabela de histórico para rastrear mudanças nas atividades
ALTER TABLE public.historico_alteracoes
ADD COLUMN IF NOT EXISTS atividades_anterior JSONB,
ADD COLUMN IF NOT EXISTS atividades_novo JSONB;

COMMENT ON COLUMN public.historico_alteracoes.atividades_anterior IS 'Atividades antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.atividades_novo IS 'Atividades após a alteração';

-- Atualizar função de histórico para incluir atividades
CREATE OR REPLACE FUNCTION public.registrar_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_email TEXT := 'sistema@tjpb.jus.br';
  v_acao TEXT;
BEGIN
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
      observacoes_novo,
      atividades_novo
    ) VALUES (
      NEW.meta_id,
      v_usuario_email,
      NULL,
      v_acao,
      NEW.status,
      NEW.estimativa_cumprimento,
      NEW.pontos_estimados,
      NEW.acoes_planejadas,
      NEW.justificativa_parcial,
      NEW.link_evidencia,
      NEW.observacoes,
      NEW.atividades
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determinar o tipo específico de atualização
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_acao := 'atualizacao_status';
    ELSIF OLD.atividades IS DISTINCT FROM NEW.atividades THEN
      v_acao := 'atualizacao_atividades';
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
      observacoes_novo,
      atividades_anterior,
      atividades_novo
    ) VALUES (
      NEW.meta_id,
      v_usuario_email,
      NULL,
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
      NEW.observacoes,
      OLD.atividades,
      NEW.atividades
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Atualizar constraint de ação para incluir novo tipo
ALTER TABLE public.historico_alteracoes 
DROP CONSTRAINT IF EXISTS historico_alteracoes_acao_check;

ALTER TABLE public.historico_alteracoes
ADD CONSTRAINT historico_alteracoes_acao_check 
CHECK (acao IN ('criacao', 'atualizacao_status', 'atualizacao_atividades', 'adicao_evidencia', 'edicao_observacoes', 'atualizacao_completa'));

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Campo atividades adicionado com sucesso!';
  RAISE NOTICE '✅ Histórico atualizado para rastrear atividades';
  RAISE NOTICE '📝 Campo acoes_planejadas mantido para preservar dados históricos';
END $$;
