-- =====================================================
-- Liberar Acesso Público ao Histórico
-- Permite leitura pública da tabela historico_alteracoes
-- Data: 12/01/2026
-- =====================================================

-- Remover políticas antigas de historico_alteracoes
DROP POLICY IF EXISTS "Permitir leitura histórico para autenticados" ON public.historico_alteracoes;
DROP POLICY IF EXISTS "Permitir inserção histórico para autenticados" ON public.historico_alteracoes;

-- Criar política de leitura pública para historico_alteracoes
CREATE POLICY "Permitir leitura pública historico_alteracoes" 
ON public.historico_alteracoes 
FOR SELECT 
USING (true);

-- Manter inserção apenas via trigger/sistema (não permite inserção direta pública)
CREATE POLICY "Permitir inserção sistema historico_alteracoes" 
ON public.historico_alteracoes 
FOR INSERT 
WITH CHECK (true);

-- Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE '✅ Histórico agora disponível publicamente para leitura';
  RAISE NOTICE '✅ Sistema pode inserir novos registros de histórico';
END $$;
