import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Scale, 
  Users, 
  Building2, 
  Target,
  LogOut,
  LogIn,
  Edit,
  Award,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MetaCard from "@/components/MetaCard";
import MetaModal from "@/components/MetaModal";
import { getMetasWithUpdates } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import type { Dificuldade } from "@/integrations/supabase/types";
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
  estimativa_maxima?: number;
  percentual_cumprimento?: number;
  acoes_planejadas?: string;
  justificativa_parcial?: string;
  dificuldade?: Dificuldade;
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
  const [filtrosDificuldade, setFiltrosDificuldade] = useState<Dificuldade[]>([]);
  const [filtroEixo, setFiltroEixo] = useState<string>('todos');
  const [eixos, setEixos] = useState<string[]>([]);
  const [tipoOrdenacao, setTipoOrdenacao] = useState<'nome' | 'efetivados' | 'total-estimado' | 'comprometidos'>('nome');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadMetas();
  }, []);

  const loadMetas = async () => {
    console.log('🔄 [VISAO AGREGADA] Iniciando carregamento de todas as metas');
    setLoading(true);
    try {
      let data: Meta[] = [];
      if (isMockMode) {
        console.log('🎭 [VISAO AGREGADA] Usando modo MOCK');
        data = getMetasWithUpdates();
      } else {
        console.log('🌐 [VISAO AGREGADA] Usando Supabase REAL');
        data = await api.getMetas();
      }
      setMetas(data);
      
      // Extrair eixos únicos
      const eixosUnicos = new Set<string>();
      data.forEach(meta => {
        const eixoLimpo = meta.eixo.replace(/^\d+\.\s*/, '');
        eixosUnicos.add(eixoLimpo);
      });
      setEixos(Array.from(eixosUnicos).sort());
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

    // Aplicar filtros de dificuldade e eixo
    let metasFiltradas = filtrosDificuldade.length === 0
      ? metas
      : metas.filter(meta => meta.dificuldade && filtrosDificuldade.includes(meta.dificuldade));

    // Aplicar filtro de eixo
    if (filtroEixo !== 'todos') {
      metasFiltradas = metasFiltradas.filter(meta => {
        const eixoLimpo = meta.eixo.replace(/^\d+\.\s*/, '');
        return eixoLimpo === filtroEixo;
      });
    }

    metasFiltradas.forEach(meta => {
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
      if (m.estimativa_cumprimento === 'Totalmente Cumprido') {
        return sum + m.pontos_aplicaveis;
      } else if (m.estimativa_cumprimento === 'Parcialmente Cumprido' && m.pontos_estimados) {
        return sum + m.pontos_estimados;
      }
      return sum;
    }, 0);

    const pontosEstimados = metasSubset.reduce((sum, m) => {
      if (m.estimativa_cumprimento === 'Em Andamento' && m.pontos_estimados) {
        return sum + m.pontos_estimados;
      }
      return sum;
    }, 0);

    const pontosMaximos = metasSubset.reduce((sum, m) => {
      if (m.estimativa_cumprimento === 'Em Andamento' && m.estimativa_maxima !== undefined) {
        return sum + m.estimativa_maxima;
      } else {
        return sum + m.pontos_aplicaveis;
      }
    }, 0);

    const pontosAplicaveis = metasSubset.reduce((sum, m) => sum + m.pontos_aplicaveis, 0);
    
    return {
      recebidos: pontosRecebidos,
      estimados: pontosEstimados,
      maximos: pontosMaximos,
      aplicaveis: pontosAplicaveis,
      percentual: pontosAplicaveis > 0 ? (pontosRecebidos / pontosAplicaveis) * 100 : 0,
      percentualComEstimados: pontosAplicaveis > 0 ? ((pontosRecebidos + pontosEstimados) / pontosAplicaveis) * 100 : 0,
      percentualMaximo: pontosAplicaveis > 0 ? (pontosMaximos / pontosAplicaveis) * 100 : 100,
    };
  };

  const getTotalPontos = (metasSubset: Meta[]) => {
    const pontosRecebidos = metasSubset.reduce((sum, m) => {
      if (m.estimativa_cumprimento === 'Totalmente Cumprido') {
        return sum + m.pontos_aplicaveis;
      } else if (m.estimativa_cumprimento === 'Parcialmente Cumprido' && m.pontos_estimados) {
        return sum + m.pontos_estimados;
      }
      return sum;
    }, 0);

    const pontosEstimados = metasSubset.reduce((sum, m) => {
      if (m.estimativa_cumprimento === 'Em Andamento' && m.pontos_estimados) {
        return sum + m.pontos_estimados;
      }
      return sum;
    }, 0);

    const pontosComprometidos = metasSubset.reduce((sum, m) => {
      if (m.estimativa_maxima !== null && m.estimativa_maxima !== undefined) {
        return sum + (m.pontos_aplicaveis - m.estimativa_maxima);
      }
      return sum;
    }, 0);

    const pontosAplicaveis = metasSubset.reduce((sum, m) => sum + m.pontos_aplicaveis, 0);
    
    return { recebidos: pontosRecebidos, estimados: pontosEstimados, comprometidos: pontosComprometidos, aplicaveis: pontosAplicaveis };
  };

  // Função para ordenar os grupos
  const getGruposOrdenados = () => {
    const gruposObj = groupByAgrupador();
    const gruposArray = Object.entries(gruposObj);
    const multiplicador = direcaoOrdenacao === 'asc' ? 1 : -1;

    switch (tipoOrdenacao) {
      case 'efetivados':
        return gruposArray.sort(([, metasA], [, metasB]) => {
          const pontosA = getTotalPontos(metasA).recebidos;
          const pontosB = getTotalPontos(metasB).recebidos;
          return (pontosA - pontosB) * multiplicador;
        });
      case 'total-estimado':
        return gruposArray.sort(([, metasA], [, metasB]) => {
          const totaisA = getTotalPontos(metasA);
          const totaisB = getTotalPontos(metasB);
          const pontosA = totaisA.recebidos + totaisA.estimados;
          const pontosB = totaisB.recebidos + totaisB.estimados;
          return (pontosA - pontosB) * multiplicador;
        });
      case 'comprometidos':
        return gruposArray.sort(([, metasA], [, metasB]) => {
          const pontosA = getTotalPontos(metasA).comprometidos;
          const pontosB = getTotalPontos(metasB).comprometidos;
          return (pontosA - pontosB) * multiplicador;
        });
      case 'nome':
      default:
        return gruposArray.sort(([a], [b]) => 
          direcaoOrdenacao === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
        );
    }
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

  const toggleDificuldade = (dificuldade: Dificuldade) => {
    setFiltrosDificuldade(prev => 
      prev.includes(dificuldade)
        ? prev.filter(d => d !== dificuldade)
        : [...prev, dificuldade]
    );
  };

  const contarPorDificuldade = () => {
    return {
      semDificuldades: metas.filter(m => !m.dificuldade || m.dificuldade === 'Sem dificuldades').length,
      alerta: metas.filter(m => m.dificuldade === 'Alerta').length,
      critica: metas.filter(m => m.dificuldade === 'Situação crítica').length,
    };
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
                <p className="text-3xl font-bold text-green-600">
                  {calculateProgress(metas).percentual.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  {Math.round(totalGeral.recebidos)} pts efetivados
                </p>
              </div>
            </div>
            
            {/* Barra de progresso composta */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min(calculateProgress(metas).percentual, 100)}%` }}
              />
              {totalGeral.estimados > 0 && (
                <div
                  className="h-full bg-blue-400 transition-all duration-500"
                  style={{ width: `${Math.min(calculateProgress(metas).percentualComEstimados - calculateProgress(metas).percentual, 100 - calculateProgress(metas).percentual)}%` }}
                />
              )}
              {/* Linha vermelha indicando limite máximo */}
              {calculateProgress(metas).percentualMaximo < 100 && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-red-600 z-10"
                  style={{ left: `${calculateProgress(metas).percentualMaximo}%` }}
                  title={`Máximo possível: ${calculateProgress(metas).percentualMaximo.toFixed(1)}%`}
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
                  <span>Efetivados: {Math.round(totalGeral.recebidos)} pts</span>
                </div>
                {totalGeral.estimados > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <span>Estimados: {Math.round(totalGeral.estimados)} pts</span>
                  </div>
                )}
              </div>
              <span className="font-semibold">
                Total: {Math.round(totalGeral.recebidos + totalGeral.estimados)} / {totalGeral.aplicaveis} pts
                {totalGeral.estimados > 0 && (
                  <span className="text-blue-600 ml-1">
                    ({calculateProgress(metas).percentualComEstimados.toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
          <div className="bg-yellow-50 rounded-lg shadow-sm border-2 border-yellow-300 p-4 text-center">
            <div className="h-6 w-6 mx-auto mb-2 bg-yellow-500 rounded-full"></div>
            <p className="text-2xl font-bold text-yellow-700">{contarPorDificuldade().alerta}</p>
            <p className="text-sm text-gray-600">Em Alerta</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow-sm border-2 border-red-300 p-4 text-center">
            <div className="h-6 w-6 mx-auto mb-2 bg-red-500 rounded-full"></div>
            <p className="text-2xl font-bold text-red-700">{contarPorDificuldade().critica}</p>
            <p className="text-sm text-gray-600">Situação Crítica</p>
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

        {/* Filtro de Dificuldade */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-start gap-3">
            <Filter className="h-5 w-5 text-gray-600 mt-1" />
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700 block mb-3">Filtrar por Dificuldade:</label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="alerta"
                    checked={filtrosDificuldade.includes('Alerta')}
                    onCheckedChange={() => toggleDificuldade('Alerta')}
                  />
                  <label
                    htmlFor="alerta"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    Alerta ({contarPorDificuldade().alerta})
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="critica"
                    checked={filtrosDificuldade.includes('Situação crítica')}
                    onCheckedChange={() => toggleDificuldade('Situação crítica')}
                  />
                  <label
                    htmlFor="critica"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Situação Crítica ({contarPorDificuldade().critica})
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sem-dificuldades"
                    checked={filtrosDificuldade.includes('Sem dificuldades')}
                    onCheckedChange={() => toggleDificuldade('Sem dificuldades')}
                  />
                  <label
                    htmlFor="sem-dificuldades"
                    className="text-sm font-medium cursor-pointer flex items-center gap-2"
                  >
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Sem Dificuldades ({contarPorDificuldade().semDificuldades})
                  </label>
                </div>
              </div>
              {filtrosDificuldade.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {filtrosDificuldade.length} filtro{filtrosDificuldade.length > 1 ? 's' : ''} ativo{filtrosDificuldade.length > 1 ? 's' : ''}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiltrosDificuldade([])}
                    className="h-6 text-xs"
                  >
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtro de Eixo */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-start gap-3">
            <Filter className="h-5 w-5 text-gray-600 mt-1" />
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700 block mb-3">Filtrar por Eixo Temático:</label>
              <Select value={filtroEixo} onValueChange={setFiltroEixo}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Todos os Eixos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Eixos</SelectItem>
                  {eixos.map((eixo) => (
                    <SelectItem key={eixo} value={eixo}>
                      {eixo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filtroEixo !== 'todos' && (
                <div className="mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiltroEixo('todos')}
                    className="h-6 text-xs"
                  >
                    Limpar filtro de eixo
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ordenação */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-start gap-3">
            <ArrowUpDown className="h-5 w-5 text-gray-600 mt-1" />
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-700 block mb-3">Ordenar por:</label>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={tipoOrdenacao} onValueChange={(value: typeof tipoOrdenacao) => setTipoOrdenacao(value)}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nome">📝 Nome</SelectItem>
                    <SelectItem value="efetivados">✅ Pontos Efetivados</SelectItem>
                    <SelectItem value="total-estimado">🔄 Total Estimado</SelectItem>
                    <SelectItem value="comprometidos">⚠️ Comprometidos</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDirecaoOrdenacao(d => d === 'asc' ? 'desc' : 'asc')}
                  className="gap-2"
                >
                  {direcaoOrdenacao === 'asc' ? (
                    <>⬆️ Menor → Maior</>
                  ) : (
                    <>⬇️ Maior → Menor</>
                  )}
                </Button>
                {(tipoOrdenacao !== 'nome' || direcaoOrdenacao !== 'asc') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTipoOrdenacao('nome');
                      setDirecaoOrdenacao('asc');
                    }}
                    className="text-xs"
                  >
                    Resetar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Coordenadores/Setores */}
        <div className="space-y-4">
          <Accordion type="multiple" className="space-y-4">
            {getGruposOrdenados()
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
                            {pontosAgrupador.estimados > 0 && (
                              <Badge 
                                variant="outline"
                                className="bg-blue-50 text-blue-600 border-blue-300 text-xs mr-2"
                              >
                                total estimado: {Math.round(pontosAgrupador.recebidos + pontosAgrupador.estimados)} pts / {((pontosAgrupador.recebidos + pontosAgrupador.estimados) / pontosAgrupador.aplicaveis * 100).toFixed(1)}%
                              </Badge>
                            )}
                            {pontosAgrupador.comprometidos > 0 && (
                              <Badge 
                                variant="outline"
                                className="bg-red-50 text-red-600 border-red-300 text-xs mr-2"
                              >
                                pontos comprometidos: {Math.round(pontosAgrupador.comprometidos)} pts / {((pontosAgrupador.comprometidos / pontosAgrupador.aplicaveis) * 100).toFixed(1)}%
                              </Badge>
                            )}
                            <Badge 
                              variant="outline"
                              className={`${
                                progressoAgrupador.percentual >= 100 ? 'bg-green-100 text-green-800 border-green-300' :
                                progressoAgrupador.percentual >= 50 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                progressoAgrupador.percentual > 0 ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                'bg-gray-100 text-gray-800 border-gray-300'
                              }`}
                            >
                              {progressoAgrupador.percentual.toFixed(1)}%
                            </Badge>
                            <p className="text-xs text-gray-600 mt-1">
                              {Math.round(pontosAgrupador.recebidos)} / {pontosAgrupador.aplicaveis} pts
                            </p>
                          </div>
                          <div className="w-32 hidden md:block">
                            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden flex">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${Math.min(progressoAgrupador.percentual, 100)}%` }}
                              />
                              {pontosAgrupador.estimados > 0 && (
                                <div
                                  className="h-full bg-blue-400 transition-all"
                                  style={{ width: `${Math.min(progressoAgrupador.percentualComEstimados - progressoAgrupador.percentual, 100 - progressoAgrupador.percentual)}%` }}
                                />
                              )}
                              {/* Linha vermelha indicando limite máximo */}
                              {progressoAgrupador.percentualMaximo < 100 && (
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-10"
                                  style={{ left: `${progressoAgrupador.percentualMaximo}%` }}
                                  title={`Máximo possível: ${progressoAgrupador.percentualMaximo.toFixed(1)}%`}
                                >
                                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                                </div>
                              )}
                            </div>
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
