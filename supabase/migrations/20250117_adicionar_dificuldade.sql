-- =====================================================
-- Adicionar campo de dificuldade
-- Data: 17/01/2026
-- =====================================================

-- Criar tipo ENUM para dificuldade
DO $$ BEGIN
  CREATE TYPE dificuldade_tipo AS ENUM ('Sem dificuldades', 'Alerta', 'Situação crítica');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna de dificuldade na tabela updates
ALTER TABLE public.updates
ADD COLUMN IF NOT EXISTS dificuldade dificuldade_tipo DEFAULT 'Sem dificuldades';

COMMENT ON COLUMN public.updates.dificuldade IS 'Nível de dificuldade: Sem dificuldades (verde), Alerta (amarelo), Situação crítica (vermelho)';

-- Adicionar colunas de dificuldade no histórico
ALTER TABLE public.historico_alteracoes
ADD COLUMN IF NOT EXISTS dificuldade_anterior dificuldade_tipo,
ADD COLUMN IF NOT EXISTS dificuldade_novo dificuldade_tipo;

COMMENT ON COLUMN public.historico_alteracoes.dificuldade_anterior IS 'Dificuldade antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.dificuldade_novo IS 'Dificuldade após a alteração';

-- Atualizar função de histórico para incluir dificuldade
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
      atividades_novo,
      dificuldade_novo
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
      NEW.atividades,
      NEW.dificuldade
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determinar o tipo específico de atualização
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_acao := 'atualizacao_status';
    ELSIF OLD.atividades IS DISTINCT FROM NEW.atividades THEN
      v_acao := 'atualizacao_atividades';
    ELSIF OLD.dificuldade IS DISTINCT FROM NEW.dificuldade THEN
      v_acao := 'atualizacao_dificuldade';
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
      atividades_novo,
      dificuldade_anterior,
      dificuldade_novo
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
      NEW.atividades,
      OLD.dificuldade,
      NEW.dificuldade
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
CHECK (acao IN ('criacao', 'atualizacao_status', 'atualizacao_atividades', 'atualizacao_dificuldade', 'adicao_evidencia', 'edicao_observacoes', 'atualizacao_completa'));

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Campo dificuldade adicionado com sucesso!';
  RAISE NOTICE '✅ Histórico atualizado para rastrear mudanças na dificuldade';
  RAISE NOTICE '🟢 Padrão: Sem dificuldades';
  RAISE NOTICE '🟡 Alerta';
  RAISE NOTICE '🔴 Situação crítica';
END $$;
