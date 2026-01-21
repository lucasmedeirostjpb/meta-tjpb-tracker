import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Target, User, Building2, AlertCircle, TrendingUp, Clock, Plus, Trash2, Check, ChevronsUpDown, Info } from "lucide-react";
import type { Atividade, AtividadeStatus, Dificuldade } from '@/integrations/supabase/types';
import { useResponsaveis } from '@/hooks/useResponsaveis';

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
  link_evidencia?: string;
  observacoes?: string;
  update_id?: string;
  estimativa_cumprimento?: string;
  pontos_estimados?: number;
  percentual_cumprimento?: number;
  acoes_planejadas?: string;
  justificativa_parcial?: string;
  atividades?: Atividade[];
  dificuldade?: Dificuldade;
  estimativa_maxima?: number;
}

interface MetaModalProps {
  meta: Meta | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isEditable?: boolean;
}

const MetaModal = ({ meta, open, onClose, onUpdate, isEditable = false }: MetaModalProps) => {
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const { responsaveis: responsaveisExistentes } = useResponsaveis();
  
  const [estimativa, setEstimativa] = useState<string>('Não se Aplica');
  const [pontosRecebidos, setPontosRecebidos] = useState<number>(0);
  const [estimativaMaxima, setEstimativaMaxima] = useState<number>(0);
  const [acoes, setAcoes] = useState<string>('');
  const [justificativa, setJustificativa] = useState<string>('');
  const [linkEvidencia, setLinkEvidencia] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [dificuldade, setDificuldade] = useState<Dificuldade>('Sem dificuldades');
  const [saving, setSaving] = useState(false);
  const [openResponsavelPopovers, setOpenResponsavelPopovers] = useState<Record<string, boolean>>({});

  const getEstimativaIcon = (est: string) => {
    switch (est) {
      case 'Totalmente Cumprido': return '✅ Totalmente Cumprido';
      case 'Parcialmente Cumprido': return '⚠️ Parcialmente Cumprido';
      case 'Em Andamento': return '🔄 Em Andamento';
      case 'Não Cumprido': return '❌ Não Cumprido';
      case 'Não se Aplica': return '➖ Não se Aplica';
      default: return est;
    }
  };

  // Gerar ID único para novas atividades
  const generateId = () => `atividade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (meta && open) {
      // Se está marcado como "Não Cumprido" mas não tem evidências, abrir como "Em Andamento"
      const temEvidencia = meta.link_evidencia && meta.link_evidencia.trim().length >= 5;
      let estimativaInicial = meta.estimativa_cumprimento || 'Não se Aplica';
      
      if (estimativaInicial === 'Não Cumprido' && !temEvidencia) {
        estimativaInicial = 'Em Andamento';
      }
      
      const pontosInicial = meta.pontos_estimados || 0;
      
      console.log('📋 [MODAL] Carregando meta:', {
        id: meta.id,
        estimativa_cumprimento: meta.estimativa_cumprimento,
        estimativa_ajustada: estimativaInicial,
        tem_evidencia: temEvidencia,
        pontos_estimados: meta.pontos_estimados,
        estimativa_maxima: meta.estimativa_maxima,
        pontos_aplicaveis: meta.pontos_aplicaveis,
        atividades_count: meta.atividades?.length || 0
      });
      
      setEstimativa(estimativaInicial);
      setPontosRecebidos(pontosInicial);
      setEstimativaMaxima(meta.estimativa_maxima || meta.pontos_aplicaveis);
      setAcoes(meta.acoes_planejadas || '');
      setJustificativa(meta.justificativa_parcial || '');
      setLinkEvidencia(meta.link_evidencia || '');
      setObservacoes(meta.observacoes || '');
      setAtividades(meta.atividades || []);
      setDificuldade(meta.dificuldade || 'Sem dificuldades');
    }
  }, [meta?.id, open]);

  const handleAddAtividade = () => {
    setAtividades([
      ...atividades,
      {
        id: generateId(),
        acao: '',
        responsavel: '',
        prazo: '',
        status: 'Não iniciada',
        andamento: ''
      }
    ]);
  };

  const handleRemoveAtividade = (id: string) => {
    setAtividades(atividades.filter(a => a.id !== id));
  };

  const handleUpdateAtividade = (id: string, field: keyof Atividade, value: string) => {
    setAtividades(atividades.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const toggleResponsavelPopover = (atividadeId: string, isOpen: boolean) => {
    setOpenResponsavelPopovers(prev => ({
      ...prev,
      [atividadeId]: isOpen
    }));
  };

  const getFilteredResponsaveis = (searchTerm: string) => {
    if (!searchTerm) return responsaveisExistentes;
    const search = searchTerm.toLowerCase();
    return responsaveisExistentes.filter(r => r.toLowerCase().includes(search));
  };

  const handleSave = async () => {
    if (!meta || !isEditable) return;

    if (isMockMode) {
      toast.warning('Modo de demonstração: alterações não são salvas');
      onClose();
      return;
    }

    // Validação de evidência obrigatória (mínimo 5 caracteres) APENAS para Totalmente e Parcialmente Cumprido
    // Não Cumprido pode ser sem evidências (= Pendente)
    if (estimativa === 'Totalmente Cumprido' || estimativa === 'Parcialmente Cumprido') {
      if (!linkEvidencia || linkEvidencia.trim().length < 5) {
        toast.error('O campo de evidências é obrigatório e deve ter no mínimo 5 caracteres para este status');
        return;
      }
    }

    if (estimativa === 'Parcialmente Cumprido' && !justificativa.trim()) {
      toast.error('Justificativa é obrigatória para cumprimento parcial');
      return;
    }

    setSaving(true);
    try {
      // Para "Em Andamento", não calcular percentual (é apenas estimativa)
      let percentualCalculado = 0;
      if (estimativa === 'Parcialmente Cumprido') {
        percentualCalculado = (pontosRecebidos / meta.pontos_aplicaveis) * 100;
      } else if (estimativa === 'Totalmente Cumprido') {
        percentualCalculado = 100;
      }

      const updateData = {
        meta_id: meta.id,
        setor_executor: meta.setor_executor,
        estimativa_cumprimento: estimativa,
        percentual_cumprimento: percentualCalculado,
        pontos_estimados: pontosRecebidos,
        estimativa_maxima: estimativa === 'Em Andamento' ? estimativaMaxima : null,
        acoes_planejadas: acoes,
        justificativa_parcial: justificativa,
        link_evidencia: linkEvidencia,
        observacoes,
        atividades: atividades,
        dificuldade: dificuldade,
      };

      console.log('💾 [MODAL] Salvando update:', {
        meta_id: meta.id,
        estimativa: estimativa,
        pontos_estimados: pontosRecebidos,
        estimativa_maxima: estimativaMaxima,
        atividades_count: atividades.length
      });

      await api.createUpdate(updateData);

      toast.success('Prestação de contas salva com sucesso!');
      
      meta.estimativa_cumprimento = estimativa;
      meta.percentual_cumprimento = percentualCalculado;
      meta.pontos_estimados = pontosRecebidos;
      meta.estimativa_maxima = estimativa === 'Em Andamento' ? estimativaMaxima : undefined;
      meta.atividades = atividades;
      meta.dificuldade = dificuldade;
      meta.acoes_planejadas = acoes;
      meta.justificativa_parcial = justificativa;
      meta.link_evidencia = linkEvidencia;
      meta.observacoes = observacoes;
      
      onUpdate?.();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };
  
  if (!meta) return null;

  // Calcular percentual apenas para Parcialmente Cumprido e Totalmente Cumprido
  let percentualCalculado = 0;
  if (estimativa === 'Parcialmente Cumprido') {
    percentualCalculado = (pontosRecebidos / meta.pontos_aplicaveis) * 100;
  } else if (estimativa === 'Totalmente Cumprido') {
    percentualCalculado = 100;
  }
  
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Concluído': return 'bg-green-500 text-white hover:bg-green-500';
      case 'Em Andamento': return 'bg-yellow-500 text-white hover:bg-yellow-500';
      case 'Parcialmente Cumprido': return 'bg-orange-500 text-white hover:bg-orange-500';
      case 'Pendente': return 'bg-gray-500 text-white hover:bg-gray-500';
      case 'N/A': return 'bg-gray-400 text-white hover:bg-gray-400';
      default: return 'bg-gray-500 text-white hover:bg-gray-500';
    }
  };

  const getAtividadeStatusColor = (s: AtividadeStatus) => {
    switch (s) {
      case 'Concluída': return 'bg-green-100 text-green-800 border-green-300';
      case 'Em andamento': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Não iniciada': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDificuldadeColor = (d: Dificuldade) => {
    switch (d) {
      case 'Sem dificuldades': return 'bg-green-100 text-green-800 border-green-300';
      case 'Alerta': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Situação crítica': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAcaoIcon = (acao: string) => {
    switch (acao) {
      case 'criacao': return '✨';
      case 'atualizacao_status': return '🔄';
      case 'atualizacao_atividades': return '📋';
      case 'adicao_evidencia': return '🔍';
      case 'edicao_observacoes': return '📝';
      default: return '📋';
    }
  };

  const getAcaoLabel = (acao: string) => {
    switch (acao) {
      case 'criacao': return 'Criação inicial';
      case 'atualizacao_status': return 'Atualização de status';
      case 'atualizacao_atividades': return 'Atualização de atividades';
      case 'adicao_evidencia': return 'Adição de evidência';
      case 'edicao_observacoes': return 'Edição de observações';
      default: return acao;
    }
  };

  // Mapeamento de cores para estimativa de cumprimento
  const getEstimativaColor = (est: string) => {
    switch (est) {
      case 'Totalmente Cumprido': return 'bg-green-500 text-white hover:bg-green-500';
      case 'Parcialmente Cumprido': return 'bg-orange-500 text-white hover:bg-orange-500';
      case 'Em Andamento': return 'bg-yellow-500 text-white hover:bg-yellow-500';
      case 'Não Cumprido': return 'bg-red-500 text-white hover:bg-red-500';
      case 'Não se Aplica': return 'bg-gray-400 text-white hover:bg-gray-400';
      case 'Pendente': return 'bg-gray-500 text-white hover:bg-gray-500';
      default: return 'bg-gray-500 text-white hover:bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="max-h-[90vh] overflow-y-auto px-6 py-6">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex-1">
              <DialogTitle className="text-xl">{meta.requisito}</DialogTitle>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-muted-foreground">{meta.artigo}</span>
                <Badge className={getEstimativaColor(estimativa)}>{estimativa}</Badge>
              </div>
              {meta.descricao && (
                <p className="text-sm text-muted-foreground mt-2">{meta.descricao}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informações da Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Setor</p>
              <p className="font-medium text-sm">{meta.setor_executor}</p>
            </div>
            {meta.coordenador && (
              <div>
                <p className="text-xs text-muted-foreground">Coordenador</p>
                <p className="font-medium text-sm">{meta.coordenador}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Prazo</p>
              <p className="font-medium text-sm">
                {format(parseISO(meta.deadline), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pontos</p>
              <p className="font-bold text-lg">{meta.pontos_aplicaveis}</p>
            </div>
          </div>

          {/* Informações de Prestação de Contas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base">
              Prestação de Contas {!isEditable && '(Consulta)'}
            </h3>

            {isEditable ? (
              <>
                {/* MODO EDIÇÃO */}
                <div className="space-y-2">
                  <Label htmlFor="estimativa" className="text-sm font-medium">
                    ⭐ Estimativa de Cumprimento
                  </Label>
                  <Select value={estimativa} onValueChange={setEstimativa}>
                    <SelectTrigger id="estimativa">
                      <SelectValue>
                        {getEstimativaIcon(estimativa)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Totalmente Cumprido">
                        <div className="flex flex-col gap-1 py-1">
                          <span className="font-medium">✅ Totalmente Cumprido</span>
                          <span className="text-xs text-muted-foreground">
                            Ações necessárias já realizadas e pontuação máxima alcançada
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Parcialmente Cumprido">
                        <div className="flex flex-col gap-1 py-1">
                          <span className="font-medium">⚠️ Parcialmente Cumprido</span>
                          <span className="text-xs text-muted-foreground">
                            Ações necessárias já realizadas e pontuação parcial aplicada
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Em Andamento">
                        <div className="flex flex-col gap-1 py-1">
                          <span className="font-medium">🔄 Em Andamento</span>
                          <span className="text-xs text-muted-foreground">
                            Ainda restam ações necessárias para o cumprimento do quesito
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Não Cumprido">
                        <div className="flex flex-col gap-1 py-1">
                          <span className="font-medium">❌ Não Cumprido</span>
                          <span className="text-xs text-muted-foreground">
                            Ações realizadas, mas não o suficiente para obtenção dos pontos
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Não se Aplica">
                        <div className="flex flex-col gap-1 py-1">
                          <span className="font-medium">➖ Não se Aplica</span>
                          <span className="text-xs text-muted-foreground">
                            O requisito não é aplicável. Casos em que o requisito deixou de existir, por exemplo
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {estimativa === 'Parcialmente Cumprido' && (
                  <div className="space-y-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Pontos Recebidos</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={meta.pontos_aplicaveis - 1}
                          step="1"
                          value={pontosRecebidos}
                          onChange={(e) => {
                            const valor = Number(e.target.value);
                            if (valor >= meta.pontos_aplicaveis) {
                              toast.error('Para cumprimento total, selecione "Totalmente Cumprido"');
                              return;
                            }
                            setPontosRecebidos(valor);
                          }}
                          className="bg-white w-20 text-center"
                        />
                        <span className="text-sm text-muted-foreground">
                          de {meta.pontos_aplicaveis} ({percentualCalculado.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="justificativa" className="text-sm">Justificativa</Label>
                      <Textarea
                        id="justificativa"
                        placeholder="Explique por que a meta foi cumprida parcialmente..."
                        rows={6}
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        className="bg-white resize-none min-h-[150px]"
                      />
                    </div>
                  </div>
                )}

                {estimativa === 'Em Andamento' && (
                  <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm font-medium">Estimativa Mínima (Pontos Bem Encaminhados)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center h-3.5 w-3.5 hover:opacity-70 transition-opacity"
                              >
                                <Info className="h-3.5 w-3.5 text-blue-600" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 text-xs" side="top">
                              <p className="font-medium mb-1">💡 Estimativa Mínima:</p>
                              <p>Refere-se aos pontos que estão bem encaminhados e têm alta probabilidade de serem alcançados quando a meta for concluída.</p>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={estimativaMaxima}
                            step="0.5"
                            value={pontosRecebidos}
                            onChange={(e) => {
                              const valor = Number(e.target.value);
                              if (valor > estimativaMaxima) {
                                toast.error(`A estimativa mínima não pode ser maior que a máxima (${estimativaMaxima})`);
                                return;
                              }
                              setPontosRecebidos(valor);
                            }}
                            className="bg-white w-20 text-center"
                          />
                          <span className="text-sm text-muted-foreground">
                            de {estimativaMaxima} pts
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Label className="text-sm font-medium">Estimativa Máxima (Descontando Pontos Perdidos)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex items-center justify-center h-3.5 w-3.5 hover:opacity-70 transition-opacity"
                              >
                                <Info className="h-3.5 w-3.5 text-blue-600" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 text-xs" side="top">
                              <p className="font-medium mb-1">💡 Estimativa Máxima:</p>
                              <p>Refere-se ao máximo de pontos que poderão ser alcançados, já considerando requisitos que tiveram pontos prejudicados ou descartados.</p>
                              <p className="mt-2"><strong>Exemplo:</strong> Requisito com 90 pontos totais, mas 30 já sabemos que não conseguiremos atingir → Estimativa máxima: 60 pontos.</p>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={pontosRecebidos}
                            max={meta.pontos_aplicaveis}
                            step="0.5"
                            value={estimativaMaxima}
                            onChange={(e) => {
                              const valor = Number(e.target.value);
                              if (valor > meta.pontos_aplicaveis) {
                                toast.error(`A estimativa máxima não pode ser maior que ${meta.pontos_aplicaveis} pontos`);
                                return;
                              }
                              if (valor < pontosRecebidos) {
                                toast.error(`A estimativa máxima não pode ser menor que a mínima (${pontosRecebidos})`);
                                return;
                              }
                              setEstimativaMaxima(valor);
                            }}
                            className="bg-white w-20 text-center"
                          />
                          <span className="text-sm text-muted-foreground">
                            de {meta.pontos_aplicaveis} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-blue-100 rounded border border-blue-300">
                      <AlertCircle className="h-4 w-4 text-blue-700 flex-shrink-0" />
                      <p className="text-xs text-blue-800">
                        <strong>Pontos comprometidos:</strong> {(meta.pontos_aplicaveis - estimativaMaxima).toFixed(1)} pts ({((meta.pontos_aplicaveis - estimativaMaxima) / meta.pontos_aplicaveis * 100).toFixed(1)}% perdidos)
                      </p>
                    </div>
                  </div>
                )}

                {estimativa !== 'Parcialmente Cumprido' && estimativa !== 'Em Andamento' && (
                  <div className="text-sm text-muted-foreground">
                    Pontos: {estimativa === 'Não se Aplica' || estimativa === 'Não Cumprido'
                      ? '0 (aguardando conclusão)' 
                      : `${meta.pontos_aplicaveis} (100%)`}
                  </div>
                )}

                {/* Seção de Atividades */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Atividades</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAtividade}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Atividade
                    </Button>
                  </div>

                  {atividades.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                      Nenhuma atividade adicionada. Clique em "Adicionar Atividade" para começar.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {atividades.map((atividade, index) => (
                        <div key={atividade.id} className="p-4 bg-gray-50 border border-gray-300 rounded-lg shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Atividade {index + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAtividade(atividade.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1 md:col-span-2">
                              <Label className="text-xs font-medium">Ação (Descrição da Tarefa)</Label>
                              <Textarea
                                placeholder="Ex: Implementar módulo de relatórios..."
                                value={atividade.acao}
                                onChange={(e) => handleUpdateAtividade(atividade.id, 'acao', e.target.value)}
                                rows={2}
                                className="resize-none min-h-[60px]"
                              />
                            </div>

                            {atividade.andamento && (
                              <div className="space-y-1 md:col-span-2">
                                <Label className="text-xs font-medium">
                                  Andamento da Atividade (Somente Leitura)
                                </Label>
                                <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{atividade.andamento}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  ℹ️ Para editar o andamento, acesse a aba "Atividades"
                                </p>
                              </div>
                            )}

                            <div className="space-y-1">
                              <div className="flex items-center gap-1 h-5">
                                <Label className="text-xs">Responsável</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex items-center justify-center h-3.5 w-3.5 hover:opacity-70 transition-opacity"
                                    >
                                      <Info className="h-3.5 w-3.5 text-blue-500" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 text-xs" side="top">
                                    <p className="font-medium mb-1">💡 Dica:</p>
                                    <p>Caso haja mais de um responsável, informe o principal no campo "Responsável" e indique os outros no campo "Ação".</p>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <Popover 
                                open={openResponsavelPopovers[atividade.id] || false}
                                onOpenChange={(isOpen) => toggleResponsavelPopover(atividade.id, isOpen)}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openResponsavelPopovers[atividade.id] || false}
                                    className="w-full justify-between text-left font-normal"
                                    type="button"
                                  >
                                    <span className={atividade.responsavel ? "text-foreground" : "text-muted-foreground"}>
                                      {atividade.responsavel || "Insira um novo responsável ou selecione da lista..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                                  <Command>
                                    <CommandInput 
                                      placeholder="Digite o nome do responsável..."
                                      value={atividade.responsavel}
                                      onValueChange={(value) => handleUpdateAtividade(atividade.id, 'responsavel', value)}
                                    />
                                    <CommandList>
                                      <CommandEmpty>
                                        <div className="text-sm text-muted-foreground p-2">
                                          Digite para adicionar novo responsável
                                        </div>
                                      </CommandEmpty>
                                      <CommandGroup heading="Responsáveis existentes">
                                        {getFilteredResponsaveis(atividade.responsavel).map((resp) => (
                                          <CommandItem
                                            key={resp}
                                            value={resp}
                                            onSelect={(currentValue) => {
                                              handleUpdateAtividade(atividade.id, 'responsavel', currentValue);
                                              toggleResponsavelPopover(atividade.id, false);
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                atividade.responsavel === resp ? "opacity-100" : "opacity-0"
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

                            <div className="space-y-1">
                              <Label className="text-xs h-5 flex items-center">Prazo</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !atividade.prazo && "text-muted-foreground"
                                    )}
                                    type="button"
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {atividade.prazo ? (
                                      format(parseISO(atividade.prazo), "dd/MM/yyyy", { locale: ptBR })
                                    ) : (
                                      <span>Selecione a data</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={atividade.prazo ? parseISO(atividade.prazo) : undefined}
                                    onSelect={(date) => {
                                      if (date) {
                                        handleUpdateAtividade(atividade.id, 'prazo', format(date, 'yyyy-MM-dd'));
                                      }
                                    }}
                                    locale={ptBR}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <Label className="text-xs">Status</Label>
                              <Select
                                value={atividade.status}
                                onValueChange={(value) => handleUpdateAtividade(atividade.id, 'status', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Concluída">✅ Concluída</SelectItem>
                                  <SelectItem value="Em andamento">🔄 Em andamento</SelectItem>
                                  <SelectItem value="Não iniciada">⏸️ Não iniciada</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Campo legado - Ações Planejadas (mantido mas ocultável) */}
                {acoes && (
                  <details className="space-y-2 pt-3 border-t">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
                      📝 Ações Planejadas/Executadas (dados antigos)
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                        ⚠️ Campo em descontinuação
                      </Badge>
                    </summary>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-orange-800 font-medium">
                          ⚠️ Este campo será removido em breve. Use apenas o campo "Atividades" para registrar novas ações.
                        </p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-sm whitespace-pre-wrap text-gray-700">{acoes}</p>
                      </div>
                    </div>
                  </details>
                )}

                <div className="space-y-3 pt-3 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="dificuldade" className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Nível de Dificuldade
                    </Label>
                    <Select value={dificuldade} onValueChange={(value) => setDificuldade(value as Dificuldade)}>
                      <SelectTrigger id="dificuldade">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sem dificuldades">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Sem dificuldades
                          </div>
                        </SelectItem>
                        <SelectItem value="Alerta">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            Alerta
                          </div>
                        </SelectItem>
                        <SelectItem value="Situação crítica">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            Situação crítica
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seção de Evidências - SEMPRE VISÍVEL, mas obrigatório apenas para alguns status */}
                  <div className="space-y-2">
                    <Label htmlFor="evidencias" className="text-sm font-medium">
                      Evidências para Auditoria
                      {(estimativa === 'Totalmente Cumprido' || estimativa === 'Parcialmente Cumprido' || estimativa === 'Não Cumprido') && (
                        <span className="text-red-600 ml-1">*</span>
                      )}
                    </Label>
                    {(estimativa === 'Totalmente Cumprido' || estimativa === 'Parcialmente Cumprido' || estimativa === 'Não Cumprido') && (
                      <p className="text-xs text-red-600 mb-2">
                        ⚠️ Campo obrigatório para este status (mínimo 5 caracteres)
                      </p>
                    )}
                    <Textarea
                      id="evidencias"
                      placeholder="Indique o link onde consta a evidência, o número do SEI ou a informação que indique a conclusão do requisito. Utilize Google Drive para links de documentos. Lembre de gerenciar as permissões do arquivo corretamente."
                      rows={6}
                      value={linkEvidencia}
                      onChange={(e) => setLinkEvidencia(e.target.value)}
                      className={`resize-none min-h-[150px] ${
                        (estimativa === 'Totalmente Cumprido' || estimativa === 'Parcialmente Cumprido' || estimativa === 'Não Cumprido')
                          ? 'border-red-300 focus:border-red-500'
                          : ''
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes" className="text-sm">Observações</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Observações gerais..."
                      rows={5}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="resize-none min-h-[120px]"
                    />
                  </div>
                </div>

                {isMockMode && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        Modo de demonstração: as alterações não serão salvas
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* MODO SOMENTE LEITURA */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Estimativa de Cumprimento</Label>
                  <div className="bg-muted rounded-lg p-3">
                    <Badge className={getEstimativaColor(estimativa)}>{estimativa}</Badge>
                  </div>
                </div>
              </>
            )}

            {/* Pontos Recebidos */}
            {estimativa === 'Em Andamento' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Estimativa Mínima</p>
                    <div className="bg-blue-200 rounded-full px-2 py-0.5">
                      <p className="text-xs font-semibold text-blue-900">Bem Encaminhados</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{pontosRecebidos} <span className="text-lg">pts</span></p>
                  <p className="text-xs text-blue-700 mt-1">
                    {((pontosRecebidos / meta.pontos_aplicaveis) * 100).toFixed(1)}% dos {meta.pontos_aplicaveis} pontos
                  </p>
                </div>
                
                {meta.estimativa_maxima !== null && meta.estimativa_maxima !== undefined && meta.estimativa_maxima > 0 && (
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Estimativa Máxima</p>
                      <div className="bg-orange-200 rounded-full px-2 py-0.5">
                        <p className="text-xs font-semibold text-orange-900">Máximo Possível</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-orange-900">{meta.estimativa_maxima} <span className="text-lg">pts</span></p>
                    <p className="text-xs text-orange-700 mt-1">
                      {((meta.estimativa_maxima / meta.pontos_aplicaveis) * 100).toFixed(1)}% dos {meta.pontos_aplicaveis} pontos
                    </p>
                    {meta.estimativa_maxima < meta.pontos_aplicaveis && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-red-700 font-medium">
                        <AlertCircle className="h-3 w-3" />
                        {(meta.pontos_aplicaveis - meta.estimativa_maxima).toFixed(1)} pts comprometidos
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {estimativa === 'Parcialmente Cumprido' ? 'Pontos Recebidos' : 'Pontos'}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">{pontosRecebidos}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">de {meta.pontos_aplicaveis}</p>
                  <p className="text-lg font-semibold">{percentualCalculado.toFixed(1)}%</p>
                </div>
              </div>
            )}

            {/* Exibir campos preenchidos em modo leitura */}
            {!isEditable && (
              <>
                {/* Informações Completas da Meta */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Informações da Meta</Label>
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Eixo Temático</p>
                        <p className="text-sm font-medium">{meta.eixo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Item</p>
                        <p className="text-sm font-medium">{meta.item}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Artigo</p>
                        <p className="text-sm font-medium">{meta.artigo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Setor Executor</p>
                        <p className="text-sm font-medium">{meta.setor_executor}</p>
                      </div>
                      {meta.coordenador && (
                        <div>
                          <p className="text-xs text-muted-foreground">Coordenador</p>
                          <p className="text-sm font-medium">{meta.coordenador}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Prazo (Deadline)</p>
                        <p className="text-sm font-medium">
                          {format(parseISO(meta.deadline), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    {meta.descricao && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                        <p className="text-sm">{meta.descricao}</p>
                      </div>
                    )}
                  </div>
                </div>

                {justificativa && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Justificativa do Cumprimento Parcial</Label>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{justificativa}</p>
                    </div>
                  </div>
                )}

                {/* Exibir Atividades */}
                {atividades && atividades.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Atividades</Label>
                    <div className="space-y-2">
                      {atividades.map((atividade, index) => (
                        <div key={atividade.id} className="bg-blue-50/30 border border-blue-200 rounded-lg p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{index + 1}. {atividade.acao}</p>
                              
                              {atividade.andamento && (
                                <div className="mt-2 p-2 bg-white/50 rounded border border-blue-200/50">
                                  <p className="text-xs font-medium text-gray-700 mb-1">📋 Andamento:</p>
                                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{atividade.andamento}</p>
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                                <div>
                                  <span className="font-medium">Responsável:</span> {atividade.responsavel}
                                </div>
                                <div>
                                  <span className="font-medium">Prazo:</span> {
                                    atividade.prazo 
                                      ? format(parseISO(atividade.prazo), "dd/MM/yyyy", { locale: ptBR })
                                      : '-'
                                  }
                                </div>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={getAtividadeStatusColor(atividade.status)}
                            >
                              {atividade.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {acoes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      Ações Planejadas / Executadas (histórico)
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
                        ⚠️ Campo descontinuado
                      </Badge>
                    </Label>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <p className="text-xs text-orange-800 font-medium">
                          Este campo será removido em breve. Dados mantidos apenas para histórico.
                        </p>
                      </div>
                      <div className="bg-white rounded p-2 mt-2">
                        <p className="text-sm whitespace-pre-wrap">{acoes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {dificuldade && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Nível de Dificuldade
                    </Label>
                    <div>
                      <Badge 
                        variant="outline" 
                        className={`${getDificuldadeColor(dificuldade)} text-sm px-3 py-1`}
                      >
                        {dificuldade}
                      </Badge>
                    </div>
                  </div>
                )}

                {linkEvidencia && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Evidências para Auditoria
                    </Label>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{linkEvidencia}</p>
                    </div>
                  </div>
                )}

                {observacoes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Observações Adicionais</Label>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{observacoes}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            {isEditable ? (
              <>
                <Button variant="outline" onClick={onClose} disabled={saving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : '💾 Salvar Prestação de Contas'}
                </Button>
              </>
            ) : (
              <Button onClick={onClose} className="w-full md:w-auto">
                Fechar
              </Button>
            )}
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MetaModal;
