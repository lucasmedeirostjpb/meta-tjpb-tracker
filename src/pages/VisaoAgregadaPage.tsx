import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import MetaCard from "@/components/MetaCard";
import MetaModal from "@/components/MetaModal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { api } from "@/services/api";
import { toast } from "sonner";
import { mockMetas, mockUpdates } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, 
  Scale, 
  Target, 
  User, 
  AlertCircle,
  LogIn,
  LogOut,
  TrendingUp
} from "lucide-react";

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
        const metasWithUpdates = mockMetas.map(meta => {
          const update = mockUpdates.find(u => u.meta_id === meta.id);
          return {
            ...meta,
            status: update?.status,
            link_evidencia: update?.link_evidencia,
            observacoes: update?.observacoes,
            update_id: update?.id,
          };
        });
        console.log('✅ [VISAO AGREGADA] Metas carregadas (MOCK):', metasWithUpdates.length);
        setMetas(metasWithUpdates);
      } else {
        console.log('🌐 [VISAO AGREGADA] Usando Supabase REAL');
        const data = await api.getMetas();
        console.log('✅ [VISAO AGREGADA] Metas recebidas:', data.length);
        if (data.length > 0) {
          console.log('📊 [VISAO AGREGADA] Primeira meta:', data[0]);
          console.log('📊 [VISAO AGREGADA] Exemplo de status:', data[0].status);
          console.log('📊 [VISAO AGREGADA] Exemplo de pontos:', data[0].pontos_estimados);
        }
        setMetas(data);
      }
    } catch (error: any) {
      console.error('❌ [VISAO AGREGADA] Erro ao carregar metas:', error);
      toast.error('Erro ao carregar dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const groupByEixoAndCoordenador = () => {
    const grupos: { 
      [eixo: string]: { 
        [coordenador: string]: Meta[] 
      } 
    } = {};

    metas.forEach(meta => {
      // Remover numeração do início do eixo
      const eixoLimpo = meta.eixo.replace(/^\d+\.\s*/, '');
      const coordenador = meta.coordenador || 'Sem Coordenador';

      if (!grupos[eixoLimpo]) {
        grupos[eixoLimpo] = {};
      }
      if (!grupos[eixoLimpo][coordenador]) {
        grupos[eixoLimpo][coordenador] = [];
      }
      grupos[eixoLimpo][coordenador].push(meta);
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
    if (!user && !isMockMode) {
      toast.error('Faça login para editar as metas', {
        action: {
          label: 'Login',
          onClick: () => navigate('/login')
        }
      });
      return;
    }
    setSelectedMeta(meta);
    setModalOpen(true);
  };

  const grupos = groupByEixoAndCoordenador();
  const totalGeral = getTotalPontos(metas);
  const progressoGeral = calculateProgress(metas);

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
                size="icon"
                onClick={() => navigate('/')}
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

      <div className="container mx-auto px-4 py-8">
        {/* Banner Informativo */}
        {!user && !isMockMode && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Modo Consulta</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Você está visualizando os requisitos publicamente. 
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

        {/* Resumo Geral */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Progresso Geral</h2>
                <p className="text-sm text-gray-600">{metas.length} requisitos em {Object.keys(grupos).length} eixos</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-blue-600">
                {progressoGeral.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">
                {totalGeral.recebidos.toFixed(1)} / {totalGeral.aplicaveis} pts
              </p>
            </div>
          </div>
          <Progress value={progressoGeral} className="h-3" />
        </div>

        {/* Acordeões por Eixo */}
        <div className="space-y-4">
          {Object.entries(grupos).map(([eixo, coordenadores]) => {
            const metasDoEixo = Object.values(coordenadores).flat();
            const progressoEixo = calculateProgress(metasDoEixo);
            const pontosEixo = getTotalPontos(metasDoEixo);
            const cor = getEixoColor(eixo);

            return (
              <div key={eixo} className={`bg-white rounded-lg shadow-sm border-l-4 ${
                cor === 'blue' ? 'border-blue-500' :
                cor === 'green' ? 'border-green-500' :
                cor === 'purple' ? 'border-purple-500' :
                cor === 'orange' ? 'border-orange-500' :
                'border-gray-500'
              }`}>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={eixo} className="border-0">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className={
                            cor === 'blue' ? 'p-2 bg-blue-100 rounded-lg' :
                            cor === 'green' ? 'p-2 bg-green-100 rounded-lg' :
                            cor === 'purple' ? 'p-2 bg-purple-100 rounded-lg' :
                            cor === 'orange' ? 'p-2 bg-orange-100 rounded-lg' :
                            'p-2 bg-gray-100 rounded-lg'
                          }>
                            <Target className={
                              cor === 'blue' ? 'h-5 w-5 text-blue-600' :
                              cor === 'green' ? 'h-5 w-5 text-green-600' :
                              cor === 'purple' ? 'h-5 w-5 text-purple-600' :
                              cor === 'orange' ? 'h-5 w-5 text-orange-600' :
                              'h-5 w-5 text-gray-600'
                            } />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold text-gray-900">{eixo}</h3>
                            <p className="text-sm text-gray-600">
                              {metasDoEixo.length} requisitos • {Object.keys(coordenadores).length} coordenadores
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge className={
                              cor === 'blue' ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100' :
                              cor === 'green' ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-100' :
                              cor === 'purple' ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100' :
                              cor === 'orange' ? 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100' :
                              'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-100'
                            }>
                              {progressoEixo.toFixed(1)}%
                            </Badge>
                            <p className="text-xs text-gray-600 mt-1">
                              {pontosEixo.recebidos.toFixed(1)} / {pontosEixo.aplicaveis} pts
                            </p>
                          </div>
                          <div className="w-24">
                            <Progress value={progressoEixo} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      {/* Acordeões por Coordenador */}
                      <Accordion type="single" collapsible className="space-y-2">
                        {Object.entries(coordenadores)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([coordenador, metasCoordenador]) => {
                            const progressoCoordenador = calculateProgress(metasCoordenador);
                            const pontosCoordenador = getTotalPontos(metasCoordenador);

                            return (
                              <AccordionItem 
                                key={coordenador} 
                                value={coordenador}
                                className="border rounded-lg bg-gray-50"
                              >
                                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-100">
                                  <div className="flex items-center justify-between w-full pr-4">
                                    <div className="flex items-center gap-3">
                                      <User className="h-4 w-4 text-gray-600" />
                                      <div className="text-left">
                                        <h4 className="font-medium text-gray-900">{coordenador}</h4>
                                        <p className="text-xs text-gray-600">
                                          {metasCoordenador.length} requisitos neste eixo
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <Badge variant="secondary" className="text-xs">
                                          {progressoCoordenador.toFixed(1)}%
                                        </Badge>
                                        <p className="text-xs text-gray-600 mt-0.5">
                                          {pontosCoordenador.recebidos.toFixed(1)} / {pontosCoordenador.aplicaveis} pts
                                        </p>
                                      </div>
                                      <div className="w-20">
                                        <Progress value={progressoCoordenador} className="h-1.5" />
                                      </div>
                                    </div>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                                    {metasCoordenador.map(meta => (
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            );
          })}
        </div>

        {/* Estatísticas Footer */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{Object.keys(grupos).length}</p>
            <p className="text-sm text-gray-600">Eixos</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <User className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {new Set(metas.map(m => m.coordenador).filter(Boolean)).size}
            </p>
            <p className="text-sm text-gray-600">Coordenadores</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{metas.length}</p>
            <p className="text-sm text-gray-600">Requisitos</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <Scale className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {totalGeral.aplicaveis}
            </p>
            <p className="text-sm text-gray-600">Pontos Totais</p>
          </div>
        </div>
      </div>

      <MetaModal
        meta={selectedMeta}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdate={() => {
          setModalOpen(false);
          // Removido: loadMetas();
          // A meta já foi atualizada no modal, não precisa recarregar tudo
        }}
      />
    </div>
  );
};

export default VisaoAgregadaPage;
