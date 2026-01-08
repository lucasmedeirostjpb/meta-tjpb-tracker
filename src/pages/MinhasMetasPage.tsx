import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Award, AlertCircle, Scale, LogOut, User, Building2, Target } from "lucide-react";
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

const MinhasMetasPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeta, setSelectedMeta] = useState<Meta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Você precisa fazer login para acessar esta página');
      navigate('/login');
      return;
    }
    fetchMetas();
  }, [user]);

  const fetchMetas = async () => {
    if (!user?.nome) return;

    try {
      console.log('📋 [MINHAS METAS] Buscando metas do coordenador:', user.nome);
      
      if (isMockMode) {
        const allMetas = getMetasWithUpdates();
        const minhasMetas = allMetas.filter(meta => meta.coordenador === user.nome);
        setMetas(minhasMetas);
        console.log(`✅ [MINHAS METAS] ${minhasMetas.length} metas encontradas (mock)`);
      } else {
        const data = await api.getMetas({ coordenador: user.nome });
        setMetas(data);
        console.log(`✅ [MINHAS METAS] ${data.length} metas encontradas`);
      }
    } catch (error: any) {
      console.error('❌ [MINHAS METAS] Erro ao carregar metas:', error);
      toast.error('Erro ao carregar suas metas');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    const total = metas.reduce((sum, meta) => sum + meta.pontos_aplicaveis, 0);
    
    // Pontos efetivados (Totalmente + Parcialmente Cumprido)
    const recebidos = metas.reduce((sum, meta) => {
      if (meta.estimativa_cumprimento === 'Totalmente Cumprido') {
        return sum + meta.pontos_aplicaveis;
      } else if (meta.estimativa_cumprimento === 'Parcialmente Cumprido' && meta.pontos_estimados) {
        return sum + meta.pontos_estimados;
      }
      return sum;
    }, 0);

    // Pontos estimados (Em Andamento)
    const estimados = metas.reduce((sum, meta) => {
      if (meta.estimativa_cumprimento === 'Em Andamento' && meta.pontos_estimados) {
        return sum + meta.pontos_estimados;
      }
      return sum;
    }, 0);

    return {
      total,
      recebidos,
      estimados,
      totalComEstimados: recebidos + estimados,
      percentual: total > 0 ? (recebidos / total) * 100 : 0,
      percentualComEstimados: total > 0 ? ((recebidos + estimados) / total) * 100 : 0,
    };
  };

  const groupByEixo = () => {
    const grupos: Record<string, Meta[]> = {};
    
    metas.forEach(meta => {
      if (!grupos[meta.eixo]) {
        grupos[meta.eixo] = [];
      }
      grupos[meta.eixo].push(meta);
    });

    return grupos;
  };

  const groupBySetor = () => {
    const grupos: Record<string, Meta[]> = {};
    
    metas.forEach(meta => {
      if (!grupos[meta.setor_executor]) {
        grupos[meta.setor_executor] = [];
      }
      grupos[meta.setor_executor].push(meta);
    });

    return grupos;
  };

  const handleMetaClick = (meta: Meta) => {
    setSelectedMeta(meta);
    setModalOpen(true);
  };

  const handleMetaUpdate = async () => {
    await fetchMetas();
    setModalOpen(false);
    setSelectedMeta(null);
    toast.success('Meta atualizada com sucesso!');
  };

  const progress = calculateProgress();
  const gruposPorSetor = groupBySetor();

  const getEixoColor = (eixo: string) => {
    const eixoLower = eixo.toLowerCase();
    if (eixoLower.includes('governança')) return 'blue';
    if (eixoLower.includes('produtividade')) return 'green';
    if (eixoLower.includes('transparência') || eixoLower.includes('transparencia')) return 'purple';
    if (eixoLower.includes('dados') || eixoLower.includes('tecnologia')) return 'orange';
    return 'gray';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground">Carregando suas metas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
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
                  <p className="text-xs text-gray-600">TJPB - Minhas Metas</p>
                </div>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
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
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header com informações do coordenador */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Minhas Metas</h2>
                <p className="text-gray-600">Coordenador: {user?.nome}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {metas.length} requisito{metas.length !== 1 ? 's' : ''} sob sua coordenação
                </p>
                <p className="text-xs text-blue-700 font-semibold italic mt-2">
                  Unidos por resultados: TJPB no padrão Excelência
                </p>
              </div>
            </div>
          </div>

          {/* Progresso Geral */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Progresso Geral</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {progress.percentual.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  {Math.round(progress.recebidos)} pts efetivados
                </p>
              </div>
            </div>
            
            {/* Barra de progresso composta */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden flex">
              {/* Parte verde - pontos efetivados */}
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min(progress.percentual, 100)}%` }}
              />
              {/* Parte azul - pontos estimados (lado a lado) */}
              {progress.estimados > 0 && (
                <div
                  className="h-full bg-blue-400 transition-all duration-500"
                  style={{ width: `${Math.min(progress.percentualComEstimados - progress.percentual, 100 - progress.percentual)}%` }}
                />
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
                Total: {Math.round(progress.totalComEstimados)} / {progress.total} pts
                {progress.estimados > 0 && (
                  <span className="text-blue-600 ml-1">
                    ({progress.percentualComEstimados.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>Clique em qualquer meta para preencher ou atualizar a prestação de contas</span>
            </div>
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

        {/* Metas organizadas por Setor */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg">
              <Building2 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Por Setor Executor</h3>
              <p className="text-sm text-gray-600">
                {Object.keys(gruposPorSetor).length} setor{Object.keys(gruposPorSetor).length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={Object.keys(gruposPorSetor)} className="space-y-4">
            {Object.entries(gruposPorSetor).map(([setor, metasDoSetor]) => {
              const pontosSetor = metasDoSetor.reduce((sum, m) => sum + m.pontos_aplicaveis, 0);
              const recebidosSetor = metasDoSetor.reduce((sum, meta) => {
                if (meta.estimativa_cumprimento === 'Totalmente Cumprido') {
                  return sum + meta.pontos_aplicaveis;
                } else if (meta.estimativa_cumprimento === 'Parcialmente Cumprido' && meta.pontos_estimados) {
                  return sum + meta.pontos_estimados;
                }
                return sum;
              }, 0);
              const percentualSetor = pontosSetor > 0 ? (recebidosSetor / pontosSetor) * 100 : 0;

              return (
                <AccordionItem 
                  key={setor} 
                  value={setor}
                  className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3 text-left">
                        <Building2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{setor}</h4>
                          <p className="text-sm text-gray-600">
                            {metasDoSetor.length} requisito{metasDoSetor.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge 
                            variant="outline"
                            className={`${
                              percentualSetor >= 100 ? 'bg-green-100 text-green-800 border-green-300' :
                              percentualSetor >= 50 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              percentualSetor > 0 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                              'bg-gray-100 text-gray-800 border-gray-300'
                            }`}
                          >
                            {percentualSetor.toFixed(1)}%
                          </Badge>
                          <p className="text-xs text-gray-600 mt-1">
                            {Math.round(recebidosSetor)} / {pontosSetor} pts
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {metasDoSetor
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

        <MetaModal
          meta={selectedMeta}
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedMeta(null);
          }}
          onUpdate={handleMetaUpdate}
          isEditable={true}
        />
      </div>
    </div>
  );
};

export default MinhasMetasPage;
