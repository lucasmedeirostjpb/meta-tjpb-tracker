-- Adiciona campo estimativa_maxima para requisitos em andamento
-- Este campo permite registrar o máximo de pontos possíveis considerando pontos já perdidos

ALTER TABLE public.updates
ADD COLUMN IF NOT EXISTS estimativa_maxima NUMERIC(5,2);

COMMENT ON COLUMN public.updates.estimativa_maxima IS 'Estimativa máxima de pontos alcançáveis, considerando pontos já prejudicados/perdidos. Usado para requisitos "Em Andamento".';

-- Para metas existentes com "Em Andamento", se não houver estimativa_maxima, usar pontos_aplicaveis da meta
-- Isso será tratado via aplicação para garantir a integridade referencial
