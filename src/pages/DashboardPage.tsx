import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Award } from "lucide-react";
import MetaCard from "@/components/MetaCard";
import MetaModal from "@/components/MetaModal";

interface Meta {
  id: string;
  eixo: string;
  item: string;
  subitem: string;
  descricao: string;
  pontos_aplicaveis: number;
  setor_executor: string;
  coordenador?: string;
  deadline: string;
  status?: string;
  link_evidencia?: string;
  observacoes?: string;
  update_id?: string;
}

const DashboardPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tipo = searchParams.get('tipo') || 'setor';
  const nome = searchParams.get('nome');
  
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeta, setSelectedMeta] = useState<Meta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!nome) {
      navigate('/setor-selection');
      return;
    }
    fetchMetas();
  }, [tipo, nome]);

  const fetchMetas = async () => {
    if (!nome) return;

    try {
      const coluna = tipo === 'coordenador' ? 'coordenador' : 'setor_executor';
      
      const { data: metasData, error: metasError } = await supabase
        .from('metas_base')
        .select('*')
        .eq(coluna, nome);

      if (metasError) throw metasError;

      const { data: updatesData, error: updatesError } = await supabase
        .from('updates')
        .select('*');

      if (updatesError) throw updatesError;

      const metasWithStatus = metasData.map(meta => {
        const update = updatesData?.find(u => u.meta_id === meta.id);
        return {
          ...meta,
          status: update?.status || 'Pendente',
          link_evidencia: update?.link_evidencia || '',
          observacoes: update?.observacoes || '',
          update_id: update?.id,
        };
      });

      setMetas(metasWithStatus);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast.error('Erro ao carregar as metas');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    const totalPontos = metas.reduce((sum, meta) => sum + meta.pontos_aplicaveis, 0);
    const pontosConcluidos = metas
      .filter(meta => meta.status === 'Concluído')
      .reduce((sum, meta) => sum + meta.pontos_aplicaveis, 0);

    return totalPontos > 0 ? (pontosConcluidos / totalPontos) * 100 : 0;
  };

  const groupByEixo = () => {
    const grupos: { [key: string]: Meta[] } = {};
    metas.forEach(meta => {
      // Remover numeração do início do eixo (ex: "1. Governança" -> "Governança")
      const eixoLimpo = meta.eixo.replace(/^\d+\.\s*/, '');
      if (!grupos[eixoLimpo]) {
        grupos[eixoLimpo] = [];
      }
      grupos[eixoLimpo].push(meta);
    });
    return grupos;
  };

  const groupBySetor = () => {
    const grupos: { [key: string]: Meta[] } = {};
    metas.forEach(meta => {
      const setor = meta.setor_executor || 'Sem Setor';
      if (!grupos[setor]) {
        grupos[setor] = [];
      }
      grupos[setor].push(meta);
    });
    return grupos;
  };

  const calculateSetorProgress = (setorMetas: Meta[]) => {
    const totalPontos = setorMetas.reduce((sum, meta) => sum + meta.pontos_aplicaveis, 0);
    const pontosConcluidos = setorMetas
      .filter(meta => meta.status === 'Concluído')
      .reduce((sum, meta) => sum + meta.pontos_aplicaveis, 0);
    return totalPontos > 0 ? (pontosConcluidos / totalPontos) * 100 : 0;
  };

  const handleMetaClick = (meta: Meta) => {
    setSelectedMeta(meta);
    setModalOpen(true);
  };

  const handleMetaUpdate = async () => {
    setModalOpen(false);
    await fetchMetas();
  };

  const progress = calculateProgress();
  const grupos = groupByEixo();
  const gruposSetor = tipo === 'coordenador' ? groupBySetor() : {};

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/setor-selection')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{nome}</h1>
            <p className="text-muted-foreground">
              {tipo === 'coordenador' ? 'Coordenação' : 'Setor'} - Prêmio CNJ de Qualidade TJPB 2026
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">
              Progresso {tipo === 'coordenador' ? 'da Coordenação' : 'do Setor'}
            </h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pontos conquistados</span>
              <span className="font-bold text-2xl text-primary">{progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {metas.filter(m => m.status === 'Concluído').length} de {metas.length} metas concluídas
            </p>
          </div>
        </div>

        {tipo === 'coordenador' && Object.keys(gruposSetor).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Consolidação por Setor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(gruposSetor).map(([setor, setorMetas]) => {
                const setorProgress = calculateSetorProgress(setorMetas);
                return (
                  <div key={setor} className="bg-card rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg line-clamp-2">{setor}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2">
                          {setorProgress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={setorProgress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {setorMetas.filter(m => m.status === 'Concluído').length}/{setorMetas.length} metas
                        </span>
                        <span>
                          {setorMetas.filter(m => m.status === 'Concluído').reduce((sum, m) => sum + m.pontos_aplicaveis, 0)}/
                          {setorMetas.reduce((sum, m) => sum + m.pontos_aplicaveis, 0)} pts
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(grupos).map(([eixo, metasDoEixo]) => (
            <div key={eixo} className="space-y-4">
              <h2 className="text-2xl font-bold sticky top-0 bg-background py-2 z-10">
                {eixo}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metasDoEixo.map(meta => (
                  <MetaCard
                    key={meta.id}
                    meta={meta}
                    onClick={() => handleMetaClick(meta)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <MetaModal
        meta={selectedMeta}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdate={handleMetaUpdate}
      />
    </div>
  );
};

export default DashboardPage;