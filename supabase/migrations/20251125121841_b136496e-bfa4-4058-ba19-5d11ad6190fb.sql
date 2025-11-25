-- Criação das tabelas para o sistema de acompanhamento de metas CNJ

-- Tabela de Dados Base (estrutura das metas)
CREATE TABLE public.metas_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eixo TEXT NOT NULL,
  item TEXT NOT NULL,
  subitem TEXT NOT NULL,
  descricao TEXT,
  pontos_aplicaveis INTEGER NOT NULL,
  setor_executor TEXT NOT NULL,
  deadline DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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

-- Habilitar RLS
ALTER TABLE public.metas_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso público para simplificar - sem autenticação necessária)
CREATE POLICY "Permitir leitura pública metas_base" 
ON public.metas_base FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção pública metas_base" 
ON public.metas_base FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir leitura pública updates" 
ON public.updates FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção pública updates" 
ON public.updates FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública updates" 
ON public.updates FOR UPDATE 
USING (true);

-- Criar índices para melhor performance
CREATE INDEX idx_metas_base_setor ON public.metas_base(setor_executor);
CREATE INDEX idx_metas_base_eixo ON public.metas_base(eixo);
CREATE INDEX idx_updates_meta_id ON public.updates(meta_id);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_updates_updated_at
BEFORE UPDATE ON public.updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();