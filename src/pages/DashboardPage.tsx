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
  deadline: string;
  status?: string;
  link_evidencia?: string;
  observacoes?: string;
  update_id?: string;
}

const DashboardPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setor = searchParams.get('setor');
  
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeta, setSelectedMeta] = useState<Meta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!setor) {
      navigate('/setor-selection');
      return;
    }
    fetchMetas();
  }, [setor]);

  const fetchMetas = async () => {
    if (!setor) return;

    try {
      const { data: metasData, error: metasError } = await supabase
        .from('metas_base')
        .select('*')
        .eq('setor_executor', setor);

      if (metasError) throw metasError;

      const { data: updatesData, error: updatesError } = await supabase
        .from('updates')
        .select('*')
        .eq('setor_executor', setor);

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
      if (!grupos[meta.eixo]) {
        grupos[meta.eixo] = [];
      }
      grupos[meta.eixo].push(meta);
    });
    return grupos;
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
            <h1 className="text-3xl font-bold">{setor}</h1>
            <p className="text-muted-foreground">Prêmio CNJ de Qualidade TJPB 2026</p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Progresso do Setor</h2>
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