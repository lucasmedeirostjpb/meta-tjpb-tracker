-- =====================================================
-- Remover Requisitos de Autenticação
-- Permite operações públicas em todas as tabelas
-- Data: 11/12/2025
-- =====================================================

-- Remover políticas antigas de metas_base
DROP POLICY IF EXISTS "Permitir leitura pública metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir inserção autenticada metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir atualização autenticada metas_base" ON public.metas_base;
DROP POLICY IF EXISTS "Permitir exclusão autenticada metas_base" ON public.metas_base;

-- Remover políticas antigas de updates
DROP POLICY IF EXISTS "Permitir leitura pública updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir inserção autenticada updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir atualização autenticada updates" ON public.updates;
DROP POLICY IF EXISTS "Permitir exclusão autenticada updates" ON public.updates;

-- Criar políticas públicas (sem autenticação) para metas_base
CREATE POLICY "Permitir todas operações públicas metas_base" 
ON public.metas_base 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Criar políticas públicas (sem autenticação) para updates
CREATE POLICY "Permitir todas operações públicas updates" 
ON public.updates 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Remover trigger de histórico se existir
DROP TRIGGER IF EXISTS trigger_registrar_historico ON public.updates;

-- Remover função de histórico se existir
DROP FUNCTION IF EXISTS public.registrar_historico_alteracao() CASCADE;

-- Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas atualizadas: operações públicas habilitadas';
  RAISE NOTICE '✅ Trigger e função de histórico removidos';
  RAISE NOTICE '⚠️ ATENÇÃO: Sistema agora permite alterações sem autenticação';
END $$;
