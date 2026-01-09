-- =====================================================
-- Restaurar Sistema de Histórico (Sem Autenticação)
-- Recria trigger e função para registrar alterações
-- Data: 09/01/2026
-- =====================================================

-- Tornar usuario_id opcional (permitir NULL)
ALTER TABLE public.historico_alteracoes 
ALTER COLUMN usuario_id DROP NOT NULL;

-- Recriar a função registrar_historico SEM dependência de auth.uid()
CREATE OR REPLACE FUNCTION public.registrar_historico()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
      observacoes_novo
    ) VALUES (
      NEW.meta_id,
      'sistema@tjpb.jus.br', -- Email padrão para operações públicas
      NULL, -- Sem usuário autenticado
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
      'sistema@tjpb.jus.br', -- Email padrão para operações públicas
      NULL, -- Sem usuário autenticado
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

-- Recriar trigger na tabela updates
DROP TRIGGER IF EXISTS trigger_registrar_historico ON public.updates;

CREATE TRIGGER trigger_registrar_historico
AFTER INSERT OR UPDATE ON public.updates
FOR EACH ROW
EXECUTE FUNCTION public.registrar_historico();

-- Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE '✅ Função registrar_historico() recriada (sem autenticação)';
  RAISE NOTICE '✅ Trigger trigger_registrar_historico recriado na tabela updates';
  RAISE NOTICE '📝 Histórico agora será registrado automaticamente com usuário sistema@tjpb.jus.br';
END $$;
