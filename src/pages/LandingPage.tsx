import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Target, Award, Users, FileText, Search, LayoutList, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '@/services/api';
import { mockMetas } from '@/lib/mockData';

const LandingPage = () => {
  const navigate = useNavigate();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const [stats, setStats] = useState({
    eixos: 4,
    requisitos: 0,
    pontosTotais: 0,
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
        const totalPontos = mockMetas.reduce((sum, m) => sum + m.pontos_aplicaveis, 0);
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
          pontosTotais: totalPontos,
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
                  TJPB - Prêmio CNJ
                </h1>
                <p className="text-xs text-gray-600 font-medium">Qualidade 2026</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/tabela')}
                className="gap-2 hidden lg:flex hover:bg-blue-50 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Tabela Completa
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/consolidado')}
                className="gap-2 hidden md:flex hover:bg-blue-50 transition-colors"
              >
                <LayoutList className="h-4 w-4" />
                Visão Consolidada
              </Button>
              <Button 
                onClick={() => navigate('/consultar')}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
              >
                Acessar Sistema
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Redesenhado */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-6 py-2 hover:from-blue-700 hover:to-indigo-700 cursor-default shadow-lg">
            Tribunal de Justiça da Paraíba
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Prêmio CNJ
            </span>
            <br />
            <span className="text-gray-800">
              de Qualidade
            </span>
            <span className="block text-blue-600 mt-2">2026</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Sistema de acompanhamento e gestão das metas para o Prêmio Conselho Nacional de Justiça de Qualidade
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              size="lg" 
              onClick={() => navigate('/consultar')}
              className="gap-3 text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <Target className="h-6 w-6" />
              Consultar Requisitos
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/consolidado')}
              className="gap-3 text-lg px-8 py-6 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <LayoutList className="h-6 w-6" />
              Visão Consolidada
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Grid - Modernizado */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {[
            { label: 'Eixos Temáticos', value: stats.eixos, color: 'from-blue-500 to-blue-600', icon: Target },
            { label: 'Requisitos', value: stats.requisitos, color: 'from-green-500 to-green-600', icon: CheckCircle2 },
            { label: 'Pontos Totais', value: stats.pontosTotais, color: 'from-purple-500 to-purple-600', icon: Award },
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

      {/* CTA Final - Redesenhado */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white border-0 shadow-2xl">
          <CardHeader className="pb-6 pt-10">
            <CardTitle className="text-4xl md:text-5xl font-bold text-center">
              Pronto para começar?
            </CardTitle>
            <CardDescription className="text-blue-100 text-xl text-center mt-4">
              Consulte os requisitos e gerencie as metas do seu setor
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center pb-10">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/consultar')}
              className="gap-2 text-lg px-8 py-6 bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <Search className="h-5 w-5" />
              Consultar Requisitos
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/consolidado')}
              className="gap-2 text-lg px-8 py-6 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <LayoutList className="h-5 w-5" />
              Visão Consolidada
            </Button>
          </CardContent>
        </Card>
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
                Sistema de Gestão do Prêmio CNJ de Qualidade 2026
              </p>
              <p className="text-blue-300 text-sm">
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
