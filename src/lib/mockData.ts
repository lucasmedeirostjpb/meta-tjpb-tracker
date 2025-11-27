// Dados fictícios para modo mock/demonstração

export const mockMetas = [
  {
    id: 'mock-1',
    eixo: '1. Governança e Gestão Judiciária',
    item: 'Planejamento Estratégico',
    artigo: 'Art. 1º',
    requisito: 'I - Implementar sistema de gestão de processos',
    descricao: 'Implementar e manter atualizado o sistema de gestão de processos judiciais com integração completa.',
    pontos_aplicaveis: 10,
    setor_executor: 'Tecnologia da Informação',
    coordenador: 'Maria Silva',
    deadline: '2026-12-31',
    created_at: '2025-11-27T00:00:00Z',
  },
  {
    id: 'mock-2',
    eixo: '1. Governança e Gestão Judiciária',
    item: 'Gestão de Pessoas',
    artigo: 'Art. 2º',
    requisito: 'II - Capacitação de servidores',
    descricao: 'Desenvolver programa de capacitação continuada para servidores do tribunal.',
    pontos_aplicaveis: 15,
    setor_executor: 'Recursos Humanos',
    coordenador: 'João Santos',
    deadline: '2026-06-30',
    created_at: '2025-11-27T00:00:00Z',
  },
  {
    id: 'mock-3',
    eixo: '2. Produtividade e Otimização',
    item: 'Automação de Processos',
    artigo: 'Art. 3º',
    requisito: 'I - Implementar RPA',
    descricao: 'Implementar soluções de automação robótica de processos (RPA) para atividades repetitivas.',
    pontos_aplicaveis: 20,
    setor_executor: 'Tecnologia da Informação',
    coordenador: 'Maria Silva',
    deadline: '2026-09-30',
    created_at: '2025-11-27T00:00:00Z',
  },
  {
    id: 'mock-4',
    eixo: '2. Produtividade e Otimização',
    item: 'Gestão de Acervo',
    artigo: 'Art. 4º',
    requisito: 'III - Reduzir acervo',
    descricao: 'Implementar estratégias para redução do acervo processual em 10%.',
    pontos_aplicaveis: 25,
    setor_executor: 'Gestão de Processos',
    coordenador: 'Pedro Oliveira',
    deadline: '2026-12-31',
    created_at: '2025-11-27T00:00:00Z',
  },
  {
    id: 'mock-5',
    eixo: '3. Gestão de Dados e Informação',
    item: 'Transparência',
    artigo: 'Art. 5º',
    requisito: 'I - Portal de transparência',
    descricao: 'Criar portal de transparência com dados atualizados sobre o tribunal.',
    pontos_aplicaveis: 12,
    setor_executor: 'Comunicação Social',
    coordenador: 'Ana Costa',
    deadline: '2026-03-31',
    created_at: '2025-11-27T00:00:00Z',
  },
  {
    id: 'mock-6',
    eixo: '3. Gestão de Dados e Informação',
    item: 'Business Intelligence',
    artigo: 'Art. 6º',
    requisito: 'II - Dashboard gerencial',
    descricao: 'Implementar dashboard com indicadores estratégicos para gestores.',
    pontos_aplicaveis: 18,
    setor_executor: 'Tecnologia da Informação',
    coordenador: 'Maria Silva',
    deadline: '2026-08-31',
    created_at: '2025-11-27T00:00:00Z',
  },
  {
    id: 'mock-7',
    eixo: '4. Sustentabilidade e Responsabilidade Social',
    item: 'Sustentabilidade Ambiental',
    artigo: 'Art. 7º',
    requisito: 'I - Programa de reciclagem',
    descricao: 'Implementar programa de reciclagem e redução de consumo de papel.',
    pontos_aplicaveis: 8,
    setor_executor: 'Administração',
    coordenador: 'Carlos Mendes',
    deadline: '2026-05-31',
    created_at: '2025-11-27T00:00:00Z',
  },
  {
    id: 'mock-8',
    eixo: '4. Sustentabilidade e Responsabilidade Social',
    item: 'Acessibilidade',
    artigo: 'Art. 8º',
    requisito: 'II - Adaptações estruturais',
    descricao: 'Realizar adaptações para garantir acessibilidade plena em todas as unidades.',
    pontos_aplicaveis: 14,
    setor_executor: 'Infraestrutura',
    coordenador: 'Carlos Mendes',
    deadline: '2026-10-31',
    created_at: '2025-11-27T00:00:00Z',
  },
];

export const mockUpdates = [
  {
    id: 'update-1',
    meta_id: 'mock-1',
    setor_executor: 'Tecnologia da Informação',
    status: 'Em Andamento',
    link_evidencia: 'https://exemplo.com/evidencia1',
    observacoes: 'Sistema 70% implementado. Fase de testes em andamento.',
    updated_at: '2025-11-20T10:30:00Z',
  },
  {
    id: 'update-2',
    meta_id: 'mock-2',
    setor_executor: 'Recursos Humanos',
    status: 'Concluído',
    link_evidencia: 'https://exemplo.com/evidencia2',
    observacoes: 'Programa de capacitação finalizado com sucesso. 95% dos servidores participaram.',
    updated_at: '2025-11-15T14:20:00Z',
  },
  {
    id: 'update-3',
    meta_id: 'mock-3',
    setor_executor: 'Tecnologia da Informação',
    status: 'Pendente',
    link_evidencia: '',
    observacoes: 'Aguardando aprovação de orçamento para contratação da solução RPA.',
    updated_at: '2025-11-10T09:00:00Z',
  },
  {
    id: 'update-4',
    meta_id: 'mock-5',
    setor_executor: 'Comunicação Social',
    status: 'Em Andamento',
    link_evidencia: 'https://exemplo.com/evidencia5',
    observacoes: 'Portal 50% desenvolvido. Previsão de lançamento em janeiro.',
    updated_at: '2025-11-25T16:45:00Z',
  },
];

export const mockSetores = [
  'Tecnologia da Informação',
  'Recursos Humanos',
  'Gestão de Processos',
  'Comunicação Social',
  'Administração',
  'Infraestrutura',
];

export const mockCoordenadores = [
  'Maria Silva',
  'João Santos',
  'Pedro Oliveira',
  'Ana Costa',
  'Carlos Mendes',
];

// Função para obter metas com updates
export const getMetasWithUpdates = () => {
  return mockMetas.map(meta => {
    const update = mockUpdates.find(u => u.meta_id === meta.id);
    return {
      ...meta,
      status: update?.status || 'Pendente',
      link_evidencia: update?.link_evidencia || '',
      observacoes: update?.observacoes || '',
      update_id: update?.id,
    };
  });
};

// Função para obter setores únicos
export const getSetoresUnicos = () => {
  return [...new Set(mockMetas.map(m => m.setor_executor))].sort();
};

// Função para obter coordenadores únicos
export const getCoordenadoresUnicos = () => {
  return [...new Set(mockMetas.map(m => m.coordenador).filter(Boolean))].sort();
};
