import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Scale, 
  Users, 
  Building2, 
  Target,
  LogOut,
  LogIn,
  Edit,
  Award
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MetaCard from "@/components/MetaCard";
import MetaModal from "@/components/MetaModal";
import { getMetasWithUpdates } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

const VisaoAgregadaPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  
  const [searchParams] = useSearchParams();
  const tipoConsolidacao = searchParams.get('tipo') || 'coordenador'; // 'coordenador' ou 'setor'
  
  const [metas, setMetas] = useState<Meta[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<Meta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetas();
  }, []);

  const loadMetas = async () => {
    console.log('🔄 [VISAO AGREGADA] Iniciando carregamento de todas as metas');
    setLoading(true);
    try {
      if (isMockMode) {
        console.log('🎭 [VISAO AGREGADA] Usando modo MOCK');
        const data = getMetasWithUpdates();
        setMetas(data);
      } else {
        console.log('🌐 [VISAO AGREGADA] Usando Supabase REAL');
        const data = await api.getMetas();
        setMetas(data);
      }
    } catch (error: any) {
      console.error('❌ [VISAO AGREGADA] Erro ao carregar metas:', error);
      toast.error('Erro ao carregar dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  // Agrupar por Coordenador ou Setor
  const groupByAgrupador = () => {
    const grupos: Record<string, Meta[]> = {};

    metas.forEach(meta => {
      const agrupador = tipoConsolidacao === 'coordenador' 
        ? (meta.coordenador || 'Sem Coordenador')
        : (meta.setor_executor || 'Sem Setor');

      if (!grupos[agrupador]) {
        grupos[agrupador] = [];
      }
      grupos[agrupador].push(meta);
    });

    return grupos;
  };

  // Agrupar metas por eixo dentro de um agrupador
  const groupByEixo = (metasAgrupador: Meta[]) => {
    const grupos: Record<string, Meta[]> = {};
    
    metasAgrupador.forEach(meta => {
      const eixoLimpo = meta.eixo.replace(/^\d+\.\s*/, '');
      if (!grupos[eixoLimpo]) {
        grupos[eixoLimpo] = [];
      }
      grupos[eixoLimpo].push(meta);
    });

    return grupos;
  };

  const calculateProgress = (metasSubset: Meta[]) => {
    if (metasSubset.length === 0) return 0;
    
    const pontosRecebidos = metasSubset.reduce((sum, m) => {
      // Usar pontos_estimados se disponível, senão calcular do percentual
      if (m.pontos_estimados !== undefined && m.pontos_estimados !== null) {
        return sum + m.pontos_estimados;
      }
      // Fallback para cálculo via percentual
      const percentual = m.percentual_cumprimento || 0;
      return sum + (percentual * m.pontos_aplicaveis / 100);
    }, 0);
    
    const pontosAplicaveis = metasSubset.reduce((sum, m) => sum + m.pontos_aplicaveis, 0);
    
    return pontosAplicaveis > 0 ? (pontosRecebidos / pontosAplicaveis) * 100 : 0;
  };

  const getTotalPontos = (metasSubset: Meta[]) => {
    const pontosRecebidos = metasSubset.reduce((sum, m) => {
      // Usar pontos_estimados se disponível, senão calcular do percentual
      if (m.pontos_estimados !== undefined && m.pontos_estimados !== null) {
        return sum + m.pontos_estimados;
      }
      // Fallback para cálculo via percentual
      const percentual = m.percentual_cumprimento || 0;
      return sum + (percentual * m.pontos_aplicaveis / 100);
    }, 0);
    const pontosAplicaveis = metasSubset.reduce((sum, m) => sum + m.pontos_aplicaveis, 0);
    return { recebidos: pontosRecebidos, aplicaveis: pontosAplicaveis };
  };

  const getEixoColor = (eixo: string) => {
    const eixoLower = eixo.toLowerCase();
    
    // Eixo 1: Governança - Azul
    if (eixoLower.includes('governança')) {
      return 'blue';
    }
    
    // Eixo 2: Produtividade - Verde
    if (eixoLower.includes('produtividade')) {
      return 'green';
    }
    
    // Eixo 3: Transparência - Roxo/Purple
    if (eixoLower.includes('transparência') || eixoLower.includes('transparencia')) {
      return 'purple';
    }
    
    // Eixo 4: Dados e Tecnologia - Laranja
    if (eixoLower.includes('dados') || eixoLower.includes('tecnologia')) {
      return 'orange';
    }
    
    return 'gray';
  };

  const handleMetaClick = (meta: Meta) => {
    setSelectedMeta(meta);
    setModalOpen(true);
  };

  const grupos = groupByAgrupador();
  const totalGeral = getTotalPontos(metas);
  const progressoGeral = calculateProgress(metas);

  const totalAgrupadores = Object.keys(grupos).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
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
                  <p className="text-xs text-gray-600">
                    TJPB - Consolidado por {tipoConsolidacao === 'coordenador' ? 'Coordenador' : 'Setor'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Toggle de tipo de consolidação */}
              <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={tipoConsolidacao === 'coordenador' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/consolidado?tipo=coordenador')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Coordenador
                </Button>
                <Button
                  variant={tipoConsolidacao === 'setor' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate('/consolidado?tipo=setor')}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Setor
                </Button>
              </div>
              
              {/* Informações do usuário ou Login */}
              {user ? (
                <>
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate('/minhas-metas')}
                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Minhas Metas</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header com Informações Gerais */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
              {tipoConsolidacao === 'coordenador' ? (
                <Users className="h-8 w-8 text-blue-600" />
              ) : (
                <Building2 className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Visão Consolidada - {tipoConsolidacao === 'coordenador' ? 'Por Coordenador' : 'Por Setor'}
              </h2>
              <p className="text-gray-600">Eficiência em Ação - Prêmio CNJ de Qualidade 2026</p>
              <p className="text-xs text-blue-700 font-semibold italic mt-1">
                Unidos por resultados: TJPB no padrão Excelência
              </p>
            </div>
          </div>

          {/* Progresso Geral */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Progresso Geral</span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {progressoGeral.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  {Math.round(totalGeral.recebidos)} / {totalGeral.aplicaveis} pts
                </p>
              </div>
            </div>
            <Progress value={progressoGeral} className="h-3" />
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            {tipoConsolidacao === 'coordenador' ? (
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            ) : (
              <Building2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            )}
            <p className="text-2xl font-bold text-gray-900">{totalAgrupadores}</p>
            <p className="text-sm text-gray-600">{tipoConsolidacao === 'coordenador' ? 'Coordenadores' : 'Setores'}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{metas.length}</p>
            <p className="text-sm text-gray-600">Requisitos</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {totalGeral.recebidos.toFixed(0)}
            </p>
            <p className="text-sm text-gray-600">Pontos Alcançados</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <Scale className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {totalGeral.aplicaveis}
            </p>
            <p className="text-sm text-gray-600">Pontos Totais</p>
          </div>
        </div>

        {/* Legenda de Cores dos Eixos */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Legenda dos Eixos Temáticos:</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-700">Governança</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">Produtividade</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-700">Transparência</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-700">Dados e Tecnologia</span>
            </div>
          </div>
        </div>

        {/* Lista de Coordenadores/Setores */}
        <div className="space-y-4">
          <Accordion type="multiple" className="space-y-4">
            {Object.entries(grupos)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([agrupador, metasAgrupador]) => {
                const progressoAgrupador = calculateProgress(metasAgrupador);
                const pontosAgrupador = getTotalPontos(metasAgrupador);

                return (
                  <AccordionItem 
                    key={agrupador} 
                    value={agrupador}
                    className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3 text-left">
                          {tipoConsolidacao === 'coordenador' ? (
                            <Users className="h-6 w-6 text-blue-600 flex-shrink-0" />
                          ) : (
                            <Building2 className="h-6 w-6 text-purple-600 flex-shrink-0" />
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{agrupador}</h4>
                            <p className="text-sm text-gray-600">
                              {metasAgrupador.length} requisito{metasAgrupador.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge 
                              variant="outline"
                              className={`${
                                progressoAgrupador >= 100 ? 'bg-green-100 text-green-800 border-green-300' :
                                progressoAgrupador >= 50 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                progressoAgrupador > 0 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                'bg-gray-100 text-gray-800 border-gray-300'
                              }`}
                            >
                              {progressoAgrupador.toFixed(1)}%
                            </Badge>
                            <p className="text-xs text-gray-600 mt-1">
                              {Math.round(pontosAgrupador.recebidos)} / {pontosAgrupador.aplicaveis} pts
                            </p>
                          </div>
                          <div className="w-32 hidden md:block">
                            <Progress value={progressoAgrupador} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2">
                      {/* Lista de Requisitos em grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {metasAgrupador
                          .sort((a, b) => a.eixo.localeCompare(b.eixo))
                          .map((meta) => (
                            <MetaCard
                              key={meta.id}
                              meta={meta}
                              onClick={() => handleMetaClick(meta)}
                            />
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
        </div>
      </div>

      <MetaModal
        meta={selectedMeta}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdate={() => {
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default VisaoAgregadaPage;
