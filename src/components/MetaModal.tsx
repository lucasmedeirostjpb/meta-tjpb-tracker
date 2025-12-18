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
import { Calendar, Target, User, Building2, AlertCircle, TrendingUp, Clock } from "lucide-react";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (meta && open) {
      const statusInicial = meta.status || 'Pendente';
      const estimativaInicial = meta.estimativa_cumprimento || 'Não se Aplica';
      const pontosInicial = meta.pontos_estimados || 0;
      
      setStatus(statusInicial);
      setEstimativa(estimativaInicial);
      setPontosRecebidos(pontosInicial);
      setAcoes(meta.acoes_planejadas || '');
      setJustificativa(meta.justificativa_parcial || '');
      setLinkEvidencia(meta.link_evidencia || '');
      setObservacoes(meta.observacoes || '');
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
      const percentualCalculado = (pontosRecebidos / meta.pontos_aplicaveis) * 100;

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
      };

      await api.createUpdate(updateData);

      toast.success('Prestação de contas salva com sucesso!');
      
      meta.status = status;
      meta.estimativa_cumprimento = estimativa;
      meta.percentual_cumprimento = percentualCalculado;
      meta.pontos_estimados = pontosRecebidos;
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

  const percentualCalculado = (pontosRecebidos / meta.pontos_aplicaveis) * 100;
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

  const getAcaoIcon = (acao: string) => {
    switch (acao) {
      case 'criacao': return '✨';
      case 'atualizacao_status': return '🔄';
      case 'adicao_evidencia': return '🔍';
      case 'edicao_observacoes': return '📝';
      default: return '📋';
    }
  };

  const getAcaoLabel = (acao: string) => {
    switch (acao) {
      case 'criacao': return 'Criação inicial';
      case 'atualizacao_status': return 'Atualização de status';
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

                {estimativa !== 'Parcialmente Cumprido' && (
                  <div className="text-sm text-muted-foreground">
                    Pontos: {estimativa === 'Não se Aplica' || estimativa === 'Não Cumprido' || estimativa === 'Em Andamento'
                      ? '0 (aguardando conclusão)' 
                      : `${meta.pontos_aplicaveis} (100%)`}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="acoes" className="text-sm font-medium">
                    Ações Planejadas / Executadas
                  </Label>
                  <Textarea
                    id="acoes"
                    placeholder="Descreva as iniciativas e providências adotadas..."
                    rows={4}
                    value={acoes}
                    onChange={(e) => setAcoes(e.target.value)}
                  />
                </div>

                <div className="space-y-3 pt-3 border-t">
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
                <p className="text-xs text-muted-foreground">Pontos Recebidos</p>
                <p className="text-2xl font-bold text-blue-600">{pontosRecebidos}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">de {meta.pontos_aplicaveis}</p>
                <p className="text-lg font-semibold">{percentualCalculado.toFixed(1)}%</p>
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

                {acoes && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Ações Planejadas / Executadas</Label>
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{acoes}</p>
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
      </DialogContent>
    </Dialog>
  );
};

export default MetaModal;
