-- =====================================================
-- Atualização da Tabela historico_alteracoes
-- Adiciona campos para rastreamento completo de alterações
-- Data: 01/12/2025
-- =====================================================

-- Adicionar novos campos à tabela historico_alteracoes
ALTER TABLE public.historico_alteracoes
ADD COLUMN IF NOT EXISTS estimativa_cumprimento_anterior TEXT,
ADD COLUMN IF NOT EXISTS estimativa_cumprimento_novo TEXT,
ADD COLUMN IF NOT EXISTS pontos_estimados_anterior NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS pontos_estimados_novo NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS acoes_planejadas_anterior TEXT,
ADD COLUMN IF NOT EXISTS acoes_planejadas_novo TEXT,
ADD COLUMN IF NOT EXISTS justificativa_parcial_anterior TEXT,
ADD COLUMN IF NOT EXISTS justificativa_parcial_novo TEXT;

-- Atualizar constraint de acao para incluir novo tipo
ALTER TABLE public.historico_alteracoes 
DROP CONSTRAINT IF EXISTS historico_alteracoes_acao_check;

ALTER TABLE public.historico_alteracoes
ADD CONSTRAINT historico_alteracoes_acao_check 
CHECK (acao IN ('criacao', 'atualizacao_status', 'adicao_evidencia', 'edicao_observacoes', 'atualizacao_completa'));

-- Adicionar comentários aos novos campos
COMMENT ON COLUMN public.historico_alteracoes.estimativa_cumprimento_anterior IS 'Estimativa de cumprimento antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.estimativa_cumprimento_novo IS 'Estimativa de cumprimento após a alteração';
COMMENT ON COLUMN public.historico_alteracoes.pontos_estimados_anterior IS 'Pontos estimados antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.pontos_estimados_novo IS 'Pontos estimados após a alteração';
COMMENT ON COLUMN public.historico_alteracoes.acoes_planejadas_anterior IS 'Ações planejadas antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.acoes_planejadas_novo IS 'Ações planejadas após a alteração';
COMMENT ON COLUMN public.historico_alteracoes.justificativa_parcial_anterior IS 'Justificativa antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.justificativa_parcial_novo IS 'Justificativa após a alteração';

-- Recriar a função registrar_historico com todos os campos
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

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Tabela historico_alteracoes atualizada com sucesso!';
  RAISE NOTICE 'Novos campos: estimativa_cumprimento, pontos_estimados, acoes_planejadas, justificativa_parcial';
  RAISE NOTICE 'Função registrar_historico() atualizada para rastrear todas as alterações';
END $$;
