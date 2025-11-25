-- Adicionar coluna coordenador na tabela metas_base
ALTER TABLE public.metas_base 
ADD COLUMN coordenador TEXT;

-- Criar índice para melhor performance nas consultas por coordenador
CREATE INDEX idx_metas_base_coordenador ON public.metas_base(coordenador);

-- Comentário para documentação
COMMENT ON COLUMN public.metas_base.coordenador IS 'Nome do coordenador responsável pela meta';
