import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Target, Award, Users, FileText, LogIn, ChevronDown, Search, LayoutList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

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

  const stats = [
    { label: 'Eixos Temáticos', value: '4', color: 'blue' },
    { label: 'Requisitos', value: '50+', color: 'green' },
    { label: 'Pontos Totais', value: '1000', color: 'purple' },
    { label: 'Setores Envolvidos', value: '15+', color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header/Navbar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Scale className="h-6 w-6 text-white" />
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
          <Badge className="bg-blue-100 text-blue-800 text-sm px-4 py-2">
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
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <p className={`text-4xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
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
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scale className="h-6 w-6" />
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
