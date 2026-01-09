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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { api } from "@/services/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Target, User, Building2, AlertCircle, TrendingUp, Clock, Plus, Trash2 } from "lucide-react";
import type { Atividade, AtividadeStatus, Dificuldade } from '@/integrations/supabase/types';

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
  
  const [status, setStatus] = useState<string>('Pendente');
  const [estimativa, setEstimativa] = useState<string>('Não se Aplica');
  const [pontosRecebidos, setPontosRecebidos] = useState<number>(0);
  const [acoes, setAcoes] = useState<string>('');
  const [justificativa, setJustificativa] = useState<string>('');
  const [linkEvidencia, setLinkEvidencia] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [dificuldade, setDificuldade] = useState<Dificuldade>('Sem dificuldades');
  const [saving, setSaving] = useState(false);

  // Gerar ID único para novas atividades
  const generateId = () => `atividade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (meta && open) {
      const statusInicial = meta.status || 'Pendente';
      const estimativaInicial = meta.estimativa_cumprimento || 'Não se Aplica';
      const pontosInicial = meta.pontos_estimados || 0;
      
      console.log('📋 [MODAL] Carregando meta:', {
        id: meta.id,
        atividades: meta.atividades,
        atividades_count: meta.atividades?.length || 0
      });
      
      setStatus(statusInicial);
      setEstimativa(estimativaInicial);
      setPontosRecebidos(pontosInicial);
      setAcoes(meta.acoes_planejadas || '');
      setJustificativa(meta.justificativa_parcial || '');
      setLinkEvidencia(meta.link_evidencia || '');
      setObservacoes(meta.observacoes || '');
      setAtividades(meta.atividades || []);
      setDificuldade(meta.dificuldade || 'Sem dificuldades');
    }
  }, [meta?.id, open]);

  useEffect(() => {
    if (!isEditable) return;
    
    if (estimativa === 'Totalmente Cumprido') {
      setStatus('Concluído');
      if (meta) setPontosRecebidos(meta.pontos_aplicaveis);
    } else if (estimativa === 'Não Cumprido') {
      setStatus('Pendente');
      setPontosRecebidos(0);
    } else if (estimativa === 'Parcialmente Cumprido') {
      setStatus('Em Andamento');
    } else if (estimativa === 'Em Andamento') {
      setStatus('Em Andamento');
    } else if (estimativa === 'Não se Aplica') {
      setPontosRecebidos(0);
    }
  }, [estimativa, isEditable, meta]);

  const handleAddAtividade = () => {
    setAtividades([
      ...atividades,
      {
        id: generateId(),
        acao: '',
        responsavel: '',
        prazo: '',
        status: 'Não iniciada'
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

  const handleSave = async () => {
    if (!meta || !isEditable) return;

    if (isMockMode) {
      toast.warning('Modo de demonstração: alterações não são salvas');
      onClose();
      return;
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
        status,
        estimativa_cumprimento: estimativa,
        percentual_cumprimento: percentualCalculado,
        pontos_estimados: pontosRecebidos,
        acoes_planejadas: acoes,
        justificativa_parcial: justificativa,
        link_evidencia: linkEvidencia,
        observacoes,
        atividades: atividades,
        dificuldade: dificuldade,
      };

      console.log('💾 [MODAL] Salvando com atividades:', {
        meta_id: meta.id,
        atividades_count: atividades.length,
        atividades: atividades
      });

      await api.createUpdate(updateData);

      toast.success('Prestação de contas salva com sucesso!');
      
      meta.status = status;
      meta.estimativa_cumprimento = estimativa;
      meta.percentual_cumprimento = percentualCalculado;
      meta.pontos_estimados = pontosRecebidos;
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

  // Determinar status atual baseado na estimativa (para exibição)
  const statusAtual = (() => {
    if (estimativa === 'Totalmente Cumprido') return 'Concluído';
    if (estimativa === 'Parcialmente Cumprido') return 'Parcialmente Cumprido';
    if (estimativa === 'Em Andamento') return 'Em Andamento';
    if (estimativa === 'Não Cumprido') return 'Pendente';
    if (estimativa === 'Não se Aplica') return 'N/A';
    return status;
  })();

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
                <Badge className={getStatusColor(statusAtual)}>{statusAtual}</Badge>
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="Totalmente Cumprido">Totalmente Cumprido</SelectItem>
                      <SelectItem value="Parcialmente Cumprido">Parcialmente Cumprido</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Não Cumprido">Não Cumprido</SelectItem>
                      <SelectItem value="Não se Aplica">Não se Aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {estimativa === 'Parcialmente Cumprido' && (
                  <div className="space-y-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Pontos Recebidos *</Label>
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
                      <Label htmlFor="justificativa" className="text-sm">Justificativa *</Label>
                      <Textarea
                        id="justificativa"
                        placeholder="Explique por que a meta foi cumprida parcialmente..."
                        rows={3}
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        className="bg-white"
                      />
                    </div>
                  </div>
                )}

                {estimativa === 'Em Andamento' && (
                  <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Pontos Estimados *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={meta.pontos_aplicaveis}
                          step="0.5"
                          value={pontosRecebidos}
                          onChange={(e) => {
                            const valor = Number(e.target.value);
                            if (valor > meta.pontos_aplicaveis) {
                              toast.error(`Para "Em Andamento", o máximo é ${meta.pontos_aplicaveis} pontos`);
                              return;
                            }
                            setPontosRecebidos(valor);
                          }}
                          className="bg-white w-20 text-center"
                        />
                        <span className="text-sm text-muted-foreground">
                          (máximo {meta.pontos_aplicaveis} pontos)
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Informe quantos pontos você estima que serão recebidos quando a meta for concluída.
                    </p>
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
                              <Label className="text-xs">Ação</Label>
                              <Input
                                placeholder="Descreva a ação..."
                                value={atividade.acao}
                                onChange={(e) => handleUpdateAtividade(atividade.id, 'acao', e.target.value)}
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Responsável</Label>
                              <Input
                                placeholder="Nome do responsável"
                                value={atividade.responsavel}
                                onChange={(e) => handleUpdateAtividade(atividade.id, 'responsavel', e.target.value)}
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Prazo</Label>
                              <Input
                                type="date"
                                value={atividade.prazo}
                                onChange={(e) => handleUpdateAtividade(atividade.id, 'prazo', e.target.value)}
                              />
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
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      📝 Ações Planejadas/Executadas (dados antigos)
                    </summary>
                    <div className="bg-muted rounded-lg p-3 mt-2">
                      <p className="text-sm whitespace-pre-wrap">{acoes}</p>
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

                  <div className="space-y-2">
                    <Label htmlFor="link" className="text-sm">Link de Evidência</Label>
                    <Input
                      id="link"
                      type="url"
                      placeholder="https://..."
                      value={linkEvidencia}
                      onChange={(e) => setLinkEvidencia(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes" className="text-sm">Observações</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Observações gerais..."
                      rows={2}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Estimativa de Cumprimento</Label>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="font-medium">{estimativa}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="bg-muted rounded-lg p-3">
                      <Badge className={getStatusColor(status)}>{status}</Badge>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Pontos Recebidos */}
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">
                  {estimativa === 'Em Andamento' ? 'Pontos Estimados' : 'Pontos Recebidos'}
                </p>
                <p className="text-2xl font-bold text-blue-600">{pontosRecebidos}</p>
              </div>
              <div className="text-right">
                {estimativa === 'Em Andamento' ? (
                  <>
                    <p className="text-xs text-muted-foreground">máximo {meta.pontos_aplicaveis}</p>
                    <p className="text-lg font-semibold">Estimativa</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">de {meta.pontos_aplicaveis}</p>
                    <p className="text-lg font-semibold">{percentualCalculado.toFixed(1)}%</p>
                  </>
                )}
              </div>
            </div>

            {/* Exibir campos preenchidos em modo leitura */}
            {!isEditable && (
              <>
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
                    <Label className="text-sm font-medium text-muted-foreground">Ações Planejadas / Executadas (histórico)</Label>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{acoes}</p>
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
                    <Label className="text-sm font-medium text-muted-foreground">Link de Evidência</Label>
                    <div className="bg-muted rounded-lg p-3">
                      <a href={linkEvidencia} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                        {linkEvidencia}
                      </a>
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
