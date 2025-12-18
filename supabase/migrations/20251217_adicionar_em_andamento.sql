-- Migration: Adicionar "Em Andamento" como opção de estimativa_cumprimento
-- Data: 2025-12-17
-- Descrição: Permite que coordenadores marquem requisitos como "Em Andamento"

-- Remover constraint antiga
ALTER TABLE public.updates 
DROP CONSTRAINT IF EXISTS updates_estimativa_cumprimento_check;

-- Adicionar nova constraint com "Em Andamento"
ALTER TABLE public.updates 
ADD CONSTRAINT updates_estimativa_cumprimento_check 
CHECK (estimativa_cumprimento IN ('Totalmente Cumprido', 'Parcialmente Cumprido', 'Em Andamento', 'Não Cumprido', 'Não se Aplica'));
