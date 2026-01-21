import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Search, Download, Filter, Scale, X, Copy, ChevronLeft, ChevronRight, LogOut, LogIn, Edit, History, FileText } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getMetasWithUpdates } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';

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
  status?: string;
  estimativa_cumprimento?: string;
  pontos_estimados?: number;
  estimativa_maxima?: number;
  percentual_cumprimento?: number;
  observacoes?: string;
  acoes_planejadas?: string;
  justificativa_parcial?: string;
  atividades?: Array<{
    id: string;
    acao: string;
    responsavel: string;
    prazo: string;
    status: string;
    andamento?: string;
  }>;
}

const TabelaCompletaPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [metas, setMetas] = useState<Meta[]>([]);
  const [filteredMetas, setFilteredMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Scroll state
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEixo, setSelectedEixo] = useState<string>('todos');
  const [selectedSetor, setSelectedSetor] = useState<string>('todos');
  const [selectedCoordenador, setSelectedCoordenador] = useState<string>('todos');

  useEffect(() => {
    fetchMetas();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedEixo, selectedSetor, selectedCoordenador, metas]);

  // Verificar se pode fazer scroll
  const checkScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [filteredMetas]);

  const scrollTable = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 400;
    const newScrollLeft = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const fetchMetas = async () => {
    setLoading(true);
    try {
      if (isMockMode) {
        console.log('📊 [TABELA] Usando dados MOCK');
        const data = getMetasWithUpdates();
        setMetas(data);
      } else {
        console.log('🌐 [TABELA] Buscando dados do Supabase');
        const data = await api.getMetas();
        setMetas(data);
      }
    } catch (error: any) {
      console.error('❌ [TABELA] Erro ao carregar metas:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...metas];

    // Filtro de busca textual
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.requisito.toLowerCase().includes(search) ||
        m.artigo.toLowerCase().includes(search) ||
        m.descricao?.toLowerCase().includes(search) ||
        m.item?.toLowerCase().includes(search) ||
        m.eixo.toLowerCase().includes(search)
      );
    }

    // Filtro por eixo
    if (selectedEixo !== 'todos') {
      filtered = filtered.filter(m => m.eixo === selectedEixo);
    }

    // Filtro por setor
    if (selectedSetor !== 'todos') {
      filtered = filtered.filter(m => m.setor_executor === selectedSetor);
    }

    // Filtro por coordenador
    if (selectedCoordenador !== 'todos') {
      filtered = filtered.filter(m => m.coordenador === selectedCoordenador);
    }

    setFilteredMetas(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedEixo('todos');
    setSelectedSetor('todos');
    setSelectedCoordenador('todos');
  };

  const exportToCSV = () => {
    const headers = [
      'Eixo',
      'Coordenador Executivo',
      'Setor Executor',
      'Item',
      'Artigo',
      'Requisito',
      'Descrição',
      'Pontos Aplicáveis 2026',
      'Pontos Recebidos 2026',
      'Performance',
      'Status',
      'Deadline',
      'Ações - Legado',
      'Atividade 1',
      'Atividade 2',
      'Atividade 3',
      'Atividade 4',
      'Atividade 5',
      'Justificativa para Parcial',
      'Observação'
    ];

    const rows = filteredMetas.map(meta => {
      const pontosRecebidos = calcularPontosRecebidos(meta);
      
      // Formatar atividades
      const atividade1 = meta.atividades?.[0] 
        ? `${meta.atividades[0].acao} | Resp: ${meta.atividades[0].responsavel} | Prazo: ${meta.atividades[0].prazo ? format(parseISO(meta.atividades[0].prazo), 'dd/MM/yyyy', { locale: ptBR }) : 'Sem prazo'} | Status: ${meta.atividades[0].status}${meta.atividades[0].andamento ? ` | Andamento: ${meta.atividades[0].andamento}` : ''}`
        : '';
      const atividade2 = meta.atividades?.[1]
        ? `${meta.atividades[1].acao} | Resp: ${meta.atividades[1].responsavel} | Prazo: ${meta.atividades[1].prazo ? format(parseISO(meta.atividades[1].prazo), 'dd/MM/yyyy', { locale: ptBR }) : 'Sem prazo'} | Status: ${meta.atividades[1].status}${meta.atividades[1].andamento ? ` | Andamento: ${meta.atividades[1].andamento}` : ''}`
        : '';
      const atividade3 = meta.atividades?.[2]
        ? `${meta.atividades[2].acao} | Resp: ${meta.atividades[2].responsavel} | Prazo: ${meta.atividades[2].prazo ? format(parseISO(meta.atividades[2].prazo), 'dd/MM/yyyy', { locale: ptBR }) : 'Sem prazo'} | Status: ${meta.atividades[2].status}${meta.atividades[2].andamento ? ` | Andamento: ${meta.atividades[2].andamento}` : ''}`
        : '';
      const atividade4 = meta.atividades?.[3]
        ? `${meta.atividades[3].acao} | Resp: ${meta.atividades[3].responsavel} | Prazo: ${meta.atividades[3].prazo ? format(parseISO(meta.atividades[3].prazo), 'dd/MM/yyyy', { locale: ptBR }) : 'Sem prazo'} | Status: ${meta.atividades[3].status}${meta.atividades[3].andamento ? ` | Andamento: ${meta.atividades[3].andamento}` : ''}`
        : '';
      const atividade5 = meta.atividades?.[4]
        ? `${meta.atividades[4].acao} | Resp: ${meta.atividades[4].responsavel} | Prazo: ${meta.atividades[4].prazo ? format(parseISO(meta.atividades[4].prazo), 'dd/MM/yyyy', { locale: ptBR }) : 'Sem prazo'} | Status: ${meta.atividades[4].status}${meta.atividades[4].andamento ? ` | Andamento: ${meta.atividades[4].andamento}` : ''}`
        : '';

      return [
        meta.eixo,
        meta.coordenador || '',
        meta.setor_executor,
        meta.item || '',
        meta.artigo,
        meta.requisito,
        meta.descricao || '',
        meta.pontos_aplicaveis,
        pontosRecebidos.toFixed(2),
        `${meta.percentual_cumprimento?.toFixed(1) || '0.0'}%`,
        meta.estimativa_cumprimento || 'Não se Aplica',
        format(parseISO(meta.deadline), 'dd/MM/yyyy', { locale: ptBR }),
        meta.acoes_planejadas || '',
        atividade1,
        atividade2,
        atividade3,
        atividade4,
        atividade5,
        meta.justificativa_parcial || '',
        meta.observacoes || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `requisitos-cnj-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success('Tabela exportada com sucesso!');
  };

  const copyColumnToClipboard = (columnName: string) => {
    let header = '';
    let data: string[] = [];

    switch (columnName) {
      case 'pontos_recebidos':
        header = 'Pontos Recebidos';
        data = filteredMetas.map(meta => calcularPontosRecebidos(meta).toFixed(2));
        break;
      case 'pontos_aplicaveis':
        header = 'Pontos Aplicáveis';
        data = filteredMetas.map(meta => meta.pontos_aplicaveis.toString());
        break;
      case 'performance':
        header = 'Performance';
        data = filteredMetas.map(meta => `${meta.percentual_cumprimento?.toFixed(1) || '0.0'}%`);
        break;
      case 'status':
        header = 'Status';
        data = filteredMetas.map(meta => meta.estimativa_cumprimento || 'Não se Aplica');
        break;
      case 'eixo':
        header = 'Eixo';
        data = filteredMetas.map(meta => meta.eixo);
        break;
      case 'coordenador':
        header = 'Coordenador';
        data = filteredMetas.map(meta => meta.coordenador || '');
        break;
      case 'setor':
        header = 'Setor Executor';
        data = filteredMetas.map(meta => meta.setor_executor);
        break;
      case 'requisito':
        header = 'Requisito';
        data = filteredMetas.map(meta => meta.requisito);
        break;
      case 'deadline':
        header = 'Deadline';
        data = filteredMetas.map(meta => format(parseISO(meta.deadline), 'dd/MM/yyyy', { locale: ptBR }));
        break;
      case 'acoes':
        header = 'Ações - Legado';
        data = filteredMetas.map(meta => meta.acoes_planejadas || '');
        break;
      case 'justificativa':
        header = 'Justificativa para Parcial';
        data = filteredMetas.map(meta => meta.justificativa_parcial || '');
        break;
      case 'observacoes':
        header = 'Observação';
        data = filteredMetas.map(meta => meta.observacoes || '');
        break;
      default:
        return;
    }

    const textToCopy = header + '\n' + data.join('\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success(`Coluna "${header}" copiada! ${filteredMetas.length + 1} valores copiados.`);
    }).catch(() => {
      toast.error('Erro ao copiar para área de transferência');
    });
  };

  const copyPontosToClipboard = () => {
    copyColumnToClipboard('pontos_recebidos');
  };

  const calcularPontosRecebidos = (meta: Meta): number => {
    // Se o requisito foi totalmente cumprido, retorna todos os pontos
    if (meta.estimativa_cumprimento === 'Totalmente Cumprido') {
      return meta.pontos_aplicaveis;
    }
    
    // Se foi parcialmente cumprido, retorna os pontos estimados
    if (meta.estimativa_cumprimento === 'Parcialmente Cumprido') {
      return meta.pontos_estimados || 0;
    }
    
    // Se não foi cumprido ou não se aplica, retorna 0
    return 0;
  };

  // Obter listas únicas para filtros
  const eixosUnicos = ['todos', ...new Set(metas.map(m => m.eixo))];
  const setoresUnicos = ['todos', ...new Set(metas.map(m => m.setor_executor).filter(Boolean))];
  const coordenadoresUnicos = ['todos', ...new Set(metas.map(m => m.coordenador).filter(Boolean))];

  const getStatusColor = (percentual?: number) => {
    if (!percentual || percentual === 0) return 'bg-gray-100 text-gray-800';
    if (percentual < 50) return 'bg-red-100 text-red-800';
    if (percentual < 100) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusBadgeColor = (estimativa?: string) => {
    switch (estimativa) {
      case 'Totalmente Cumprido': return 'bg-green-100 text-green-800 border-green-300';
      case 'Parcialmente Cumprido': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Em Andamento': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Não Cumprido': return 'bg-red-100 text-red-800 border-red-300';
      case 'Não se Aplica': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Calcular progresso por eixo
  const getProgressoPorEixo = () => {
    const eixosMap = new Map<string, {
      nome: string;
      pontos: number;
      recebidos: number;
      maximos: number;
      cor: string;
    }>();

    // IMPORTANTE: usar filteredMetas, não metas
    filteredMetas.forEach(meta => {
      const eixoLimpo = meta.eixo.replace(/^\d+\.\s*/, '');
      if (!eixosMap.has(eixoLimpo)) {
        let cor = 'blue';
        if (eixoLimpo.toLowerCase().includes('governança')) cor = 'blue';
        else if (eixoLimpo.toLowerCase().includes('produtividade')) cor = 'green';
        else if (eixoLimpo.toLowerCase().includes('transparência')) cor = 'purple';
        else if (eixoLimpo.toLowerCase().includes('dados') || eixoLimpo.toLowerCase().includes('tecnologia')) cor = 'orange';

        eixosMap.set(eixoLimpo, {
          nome: eixoLimpo,
          pontos: 0,
          recebidos: 0,
          maximos: 0,
          cor
        });
      }

      const eixoData = eixosMap.get(eixoLimpo)!;
      eixoData.pontos += meta.pontos_aplicaveis;

      // Calcular recebidos
      if (meta.estimativa_cumprimento === 'Totalmente Cumprido') {
        eixoData.recebidos += meta.pontos_aplicaveis;
      } else if (meta.estimativa_cumprimento === 'Parcialmente Cumprido' && meta.pontos_estimados) {
        eixoData.recebidos += meta.pontos_estimados;
      } else if (meta.estimativa_cumprimento === 'Em Andamento' && meta.pontos_estimados) {
        eixoData.recebidos += meta.pontos_estimados;
      }

      // Calcular máximos (para TODAS as metas)
      if (meta.estimativa_cumprimento === 'Em Andamento' && meta.estimativa_maxima !== undefined && meta.estimativa_maxima !== null) {
        eixoData.maximos += meta.estimativa_maxima;
      } else if (meta.estimativa_cumprimento === 'Não Cumprido') {
        // Verificar se tem evidências válidas (mínimo 5 caracteres)
        const temEvidencia = meta.link_evidencia && meta.link_evidencia.trim().length >= 5;
        if (temEvidencia) {
          // Não Cumprido REAL (com evidências): usar estimativa_maxima ou 0 (todos perdidos)
          eixoData.maximos += (meta.estimativa_maxima !== undefined && meta.estimativa_maxima !== null ? meta.estimativa_maxima : 0);
        } else {
          // Se não tem evidências, é "Pendente", não compromete pontos
          eixoData.maximos += meta.pontos_aplicaveis;
        }
      } else {
        eixoData.maximos += meta.pontos_aplicaveis;
      }
    });

    return Array.from(eixosMap.values());
  };

  const progressoPorEixo = getProgressoPorEixo();

  // Log de pontos comprometidos por eixo
  console.log('📊 ===== ANÁLISE DE PONTOS COMPROMETIDOS =====');
  progressoPorEixo.forEach(eixo => {
    const pontosComprometidos = eixo.pontos - eixo.maximos;
    console.log(`[${eixo.nome}]`, {
      total: eixo.pontos,
      maximos: eixo.maximos,
      comprometidos: pontosComprometidos,
      percentualComprometido: ((pontosComprometidos / eixo.pontos) * 100).toFixed(1) + '%'
    });
  });
  
  const totalGeral = progressoPorEixo.reduce((sum, e) => sum + e.pontos, 0);
  const maximoGeral = progressoPorEixo.reduce((sum, e) => sum + e.maximos, 0);
  const comprometidoGeral = totalGeral - maximoGeral;
  console.log('🔴 TOTAL GERAL:', {
    aplicavel: totalGeral,
    maximoPossivel: maximoGeral,
    comprometido: comprometidoGeral,
    percentualComprometido: ((comprometidoGeral / totalGeral) * 100).toFixed(1) + '%'
  });
  console.log('===============================================');

  const formatAtividade = (atividade: { acao: string; responsavel: string; prazo: string; status: string; andamento?: string }) => {
    const prazoFormatado = atividade.prazo 
      ? format(parseISO(atividade.prazo), 'dd/MM/yyyy', { locale: ptBR })
      : 'Sem prazo';
    return (
      <div className="text-xs space-y-1">
        <p className="font-medium text-gray-900">{atividade.acao}</p>
        
        {atividade.andamento && (
          <div className="mt-1 p-1.5 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs font-semibold text-blue-900 mb-0.5">📋 Andamento:</p>
            <p className="text-xs text-gray-700">{atividade.andamento}</p>
          </div>
        )}
        
        <p className="text-gray-600">👤 {atividade.responsavel}</p>
        <p className="text-gray-600">📅 {prazoFormatado}</p>
        <Badge variant="outline" className="text-xs">
          {atividade.status}
        </Badge>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando requisitos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
                  <p className="text-xs text-gray-600">TJPB - Tabela Completa</p>
                </div>
                {/* Botão discreto para histórico */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/historico')}
                  className="ml-2 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Ver histórico de alterações de requisitos"
                >
                  <History className="h-4 w-4" />
                </Button>
                {/* Botão para histórico de atividades */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/historico-atividades')}
                  className="h-8 w-8 text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                  title="Ver histórico de alterações de atividades"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
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
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              )}
              
              {/* Dropdown para copiar colunas */}
              <Select onValueChange={(value) => copyColumnToClipboard(value)}>
                <SelectTrigger className="w-[200px]">
                  <Copy className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Copiar Coluna</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pontos_recebidos">📊 Pontos Recebidos</SelectItem>
                  <SelectItem value="pontos_aplicaveis">🎯 Pontos Aplicáveis</SelectItem>
                  <SelectItem value="performance">📈 Performance</SelectItem>
                  <SelectItem value="status">✅ Status</SelectItem>
                  <SelectItem value="eixo">📋 Eixo</SelectItem>
                  <SelectItem value="coordenador">👤 Coordenador</SelectItem>
                  <SelectItem value="setor">🏢 Setor Executor</SelectItem>
                  <SelectItem value="requisito">📝 Requisito</SelectItem>
                  <SelectItem value="deadline">📅 Deadline</SelectItem>
                  <SelectItem value="acoes">💼 Ações - Legado</SelectItem>
                  <SelectItem value="justificativa">📄 Justificativa Parcial</SelectItem>
                  <SelectItem value="observacoes">💬 Observações</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportToCSV} className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Filtros</h2>
            {(searchTerm || selectedEixo !== 'todos' || selectedSetor !== 'todos' || selectedCoordenador !== 'todos') && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto gap-2">
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca Textual */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por requisito, artigo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro Eixo */}
            <Select value={selectedEixo} onValueChange={setSelectedEixo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os eixos" />
              </SelectTrigger>
              <SelectContent>
                {eixosUnicos.map(eixo => (
                  <SelectItem key={eixo} value={eixo}>
                    {eixo === 'todos' ? 'Todos os eixos' : eixo.replace(/^\d+\.\s*/, '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Setor */}
            <Select value={selectedSetor} onValueChange={setSelectedSetor}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os setores" />
              </SelectTrigger>
              <SelectContent>
                {setoresUnicos.map(setor => (
                  <SelectItem key={setor} value={setor}>
                    {setor === 'todos' ? 'Todos os setores' : setor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Coordenador */}
            <Select value={selectedCoordenador} onValueChange={setSelectedCoordenador}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os coordenadores" />
              </SelectTrigger>
              <SelectContent>
                {coordenadoresUnicos.map(coord => (
                  <SelectItem key={coord} value={coord}>
                    {coord === 'todos' ? 'Todos os coordenadores' : coord}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Exibindo <strong>{filteredMetas.length}</strong> de <strong>{metas.length}</strong> requisitos
          </div>
        </div>

        {/* Tabela com Controles de Scroll */}
        <div className="relative bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Botões de Scroll (visíveis apenas no desktop) */}
          {canScrollLeft && (
            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-100"
              onClick={() => scrollTable('left')}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          {canScrollRight && (
            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:bg-gray-100"
              onClick={() => scrollTable('right')}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}

          {/* Container com scroll */}
          <div 
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-visible"
            onScroll={checkScrollButtons}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}
          >
            {/* Dica de scroll no mobile */}
            <div className="md:hidden bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-800 text-center">
              👈 Deslize para ver mais colunas 👉
            </div>

            <Table>
              <TableHeader className="sticky top-0 bg-white z-20 shadow-sm">
                <TableRow>
                  <TableHead className="min-w-[200px] bg-white border-b-2 border-gray-200">Eixo</TableHead>
                  <TableHead className="min-w-[150px] bg-white border-b-2 border-gray-200">Coordenador Executivo</TableHead>
                  <TableHead className="min-w-[150px] bg-white border-b-2 border-gray-200">Setor Executor</TableHead>
                  <TableHead className="min-w-[150px] bg-white border-b-2 border-gray-200">Item</TableHead>
                  <TableHead className="min-w-[100px] bg-white border-b-2 border-gray-200">Artigo</TableHead>
                  <TableHead className="min-w-[200px] bg-white border-b-2 border-gray-200">Requisito</TableHead>
                  <TableHead className="min-w-[300px] bg-white border-b-2 border-gray-200">Descrição</TableHead>
                  <TableHead className="min-w-[100px] text-center bg-white border-b-2 border-gray-200">Pontos Aplicáveis</TableHead>
                  <TableHead className="min-w-[100px] text-center bg-green-50 border-b-2 border-green-300 font-semibold">Pontos Recebidos</TableHead>
                  <TableHead className="min-w-[100px] text-center bg-white border-b-2 border-gray-200">Performance</TableHead>
                  <TableHead className="min-w-[120px] bg-white border-b-2 border-gray-200">Status</TableHead>
                  <TableHead className="min-w-[120px] bg-white border-b-2 border-gray-200">Deadline</TableHead>
                  <TableHead className="min-w-[250px] bg-amber-50 border-b-2 border-amber-300">Ações - Legado</TableHead>
                  <TableHead className="min-w-[250px] bg-blue-50 border-b-2 border-blue-300">Atividade 1</TableHead>
                  <TableHead className="min-w-[250px] bg-blue-50 border-b-2 border-blue-300">Atividade 2</TableHead>
                  <TableHead className="min-w-[250px] bg-blue-50 border-b-2 border-blue-300">Atividade 3</TableHead>
                  <TableHead className="min-w-[250px] bg-blue-50 border-b-2 border-blue-300">Atividade 4</TableHead>
                  <TableHead className="min-w-[250px] bg-blue-50 border-b-2 border-blue-300">Atividade 5</TableHead>
                  <TableHead className="min-w-[300px] bg-yellow-50 border-b-2 border-yellow-300">Justificativa para Parcial</TableHead>
                  <TableHead className="min-w-[200px] bg-white border-b-2 border-gray-200">Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMetas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={20} className="text-center py-8 text-muted-foreground">
                      Nenhum requisito encontrado com os filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMetas.map((meta) => {
                    const pontosRecebidos = calcularPontosRecebidos(meta);
                    return (
                    <TableRow key={meta.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {meta.eixo.replace(/^\d+\.\s*/, '')}
                      </TableCell>
                      <TableCell>{meta.coordenador || '-'}</TableCell>
                      <TableCell>{meta.setor_executor}</TableCell>
                      <TableCell>{meta.item || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">{meta.artigo}</TableCell>
                      <TableCell className="font-medium">{meta.requisito}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {meta.descricao || '-'}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {meta.pontos_aplicaveis}
                      </TableCell>
                      <TableCell className="text-center font-bold text-green-600 bg-green-50">
                        {Math.round(pontosRecebidos)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusColor(meta.percentual_cumprimento)}>
                          {meta.percentual_cumprimento?.toFixed(1) || '0.0'}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getStatusBadgeColor(meta.estimativa_cumprimento)}
                        >
                          {meta.estimativa_cumprimento || 'Não se Aplica'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(meta.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground bg-amber-50/30">
                        {meta.acoes_planejadas || '-'}
                      </TableCell>
                      <TableCell className="bg-blue-50/30">
                        {meta.atividades?.[0] ? formatAtividade(meta.atividades[0]) : '-'}
                      </TableCell>
                      <TableCell className="bg-blue-50/30">
                        {meta.atividades?.[1] ? formatAtividade(meta.atividades[1]) : '-'}
                      </TableCell>
                      <TableCell className="bg-blue-50/30">
                        {meta.atividades?.[2] ? formatAtividade(meta.atividades[2]) : '-'}
                      </TableCell>
                      <TableCell className="bg-blue-50/30">
                        {meta.atividades?.[3] ? formatAtividade(meta.atividades[3]) : '-'}
                      </TableCell>
                      <TableCell className="bg-blue-50/30">
                        {meta.atividades?.[4] ? formatAtividade(meta.atividades[4]) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground bg-yellow-50/30">
                        {meta.justificativa_parcial || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {meta.observacoes || '-'}
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Indicadores visuais de mais conteúdo (desktop) */}
          {canScrollRight && (
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
          )}
          {canScrollLeft && (
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Estilos customizados para scrollbar */}
      <style>{`
        .overflow-x-auto::-webkit-scrollbar {
          height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default TabelaCompletaPage;
