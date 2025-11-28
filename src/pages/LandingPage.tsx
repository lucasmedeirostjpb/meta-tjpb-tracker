import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Target, Award, Users, FileText, LogIn, ChevronDown, Search, LayoutList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { mockMetas } from '@/lib/mockData';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
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

        setStats({
          eixos: 4,
          requisitos: totalRequisitos,
          pontosTotais: totalPontos,
          setores: setoresUnicos,
          eixosData
        });
      } else {
        // Buscar dados reais do Supabase
        const { data: metas, error } = await supabase
          .from('metas_base')
          .select(`
            id,
            eixo,
            pontos_aplicaveis,
            setor_executor
          `);

        if (error) throw error;

        // Buscar todos os updates
        const { data: updates, error: updatesError } = await supabase
          .from('updates')
          .select('meta_id, percentual_cumprimento, updated_at')
          .order('updated_at', { ascending: false });

        if (updatesError) throw updatesError;

        // Criar mapa de updates mais recentes por meta
        const updatesMap = new Map<string, number>();
        updates?.forEach(update => {
          if (!updatesMap.has(update.meta_id)) {
            updatesMap.set(update.meta_id, update.percentual_cumprimento || 0);
          }
        });

        const totalRequisitos = metas?.length || 0;
        const totalPontos = metas?.reduce((sum, m) => sum + m.pontos_aplicaveis, 0) || 0;
        const setoresUnicos = new Set(metas?.map(m => m.setor_executor)).size || 0;

        const eixosMap = new Map<string, { pontos: number; pontosRecebidos: number; cor: string }>();
        metas?.forEach(meta => {
          const eixoLimpo = meta.eixo.replace(/^\d+\.\s*/, '');
          if (!eixosMap.has(eixoLimpo)) {
            eixosMap.set(eixoLimpo, { pontos: 0, pontosRecebidos: 0, cor: getEixoColor(eixoLimpo) });
          }
          const eixoData = eixosMap.get(eixoLimpo)!;
          eixoData.pontos += meta.pontos_aplicaveis;
          
          // Pegar percentual do update mais recente
          const percentual = updatesMap.get(meta.id) || 0;
          eixoData.pontosRecebidos += (meta.pontos_aplicaveis * percentual) / 100;
        });

        const eixosData = Array.from(eixosMap.entries()).map(([nome, data]) => ({
          nome,
          pontos: data.pontos,
          pontosRecebidos: data.pontosRecebidos,
          percentual: data.pontos > 0 ? (data.pontosRecebidos / data.pontos) * 100 : 0,
          cor: data.cor
        }));

        setStats({
          eixos: 4,
          requisitos: totalRequisitos,
          pontosTotais: totalPontos,
          setores: setoresUnicos,
          eixosData
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
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
      icone: Award,
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

  const statsCards = [
    { label: 'Eixos Temáticos', value: stats.eixos.toString(), color: 'blue' },
    { label: 'Requisitos', value: stats.requisitos.toString(), color: 'green' },
    { label: 'Pontos Totais', value: stats.pontosTotais.toString(), color: 'purple' },
    { label: 'Setores Envolvidos', value: stats.setores.toString(), color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header/Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <defs>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#1e40af', stopOpacity: 1}} />
                      <stop offset="100%" style={{stopColor: '#2563eb', stopOpacity: 1}} />
                    </linearGradient>
                  </defs>
                  {/* Escudo */}
                  <path d="M50 5 L85 20 L85 50 Q85 75 50 95 Q15 75 15 50 L15 20 Z" fill="url(#blueGradient)" stroke="#94a3b8" strokeWidth="2"/>
                  {/* Balança */}
                  <line x1="50" y1="30" x2="50" y2="60" stroke="#fbbf24" strokeWidth="2"/>
                  <line x1="35" y1="35" x2="65" y2="35" stroke="#fbbf24" strokeWidth="2"/>
                  <path d="M32 35 L32 40 L38 45 L32 45 Z" fill="#fbbf24"/>
                  <path d="M68 35 L68 40 L62 45 L68 45 Z" fill="#fbbf24"/>
                  {/* Livro */}
                  <rect x="42" y="55" width="16" height="12" fill="#fbbf24" rx="1"/>
                  <line x1="50" y1="57" x2="50" y2="65" stroke="#1e40af" strokeWidth="1"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TJPB - Prêmio CNJ</h1>
                <p className="text-xs text-gray-600">Qualidade 2026</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/consolidado')}
                className="gap-2 hidden md:flex"
              >
                <LayoutList className="h-4 w-4" />
                Visão Consolidada
              </Button>
              <Button onClick={() => navigate('/consultar')}>
                Acessar Sistema
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <Badge className="bg-blue-100 text-blue-800 text-sm px-4 py-2 hover:bg-blue-100 cursor-default">
            Tribunal de Justiça da Paraíba
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Prêmio CNJ de Qualidade
            <span className="block text-blue-600 mt-2">2026</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema de acompanhamento e gestão das metas para o Prêmio Conselho Nacional de Justiça de Qualidade
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/consultar')}
              className="gap-2 text-lg px-8"
            >
              <Target className="h-5 w-5" />
              Consultar Requisitos
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/consolidado')}
              className="gap-2 text-lg px-8"
            >
              <LayoutList className="h-5 w-5" />
              Visão Consolidada
            </Button>
          </div>

          <div className="pt-8">
            <ChevronDown className="h-8 w-8 text-gray-400 mx-auto animate-bounce" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <p className={`text-4xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Performance por Eixo */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Performance por Eixo
            </h2>
            <p className="text-lg text-gray-600">
              Acompanhe o progresso de cada eixo temático
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {stats.eixosData.map((eixo, index) => {
              const strokeDasharray = `${eixo.percentual * 2.51} 251`;
              const corClass = eixo.cor === 'blue' ? 'stroke-blue-600' :
                              eixo.cor === 'green' ? 'stroke-green-600' :
                              eixo.cor === 'purple' ? 'stroke-purple-600' :
                              eixo.cor === 'orange' ? 'stroke-orange-600' : 'stroke-gray-600';
              const bgClass = eixo.cor === 'blue' ? 'bg-blue-50' :
                             eixo.cor === 'green' ? 'bg-green-50' :
                             eixo.cor === 'purple' ? 'bg-purple-50' :
                             eixo.cor === 'orange' ? 'bg-orange-50' : 'bg-gray-50';
              const textClass = eixo.cor === 'blue' ? 'text-blue-600' :
                               eixo.cor === 'green' ? 'text-green-600' :
                               eixo.cor === 'purple' ? 'text-purple-600' :
                               eixo.cor === 'orange' ? 'text-orange-600' : 'text-gray-600';

              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">{eixo.nome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative inline-flex items-center justify-center">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={strokeDasharray}
                          className={corClass}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-3xl font-bold ${textClass}`}>
                          {eixo.percentual.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className={`mt-4 p-3 ${bgClass} rounded-lg`}>
                      <p className="text-xs text-gray-600">Pontos Alcançados</p>
                      <p className={`text-lg font-bold ${textClass}`}>
                        {eixo.pontosRecebidos.toFixed(0)}
                      </p>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      de {eixo.pontos} pontos
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Eixos Temáticos */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Eixos Temáticos
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            O prêmio é dividido em 4 eixos principais, cada um avaliando diferentes aspectos da qualidade do tribunal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {eixos.map((eixo, index) => {
            const Icon = eixo.icone;
            return (
              <Card 
                key={index} 
                className={`border-l-4 border-${eixo.cor}-500 hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => navigate('/consultar')}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className={`p-3 bg-${eixo.cor}-100 rounded-lg`}>
                      <Icon className={`h-6 w-6 text-${eixo.cor}-600`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{eixo.nome}</CardTitle>
                      <CardDescription className="mt-2">
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

      {/* Como Funciona */}
      <section className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-lg text-gray-600">
              Processo simples e transparente de gestão das metas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Consulta Pública</h3>
              <p className="text-gray-600">
                Qualquer pessoa pode consultar os requisitos e o progresso das metas
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Prestação de Contas</h3>
              <p className="text-gray-600">
                Setores e coordenadores fazem login para registrar o cumprimento das metas
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Acompanhamento</h3>
              <p className="text-gray-600">
                Sistema calcula automaticamente a pontuação e gera relatórios
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-16 text-center">
        <Card className="max-w-3xl mx-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl">
              Pronto para começar?
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Consulte os requisitos ou faça login para gerenciar as metas do seu setor
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/consultar')}
              className="gap-2"
            >
              <Search className="h-5 w-5" />
              Consultar Requisitos
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/consolidado')}
              className="gap-2 bg-white text-blue-600 hover:bg-blue-50"
            >
              <LayoutList className="h-5 w-5" />
              Visão Consolidada
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg viewBox="0 0 100 100" className="h-8 w-8">
              <defs>
                <linearGradient id="blueGradientFooter" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#60a5fa', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              {/* Escudo */}
              <path d="M50 5 L85 20 L85 50 Q85 75 50 95 Q15 75 15 50 L15 20 Z" fill="url(#blueGradientFooter)" stroke="#94a3b8" strokeWidth="2"/>
              {/* Balança */}
              <line x1="50" y1="30" x2="50" y2="60" stroke="#fbbf24" strokeWidth="2"/>
              <line x1="35" y1="35" x2="65" y2="35" stroke="#fbbf24" strokeWidth="2"/>
              <path d="M32 35 L32 40 L38 45 L32 45 Z" fill="#fbbf24"/>
              <path d="M68 35 L68 40 L62 45 L68 45 Z" fill="#fbbf24"/>
              {/* Livro */}
              <rect x="42" y="55" width="16" height="12" fill="#fbbf24" rx="1"/>
              <line x1="50" y1="57" x2="50" y2="65" stroke="#1e40af" strokeWidth="1"/>
            </svg>
            <span className="font-semibold">TJPB - Tribunal de Justiça da Paraíba</span>
          </div>
          <p className="text-gray-400 text-sm">
            Sistema de Gestão do Prêmio CNJ de Qualidade 2026
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © 2025 - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
