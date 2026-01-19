import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Filter, CheckCircle2, Clock, AlertCircle, Calendar, User as UserIcon, ChevronsUpDown, Check, Edit2, Save, X, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Atividade, AtividadeStatus } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface Meta {
  id: string;
  eixo: string;
  item: string;
  artigo: string;
  requisito: string;
  descricao: string;
  setor_executor: string;
  coordenador?: string;
  deadline: string;
  pontos_aplicaveis: number;
  estimativa_cumprimento?: string;
  observacoes?: string;
  atividades?: Atividade[];
}

interface AtividadeComMeta extends Atividade {
  meta_id: string;
  meta_requisito: string;
  meta_eixo: string;
  meta_setor: string;
  meta_coordenador?: string;
}

const GerenciamentoAtividadesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [atividades, setAtividades] = useState<AtividadeComMeta[]>([]);
  const [filteredAtividades, setFilteredAtividades] = useState<AtividadeComMeta[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todas');
  const [filtroSetor, setFiltroSetor] = useState<string>('todos');
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>('todos');
  const [filtroCoordenador, setFiltroCoordenador] = useState<string>('todos');
  const [filtroEixo, setFiltroEixo] = useState<string>('todos');
  const [setores, setSetores] = useState<string[]>([]);
  const [responsaveis, setResponsaveis] = useState<string[]>([]);
  const [coordenadores, setCoordenadores] = useState<string[]>([]);
  const [eixos, setEixos] = useState<string[]>([]);
  const [openSetor, setOpenSetor] = useState(false);
  const [openResponsavel, setOpenResponsavel] = useState(false);
  const [openCoordenador, setOpenCoordenador] = useState(false);
  const [editandoAndamento, setEditandoAndamento] = useState<string | null>(null);
  const [andamentoTemp, setAndamentoTemp] = useState<string>('');
  const [salvandoAndamento, setSalvandoAndamento] = useState(false);
  const [usuarioEdicao, setUsuarioEdicao] = useState<string>('');
  const [andamentoAnterior, setAndamentoAnterior] = useState<string>('');
  
  // NOVO: Estados para ordenação
  const [ordenacao, setOrdenacao] = useState<'prazo' | 'criacao'>('prazo');
  
  // NOVO: Estado para acordeão expandido
  const [atividadeExpandida, setAtividadeExpandida] = useState<string | null>(null);
  
  // NOVO: Estados para edição de campos
  const [editandoCampo, setEditandoCampo] = useState<{ atividadeId: string; campo: 'responsavel' | 'prazo' | 'status' } | null>(null);
  const [valorTempResponsavel, setValorTempResponsavel] = useState<string>('');
  const [valorTempPrazo, setValorTempPrazo] = useState<string>('');
  const [valorTempStatus, setValorTempStatus] = useState<AtividadeStatus>('Não iniciada');

  useEffect(() => {
    fetchAtividades();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [atividades, filtroStatus, filtroSetor, filtroResponsavel, filtroCoordenador, filtroEixo, ordenacao]);

  const fetchAtividades = async () => {
    try {
      setLoading(true);
      const metas = await api.getMetas();
      
      // Extrair todas as atividades de todas as metas
      const todasAtividades: AtividadeComMeta[] = [];
      const setoresUnicos = new Set<string>();
      const responsaveisUnicos = new Set<string>();
      const coordenadoresUnicos = new Set<string>();
      const eixosUnicos = new Set<string>();

      metas.forEach((meta: Meta) => {
        const eixoLimpo = meta.eixo.replace(/^\d+\.\s*/, '');
        eixosUnicos.add(eixoLimpo);
        if (meta.atividades && meta.atividades.length > 0) {
          meta.atividades.forEach((atividade) => {
            todasAtividades.push({
              ...atividade,
              meta_id: meta.id,
              meta_requisito: meta.requisito,
              meta_eixo: meta.eixo,
              meta_setor: meta.setor_executor,
              meta_coordenador: meta.coordenador,
            });
            if (atividade.responsavel && atividade.responsavel.trim()) {
              responsaveisUnicos.add(atividade.responsavel.trim());
            }
          });
          setoresUnicos.add(meta.setor_executor);
          if (meta.coordenador && meta.coordenador.trim()) {
            coordenadoresUnicos.add(meta.coordenador.trim());
          }
        }
      });

      setAtividades(todasAtividades);
      setSetores(Array.from(setoresUnicos).sort());
      setResponsaveis(Array.from(responsaveisUnicos).sort());
      setCoordenadores(Array.from(coordenadoresUnicos).sort());
      setEixos(Array.from(eixosUnicos).sort());
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...atividades];

    // Filtro por status
    if (filtroStatus !== 'todas') {
      resultado = resultado.filter(a => a.status === filtroStatus);
    }

    // Filtro por setor
    if (filtroSetor !== 'todos') {
      resultado = resultado.filter(a => a.meta_setor === filtroSetor);
    }

    // Filtro por responsável
    if (filtroResponsavel !== 'todos') {
      resultado = resultado.filter(a => a.responsavel === filtroResponsavel);
    }

    // Filtro por coordenador
    if (filtroCoordenador !== 'todos') {
      resultado = resultado.filter(a => a.meta_coordenador === filtroCoordenador);
    }

    // Filtro por eixo
    if (filtroEixo !== 'todos') {
      resultado = resultado.filter(a => {
        const eixoLimpo = a.meta_eixo.replace(/^\d+\.\s*/, '');
        return eixoLimpo === filtroEixo;
      });
    }

    // NOVO: Aplicar ordenação
    resultado.sort((a, b) => {
      if (ordenacao === 'prazo') {
        // Ordenar por prazo (mais próximo primeiro)
        if (!a.prazo && !b.prazo) return 0;
        if (!a.prazo) return 1;
        if (!b.prazo) return -1;
        return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
      } else {
        // Ordenar por ID (proxy para data de criação - mais recente primeiro)
        return b.id.localeCompare(a.id);
      }
    });

    setFilteredAtividades(resultado);
  };

  const getStatusColor = (status: AtividadeStatus) => {
    switch (status) {
      case 'Concluída': return 'bg-green-100 text-green-800 border-green-300';
      case 'Em andamento': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Não iniciada': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: AtividadeStatus) => {
    switch (status) {
      case 'Concluída': return <CheckCircle2 className="h-4 w-4" />;
      case 'Em andamento': return <Clock className="h-4 w-4" />;
      case 'Não iniciada': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isPrazoVencido = (prazo: string) => {
    if (!prazo) return false;
    return isPast(parseISO(prazo));
  };

  const contarPorStatus = () => {
    return {
      total: atividades.length,
      concluidas: atividades.filter(a => a.status === 'Concluída').length,
      emAndamento: atividades.filter(a => a.status === 'Em andamento').length,
      naoIniciadas: atividades.filter(a => a.status === 'Não iniciada').length,
    };
  };

  const stats = contarPorStatus();

  const iniciarEdicaoAndamento = (atividadeId: string, andamentoAtual: string) => {
    if (!usuarioEdicao.trim()) {
      toast.error('Por favor, informe seu nome antes de editar');
      return;
    }
    setEditandoAndamento(atividadeId);
    setAndamentoTemp(andamentoAtual || '');
    setAndamentoAnterior(andamentoAtual || '');
  };

  const cancelarEdicaoAndamento = () => {
    setEditandoAndamento(null);
    setAndamentoTemp('');
  };

  const salvarAndamento = async (atividadeId: string, metaId: string) => {
    try {
      setSalvandoAndamento(true);
      
      // Buscar a meta completa
      const metas = await api.getMetas();
      const meta = metas.find((m: Meta) => m.id === metaId);
      
      if (!meta) {
        toast.error('Meta não encontrada');
        return;
      }

      // Atualizar o andamento da atividade específica
      const atividadesAtualizadas = meta.atividades?.map(a => 
        a.id === atividadeId ? { ...a, andamento: andamentoTemp } : a
      ) || [];

      // Salvar update com as atividades atualizadas
      await api.createUpdate({
        meta_id: metaId,
        setor_executor: meta.setor_executor,
        atividades: atividadesAtualizadas,
      });

      // Registrar no histórico de atividades
      const { supabase } = await import('@/integrations/supabase/client');
      const atividade = atividadesAtualizadas.find(a => a.id === atividadeId);
      
      if (atividade && andamentoAnterior !== andamentoTemp) {
        await supabase.from('historico_atividades').insert({
          meta_id: metaId,
          atividade_id: atividadeId,
          acao_descricao: atividade.acao,
          usuario_nome: usuarioEdicao,
          andamento_anterior: andamentoAnterior || null,
          andamento_novo: andamentoTemp || null
        });
      }

      // Atualizar estado local
      setAtividades(prevAtividades =>
        prevAtividades.map(a =>
          a.id === atividadeId ? { ...a, andamento: andamentoTemp } : a
        )
      );

      toast.success('Andamento atualizado com sucesso!');
      setEditandoAndamento(null);
      setAndamentoTemp('');
    } catch (error) {
      console.error('Erro ao salvar andamento:', error);
      toast.error('Erro ao salvar andamento');
    } finally {
      setSalvandoAndamento(false);
    }
  };

  // NOVO: Funções para edição de campos
  const iniciarEdicaoCampo = (atividadeId: string, campo: 'responsavel' | 'prazo' | 'status', valorAtual: string | AtividadeStatus) => {
    if (!usuarioEdicao.trim()) {
      toast.error('Por favor, informe seu nome antes de editar');
      return;
    }
    setEditandoCampo({ atividadeId, campo });
    if (campo === 'responsavel') setValorTempResponsavel(valorAtual as string);
    if (campo === 'prazo') setValorTempPrazo(valorAtual as string);
    if (campo === 'status') setValorTempStatus(valorAtual as AtividadeStatus);
  };

  const cancelarEdicaoCampo = () => {
    setEditandoCampo(null);
    setValorTempResponsavel('');
    setValorTempPrazo('');
    setValorTempStatus('Não iniciada');
  };

  const salvarCampo = async (atividadeId: string, metaId: string, campo: 'responsavel' | 'prazo' | 'status') => {
    try {
      setSalvandoAndamento(true);
      
      const metas = await api.getMetas();
      const meta = metas.find((m: Meta) => m.id === metaId);
      
      if (!meta) {
        toast.error('Meta não encontrada');
        return;
      }

      const atividade = meta.atividades?.find(a => a.id === atividadeId);
      if (!atividade) {
        toast.error('Atividade não encontrada');
        return;
      }

      const valorAnterior = campo === 'responsavel' ? atividade.responsavel : 
                           campo === 'prazo' ? atividade.prazo : 
                           atividade.status;
      const valorNovo = campo === 'responsavel' ? valorTempResponsavel :
                       campo === 'prazo' ? valorTempPrazo :
                       valorTempStatus;

      if (valorAnterior === valorNovo) {
        toast.info('Nenhuma alteração foi feita');
        cancelarEdicaoCampo();
        return;
      }

      const atividadesAtualizadas = meta.atividades?.map(a => 
        a.id === atividadeId ? { ...a, [campo]: valorNovo } : a
      ) || [];

      await api.createUpdate({
        meta_id: metaId,
        setor_executor: meta.setor_executor,
        atividades: atividadesAtualizadas,
      });

      const { supabase } = await import('@/integrations/supabase/client');
      const atividadeAtualizada = atividadesAtualizadas.find(a => a.id === atividadeId);
      
      if (atividadeAtualizada) {
        const campoNome = campo === 'responsavel' ? 'responsável' :
                         campo === 'prazo' ? 'prazo' : 'status';
        const valorAnteriorFormatado = campo === 'prazo' && valorAnterior ? 
          format(parseISO(valorAnterior), 'dd/MM/yyyy', { locale: ptBR }) : valorAnterior;
        const valorNovoFormatado = campo === 'prazo' && valorNovo ?
          format(parseISO(valorNovo), 'dd/MM/yyyy', { locale: ptBR }) : valorNovo;

        await supabase.from('historico_atividades').insert({
          meta_id: metaId,
          atividade_id: atividadeId,
          acao_descricao: `Alteração de ${campoNome}: ${atividadeAtualizada.acao}`,
          usuario_nome: usuarioEdicao,
          andamento_anterior: `${campoNome}: ${valorAnteriorFormatado}`,
          andamento_novo: `${campoNome}: ${valorNovoFormatado}`,
        });
      }

      setAtividades(prevAtividades =>
        prevAtividades.map(a =>
          a.id === atividadeId ? { ...a, [campo]: valorNovo } : a
        )
      );

      toast.success(`${campo === 'responsavel' ? 'Responsável' : campo === 'prazo' ? 'Prazo' : 'Status'} atualizado com sucesso!`);
      cancelarEdicaoCampo();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alteração');
    } finally {
      setSalvandoAndamento(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando atividades...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Atividades</h1>
              <p className="text-gray-600">Visão consolidada de todas as atividades do projeto</p>
            </div>
          </div>
        </div>

        {/* Input de Usuário */}
        <Card className="p-4 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center gap-4">
            <UserIcon className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <label className="text-sm font-medium text-blue-900 mb-1 block">
                👤 Quem está editando as atividades?
              </label>
              <input
                type="text"
                placeholder="Digite seu nome completo"
                value={usuarioEdicao}
                onChange={(e) => setUsuarioEdicao(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-blue-700 mt-1">
                ℹ️ Esta informação será registrada no histórico de alterações
              </p>
            </div>
          </div>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-white border-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Concluídas</p>
                <p className="text-3xl font-bold text-green-600">{stats.concluidas}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Andamento</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.emAndamento}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Não Iniciadas</p>
                <p className="text-3xl font-bold text-gray-600">{stats.naoIniciadas}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="Não iniciada">Não iniciadas</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Concluída">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Eixo Temático</label>
              <Select value={filtroEixo} onValueChange={setFiltroEixo}>
                <SelectTrigger className="font-semibold">
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Setor</label>
              <Popover open={openSetor} onOpenChange={setOpenSetor}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSetor}
                    className="w-full justify-between"
                  >
                    {filtroSetor === 'todos' ? 'Todos os setores' : filtroSetor}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar setor..." />
                    <CommandList>
                      <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todos"
                          onSelect={() => {
                            setFiltroSetor('todos');
                            setOpenSetor(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              filtroSetor === 'todos' ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          Todos os setores
                        </CommandItem>
                        {setores.map((setor) => (
                          <CommandItem
                            key={setor}
                            value={setor}
                            onSelect={(currentValue) => {
                              setFiltroSetor(currentValue);
                              setOpenSetor(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                filtroSetor === setor ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {setor}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Responsável</label>
              <Popover open={openResponsavel} onOpenChange={setOpenResponsavel}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openResponsavel}
                    className="w-full justify-between"
                  >
                    {filtroResponsavel === 'todos' ? 'Todos os responsáveis' : filtroResponsavel}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar responsável..." />
                    <CommandList>
                      <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todos"
                          onSelect={() => {
                            setFiltroResponsavel('todos');
                            setOpenResponsavel(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              filtroResponsavel === 'todos' ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          Todos os responsáveis
                        </CommandItem>
                        {responsaveis.map((resp) => (
                          <CommandItem
                            key={resp}
                            value={resp}
                            onSelect={(currentValue) => {
                              setFiltroResponsavel(currentValue);
                              setOpenResponsavel(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                filtroResponsavel === resp ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {resp}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Coordenador</label>
              <Popover open={openCoordenador} onOpenChange={setOpenCoordenador}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCoordenador}
                    className="w-full justify-between"
                  >
                    {filtroCoordenador === 'todos' ? 'Todos os coordenadores' : filtroCoordenador}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar coordenador..." />
                    <CommandList>
                      <CommandEmpty>Nenhum coordenador encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todos"
                          onSelect={() => {
                            setFiltroCoordenador('todos');
                            setOpenCoordenador(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              filtroCoordenador === 'todos' ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          Todos os coordenadores
                        </CommandItem>
                        {coordenadores.map((coord) => (
                          <CommandItem
                            key={coord}
                            value={coord}
                            onSelect={(currentValue) => {
                              setFiltroCoordenador(currentValue);
                              setOpenCoordenador(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                filtroCoordenador === coord ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {coord}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* NOVO: Ordenação */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ordenar por</label>
              <Select value={ordenacao} onValueChange={(value: 'prazo' | 'criacao') => setOrdenacao(value)}>
                <SelectTrigger className="font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prazo"> Prazo (mais próximo)</SelectItem>
                  <SelectItem value="criacao">Data de criação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Lista de Atividades */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Atividades ({filteredAtividades.length})
            </h2>
          </div>

          {filteredAtividades.length === 0 ? (
            <Card className="p-8 text-center bg-white">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhuma atividade encontrada com os filtros selecionados.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAtividades.map((atividade, index) => {
                const prazoVencido = isPrazoVencido(atividade.prazo);
                const isExpanded = atividadeExpandida === atividade.id;
                
                return (
                  <Card key={`${atividade.meta_id}-${atividade.id}`} className="p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      {/* Ação e Botão Ver Requisito */}
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-gray-900 text-lg flex-1">{atividade.acao}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAtividadeExpandida(isExpanded ? null : atividade.id)}
                          className="gap-2 flex-shrink-0"
                        >
                          {isExpanded ? 'Ocultar' : 'Ver'} Requisito
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>

                      {/* Andamento da Atividade */}
                      <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                            <span>📋</span> Andamento:
                          </p>
                          {editandoAndamento === atividade.id ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => salvarAndamento(atividade.id, atividade.meta_id)}
                                disabled={salvandoAndamento}
                                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Save className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelarEdicaoAndamento}
                                disabled={salvandoAndamento}
                                className="h-7 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => iniciarEdicaoAndamento(atividade.id, atividade.andamento || '')}
                              className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                        {editandoAndamento === atividade.id ? (
                          <Textarea
                            value={andamentoTemp}
                            onChange={(e) => setAndamentoTemp(e.target.value)}
                            placeholder="Descreva as ações realizadas, progresso atual, próximos passos..."
                            rows={4}
                            className="resize-none min-h-[100px] bg-white"
                          />
                        ) : (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {atividade.andamento || 'Nenhum andamento registrado. Clique no ícone de edição para adicionar.'}
                          </p>
                        )}
                      </div>

                        {/* Requisito relacionado */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Requisito:</span>
                          <span>{atividade.meta_requisito}</span>
                          <Badge variant="outline" className="ml-2">
                            {atividade.meta_eixo}
                          </Badge>
                        </div>

                        <Separator />

                        {/* NOVO: Detalhes editáveis */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Responsável */}
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Responsável</p>
                              {editandoCampo?.atividadeId === atividade.id && editandoCampo.campo === 'responsavel' ? (
                                <div className="flex gap-1 items-center">
                                  <Input
                                    value={valorTempResponsavel}
                                    onChange={(e) => setValorTempResponsavel(e.target.value)}
                                    className="h-7 text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => salvarCampo(atividade.id, atividade.meta_id, 'responsavel')}
                                    disabled={salvandoAndamento}
                                    className="h-7 w-7 p-0 text-green-600 flex-shrink-0"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={cancelarEdicaoCampo}
                                    disabled={salvandoAndamento}
                                    className="h-7 w-7 p-0 flex-shrink-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900 truncate">{atividade.responsavel || '-'}</p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => iniciarEdicaoCampo(atividade.id, 'responsavel', atividade.responsavel)}
                                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 flex-shrink-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Prazo */}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Prazo</p>
                              {editandoCampo?.atividadeId === atividade.id && editandoCampo.campo === 'prazo' ? (
                                <div className="flex gap-1 items-center">
                                  <Input
                                    type="date"
                                    value={valorTempPrazo}
                                    onChange={(e) => setValorTempPrazo(e.target.value)}
                                    className="h-7 text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => salvarCampo(atividade.id, atividade.meta_id, 'prazo')}
                                    disabled={salvandoAndamento}
                                    className="h-7 w-7 p-0 text-green-600 flex-shrink-0"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={cancelarEdicaoCampo}
                                    disabled={salvandoAndamento}
                                    className="h-7 w-7 p-0 flex-shrink-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-medium truncate ${prazoVencido && atividade.status !== 'Concluída' ? 'text-red-600' : 'text-gray-900'}`}>
                                    {atividade.prazo ? format(parseISO(atividade.prazo), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                                    {prazoVencido && atividade.status !== 'Concluída' && (
                                      <span className="ml-1 text-xs">(Vencido)</span>
                                    )}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => iniciarEdicaoCampo(atividade.id, 'prazo', atividade.prazo)}
                                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 flex-shrink-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-2">
                            {getStatusIcon(atividade.status)}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500">Status</p>
                              {editandoCampo?.atividadeId === atividade.id && editandoCampo.campo === 'status' ? (
                                <div className="flex gap-1 items-center">
                                  <Select value={valorTempStatus} onValueChange={(value: AtividadeStatus) => setValorTempStatus(value)}>
                                    <SelectTrigger className="h-7 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Concluída">✅ Concluída</SelectItem>
                                      <SelectItem value="Em andamento">🔄 Em andamento</SelectItem>
                                      <SelectItem value="Não iniciada">⏸️ Não iniciada</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => salvarCampo(atividade.id, atividade.meta_id, 'status')}
                                    disabled={salvandoAndamento}
                                    className="h-7 w-7 p-0 text-green-600 flex-shrink-0"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={cancelarEdicaoCampo}
                                    disabled={salvandoAndamento}
                                    className="h-7 w-7 p-0 flex-shrink-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getStatusColor(atividade.status)} border text-xs`}>
                                    {atividade.status}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => iniciarEdicaoCampo(atividade.id, 'status', atividade.status)}
                                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 flex-shrink-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Setor */}
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500">
                            Setor: <span className="font-medium text-gray-700">{atividade.meta_setor}</span>
                            {atividade.meta_coordenador && (
                              <> • Coordenador: <span className="font-medium text-gray-700">{atividade.meta_coordenador}</span></>
                            )}
                          </p>
                        </div>

                        {/* NOVO: Acordeão com informações completas do requisito */}
                        {isExpanded && (
                          <RequisitoAcordeao metaId={atividade.meta_id} />
                        )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// NOVO: Componente para exibir informações do requisito
const RequisitoAcordeao = ({ metaId }: { metaId: string }) => {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarMeta = async () => {
      try {
        const metas = await api.getMetas();
        const metaEncontrada = metas.find((m: Meta) => m.id === metaId);
        setMeta(metaEncontrada || null);
      } catch (error) {
        console.error('Erro ao carregar meta:', error);
      } finally {
        setLoading(false);
      }
    };
    carregarMeta();
  }, [metaId]);

  if (loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
        <p className="text-sm text-gray-500">Carregando informações do requisito...</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
        <p className="text-sm text-red-500">Erro ao carregar informações do requisito.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 space-y-3 mt-3">
      <h4 className="font-semibold text-blue-900 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Informações Completas do Requisito
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-blue-700 font-medium">Eixo</p>
          <p className="text-gray-900">{meta.eixo}</p>
        </div>
        <div>
          <p className="text-xs text-blue-700 font-medium">Item</p>
          <p className="text-gray-900">{meta.item}</p>
        </div>
        <div>
          <p className="text-xs text-blue-700 font-medium">Artigo</p>
          <p className="text-gray-900">{meta.artigo}</p>
        </div>
        <div>
          <p className="text-xs text-blue-700 font-medium">Requisito</p>
          <p className="text-gray-900">{meta.requisito}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-blue-700 font-medium mb-1">Descrição</p>
        <p className="text-sm text-gray-900 bg-white/50 p-2 rounded border border-blue-100">{meta.descricao}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-blue-700 font-medium">Setor Executor</p>
          <p className="text-gray-900">{meta.setor_executor}</p>
        </div>
        <div>
          <p className="text-xs text-blue-700 font-medium">Coordenador</p>
          <p className="text-gray-900">{meta.coordenador || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-blue-700 font-medium">Deadline</p>
          <p className="text-gray-900">
            {format(parseISO(meta.deadline), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-blue-700 font-medium">Pontos Aplicáveis</p>
          <p className="text-gray-900 font-semibold">{meta.pontos_aplicaveis}</p>
        </div>
        <div>
          <p className="text-xs text-blue-700 font-medium">Estimativa de Cumprimento</p>
          <Badge variant="outline" className="text-xs">
            {meta.estimativa_cumprimento || 'Não se Aplica'}
          </Badge>
        </div>
      </div>

      {meta.atividades && meta.atividades.length > 0 && (
        <div>
          <p className="text-xs text-blue-700 font-medium mb-2">Todas as Atividades deste Requisito</p>
          <div className="space-y-2">
            {meta.atividades.map((atv, idx) => (
              <div key={atv.id} className="bg-white/70 border border-blue-200 rounded p-2 text-sm">
                <p className="font-medium text-gray-900 mb-1">{idx + 1}. {atv.acao}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>👤 {atv.responsavel}</div>
                  <div>📅 {atv.prazo ? format(parseISO(atv.prazo), 'dd/MM/yyyy', { locale: ptBR }) : 'Sem prazo'}</div>
                </div>
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    {atv.status}
                  </Badge>
                </div>
                {atv.andamento && (
                  <div className="mt-2 pt-2 border-t border-blue-100">
                    <p className="text-xs font-medium text-blue-700">Andamento:</p>
                    <p className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{atv.andamento}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {meta.observacoes && (
        <div>
          <p className="text-xs text-blue-700 font-medium mb-1">Observações</p>
          <p className="text-sm text-gray-900 bg-white/50 p-2 rounded border border-blue-100">{meta.observacoes}</p>
        </div>
      )}
    </div>
  );
};

export default GerenciamentoAtividadesPage;
