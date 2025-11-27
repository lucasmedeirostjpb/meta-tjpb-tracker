-- =====================================================
-- Sistema de Acompanhamento de Metas CNJ - TJPB 2026
-- Migration Inicial Completa
-- =====================================================

-- Tabela de Dados Base (estrutura das metas)
CREATE TABLE public.metas_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eixo TEXT NOT NULL,
  item TEXT NOT NULL,
  artigo TEXT NOT NULL,
  requisito TEXT NOT NULL,
  descricao TEXT,
  pontos_aplicaveis INTEGER NOT NULL,
  setor_executor TEXT NOT NULL,
  coordenador TEXT,
  deadline DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários da tabela metas_base
COMMENT ON TABLE public.metas_base IS 'Tabela base com as metas do Prêmio CNJ de Qualidade TJPB 2026';
COMMENT ON COLUMN public.metas_base.eixo IS 'Eixo temático da meta (ex: Governança, Produtividade)';
COMMENT ON COLUMN public.metas_base.item IS 'Descrição do item da meta';
COMMENT ON COLUMN public.metas_base.artigo IS 'Artigo específico da meta';
COMMENT ON COLUMN public.metas_base.requisito IS 'Requisito associado ao artigo';
COMMENT ON COLUMN public.metas_base.descricao IS 'Descrição detalhada da meta';
COMMENT ON COLUMN public.metas_base.pontos_aplicaveis IS 'Pontuação que pode ser obtida com a meta';
COMMENT ON COLUMN public.metas_base.setor_executor IS 'Setor responsável pela execução da meta';
COMMENT ON COLUMN public.metas_base.coordenador IS 'Coordenador responsável pela meta';
COMMENT ON COLUMN public.metas_base.deadline IS 'Prazo final para conclusão da meta';

-- Tabela de Acompanhamento (status, evidências e observações)
CREATE TABLE public.updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES public.metas_base(id) ON DELETE CASCADE,
  setor_executor TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Em Andamento', 'Concluído')),
  link_evidencia TEXT,
  observacoes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(meta_id)
);

-- Comentários da tabela updates
COMMENT ON TABLE public.updates IS 'Tabela de acompanhamento do status e evidências das metas';
COMMENT ON COLUMN public.updates.meta_id IS 'Referência para a meta na tabela metas_base';
COMMENT ON COLUMN public.updates.setor_executor IS 'Setor que realizou a atualização';
COMMENT ON COLUMN public.updates.status IS 'Status atual da meta: Pendente, Em Andamento ou Concluído';
COMMENT ON COLUMN public.updates.link_evidencia IS 'URL com evidências da execução da meta';
COMMENT ON COLUMN public.updates.observacoes IS 'Observações sobre o andamento da meta';
COMMENT ON COLUMN public.updates.updated_at IS 'Data e hora da última atualização';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.metas_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Acesso público (sem autenticação)
-- Para adicionar autenticação futuramente, substitua 'true' por validações de auth.uid()

CREATE POLICY "Permitir leitura pública metas_base" 
ON public.metas_base FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção pública metas_base" 
ON public.metas_base FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública metas_base" 
ON public.metas_base FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão pública metas_base" 
ON public.metas_base FOR DELETE 
USING (true);

CREATE POLICY "Permitir leitura pública updates" 
ON public.updates FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção pública updates" 
ON public.updates FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública updates" 
ON public.updates FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão pública updates" 
ON public.updates FOR DELETE 
USING (true);

-- Índices para melhor performance
CREATE INDEX idx_metas_base_setor ON public.metas_base(setor_executor);
CREATE INDEX idx_metas_base_coordenador ON public.metas_base(coordenador);
CREATE INDEX idx_metas_base_eixo ON public.metas_base(eixo);
CREATE INDEX idx_metas_base_artigo ON public.metas_base(artigo);
CREATE INDEX idx_metas_base_requisito ON public.metas_base(requisito);
CREATE INDEX idx_metas_base_deadline ON public.metas_base(deadline);
CREATE INDEX idx_updates_meta_id ON public.updates(meta_id);
CREATE INDEX idx_updates_status ON public.updates(status);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_updates_updated_at
BEFORE UPDATE ON public.updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário da função
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Atualiza automaticamente o campo updated_at quando um registro é modificado';
