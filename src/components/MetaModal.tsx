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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { api } from "@/services/api";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Target, User, Building2, AlertCircle, TrendingUp, History, Clock } from "lucide-react";

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

interface HistoricoAlteracao {
  id: string;
  meta_id: string;
  usuario_email: string;
  usuario_id: string;
  acao: string;
  status_anterior?: string | null;
  status_novo?: string | null;
  link_evidencia_anterior?: string | null;
  link_evidencia_novo?: string | null;
  observacoes_anterior?: string | null;
  observacoes_novo?: string | null;
  estimativa_cumprimento_anterior?: string | null;
  estimativa_cumprimento_novo?: string | null;
  pontos_estimados_anterior?: number | null;
  pontos_estimados_novo?: number | null;
  acoes_planejadas_anterior?: string | null;
  acoes_planejadas_novo?: string | null;
  justificativa_parcial_anterior?: string | null;
  justificativa_parcial_novo?: string | null;
  created_at: string;
}

interface MetaModalProps {
  meta: Meta | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const MetaModal = ({ meta, open, onClose, onUpdate }: MetaModalProps) => {
  const { user } = useAuth();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const [status, setStatus] = useState<string>('Pendente');
  const [estimativa, setEstimativa] = useState<string>('Não se Aplica');
  const [pontosRecebidos, setPontosRecebidos] = useState<number>(0);
  const [acoes, setAcoes] = useState<string>('');
  const [justificativa, setJustificativa] = useState<string>('');
  const [linkEvidencia, setLinkEvidencia] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [historico, setHistorico] = useState<HistoricoAlteracao[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  useEffect(() => {
    if (meta) {
      setStatus(meta.status || 'Pendente');
      setEstimativa(meta.estimativa_cumprimento || 'Não se Aplica');
      setPontosRecebidos(meta.pontos_estimados || 0);
      setAcoes(meta.acoes_planejadas || '');
      setJustificativa(meta.justificativa_parcial || '');
      setLinkEvidencia(meta.link_evidencia || '');
      setObservacoes(meta.observacoes || '');
      
      // Carregar histórico
      loadHistorico();
    } else {
      // Resetar estado quando fechar modal
      setHistorico([]);
    }
  }, [meta?.id]); // Usar meta.id como dependência para forçar reset

  const loadHistorico = async () => {
    if (!meta || isMockMode) return;
    
    setLoadingHistorico(true);
    try {
      const data = await api.getHistoricoByMeta(meta.id);
      setHistorico(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Sincronizar status com estimativa
  useEffect(() => {
    if (estimativa === 'Totalmente Cumprido') {
      setStatus('Concluído');
      if (meta) setPontosRecebidos(meta.pontos_aplicaveis);
    } else if (estimativa === 'Não Cumprido') {
      setStatus('Pendente');
      setPontosRecebidos(0);
    } else if (estimativa === 'Parcialmente Cumprido') {
      setStatus('Em Andamento');
      // Manter pontos atual definido pelo usuário
    } else if (estimativa === 'Não se Aplica') {
      setPontosRecebidos(0);
    }
  }, [estimativa, meta]);

  const handleSave = async () => {
    if (!meta) return;

    if (isMockMode) {
      toast.warning('Modo de demonstração: alterações não são salvas');
      onClose();
      return;
    }

    if (!user) {
      toast.error('Você precisa estar logado para fazer alterações.');
      return;
    }

    // Validações
    if (estimativa === 'Parcialmente Cumprido' && pontosRecebidos === 0) {
      toast.error('Informe os pontos recebidos para metas parcialmente cumpridas.');
      return;
    }

    if (estimativa === 'Parcialmente Cumprido' && pontosRecebidos > meta.pontos_aplicaveis) {
      toast.error(`Os pontos recebidos não podem ser maiores que ${meta.pontos_aplicaveis}.`);
      return;
    }

    if (estimativa === 'Parcialmente Cumprido' && !justificativa.trim()) {
      toast.error('Informe a justificativa para cumprimento parcial.');
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
      
      // Aguardar um pouco para garantir que o banco atualizou
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onUpdate();
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
      default: return 'bg-gray-500 text-white hover:bg-gray-500';
    }
  };

  const getAcaoIcon = (acao: string) => {
    switch (acao) {
      case 'criacao': return '✨';
      case 'atualizacao_status': return '🔄';
      case 'adicao_evidencia': return '📎';
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 pr-8">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{meta.artigo} - {meta.requisito}</DialogTitle>
              <DialogDescription className="text-base">{meta.item}</DialogDescription>
              <div className="mt-2">
                <Badge className={getStatusColor(status)}>{status}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="prestacao" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prestacao">📋 Prestação de Contas</TabsTrigger>
            <TabsTrigger value="historico">
              <History className="h-4 w-4 mr-2" />
              Histórico {historico.length > 0 && `(${historico.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prestacao" className="space-y-6 mt-4">
          {/* Informações da Meta */}
          <div className="border-l-4 border-blue-500 bg-muted/30 p-4 rounded-r-lg space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Eixo:</span>
              <span>{meta.eixo}</span>
            </div>
            
            {meta.descricao && (
              <div className="text-sm">
                <span className="font-medium">Descrição:</span>
                <p className="mt-1 text-muted-foreground">{meta.descricao}</p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Setor</p>
                  <p className="font-medium">{meta.setor_executor}</p>
                </div>
              </div>
              {meta.coordenador && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Coordenador</p>
                    <p className="font-medium">{meta.coordenador}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Prazo</p>
                  <p className="font-medium">
                    {format(parseISO(meta.deadline), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Pontos Aplicáveis</p>
                  <p className="font-medium text-lg">{meta.pontos_aplicaveis}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prestação de Contas */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">📋 Prestação de Contas</h3>

            {/*  Estimativa de Cumprimento */}
            <div className="space-y-2">
              <Label htmlFor="estimativa" className="text-sm font-medium">
                 Estimativa de Cumprimento
              </Label>
              <Select value={estimativa} onValueChange={setEstimativa}>
                <SelectTrigger id="estimativa">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="Totalmente Cumprido">✅ Totalmente Cumprido</SelectItem>
                  <SelectItem value="Parcialmente Cumprido">⚠️ Parcialmente Cumprido</SelectItem>
                  <SelectItem value="Não Cumprido">❌ Não Cumprido</SelectItem>
                  <SelectItem value="Não se Aplica">➖ Não se Aplica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/*  Pontos Estimados */}
            {estimativa === 'Parcialmente Cumprido' && (
              <div className="space-y-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <Label className="text-sm font-medium">
                   Pontos Recebidos (Cumprimento Parcial) *
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pontos recebidos:</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max={meta.pontos_aplicaveis}
                        step="1"
                        value={pontosRecebidos}
                        onChange={(e) => setPontosRecebidos(Number(e.target.value))}
                        className="bg-white w-20 text-center"
                      />
                      <span className="text-sm">
                        / {meta.pontos_aplicaveis} <span className="text-muted-foreground">({percentualCalculado.toFixed(1)}%)</span>
                      </span>
                    </div>
                  </div>
                  
                  <Slider
                    value={[pontosRecebidos]}
                    onValueChange={(value) => setPontosRecebidos(value[0])}
                    min={0}
                    max={meta.pontos_aplicaveis}
                    step={1}
                    className="w-full"
                  />
                  
                  <p className="text-xs text-muted-foreground">
                    Use o campo ou a barra para definir quantos pontos foram conquistados (0 a {meta.pontos_aplicaveis})
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="justificativa">Justificativa do Cumprimento Parcial *</Label>
                  <Textarea
                    id="justificativa"
                    placeholder="Explique por que a meta foi cumprida parcialmente e quantos pontos foram atingidos..."
                    rows={3}
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    className="bg-white"
                  />
                </div>
              </div>
            )}

            {estimativa !== 'Parcialmente Cumprido' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <Label className="text-sm font-medium">Pontos Estimados</Label>
                <p className="text-sm mt-1 text-muted-foreground">
                  {estimativa === 'Não se Aplica' || estimativa === 'Não Cumprido' 
                    ? 'Não se aplica' 
                    : `${meta.pontos_aplicaveis} pontos (100% de cumprimento)`}
                </p>
              </div>
            )}

            {/*  Ações Planejadas */}
            <div className="space-y-2">
              <Label htmlFor="acoes" className="text-sm font-medium">
                Ações Planejadas / Executadas
              </Label>
              <Textarea
                id="acoes"
                placeholder="Descreva as iniciativas, medidas ou providências que estão sendo adotadas ou que serão implementadas para garantir o atendimento ao critério..."
                rows={5}
                value={acoes}
                onChange={(e) => setAcoes(e.target.value)}
              />
            </div>

            {/* Campos Complementares */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">📎 Informações Complementares</h4>

              <div className="space-y-2">
                <Label htmlFor="link">Link de Evidência</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://..."
                  value={linkEvidencia}
                  onChange={(e) => setLinkEvidencia(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  URL com documentos, relatórios ou comprovações da execução
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Adicione observações gerais sobre o andamento..."
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
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

          {/* Resumo de Pontuação */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pontos Recebidos (Estimativa)</p>
                <p className="text-3xl font-bold text-blue-600">{pontosRecebidos}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">de {meta.pontos_aplicaveis} pontos</p>
                <p className="text-xl font-semibold">{percentualCalculado.toFixed(1)}%</p>
              </div>
            </div>
          </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : '💾 Salvar Prestação de Contas'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            <div className="space-y-4">
              {loadingHistorico ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Carregando histórico...</p>
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma alteração registrada ainda</p>
                  <p className="text-sm mt-1">Faça uma alteração na prestação de contas para criar o primeiro registro</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {historico.map((item, index) => (
                      <div key={item.id} className="relative">
                        {index !== historico.length - 1 && (
                          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                        )}
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                            {getAcaoIcon(item.acao)}
                          </div>
                          <div className="flex-1 bg-muted/30 rounded-lg p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{getAcaoLabel(item.acao)}</p>
                                <p className="text-sm text-muted-foreground">
                                  por {item.usuario_email}
                                </p>
                              </div>
                              <div className="text-xs text-muted-foreground text-right">
                                <p>{format(parseISO(item.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                                <p>{format(parseISO(item.created_at), "HH:mm", { locale: ptBR })}</p>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2">
                              {/* Status */}
                              {(item.status_anterior !== item.status_novo) && (
                                <div className="text-sm pt-2 border-t">
                                  <p className="text-muted-foreground mb-1 font-medium">📊 Status:</p>
                                  <div className="flex items-center gap-2">
                                    {item.status_anterior && (
                                      <>
                                        <Badge variant="outline" className="text-xs">
                                          {item.status_anterior}
                                        </Badge>
                                        <span className="text-muted-foreground">→</span>
                                      </>
                                    )}
                                    <Badge className={item.status_novo ? getStatusColor(item.status_novo) : ''}>
                                      {item.status_novo || 'N/A'}
                                    </Badge>
                                  </div>
                                </div>
                              )}

                              {/* Estimativa de Cumprimento */}
                              {(item.estimativa_cumprimento_anterior !== item.estimativa_cumprimento_novo) && (
                                <div className="text-sm pt-2 border-t">
                                  <p className="text-muted-foreground mb-1 font-medium">✅ Estimativa de Cumprimento:</p>
                                  <div className="flex items-center gap-2 text-xs">
                                    {item.estimativa_cumprimento_anterior && (
                                      <>
                                        <span className="bg-muted px-2 py-1 rounded">{item.estimativa_cumprimento_anterior}</span>
                                        <span className="text-muted-foreground">→</span>
                                      </>
                                    )}
                                    <span className="bg-primary/10 px-2 py-1 rounded font-medium">
                                      {item.estimativa_cumprimento_novo || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Pontos Estimados */}
                              {(item.pontos_estimados_anterior !== item.pontos_estimados_novo) && (
                                <div className="text-sm pt-2 border-t">
                                  <p className="text-muted-foreground mb-1 font-medium">🎯 Pontos Estimados:</p>
                                  <div className="flex items-center gap-2 text-xs">
                                    {item.pontos_estimados_anterior !== null && item.pontos_estimados_anterior !== undefined && (
                                      <>
                                        <span className="bg-muted px-2 py-1 rounded">{item.pontos_estimados_anterior}</span>
                                        <span className="text-muted-foreground">→</span>
                                      </>
                                    )}
                                    <span className="bg-primary/10 px-2 py-1 rounded font-medium">
                                      {item.pontos_estimados_novo ?? 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Ações Planejadas */}
                              {(item.acoes_planejadas_anterior !== item.acoes_planejadas_novo) && (
                                <div className="text-sm pt-2 border-t">
                                  <p className="text-muted-foreground mb-1 font-medium">📝 Ações Planejadas:</p>
                                  {item.acoes_planejadas_anterior && (
                                    <div className="mb-2">
                                      <p className="text-xs text-muted-foreground mb-1">Anterior:</p>
                                      <p className="text-xs bg-muted/50 p-2 rounded line-through">
                                        {item.acoes_planejadas_anterior}
                                      </p>
                                    </div>
                                  )}
                                  {item.acoes_planejadas_novo && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Novo:</p>
                                      <p className="text-xs bg-primary/10 p-2 rounded">
                                        {item.acoes_planejadas_novo}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Justificativa Parcial */}
                              {(item.justificativa_parcial_anterior !== item.justificativa_parcial_novo) && (
                                <div className="text-sm pt-2 border-t">
                                  <p className="text-muted-foreground mb-1 font-medium">📋 Justificativa (Cumprimento Parcial):</p>
                                  {item.justificativa_parcial_anterior && (
                                    <div className="mb-2">
                                      <p className="text-xs text-muted-foreground mb-1">Anterior:</p>
                                      <p className="text-xs bg-muted/50 p-2 rounded line-through">
                                        {item.justificativa_parcial_anterior}
                                      </p>
                                    </div>
                                  )}
                                  {item.justificativa_parcial_novo && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Novo:</p>
                                      <p className="text-xs bg-primary/10 p-2 rounded">
                                        {item.justificativa_parcial_novo}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Link de Evidência */}
                              {(item.link_evidencia_anterior !== item.link_evidencia_novo) && (
                                <div className="text-sm pt-2 border-t">
                                  <p className="text-muted-foreground mb-1 font-medium">🔗 Link de Evidência:</p>
                                  {item.link_evidencia_anterior && (
                                    <div className="mb-2">
                                      <p className="text-xs text-muted-foreground mb-1">Anterior:</p>
                                      <a 
                                        href={item.link_evidencia_anterior} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600/50 hover:underline break-all line-through"
                                      >
                                        {item.link_evidencia_anterior}
                                      </a>
                                    </div>
                                  )}
                                  {item.link_evidencia_novo && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Novo:</p>
                                      <a 
                                        href={item.link_evidencia_novo} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline break-all font-medium"
                                      >
                                        {item.link_evidencia_novo}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Observações */}
                              {(item.observacoes_anterior !== item.observacoes_novo) && (
                                <div className="text-sm pt-2 border-t">
                                  <p className="text-muted-foreground mb-1 font-medium">💬 Observações:</p>
                                  {item.observacoes_anterior && (
                                    <div className="mb-2">
                                      <p className="text-xs text-muted-foreground mb-1">Anterior:</p>
                                      <p className="text-xs bg-muted/50 p-2 rounded line-through">
                                        {item.observacoes_anterior}
                                      </p>
                                    </div>
                                  )}
                                  {item.observacoes_novo && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Novo:</p>
                                      <p className="text-xs bg-primary/10 p-2 rounded">
                                        {item.observacoes_novo}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MetaModal;