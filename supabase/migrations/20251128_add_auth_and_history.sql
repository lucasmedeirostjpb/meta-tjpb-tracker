-- =====================================================
-- Adicionar Autenticação e Sistema de Histórico
-- =====================================================

-- Tabela de histórico de alterações
CREATE TABLE public.historico_alteracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES public.metas_base(id) ON DELETE CASCADE,
  usuario_email TEXT NOT NULL,
  usuario_id UUID NOT NULL,
  acao TEXT NOT NULL CHECK (acao IN ('criacao', 'atualizacao_status', 'adicao_evidencia', 'edicao_observacoes')),
  status_anterior TEXT,
  status_novo TEXT,
  link_evidencia_anterior TEXT,
  link_evidencia_novo TEXT,
  observacoes_anterior TEXT,
  observacoes_novo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.historico_alteracoes IS 'Histórico completo de todas as alterações realizadas nas metas';
COMMENT ON COLUMN public.historico_alteracoes.meta_id IS 'Referência à meta alterada';
COMMENT ON COLUMN public.historico_alteracoes.usuario_email IS 'Email do usuário que realizou a alteração';
COMMENT ON COLUMN public.historico_alteracoes.usuario_id IS 'ID do usuário autenticado que realizou a alteração';
COMMENT ON COLUMN public.historico_alteracoes.acao IS 'Tipo de ação realizada';
COMMENT ON COLUMN public.historico_alteracoes.status_anterior IS 'Status antes da alteração';
COMMENT ON COLUMN public.historico_alteracoes.status_novo IS 'Status após a alteração';

-- Índices para performance
CREATE INDEX idx_historico_meta_id ON public.historico_alteracoes(meta_id);
CREATE INDEX idx_historico_usuario_id ON public.historico_alteracoes(usuario_id);
CREATE INDEX idx_historico_created_at ON public.historico_alteracoes(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.historico_alteracoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para histórico (apenas usuários autenticados podem ver)
CREATE POLICY "Permitir leitura histórico para autenticados" 
ON public.historico_alteracoes FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir inserção histórico para autenticados" 
ON public.historico_alteracoes FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND usuario_id = auth.uid());

-- Atualizar políticas das tabelas existentes para exigir autenticação em writes
-- Manter leitura pública, mas escrita apenas para autenticados

-- Remover políticas antigas de escrita (manter apenas leitura pública)
DROP POLICY IF EXISTS "Permitir inserção pública metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir atualização pública metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir exclusão pública metas_base" ON public.metas_base;

DROP POLICY IF EXISTS "Permitir inserção pública updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir atualização pública updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir exclusão pública updates" ON public.updates;

-- Criar novas políticas - escrita apenas para autenticados
CREATE POLICY "Permitir inserção autenticada metas_base" 
ON public.metas_base FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização autenticada metas_base" 
ON public.metas_base FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir exclusão autenticada metas_base" 
ON public.metas_base FOR DELETE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir inserção autenticada updates" 
ON public.updates FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir atualização autenticada updates" 
ON public.updates FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir exclusão autenticada updates" 
ON public.updates FOR DELETE 
USING (auth.uid() IS NOT NULL);

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
      link_evidencia_novo,
      observacoes_novo
    ) VALUES (
      NEW.meta_id,
      v_usuario_email,
      auth.uid(),
      v_acao,
      NEW.status,
      NEW.link_evidencia,
      NEW.observacoes
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determinar o tipo específico de atualização
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_acao := 'atualizacao_status';
    ELSIF OLD.link_evidencia IS DISTINCT FROM NEW.link_evidencia THEN
      v_acao := 'adicao_evidencia';
    ELSE
      v_acao := 'edicao_observacoes';
    END IF;
    
    INSERT INTO public.historico_alteracoes (
      meta_id,
      usuario_email,
      usuario_id,
      acao,
      status_anterior,
      status_novo,
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
      OLD.link_evidencia,
      NEW.link_evidencia,
      OLD.observacoes,
      NEW.observacoes
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar histórico automaticamente
CREATE TRIGGER trigger_registrar_historico
AFTER INSERT OR UPDATE ON public.updates
FOR EACH ROW
EXECUTE FUNCTION public.registrar_historico();

COMMENT ON FUNCTION public.registrar_historico() IS 'Registra automaticamente todas as alterações nas metas no histórico';
