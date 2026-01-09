import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Target, Award, Users, FileText, Search, LayoutList, TrendingUp, CheckCircle2, ArrowRight, LogOut, LogIn, AlertCircle, Edit, Gauge, BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { api } from '@/services/api';
import { mockMetas } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import GaugeChart from '@/components/GaugeChart';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const [stats, setStats] = useState({
    eixos: 4,
    requisitos: 0,
    pontosTotais: 0,
    pontosAplicaveis: 0,
    percentualGeral: 0,
    setores: 0,
    eixosData: [] as Array<{ nome: string; pontos: number; pontosRecebidos: number; percentual: number; cor: string }>
  });

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
        
        const eixosMap = new Map<string, { pontos: number; pontosRecebidos: number; cor: string }>();
        mockMetas.forEach(meta => {
          const eixoLimpo = meta.eixo.replace(/^\d+\.\s*/, '');
          if (!eixosMap.has(eixoLimpo)) {
            eixosMap.set(eixoLimpo, { pontos: 0, pontosRecebidos: 0, cor: getEixoColor(eixoLimpo) });
          }
          const eixoData = eixosMap.get(eixoLimpo)!;
          eixoData.pontos += meta.pontos_aplicaveis;
        });

        const eixosData = Array.from(eixosMap.entries()).map(([nome, data]) => ({
          nome,
          pontos: data.pontos,
          pontosRecebidos: data.pontosRecebidos,
          percentual: 0,
          cor: data.cor
        }));

        console.log('✅ [LANDING] Estatísticas calculadas (MOCK):', {
          eixos: 4,
          requisitos: totalRequisitos,
          pontos: totalPontos
        });

        setStats({
          eixos: 4,
          requisitos: totalRequisitos,
          pontosTotais: pontosRecebidos,
          pontosAplicaveis: totalPontosAplicaveis,
          percentualGeral: totalPontosAplicaveis > 0 ? (pontosRecebidos / totalPontosAplicaveis) * 100 : 0,
          setores: setoresUnicos,
          eixosData
        });
      } else {
        console.log('🌐 [LANDING] Usando Supabase REAL');
        // Buscar dados da API
        const statsData = await api.getStats();
        console.log('✅ [LANDING] Estatísticas recebidas:', statsData);
        setStats(statsData);
      }
    } catch (error: any) {
      console.error('❌ [LANDING] Erro ao carregar estatísticas:', error);
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
              </>
            ) : (
              <Button 
                size="lg" 
                onClick={() => navigate('/consultar')}
                className="gap-3 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <Search className="h-6 w-6" />
                Consultar Requisitos
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid - Modernizado */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {[
            { label: 'Eixos Temáticos', value: stats.eixos, color: 'from-blue-500 to-blue-600', icon: Target },
            { label: 'Requisitos', value: stats.requisitos, color: 'from-green-500 to-green-600', icon: CheckCircle2 },
            { label: 'Pontos Aplicáveis', value: stats.pontosAplicaveis, color: 'from-purple-500 to-purple-600', icon: Award },
            { label: 'Setores', value: stats.setores, color: 'from-orange-500 to-orange-600', icon: Users },
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
                <GaugeChart value={stats.percentualGeral} size={380} />
              </div>
              
              {/* Percentual e Pontos */}
              <div className="text-center space-y-2">
                <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stats.percentualGeral.toFixed(1)}%
                </div>
                <div className="text-base text-gray-600 font-medium">
                  {stats.pontosTotais} de {stats.pontosAplicaveis} pontos alcançados
                </div>
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
                {stats.eixosData.map((eixo) => {
                  const colors = {
                    blue: { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-500' },
                    green: { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-500' },
                    purple: { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-500' },
                    orange: { bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-500' }
                  };
                  const color = colors[eixo.cor as keyof typeof colors] || colors.blue;
                  const barWidth = (eixo.pontosRecebidos / eixo.pontos) * 100;

                  return (
                    <div key={eixo.nome} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base text-gray-700">{eixo.nome}</span>
                        <span className={`font-bold text-base ${color.text}`}>
                          {Math.round(eixo.pontosRecebidos)} pts
                        </span>
                      </div>
                      <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                        <div
                          className={`h-full ${color.bg} transition-all duration-1000 ease-out flex items-center justify-end pr-3`}
                          style={{ width: `${Math.min(barWidth, 100)}%` }}
                        >
                          <span className="text-sm font-bold text-white">
                            {eixo.percentual.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legenda */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500 text-center font-medium">
                  Total: {stats.pontosTotais} de {stats.pontosAplicaveis} pontos ({stats.percentualGeral.toFixed(1)}%)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Performance por Eixo - Redesenhado */}
      <section className="bg-white/80 backdrop-blur-sm py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent mb-4">
              Performance por Eixo
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Acompanhe o progresso de cada eixo temático do prêmio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {stats.eixosData.map((eixo, index) => {
              const strokeDasharray = `${eixo.percentual * 2.51} 251`;
              const gradients = {
                blue: 'from-blue-500 to-blue-600',
                green: 'from-green-500 to-green-600',
                purple: 'from-purple-500 to-purple-600',
                orange: 'from-orange-500 to-orange-600'
              };
              const gradient = gradients[eixo.cor as keyof typeof gradients] || 'from-gray-500 to-gray-600';

              return (
                <Card key={index} className="text-center border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-800">{eixo.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="54"
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="54"
                            stroke="url(#gradient-${index})"
                            strokeWidth="10"
                            fill="none"
                            strokeDasharray={strokeDasharray}
                            strokeLinecap="round"
                            className="transition-all duration-1000"
                          />
                          <defs>
                            <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" className={`text-${eixo.cor}-500`} stopColor="currentColor" />
                              <stop offset="100%" className={`text-${eixo.cor}-600`} stopColor="currentColor" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                            {eixo.percentual.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">Pontos Alcançados</p>
                      <p className={`text-2xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                        {eixo.pontosRecebidos.toFixed(0)} / {eixo.pontos}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
