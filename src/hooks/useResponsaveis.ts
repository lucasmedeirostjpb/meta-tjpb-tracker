import { useState, useEffect } from 'react';
import { api } from '@/services/api';

export const useResponsaveis = () => {
  const [responsaveis, setResponsaveis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponsaveis();
  }, []);

  const fetchResponsaveis = async () => {
    try {
      const metas = await api.getMetas();
      const responsaveisUnicos = new Set<string>();

      metas.forEach((meta) => {
        if (meta.atividades && meta.atividades.length > 0) {
          meta.atividades.forEach((atividade) => {
            if (atividade.responsavel && atividade.responsavel.trim()) {
              responsaveisUnicos.add(atividade.responsavel.trim());
            }
          });
        }
      });

      setResponsaveis(Array.from(responsaveisUnicos).sort());
    } catch (error) {
      console.error('Erro ao buscar responsáveis:', error);
    } finally {
      setLoading(false);
    }
  };

  return { responsaveis, loading, refetch: fetchResponsaveis };
};
