import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Target, Award, Users, FileText, Search, LayoutList, TrendingUp, CheckCircle2, ArrowRight, LogOut, LogIn, AlertCircle, Edit, Gauge, BarChart3, ExternalLink, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { api } from '@/services/api';
import { mockMetas } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import GaugeChart from '@/components/GaugeChart';
import { useClearCache } from '@/hooks/useClearCache';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { clearAndReload } = useClearCache();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const [stats, setStats] = useState({
    eixos: 4,
    requisitos: 0,
    pontosTotais: 0,
    pontosEstimados: 0,
    pontosAplicaveis: 0,
    percentualGeral: 0,
    percentualComEstimados: 0,
    percentualMaximo: 0,
    pontosMaximos: 0,
    pontosPerdidos: 0,
    setores: 0,
    eixosData: [] as Array<{ 
      nome: string; 
      pontos: number; 
      pontosRecebidos: number; 
      pontosEstimados: number;
      pontosMaximos: number;
      percentual: number;
      percentualComEstimados: number;
      percentualMaximo: number;
      cor: string 
    }>
  });

  // Estado para armazenar detalhes do ajuste do Eixo Transparência
  const [transparenciaAjuste, setTransparenciaAjuste] = useState<{
    rankingPercentual: number; // Percentual efetivado
    rankingPercentualComEstimados: number; // Percentual com em andamento
    rankingPontosRecebidos: number; // Pontos efetivados do ranking
    rankingPontosEmAndamento: number; // Pontos em andamento do ranking
    rankingPontosTotais: number; // Total de pontos do ranking
    rankingPontosPremio: number; // 0, 80 ou 100 (efetivado)
    rankingPontosPremioEstimado: number; // 0, 80 ou 100 (com estimados)
    ouvidoriaPontos: number; // 0, 20 ou 40 (efetivado)
    ouvidoriaPontosEmAndamento: number; // pontos em andamento
    ouvidoriaStatus: string;
    totalPremio: number; // rankingPontosPremio + ouvidoriaPontos (efetivado)
    totalPremioEstimado: number; // pontos estimados adicionais
  } | null>(null);

  // Stats ajustados com a correção do Eixo Transparência
  const [statsAjustados, setStatsAjustados] = useState(stats);

  useEffect(() => {
    loadStats();

    // Recarregar dados quando a página recebe foco (usuário volta para a tab)
    const handleFocus = () => {
      loadStats();
    };

    window.addEventListener('focus', handleFocus);
    
    // Recarregar a cada 30 segundos se a página estiver visível
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadStats();
      }
    }, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const loadStats = async () => {
    try {
      if (isMockMode) {
        console.log('🎭 [LANDING] Usando modo MOCK');
        // Usar dados mock
        const totalRequisitos = mockMetas.length;
        const totalPontosAplicaveis = mockMetas.reduce((sum, m) => sum + m.pontos_aplicaveis, 0);
        const pontosRecebidos = 0;
        const setoresUnicos = new Set(mockMetas.map(m => m.setor_executor)).size;
        
        const eixosMap = new Map<string, { pontos: number; pontosRecebidos: number; pontosEstimados: number; cor: string }>();
        mockMetas.forEach(meta => {
          const eixoLimpo = meta.eixo.replace(/^\d+\.\s*/, '');
          if (!eixosMap.has(eixoLimpo)) {
            eixosMap.set(eixoLimpo, { pontos: 0, pontosRecebidos: 0, pontosEstimados: 0, cor: getEixoColor(eixoLimpo) });
          }
          const eixoData = eixosMap.get(eixoLimpo)!;
          eixoData.pontos += meta.pontos_aplicaveis;
        });

        const eixosData = Array.from(eixosMap.entries()).map(([nome, data]) => ({
          nome,
          pontos: data.pontos,
          pontosRecebidos: data.pontosRecebidos,
          pontosEstimados: data.pontosEstimados,
          pontosMaximos: data.pontos,
          percentual: 0,
          percentualComEstimados: 0,
          percentualMaximo: 100,
          cor: data.cor
        }));

        console.log('✅ [LANDING] Estatísticas calculadas (MOCK):', {
          eixos: 4,
          requisitos: totalRequisitos,
          pontos: totalPontosAplicaveis
        });

        setStats({
          eixos: 4,
          requisitos: totalRequisitos,
          pontosTotais: pontosRecebidos,
          pontosEstimados: 0,
          pontosAplicaveis: totalPontosAplicaveis,
          percentualGeral: 0,
          percentualComEstimados: 0,
          percentualMaximo: 100,
          pontosMaximos: totalPontosAplicaveis,
          pontosPerdidos: 0,
          setores: setoresUnicos,
          eixosData
        });
      } else {
        console.log('🌐 [LANDING] Usando Supabase REAL');
        // Buscar dados da API
        const statsData = await api.getStats();
        console.log('✅ [LANDING] Estatísticas recebidas:', statsData);
        setStats(statsData);

        // Buscar metas do Eixo Transparência para ajuste especial
        await calcularAjusteTransparencia(statsData);
      }
    } catch (error: any) {
      console.error('❌ [LANDING] Erro ao carregar estatísticas:', error);
    }
  };

  // Função para calcular o ajuste do Eixo Transparência
  // Art. 11 I (Ranking): 202 pontos do ranking → 80 ou 100 pontos no prêmio
  // Art. 11 II (Ouvidoria - artigo "11.2"): 40 pontos diretos
  const calcularAjusteTransparencia = async (statsData: typeof stats) => {
    try {
      const metas = await api.getMetas();
      
      // Filtrar metas do Eixo Transparência
      const metasTransparencia = metas.filter(m => 
        m.eixo.toLowerCase().includes('transparência') || 
        m.eixo.toLowerCase().includes('transparencia')
      );

      // Separar Ouvidoria (artigo 11.2) dos itens do Ranking (todos os outros)
      const metaOuvidoria = metasTransparencia.find(m => m.artigo === '11.2');
      const metasRanking = metasTransparencia.filter(m => m.artigo !== '11.2');

      // Calcular pontos do Ranking - separar efetivados e em andamento
      const rankingPontosTotais = metasRanking.reduce((sum, m) => sum + ((m as any).pontos_aplicaveis || 0), 0);
      let rankingPontosEfetivados = 0;
      let rankingPontosEmAndamento = 0;
      
      metasRanking.forEach(meta => {
        const pontosMeta = (meta as any).pontos_aplicaveis || 0;
        if (meta.estimativa_cumprimento === 'Totalmente Cumprido') {
          rankingPontosEfetivados += pontosMeta;
        } else if (meta.estimativa_cumprimento === 'Parcialmente Cumprido') {
          rankingPontosEfetivados += meta.pontos_estimados || 0;
        } else if (meta.estimativa_cumprimento === 'Em Andamento') {
          rankingPontosEmAndamento += meta.pontos_estimados || 0;
        }
      });

      // Percentual efetivado (sem estimados)
      const rankingPercentualEfetivado = rankingPontosTotais > 0 
        ? (rankingPontosEfetivados / rankingPontosTotais) * 100 
        : 0;
      
      // Percentual com estimados (efetivados + em andamento)
      const rankingPercentualComEstimados = rankingPontosTotais > 0 
        ? ((rankingPontosEfetivados + rankingPontosEmAndamento) / rankingPontosTotais) * 100 
        : 0;

      // Converter para pontos do prêmio CNJ - EFETIVADOS
      // 100% = 100 pontos | 95% a 99.99% = 80 pontos | Menos de 95% = 0 pontos
      let rankingPontosPremioEfetivado = 0;
      if (rankingPercentualEfetivado >= 100) {
        rankingPontosPremioEfetivado = 100;
      } else if (rankingPercentualEfetivado >= 95) {
        rankingPontosPremioEfetivado = 80;
      }

      // Converter para pontos do prêmio CNJ - COM ESTIMADOS (projeção)
      let rankingPontosPremioEstimado = 0;
      if (rankingPercentualComEstimados >= 100) {
        rankingPontosPremioEstimado = 100;
      } else if (rankingPercentualComEstimados >= 95) {
        rankingPontosPremioEstimado = 80;
      }

      // Calcular pontos da Ouvidoria - separar efetivados e em andamento
      let ouvidoriaPontosEfetivados = 0;
      let ouvidoriaPontosEmAndamento = 0;
      let ouvidoriaStatus = 'Não avaliado';
      
      if (metaOuvidoria) {
        if (metaOuvidoria.estimativa_cumprimento === 'Totalmente Cumprido') {
          ouvidoriaPontosEfetivados = 40;
          ouvidoriaStatus = 'Totalmente Cumprido';
        } else if (metaOuvidoria.estimativa_cumprimento === 'Parcialmente Cumprido') {
          ouvidoriaPontosEfetivados = metaOuvidoria.pontos_estimados || 20;
          ouvidoriaStatus = 'Parcialmente Cumprido';
        } else if (metaOuvidoria.estimativa_cumprimento === 'Em Andamento') {
          ouvidoriaPontosEmAndamento = metaOuvidoria.pontos_estimados || 40;
          ouvidoriaStatus = 'Em Andamento';
        } else {
          ouvidoriaStatus = metaOuvidoria.estimativa_cumprimento || 'Não avaliado';
        }
      }

      // Totais
      const totalPremioEfetivado = rankingPontosPremioEfetivado + ouvidoriaPontosEfetivados;
      const totalPremioEstimado = (rankingPontosPremioEstimado - rankingPontosPremioEfetivado) + ouvidoriaPontosEmAndamento;

      console.log('🎯 [LANDING] Ajuste Transparência:', {
        rankingPercentualEfetivado: rankingPercentualEfetivado.toFixed(2) + '%',
        rankingPercentualComEstimados: rankingPercentualComEstimados.toFixed(2) + '%',
        rankingPontosPremioEfetivado,
        rankingPontosPremioEstimado,
        ouvidoriaPontosEfetivados,
        ouvidoriaPontosEmAndamento,
        totalPremioEfetivado,
        totalPremioEstimado,
        totalOriginal: statsData.eixosData.find(e => 
          e.nome.toLowerCase().includes('transparência') || e.nome.toLowerCase().includes('transparencia')
        )?.pontos || 0
      });

      setTransparenciaAjuste({
        rankingPercentual: rankingPercentualEfetivado,
        rankingPercentualComEstimados,
        rankingPontosRecebidos: rankingPontosEfetivados,
        rankingPontosEmAndamento,
        rankingPontosTotais,
        rankingPontosPremio: rankingPontosPremioEfetivado,
        rankingPontosPremioEstimado,
        ouvidoriaPontos: ouvidoriaPontosEfetivados,
        ouvidoriaPontosEmAndamento,
        ouvidoriaStatus,
        totalPremio: totalPremioEfetivado,
        totalPremioEstimado
      });

      // Agora ajustar os stats para refletir a correção
      const eixoTransparenciaOriginal = statsData.eixosData.find(e => 
        e.nome.toLowerCase().includes('transparência') || e.nome.toLowerCase().includes('transparencia')
      );

      if (eixoTransparenciaOriginal) {
        // Calcular a diferença para ajustar os totais
        const pontosOriginais = eixoTransparenciaOriginal.pontos; // ~242
        const pontosRecebidosOriginais = eixoTransparenciaOriginal.pontosRecebidos;
        const pontosEstimadosOriginais = eixoTransparenciaOriginal.pontosEstimados;
        
        const pontosAjustados = 140; // 100 (ranking máx) + 40 (ouvidoria)
        const pontosRecebidosAjustados = totalPremioEfetivado;
        const pontosEstimadosAjustados = totalPremioEstimado;

        const diferencaPontos = pontosOriginais - pontosAjustados;
        const diferencaRecebidos = pontosRecebidosOriginais - pontosRecebidosAjustados;
        const diferencaEstimados = pontosEstimadosOriginais - pontosEstimadosAjustados;

        // Criar eixosData ajustados
        const eixosDataAjustados = statsData.eixosData.map(eixo => {
          if (eixo.nome.toLowerCase().includes('transparência') || eixo.nome.toLowerCase().includes('transparencia')) {
            const percentualEfetivo = pontosAjustados > 0 ? (pontosRecebidosAjustados / pontosAjustados) * 100 : 0;
            const percentualComEst = pontosAjustados > 0 ? ((pontosRecebidosAjustados + pontosEstimadosAjustados) / pontosAjustados) * 100 : 0;
            return {
              ...eixo,
              pontos: pontosAjustados,
              pontosRecebidos: pontosRecebidosAjustados,
              pontosEstimados: pontosEstimadosAjustados,
              pontosMaximos: pontosAjustados,
              percentual: percentualEfetivo,
              percentualComEstimados: percentualComEst,
              percentualMaximo: 100
            };
          }
          return eixo;
        });

        // Recalcular totais
        const pontosAplicaveisAjustados = statsData.pontosAplicaveis - diferencaPontos;
        const pontosTotaisAjustados = statsData.pontosTotais - diferencaRecebidos;
        const pontosEstimadosAjustados2 = (statsData.pontosEstimados || 0) - diferencaEstimados;
        const percentualGeralAjustado = pontosAplicaveisAjustados > 0 
          ? (pontosTotaisAjustados / pontosAplicaveisAjustados) * 100 
          : 0;

        setStatsAjustados({
          ...statsData,
          pontosAplicaveis: pontosAplicaveisAjustados,
          pontosTotais: pontosTotaisAjustados,
          pontosEstimados: pontosEstimadosAjustados2,
          percentualGeral: percentualGeralAjustado,
          percentualComEstimados: pontosAplicaveisAjustados > 0 
            ? ((pontosTotaisAjustados + pontosEstimadosAjustados2) / pontosAplicaveisAjustados) * 100 
            : 0,
          eixosData: eixosDataAjustados
        });
      }
    } catch (error) {
      console.error('❌ [LANDING] Erro ao calcular ajuste Transparência:', error);
      setStatsAjustados(statsData);
    }
  };

  const getEixoColor = (eixo: string) => {
    const eixoLower = eixo.toLowerCase();
    if (eixoLower.includes('governança')) return 'blue';
    if (eixoLower.includes('produtividade')) return 'green';
    if (eixoLower.includes('transparência') || eixoLower.includes('transparencia')) return 'purple';
    if (eixoLower.includes('dados') || eixoLower.includes('tecnologia')) return 'orange';
    return 'gray';
  };

  // Função para calcular a próxima meta e pontos faltantes
  const calcularProximaMeta = (pontosAtuais: number, pontosAplicaveis: number, usarEstimados: boolean = false) => {
    const metas = [
      { nome: 'Prata', percentual: 75, cor: 'gray', bgColor: 'bg-gray-100', borderColor: 'border-gray-400', textColor: 'text-gray-700' },
      { nome: 'Ouro', percentual: 80, cor: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-400', textColor: 'text-yellow-700' },
      { nome: 'Diamante', percentual: 85, cor: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-400', textColor: 'text-blue-700' },
    ];

    const percentualAtual = pontosAplicaveis > 0 ? (pontosAtuais / pontosAplicaveis) * 100 : 0;

    for (const meta of metas) {
      const pontosNecessarios = Math.ceil((meta.percentual / 100) * pontosAplicaveis);
      const pontosFaltantes = pontosNecessarios - pontosAtuais;
      
      if (pontosFaltantes > 0) {
        return {
          meta,
          pontosFaltantes,
          pontosNecessarios,
          percentualAtual,
          atingida: false
        };
      }
    }

    // Já atingiu Diamante
    return {
      meta: metas[metas.length - 1],
      pontosFaltantes: 0,
      pontosNecessarios: Math.ceil((85 / 100) * pontosAplicaveis),
      percentualAtual,
      atingida: true
    };
  };

  // Calcular próxima meta com pontos efetivados
  const proximaMetaEfetivado = calcularProximaMeta(
    statsAjustados.pontosTotais,
    statsAjustados.pontosAplicaveis
  );

  // Calcular próxima meta com pontos efetivados + estimados
  const proximaMetaComEstimados = calcularProximaMeta(
    statsAjustados.pontosTotais + statsAjustados.pontosEstimados,
    statsAjustados.pontosAplicaveis,
    true
  );

  const eixos = [
    {
      nome: 'Governança',
      cor: 'blue',
      descricao: 'Planejamento estratégico, gestão de pessoas e infraestrutura judiciária',
      icone: Target,
    },
    {
      nome: 'Produtividade',
      cor: 'green',
      descricao: 'Eficiência processual, otimização e gestão de acervo',
      icone: TrendingUp,
    },
    {
      nome: 'Transparência',
      cor: 'purple',
      descricao: 'Transparência institucional e responsabilidade social',
      icone: Users,
    },
    {
      nome: 'Dados e Tecnologia',
      cor: 'orange',
      descricao: 'Gestão de dados, tecnologia da informação e inovação',
      icone: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header/Navbar - Modernizado */}
      <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 flex items-center justify-center">
                <img 
                  src="/assets/images/tjpb-brasao.png" 
                  alt="Brasão TJPB" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                  Eficiência em Ação
                </h1>
                <p className="text-xs text-gray-600 font-medium">TJPB - Prêmio CNJ 2026</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Informações do usuário ou Login */}
              {user ? (
                <>
                  <div className="text-right hidden sm:block">
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

      {/* Hero Section - Redesenhado */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase">
              Tribunal de Justiça da Paraíba
            </p>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Eficiência em Ação
            </span>
            <br />
            <span className="text-gray-800">
              Prêmio CNJ de Qualidade
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium">
            Unidos por resultados: <span className="font-bold text-blue-700">TJPB no padrão Excelência</span>
          </p>

          {user ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3 mt-6">
              <Edit className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-900 font-medium text-left">
                <strong>Bem-vindo, {user.nome}!</strong> Você pode preencher e atualizar suas metas ou consultar todos os requisitos do sistema.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center gap-3 mt-6">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-900 font-medium text-left">
                <strong>Sistema em modo de consulta.</strong> Visualize todos os requisitos e acompanhe o progresso. Faça login para preencher suas metas.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            {user ? (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/minhas-metas')}
                  className="gap-3 text-lg px-8 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <Edit className="h-6 w-6" />
                  Preencher Minhas Metas
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/consultar')}
                  className="gap-3 text-lg px-8 py-6 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Search className="h-6 w-6" />
                  Consultar Requisitos
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.open('https://atos.cnj.jus.br/files/original18414620260108695ffa6a3bf9b.pdf', '_blank')}
                  className="gap-3 text-lg px-8 py-6 border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FileText className="h-6 w-6" />
                  Portaria do Prêmio CNJ 
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.open('https://www.cnj.jus.br/wp-content/uploads/2025/12/glossario-ranking-transparencia-2026.pdf', '_blank')}
                  className="gap-3 text-lg px-8 py-6 border-2 border-orange-300 hover:bg-orange-50 hover:border-orange-400 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <BarChart3 className="h-6 w-6" />
                  Ranking da Transparência do Poder Judiciário 2026
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  onClick={() => navigate('/consultar')}
                  className="gap-3 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <Search className="h-6 w-6" />
                  Consultar Requisitos
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.open('https://drive.google.com/file/d/1MHvVUgVKIVv6D_8x_hnfDpjfCMZjfQsr/view?usp=sharing', '_blank')}
                  className="gap-3 text-lg px-8 py-6 border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <FileText className="h-6 w-6" />
                  Portaria do Prêmio CNJ 
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.open('https://www.cnj.jus.br/wp-content/uploads/2025/12/glossario-ranking-transparencia-2026.pdf', '_blank')}
                  className="gap-3 text-lg px-8 py-6 border-2 border-orange-300 hover:bg-orange-50 hover:border-orange-400 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <BarChart3 className="h-6 w-6" />
                  Ranking da Transparência do Poder Judiciário 2026
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid - Modernizado */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {[
            { label: 'Eixos Temáticos', value: statsAjustados.eixos, color: 'from-blue-500 to-blue-600', icon: Target },
            { label: 'Requisitos', value: statsAjustados.requisitos, color: 'from-green-500 to-green-600', icon: CheckCircle2 },
            { label: 'Pontos Aplicáveis', value: statsAjustados.pontosAplicaveis, color: 'from-purple-500 to-purple-600', icon: Award },
            { label: 'Setores', value: statsAjustados.setores, color: 'from-orange-500 to-orange-600', icon: Users },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
                <CardContent className="pt-6 pb-6">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Botão Gerenciamento de Atividades */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                    <LayoutList className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      Gerenciamento de Atividades
                    </h3>
                    <p className="text-gray-600">
                      Visualize todas as atividades pendentes em um só lugar
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/atividades')}
                  className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all px-6 py-6 text-base"
                >
                  <LayoutList className="h-5 w-5" />
                  Acessar Atividades
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Velocímetro e Gráfico de Barras */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Velocímetro - DESTAQUE */}
          <Card className="border-4 border-blue-500 shadow-2xl bg-gradient-to-br from-white via-blue-50 to-white">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg">
                  <Gauge className="h-12 w-12 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                Progresso Geral
              </CardTitle>
              <CardDescription className="text-lg font-medium">Rumo à Excelência</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Velocímetro */}
              <div className="flex justify-center">
                <GaugeChart 
                  value={statsAjustados.percentualComEstimados}
                  maxValue={statsAjustados.percentualMaximo !== undefined && statsAjustados.percentualMaximo < 100 ? statsAjustados.percentualMaximo : undefined}
                  size={380} 
                />
              </div>
              
              {/* Percentual e Pontos */}
              <div className="text-center space-y-4">
                {/* Percentual Principal */}
                <div>
                  <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {statsAjustados.percentualComEstimados.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Progresso Total (Efetivado + Estimado)</div>
                </div>
                
                {/* Detalhamento dos Pontos */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border-2 border-blue-100 space-y-2">
                  {/* Pontos Efetivados */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-600 rounded"></div>
                      <span className="text-sm font-semibold text-gray-700">Pontos Efetivados</span>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-green-700">{statsAjustados.pontosTotais} pts</div>
                      <div className="text-xs text-gray-600">{statsAjustados.percentualGeral.toFixed(1)}%</div>
                    </div>
                  </div>
                  
                  {/* Pontos Estimados */}
                  {statsAjustados.pontosEstimados > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-400 rounded"></div>
                        <span className="text-sm font-semibold text-gray-700">Pontos Estimados</span>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-bold text-blue-600">+{statsAjustados.pontosEstimados} pts</div>
                        <div className="text-xs text-gray-600">+{(statsAjustados.percentualComEstimados - statsAjustados.percentualGeral).toFixed(1)}%</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Linha divisória */}
                  <div className="border-t-2 border-blue-200 my-2"></div>
                  
                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">Total</span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-700">{statsAjustados.pontosTotais + statsAjustados.pontosEstimados} pts</div>
                      <div className="text-xs text-gray-600">de {statsAjustados.pontosAplicaveis} aplicáveis</div>
                    </div>
                  </div>
                </div>
                
                {/* Aviso de Próxima Meta */}
                {!proximaMetaComEstimados.atingida && (
                  <div className={`${proximaMetaComEstimados.meta.bgColor} border-2 ${proximaMetaComEstimados.meta.borderColor} rounded-lg p-4 mt-4`}>
                    <div className="flex items-center justify-center gap-2">
                      <Target className={`h-5 w-5 ${proximaMetaComEstimados.meta.textColor}`} />
                      <span className={`text-sm font-bold ${proximaMetaComEstimados.meta.textColor}`}>
                        {statsAjustados.pontosEstimados > 0 ? (
                          <>Estamos a <span className="text-lg">{proximaMetaComEstimados.pontosFaltantes}</span> pontos de estimar o <span className="uppercase">Selo {proximaMetaComEstimados.meta.nome}</span></>
                        ) : (
                          <>Faltam <span className="text-lg">{proximaMetaEfetivado.pontosFaltantes}</span> pontos para o <span className="uppercase">Selo {proximaMetaEfetivado.meta.nome}</span></>
                        )}
                      </span>
                    </div>
                    {statsAjustados.pontosEstimados > 0 && proximaMetaEfetivado.pontosFaltantes !== proximaMetaComEstimados.pontosFaltantes && (
                      <div className="text-xs text-center mt-2 text-gray-600">
                        (Com pontos efetivados: faltam {proximaMetaEfetivado.pontosFaltantes} pts para {proximaMetaEfetivado.meta.nome})
                      </div>
                    )}
                  </div>
                )}

                {/* Aviso quando já atingiu Diamante */}
                {proximaMetaComEstimados.atingida && (
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-400 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-center gap-2">
                      <Award className="h-5 w-5 text-blue-700" />
                      <span className="text-sm font-bold text-blue-700">
                        🎉 Parabéns! Já estimamos o <span className="uppercase">Selo Diamante</span>!
                      </span>
                    </div>
                  </div>
                )}

                {/* Alerta de pontos comprometidos */}
                {statsAjustados.pontosPerdidos > 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-2 text-red-700">
                      <span className="inline-block w-2 h-2 bg-red-600 rounded-full"></span>
                      <span className="text-sm font-semibold">
                        Máximo possível: {statsAjustados.percentualMaximo.toFixed(1)}% ({statsAjustados.pontosMaximos} pts)
                      </span>
                    </div>
                    <div className="text-xs text-red-600 text-center mt-1">
                      {statsAjustados.pontosPerdidos} pontos comprometidos
                    </div>
                  </div>
                )}
              </div>
              
              {/* Marcações dos Selos */}
              <div className="space-y-2 mt-6">
                <div className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-400 bg-gray-50 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-gray-600" />
                    <span className="font-bold text-sm text-gray-900">SELO PRATA</span>
                  </div>
                  <span className="text-xl font-bold text-gray-700">75%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border-2 border-yellow-400 bg-yellow-50 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span className="font-bold text-sm text-yellow-900">SELO OURO</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-700">80%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border-2 border-blue-400 bg-blue-50 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <span className="font-bold text-sm text-blue-900">SELO DIAMANTE</span>
                  </div>
                  <span className="text-xl font-bold text-blue-700">85%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Barras Simples */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Comparativo dos Eixos</CardTitle>
                  <CardDescription className="text-base">Pontos alcançados por eixo temático</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-100px)]">
              <div className="space-y-8 h-full flex flex-col justify-between py-4">
                {statsAjustados.eixosData.map((eixo) => {
                  const colors = {
                    blue: { bg: 'bg-blue-500', bgLight: 'bg-blue-400', text: 'text-blue-700', border: 'border-blue-500' },
                    green: { bg: 'bg-green-500', bgLight: 'bg-green-400', text: 'text-green-700', border: 'border-green-500' },
                    purple: { bg: 'bg-purple-500', bgLight: 'bg-purple-400', text: 'text-purple-700', border: 'border-purple-500' },
                    orange: { bg: 'bg-orange-500', bgLight: 'bg-orange-400', text: 'text-orange-700', border: 'border-orange-500' }
                  };
                  const color = colors[eixo.cor as keyof typeof colors] || colors.blue;
                  const barWidth = eixo.pontos > 0 ? (eixo.pontosRecebidos / eixo.pontos) * 100 : 0;
                  const barWidthComEstimados = eixo.pontos > 0 ? ((eixo.pontosRecebidos + eixo.pontosEstimados) / eixo.pontos) * 100 : 0;
                  const maxBarWidth = eixo.pontos > 0 ? (eixo.pontosMaximos / eixo.pontos) * 100 : 0;
                  const hasLimit = eixo.pontosMaximos < eixo.pontos;
                  const hasEstimados = eixo.pontosEstimados > 0;
                  
                  // Verificar se é o Eixo Transparência para mostrar detalhamento
                  const isTransparencia = eixo.nome.toLowerCase().includes('transparência') || eixo.nome.toLowerCase().includes('transparencia');

                  return (
                    <div key={eixo.nome} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base text-gray-700">{eixo.nome}</span>
                          {/* Ícone de info para Eixo Transparência */}
                          {isTransparencia && transparenciaAjuste && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="p-1 hover:bg-purple-100 rounded-full transition-colors cursor-pointer" title="Ver detalhamento do cálculo">
                                  <Info className="h-4 w-4 text-purple-600" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent side="right" className="w-96 p-4 bg-white border-2 border-purple-200 shadow-xl">
                                <div className="space-y-3 text-sm">
                                  <p className="font-bold text-purple-700 border-b pb-2 text-base">📋 Cálculo Especial - Prêmio CNJ</p>
                                  
                                  {/* Ranking da Transparência */}
                                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                                    <p className="font-semibold text-gray-700">📊 Ranking da Transparência (Art. 11, I)</p>
                                    <div className="text-xs pl-4 space-y-1">
                                      <p className="text-gray-600">
                                        Itens efetivados: <span className="font-bold text-green-700">{transparenciaAjuste.rankingPontosRecebidos}</span>/{transparenciaAjuste.rankingPontosTotais} pts = <span className="font-bold text-green-700">{transparenciaAjuste.rankingPercentual.toFixed(1)}%</span>
                                      </p>
                                      {transparenciaAjuste.rankingPontosEmAndamento > 0 && (
                                        <p className="text-gray-600">
                                          + Em andamento: <span className="font-bold text-blue-600">+{transparenciaAjuste.rankingPontosEmAndamento}</span> pts = <span className="font-bold text-blue-600">{transparenciaAjuste.rankingPercentualComEstimados.toFixed(1)}%</span>
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-xs pl-4 pt-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Efetivado:</span>
                                        {transparenciaAjuste.rankingPercentual >= 100 ? (
                                          <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-xs">100 pts</span>
                                        ) : transparenciaAjuste.rankingPercentual >= 95 ? (
                                          <span className="bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded text-xs">80 pts</span>
                                        ) : (
                                          <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded text-xs">0 pts</span>
                                        )}
                                      </div>
                                      {transparenciaAjuste.rankingPontosEmAndamento > 0 && transparenciaAjuste.rankingPontosPremioEstimado > transparenciaAjuste.rankingPontosPremio && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-500">Com estimados:</span>
                                          {transparenciaAjuste.rankingPercentualComEstimados >= 100 ? (
                                            <span className="bg-green-50 text-green-600 font-bold px-2 py-0.5 rounded text-xs border border-green-300">→ 100 pts</span>
                                          ) : transparenciaAjuste.rankingPercentualComEstimados >= 95 ? (
                                            <span className="bg-yellow-50 text-yellow-600 font-bold px-2 py-0.5 rounded text-xs border border-yellow-300">→ 80 pts</span>
                                          ) : (
                                            <span className="bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded text-xs">→ 0 pts</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Ouvidoria */}
                                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                                    <p className="font-semibold text-gray-700">📞 Ouvidoria (Art. 11, II)</p>
                                    <div className="text-xs pl-4 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Status:</span>
                                        <span className={`font-semibold ${
                                          transparenciaAjuste.ouvidoriaStatus === 'Totalmente Cumprido' ? 'text-green-700' :
                                          transparenciaAjuste.ouvidoriaStatus === 'Parcialmente Cumprido' ? 'text-yellow-700' :
                                          transparenciaAjuste.ouvidoriaStatus === 'Em Andamento' ? 'text-blue-600' :
                                          'text-gray-500'
                                        }`}>{transparenciaAjuste.ouvidoriaStatus}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Efetivado:</span>
                                        <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded">{transparenciaAjuste.ouvidoriaPontos} pts</span>
                                      </div>
                                      {transparenciaAjuste.ouvidoriaPontosEmAndamento > 0 && (
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-500">Em andamento:</span>
                                          <span className="bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded border border-blue-200">+{transparenciaAjuste.ouvidoriaPontosEmAndamento} pts</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Totais */}
                                  <div className="border-t-2 border-purple-200 pt-3 mt-2 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-gray-700">Efetivado:</span>
                                      <span className="font-bold text-lg text-green-700">{transparenciaAjuste.totalPremio}/140 pts</span>
                                    </div>
                                    {transparenciaAjuste.totalPremioEstimado > 0 && (
                                      <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-600">+ Em andamento:</span>
                                        <span className="font-bold text-blue-600">+{transparenciaAjuste.totalPremioEstimado} pts</span>
                                      </div>
                                    )}
                                    {transparenciaAjuste.totalPremioEstimado > 0 && (
                                      <div className="flex justify-between items-center pt-1 border-t">
                                        <span className="font-bold text-purple-700">Total projetado:</span>
                                        <span className="font-bold text-xl text-purple-700">{transparenciaAjuste.totalPremio + transparenciaAjuste.totalPremioEstimado}/140 pts</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {/* Pontos efetivados */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Efetivados:</span>
                            <span className={`font-bold text-base ${color.text}`}>
                              {Math.round(eixo.pontosRecebidos)}/{eixo.pontos} pts ({eixo.percentual.toFixed(1)}%)
                            </span>
                            {hasLimit && (
                              <span className="text-xs text-red-600 font-semibold">
                                (máx: {Math.round(eixo.pontosMaximos)})
                              </span>
                            )}
                          </div>
                          {/* Total com estimados */}
                          {hasEstimados && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Com estimados:</span>
                              <span className="text-sm text-blue-600 font-bold">
                                {Math.round(eixo.pontosRecebidos + eixo.pontosEstimados)}/{eixo.pontos} pts ({eixo.percentualComEstimados.toFixed(1)}%)
                              </span>
                            </div>
                          )}
                          {/* Detalhamento inline para Transparência */}
                          {isTransparencia && transparenciaAjuste && (
                            <div className="flex flex-col items-end text-xs mt-1 pt-1 border-t border-purple-200">
                              <span className="text-purple-600 font-medium">
                                Ranking: {transparenciaAjuste.rankingPontosPremio}pts 
                                {transparenciaAjuste.rankingPontosPremioEstimado > transparenciaAjuste.rankingPontosPremio && (
                                  <span className="text-blue-500"> (+{transparenciaAjuste.rankingPontosPremioEstimado - transparenciaAjuste.rankingPontosPremio} est.)</span>
                                )}
                              </span>
                              <span className="text-purple-600 font-medium">
                                Ouvidoria: {transparenciaAjuste.ouvidoriaPontos}pts
                                {transparenciaAjuste.ouvidoriaPontosEmAndamento > 0 && (
                                  <span className="text-blue-500"> (+{transparenciaAjuste.ouvidoriaPontosEmAndamento} est.)</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                        {/* Barra de pontos estimados (mais clara, por baixo) */}
                        {hasEstimados && (
                          <div
                            className={`h-full ${color.bgLight} opacity-60 transition-all duration-1000 ease-out absolute rounded-lg`}
                            style={{ 
                              width: `${Math.min(barWidthComEstimados, 100)}%`,
                              zIndex: 0
                            }}
                          />
                        )}
                        {/* Barra de progresso efetivado (por cima) */}
                        <div
                          className={`h-full ${color.bg} transition-all duration-1000 ease-out absolute rounded-lg`}
                          style={{ 
                            width: `${Math.min(barWidth, 100)}%`,
                            zIndex: 1
                          }}
                        />
                        {/* Linha vermelha indicando limite máximo */}
                        {hasLimit && maxBarWidth < 100 && (
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-red-600 z-20"
                            style={{ left: `${maxBarWidth}%` }}
                            title={`Máximo possível: ${eixo.percentualMaximo.toFixed(1)}%`}
                          >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Legenda */}
              <div className="pt-4 border-t mt-4">
                <div className="flex items-center justify-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="font-medium">Pontos Efetivados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-400 opacity-60 rounded"></div>
                    <span className="font-medium">+ Pontos Estimados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-red-600 rounded"></div>
                    <span className="font-medium">Limite Máximo</span>
                  </div>
                </div>
              </div>

              {/* Total Geral */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 text-center font-medium">
                  Total: {statsAjustados.pontosTotais} de {statsAjustados.pontosAplicaveis} pontos ({statsAjustados.percentualGeral.toFixed(1)}%)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Eixos Temáticos - Melhorado */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-4">
            Eixos Temáticos
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            O prêmio é dividido em 4 eixos principais, cada um avaliando diferentes aspectos da qualidade do tribunal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {eixos.map((eixo, index) => {
            const Icon = eixo.icone;
            const gradients = {
              blue: 'from-blue-500 to-blue-600',
              green: 'from-green-500 to-green-600',
              purple: 'from-purple-500 to-purple-600',
              orange: 'from-orange-500 to-orange-600'
            };
            const gradient = gradients[eixo.cor as keyof typeof gradients] || 'from-gray-500 to-gray-600';
            
            return (
              <Card 
                key={index} 
                className="border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group bg-white"
                onClick={() => navigate('/consultar')}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-4 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl font-bold text-gray-800 mb-2">
                        {eixo.nome}
                      </CardTitle>
                      <CardDescription className="text-base text-gray-600">
                        {eixo.descricao}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Como Funciona - Melhorado */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Como Funciona
            </h2>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
              Processo simples e transparente de gestão das metas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                numero: '1',
                titulo: 'Consulta Pública',
                descricao: 'Qualquer pessoa pode consultar os requisitos e o progresso das metas'
              },
              {
                numero: '2',
                titulo: 'Prestação de Contas',
                descricao: 'Setores e coordenadores registram o cumprimento das metas'
              },
              {
                numero: '3',
                titulo: 'Acompanhamento',
                descricao: 'Sistema calcula automaticamente a pontuação e gera relatórios'
              }
            ].map((passo, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-2xl">
                  {passo.numero}
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">{passo.titulo}</h3>
                <p className="text-blue-100 text-lg leading-relaxed">
                  {passo.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Redesenhado com Brasão */}
      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Brasão TJPB */}
            <div className="flex items-center gap-4">
              <img 
                src="/assets/images/tjpb-brasao.png" 
                alt="Brasão TJPB" 
                className="h-16 w-16 object-contain drop-shadow-2xl"
              />
              <div className="text-left">
                <p className="font-bold text-xl text-white">
                  TJPB
                </p>
                <p className="text-sm text-blue-200">
                  Tribunal de Justiça da Paraíba
                </p>
              </div>
            </div>
            
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            
            <div className="space-y-2">
              <p className="text-blue-200 font-medium">
                Eficiência em Ação - Prêmio CNJ de Qualidade 2026
              </p>
              <p className="text-sm text-blue-300 italic">
                Unidos por resultados: TJPB no padrão Excelência
              </p>
              <p className="text-blue-300 text-sm mt-2">
                © 2025 - Todos os direitos reservados
              </p>
              <button
                onClick={clearAndReload}
                className="text-xs text-blue-400 hover:text-blue-300 mt-3 opacity-60 hover:opacity-100 transition-opacity"
                title="Use se os dados parecerem desatualizados"
              >
                🔄 Limpar Cache
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
