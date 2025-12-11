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
import { ArrowLeft, Search, Download, Filter, Scale, X, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getMetasWithUpdates } from '@/lib/mockData';

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
  percentual_cumprimento?: number;
  observacoes?: string;
}

const TabelaCompletaPage = () => {
  const navigate = useNavigate();
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
      'Deadline',
      'Observação'
    ];

    const rows = filteredMetas.map(meta => {
      const pontosRecebidos = calcularPontosRecebidos(meta);
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
        format(parseISO(meta.deadline), 'dd/MM/yyyy', { locale: ptBR }),
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

  const copyPontosToClipboard = () => {
    // Criar dados para copiar no formato de coluna do Google Sheets
    const header = 'Pontos Recebidos\n';
    const pontosData = filteredMetas.map(meta => {
      const pontosRecebidos = calcularPontosRecebidos(meta);
      return pontosRecebidos.toFixed(2);
    }).join('\n');

    const textToCopy = header + pontosData;

    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success(`${filteredMetas.length + 1} valores copiados! Cole no Google Sheets com Ctrl+V`);
    }).catch(() => {
      toast.error('Erro ao copiar para área de transferência');
    });
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
                size="icon"
                onClick={() => navigate('/consultar')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TJPB - Prêmio CNJ</h1>
                  <p className="text-xs text-gray-600">Tabela Completa de Requisitos</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={copyPontosToClipboard} variant="outline" className="gap-2">
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copiar Pontos</span>
              </Button>
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
                  <TableHead className="min-w-[120px] bg-white border-b-2 border-gray-200">Deadline</TableHead>
                  <TableHead className="min-w-[200px] bg-white border-b-2 border-gray-200">Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMetas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
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
                        {pontosRecebidos.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusColor(meta.percentual_cumprimento)}>
                          {meta.percentual_cumprimento?.toFixed(1) || '0.0'}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(meta.deadline), 'dd/MM/yyyy', { locale: ptBR })}
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

        {/* Resumo */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-muted-foreground mb-1">Total de Pontos Aplicáveis</p>
            <p className="text-3xl font-bold text-gray-900">
              {filteredMetas.reduce((sum, m) => sum + m.pontos_aplicaveis, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-muted-foreground mb-1">Total de Pontos Recebidos</p>
            <p className="text-3xl font-bold text-green-600">
              {filteredMetas.reduce((sum, m) => sum + calcularPontosRecebidos(m), 0).toFixed(1)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-sm text-muted-foreground mb-1">Performance Geral</p>
            <p className="text-3xl font-bold text-blue-600">
              {filteredMetas.length > 0
                ? (
                    (filteredMetas.reduce((sum, m) => sum + calcularPontosRecebidos(m), 0) /
                      filteredMetas.reduce((sum, m) => sum + m.pontos_aplicaveis, 0)) *
                    100
                  ).toFixed(1)
                : '0.0'}
              %
            </p>
          </div>
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
