import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Award, AlertCircle, Scale, LogOut, Target } from "lucide-react";
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
  estimativa_maxima?: number;
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
    
    // Pontos efetivados (Totalmente + Parcialmente Cumprido)
    const pontosRecebidos = metas.reduce((sum, meta) => {
      if (meta.estimativa_cumprimento === 'Totalmente Cumprido') {
        return sum + meta.pontos_aplicaveis;
      } else if (meta.estimativa_cumprimento === 'Parcialmente Cumprido' && meta.pontos_estimados) {
        return sum + meta.pontos_estimados;
      }
      return sum;
    }, 0);

    // Pontos estimados (Em Andamento)
    const pontosEstimados = metas.reduce((sum, meta) => {
      if (meta.estimativa_cumprimento === 'Em Andamento' && meta.pontos_estimados) {
        return sum + meta.pontos_estimados;
      }
      return sum;
    }, 0);

    // Pontos máximos possíveis (para TODAS as metas)
    const pontosMaximos = metas.reduce((sum, meta) => {
      if (meta.estimativa_cumprimento === 'Em Andamento' && meta.estimativa_maxima !== undefined && meta.estimativa_maxima !== null) {
        return sum + meta.estimativa_maxima;
      } else if (meta.estimativa_cumprimento === 'Não Cumprido') {
        // Verificar se tem evidências válidas (mínimo 5 caracteres)
        const temEvidencia = meta.link_evidencia && meta.link_evidencia.trim().length >= 5;
        if (temEvidencia) {
          // Não Cumprido REAL (com evidências): usar estimativa_maxima ou 0 (todos perdidos)
          return sum + (meta.estimativa_maxima !== undefined && meta.estimativa_maxima !== null ? meta.estimativa_maxima : 0);
        }
        // Se não tem evidências, é "Pendente", não compromete pontos
        return sum + meta.pontos_aplicaveis;
      } else {
        return sum + meta.pontos_aplicaveis;
      }
    }, 0);

    return {
      total: totalPontos,
      recebidos: pontosRecebidos,
      estimados: pontosEstimados,
      maximos: pontosMaximos,
      totalComEstimados: pontosRecebidos + pontosEstimados,
      percentual: totalPontos > 0 ? (pontosRecebidos / totalPontos) * 100 : 0,
      percentualComEstimados: totalPontos > 0 ? ((pontosRecebidos + pontosEstimados) / totalPontos) * 100 : 0,
      percentualMaximo: totalPontos > 0 ? (pontosMaximos / totalPontos) * 100 : 0,
    };
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
    
    // Pontos recebidos
    const pontosRecebidos = setorMetas.reduce((sum, meta) => {
      if (meta.estimativa_cumprimento === 'Totalmente Cumprido') {
        return sum + meta.pontos_aplicaveis;
      } else if (meta.estimativa_cumprimento === 'Parcialmente Cumprido' && meta.pontos_estimados) {
        return sum + meta.pontos_estimados;
      }
      return sum;
    }, 0);
    
    // Pontos máximos possíveis
    const pontosMaximos = setorMetas.reduce((sum, meta) => {
      if (meta.estimativa_cumprimento === 'Em Andamento' && meta.estimativa_maxima !== undefined && meta.estimativa_maxima !== null) {
        return sum + meta.estimativa_maxima;
      } else if (meta.estimativa_cumprimento === 'Não Cumprido') {
        // Verificar se tem evidências válidas (mínimo 5 caracteres)
        const temEvidencia = meta.link_evidencia && meta.link_evidencia.trim().length >= 5;
        if (temEvidencia) {
          // Não Cumprido REAL (com evidências): usar estimativa_maxima ou 0 (todos perdidos)
          return sum + (meta.estimativa_maxima !== undefined && meta.estimativa_maxima !== null ? meta.estimativa_maxima : 0);
        }
        // Se não tem evidências, é "Pendente", não compromete pontos
        return sum + meta.pontos_aplicaveis;
      } else {
        return sum + meta.pontos_aplicaveis;
      }
    }, 0);
    
    return {
      percentual: totalPontos > 0 ? (pontosRecebidos / totalPontos) * 100 : 0,
      percentualMaximo: totalPontos > 0 ? (pontosMaximos / totalPontos) * 100 : 0,
      recebidos: pontosRecebidos,
      maximos: pontosMaximos,
      total: totalPontos,
    };
  };

  const handleMetaClick = (meta: Meta) => {
    setSelectedMeta(meta);
    setModalOpen(true);
  };

  const handleMetaUpdate = async () => {
    setModalOpen(false);
    if (isMockMode) {
      toast.info('Em modo mock, as alterações não são persistidas');
    }
    // Removido: await fetchMetas();
    // A meta já foi atualizada no modal, não precisa recarregar tudo
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
                onClick={() => navigate('/consultar')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Eficiência em Ação</h1>
                  <p className="text-xs text-gray-600">TJPB - Prêmio CNJ 2026</p>
                </div>
              </div>
            </div>
            
            {/* Informações do usuário */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            )}
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

        {/* Performance Geral */}
        <div className="bg-card rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">
              Progresso {tipo === 'coordenador' ? 'da Coordenação' : 'do Setor'}
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Performance Geral</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {progress.percentual.toFixed(1)}%
                  {progress.percentualMaximo < 100 && (
                    <span className="text-sm text-red-600 font-semibold ml-2">
                      (máx: {progress.percentualMaximo.toFixed(1)}%)
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  {Math.round(progress.recebidos)} pts efetivados
                </p>
              </div>
            </div>
            
            {/* Barra de progresso */}
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              {/* Parte verde - pontos efetivados */}
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress.percentual, 100)}%` }}
              />
              {/* Parte azul - pontos estimados (sobreposta) */}
              {progress.estimados > 0 && (
                <div
                  className="absolute top-0 left-0 h-full bg-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress.percentualComEstimados, 100)}%` }}
                />
              )}
              {/* Linha vermelha indicando limite máximo */}
              {progress.percentualMaximo < 100 && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-red-600 z-10"
                  style={{ left: `${Math.min(progress.percentualMaximo, 99)}%` }}
                  title={`Máximo possível: ${progress.percentualMaximo.toFixed(1)}%`}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
                </div>
              )}
            </div>
            
            {/* Legenda */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Efetivados: {Math.round(progress.recebidos)} pts</span>
                </div>
                {progress.estimados > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <span>Estimados: {Math.round(progress.estimados)} pts</span>
                  </div>
                )}
              </div>
              <span className="font-semibold">
                {Math.round(progress.recebidos)} / {progress.total} pts
                {progress.estimados > 0 && (
                  <span className="text-blue-600 ml-1">
                    (com estimados: {Math.round(progress.totalComEstimados)})
                  </span>
                )}
                {progress.percentualMaximo < 100 && (
                  <span className="text-red-600 ml-1">
                    | máx: {Math.round(progress.maximos)}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {tipo === 'coordenador' && Object.keys(gruposSetor).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Consolidação por Setor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(gruposSetor).map(([setor, setorMetas]) => {
                const setorProgress = calculateSetorProgress(setorMetas);
                const hasLimit = setorProgress.percentualMaximo < 100;
                
                return (
                  <div key={setor} className="bg-card rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg line-clamp-2">{setor}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2">
                          {setorProgress.percentual.toFixed(0)}%
                          {hasLimit && (
                            <span className="text-red-600 ml-1">
                              (máx: {setorProgress.percentualMaximo.toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      
                      {/* Barra de progresso com linha vermelha */}
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(setorProgress.percentual, 100)}%` }}
                        />
                        {/* Linha vermelha indicando limite máximo */}
                        {hasLimit && setorProgress.percentualMaximo < 100 && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10"
                            style={{ left: `${Math.min(setorProgress.percentualMaximo, 99)}%` }}
                            title={`Máximo possível: ${setorProgress.percentualMaximo.toFixed(1)}%`}
                          >
                            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                            <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {setorMetas.length} metas
                        </span>
                        <span>
                          {Math.round(setorProgress.recebidos)}/{setorProgress.total} pts
                          {hasLimit && (
                            <span className="text-red-600 ml-1">
                              (máx: {Math.round(setorProgress.maximos)})
                            </span>
                          )}
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