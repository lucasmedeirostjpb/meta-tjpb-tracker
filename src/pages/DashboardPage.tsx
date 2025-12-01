import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Award, LogOut, LogIn, AlertCircle, Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MetaCard from "@/components/MetaCard";
import MetaModal from "@/components/MetaModal";
import { getMetasWithUpdates } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";

interface Meta {
  id: string;
  eixo: string;
  item: string;
  artigo: string;
  requisito: string;
  descricao: string;
  pontos_aplicaveis: number;
  setor_executor: string;
  coordenador?: string;
  deadline: string;
  linha_planilha?: number;
  status?: string;
  link_evidencia?: string;
  observacoes?: string;
  update_id?: string;
  estimativa_cumprimento?: string;
  pontos_estimados?: number;
  percentual_cumprimento?: number;
  acoes_planejadas?: string;
  justificativa_parcial?: string;
}

const DashboardPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
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
      if (isMockMode) {
        // Usar dados mock
        const allMetas = getMetasWithUpdates();
        const coluna = tipo === 'coordenador' ? 'coordenador' : 'setor_executor';
        const filteredMetas = allMetas.filter(meta => meta[coluna] === nome);
        setMetas(filteredMetas);
      } else {
        // Usar API
        const coluna = tipo === 'coordenador' ? 'coordenador' : 'setor';
        const filters = { [coluna]: nome };
        
        const data = await api.getMetas(filters);
        setMetas(data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar metas:', error);
      toast.error('Erro ao carregar metas: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    const totalPontos = metas.reduce((sum, meta) => sum + meta.pontos_aplicaveis, 0);
    const pontosRecebidos = metas.reduce((sum, meta) => {
      // Usar pontos_estimados se disponível, senão calcular do percentual
      if (meta.pontos_estimados !== undefined && meta.pontos_estimados !== null) {
        return sum + meta.pontos_estimados;
      }
      // Fallback para cálculo via percentual
      const percentual = meta.percentual_cumprimento || 0;
      return sum + (meta.pontos_aplicaveis * percentual / 100);
    }, 0);

    return totalPontos > 0 ? (pontosRecebidos / totalPontos) * 100 : 0;
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
    const pontosRecebidos = setorMetas.reduce((sum, meta) => {
      const percentual = meta.percentual_cumprimento || 0;
      return sum + (meta.pontos_aplicaveis * percentual / 100);
    }, 0);
    return totalPontos > 0 ? (pontosRecebidos / totalPontos) * 100 : 0;
  };

  const handleMetaClick = (meta: Meta) => {
    if (!user && !isMockMode) {
      toast.info('Faça login para editar metas', {
        action: {
          label: 'Login',
          onClick: () => navigate('/login'),
        },
      });
      return;
    }
    setSelectedMeta(meta);
    setModalOpen(true);
  };

  const handleMetaUpdate = async () => {
    setModalOpen(false);
    if (isMockMode) {
      toast.info('Em modo mock, as alterações não são persistidas');
    }
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
      {/* Header Padronizado */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/consultar')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TJPB - Prêmio CNJ</h1>
                  <p className="text-xs text-gray-600">Qualidade 2026</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Badge variant="outline" className="gap-2">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    <span className="hidden sm:inline">{user.email}</span>
                    <span className="sm:hidden">Logado</span>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate('/login')} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{tipo === 'coordenador' ? 'Coordenação' : 'Setor'}</span>
          <span>/</span>
          <span className="font-medium text-foreground">{nome}</span>
        </div>

        {!user && !isMockMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Modo Consulta</p>
                <p className="text-sm text-blue-700 mt-1">
                  Você está visualizando as metas em modo somente leitura. 
                  <button 
                    onClick={() => navigate('/login')} 
                    className="underline font-medium ml-1"
                  >
                    Faça login
                  </button> para registrar prestações de contas.
                </p>
              </div>
            </div>
          </div>
        )}

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
              {metas.reduce((sum, m) => sum + ((m.percentual_cumprimento || 0) * m.pontos_aplicaveis / 100), 0).toFixed(1)} de{' '}
              {metas.reduce((sum, m) => sum + m.pontos_aplicaveis, 0)} pontos
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
                          {setorMetas.length} metas
                        </span>
                        <span>
                          {setorMetas.reduce((sum, m) => sum + ((m.percentual_cumprimento || 0) * m.pontos_aplicaveis / 100), 0).toFixed(1)}/
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