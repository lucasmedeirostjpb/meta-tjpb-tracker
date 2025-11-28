-- Adicionar coluna linha_planilha para manter a ordem da planilha original
ALTER TABLE public.metas_base 
ADD COLUMN IF NOT EXISTS linha_planilha INTEGER;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_metas_base_linha_planilha ON public.metas_base(linha_planilha);

-- Comentário
COMMENT ON COLUMN public.metas_base.linha_planilha IS 'Número da linha na planilha original (para manter ordem de exportação)';
