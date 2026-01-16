import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, Building2, User, Clock, Target, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Atividade, Dificuldade } from '@/integrations/supabase/types';

// Versão: 2026-01-16 - Com todos os campos e sem email
interface HistoricoItem {
  id: string;
  meta_id: string;
  usuario_email: string; // Manter por compatibilidade mas não exibir
  acao: string;
  status_anterior: string | null;
  status_novo: string | null;
  estimativa_cumprimento_anterior: string | null;
  estimativa_cumprimento_novo: string | null;
  pontos_estimados_anterior: number | null;
  pontos_estimados_novo: number | null;
  percentual_cumprimento_anterior: number | null;
  percentual_cumprimento_novo: number | null;
  estimativa_maxima_anterior: number | null;
  estimativa_maxima_novo: number | null;
  acoes_planejadas_anterior: string | null;
  acoes_planejadas_novo: string | null;
  justificativa_parcial_anterior: string | null;
  justificativa_parcial_novo: string | null;
  link_evidencia_anterior: string | null;
  link_evidencia_novo: string | null;
  observacoes_anterior: string | null;
  observacoes_novo: string | null;
  atividades_anterior: Atividade[] | null;
  atividades_novo: Atividade[] | null;
  dificuldade_anterior: Dificuldade | null;
  dificuldade_novo: Dificuldade | null;
  created_at: string;
  meta?: {
    eixo: string;
    artigo: string;
    requisito: string;
    descricao: string;
    pontos_aplicaveis: number;
    setor_executor?: string;
    coordenador?: string;
    deadline?: string;
  };
}

const HistoricoPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    console.log('🔄 [HISTORICO] Carregando histórico de alterações');
    try {
      const data = await api.getHistorico(100);
      console.log('✅ [HISTORICO] Registros recebidos:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📊 [HISTORICO] Primeiro registro:', data[0]);
      }
      setHistorico(data || []);
    } catch (error: any) {
      console.error('❌ [HISTORICO] Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const getAcaoLabel = (acao: string) => {
    const labels: Record<string, string> = {
      criacao: 'Criação',
      atualizacao_status: 'Atualização de Status',
      atualizacao_atividades: 'Atualização de Atividades',
      atualizacao_dificuldade: 'Atualização de Dificuldade',
      adicao_evidencia: 'Adição de Evidência',
      edicao_observacoes: 'Edição de Observações',
      atualizacao_completa: 'Atualização Completa',
    };
    return labels[acao] || acao;
  };

  const formatarValor = (valor: any): string => {
    if (valor === null || valor === undefined || valor === '') {
      return 'Sem informações';
    }
    if (typeof valor === 'number') {
      return valor.toFixed(2);
    }
    return String(valor);
  };

  const houveAlteracao = (anterior: any, novo: any): boolean => {
    // Considera sem alteração se ambos são null/undefined/vazio
    const anteriorVazio = anterior === null || anterior === undefined || anterior === '';
    const novoVazio = novo === null || novo === undefined || novo === '';
    
    if (anteriorVazio && novoVazio) return false;
    return anterior !== novo;
  };

  const getAcaoBadgeVariant = (acao: string): "default" | "secondary" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      criacao: 'default',
      atualizacao_status: 'secondary',
      atualizacao_atividades: 'secondary',
      atualizacao_dificuldade: 'secondary',
      adicao_evidencia: 'outline',
      edicao_observacoes: 'outline',
      atualizacao_completa: 'secondary',
    };
    return variants[acao] || 'default';
  };

  const getDificuldadeTextColor = (dificuldade: Dificuldade) => {
    switch (dificuldade) {
      case 'Sem dificuldades': return 'text-green-600 font-semibold';
      case 'Alerta': return 'text-yellow-600 font-semibold';
      case 'Situação crítica': return 'text-red-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  const compararAtividades = (anterior: Atividade[] | null, novo: Atividade[] | null) => {
    const atividadesAnt = anterior || [];
    const atividadesNov = novo || [];
    
    const mudancas: string[] = [];
    
    // Atividades removidas
    atividadesAnt.forEach(ant => {
      const existe = atividadesNov.find(n => n.id === ant.id);
      if (!existe) {
        mudancas.push(`❌ Removida: "${ant.acao}"`);
      }
    });
    
    // Atividades adicionadas
    atividadesNov.forEach(nov => {
      const existia = atividadesAnt.find(a => a.id === nov.id);
      if (!existia) {
        mudancas.push(`➕ Adicionada: "${nov.acao}" (${nov.responsavel}, prazo: ${nov.prazo ? format(parseISO(nov.prazo), 'dd/MM/yyyy', { locale: ptBR }) : 'sem prazo'}, status: ${nov.status})`);
      }
    });
    
    // Atividades modificadas
    atividadesAnt.forEach(ant => {
      const nov = atividadesNov.find(n => n.id === ant.id);
      if (nov) {
        const alteracoes: string[] = [];
        if (ant.acao !== nov.acao) alteracoes.push(`ação: "${ant.acao}" → "${nov.acao}"`);
        if (ant.responsavel !== nov.responsavel) alteracoes.push(`responsável: "${ant.responsavel}" → "${nov.responsavel}"`);
        if (ant.prazo !== nov.prazo) {
          const prazoAnt = ant.prazo ? format(parseISO(ant.prazo), 'dd/MM/yyyy', { locale: ptBR }) : 'sem prazo';
          const prazoNov = nov.prazo ? format(parseISO(nov.prazo), 'dd/MM/yyyy', { locale: ptBR }) : 'sem prazo';
          alteracoes.push(`prazo: ${prazoAnt} → ${prazoNov}`);
        }
        if (ant.status !== nov.status) alteracoes.push(`status: ${ant.status} → ${nov.status}`);
        
        if (alteracoes.length > 0) {
          mudancas.push(`✏️ Modificada: "${nov.acao}" (${alteracoes.join(', ')})`);
        }
      }
    });
    
    return mudancas;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              <History className="h-6 w-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Histórico de Alterações
              </h1>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando histórico...</p>
          </div>
        ) : historico.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Nenhuma alteração registrada ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {historico.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {item.meta?.requisito || 'Meta desconhecida'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {item.meta?.artigo} - {item.meta?.eixo}
                      </CardDescription>
                      
                      {/* Indicadores de Setor e Coordenador */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.meta?.setor_executor && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Building2 className="h-3 w-3 mr-1" />
                            {item.meta.setor_executor}
                          </Badge>
                        )}
                        {item.meta?.coordenador && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <User className="h-3 w-3 mr-1" />
                            {item.meta.coordenador}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant={getAcaoBadgeVariant(item.acao)}>
                      {getAcaoLabel(item.acao)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Descrição completa do requisito */}
                  {item.meta?.descricao && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {item.meta.descricao}
                      </p>
                    </div>
                  )}

                  {/* Indicadores adicionais */}
                  <div className="flex flex-wrap gap-2">
                    {item.meta?.deadline && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Prazo: {format(parseISO(item.meta.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                      </Badge>
                    )}
                    {item.meta?.pontos_aplicaveis && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Target className="h-3 w-3 mr-1" />
                        {item.meta.pontos_aplicaveis} pontos
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 pt-2 border-t">
                    <Clock className="h-4 w-4 inline mr-2" />
                    <strong>Data:</strong>{' '}
                    {format(parseISO(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>

                  {/* Mudanças em Estimativa de Cumprimento */}
                  {(item.estimativa_cumprimento_anterior || item.estimativa_cumprimento_novo) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <strong className="text-sm text-blue-900">📋 Estimativa de Cumprimento:</strong>
                      {houveAlteracao(item.estimativa_cumprimento_anterior, item.estimativa_cumprimento_novo) ? (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="bg-white">
                            {formatarValor(item.estimativa_cumprimento_anterior)}
                          </Badge>
                          <span className="text-blue-600">→</span>
                          <Badge className="bg-blue-600">
                            {formatarValor(item.estimativa_cumprimento_novo)}
                          </Badge>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <Badge className="bg-blue-600">
                            {formatarValor(item.estimativa_cumprimento_novo || item.estimativa_cumprimento_anterior)}
                          </Badge>
                          <p className="text-xs text-gray-600 mt-1">Não houve alteração</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mudanças em Pontos */}
                  {(item.pontos_estimados_anterior !== null || item.pontos_estimados_novo !== null) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <strong className="text-sm text-green-900">🎯 Pontos Estimados:</strong>
                      {houveAlteracao(item.pontos_estimados_anterior, item.pontos_estimados_novo) ? (
                        <div className="mt-2 flex items-center gap-2">
                          {item.pontos_estimados_anterior !== null && item.pontos_estimados_anterior !== undefined ? (
                            <span className="font-mono text-lg">{item.pontos_estimados_anterior.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem informações</span>
                          )}
                          <span className="text-green-600">→</span>
                          {item.pontos_estimados_novo !== null && item.pontos_estimados_novo !== undefined ? (
                            <span className="font-mono text-lg font-bold text-green-700">
                              {item.pontos_estimados_novo.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem informações</span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1">
                          {item.pontos_estimados_novo !== null && item.pontos_estimados_novo !== undefined ? (
                            <span className="font-mono text-lg font-bold text-green-700">
                              {item.pontos_estimados_novo.toFixed(2)} pontos
                            </span>
                          ) : item.pontos_estimados_anterior !== null && item.pontos_estimados_anterior !== undefined ? (
                            <span className="font-mono text-lg text-green-700">
                              {item.pontos_estimados_anterior.toFixed(2)} pontos
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem informações</span>
                          )}
                          <p className="text-xs text-gray-600 mt-1">Não houve alteração</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mudanças em Percentual */}
                  {(item.percentual_cumprimento_anterior !== null || item.percentual_cumprimento_novo !== null) && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <strong className="text-sm text-purple-900">📈 Percentual de Cumprimento:</strong>
                      {houveAlteracao(item.percentual_cumprimento_anterior, item.percentual_cumprimento_novo) ? (
                        <div className="mt-2 flex items-center gap-2">
                          {item.percentual_cumprimento_anterior !== null && item.percentual_cumprimento_anterior !== undefined ? (
                            <span className="font-mono text-lg">{item.percentual_cumprimento_anterior.toFixed(1)}%</span>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem informações</span>
                          )}
                          <span className="text-purple-600">→</span>
                          {item.percentual_cumprimento_novo !== null && item.percentual_cumprimento_novo !== undefined ? (
                            <span className="font-mono text-lg font-bold text-purple-700">
                              {item.percentual_cumprimento_novo.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem informações</span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1">
                          {item.percentual_cumprimento_novo !== null && item.percentual_cumprimento_novo !== undefined ? (
                            <span className="font-mono text-lg font-bold text-purple-700">
                              {item.percentual_cumprimento_novo.toFixed(1)}%
                            </span>
                          ) : item.percentual_cumprimento_anterior !== null && item.percentual_cumprimento_anterior !== undefined ? (
                            <span className="font-mono text-lg text-purple-700">
                              {item.percentual_cumprimento_anterior.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem informações</span>
                          )}
                          <p className="text-xs text-gray-600 mt-1">Não houve alteração</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mudanças em Estimativa Máxima */}
                  {(item.estimativa_maxima_anterior !== null || item.estimativa_maxima_novo !== null) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <strong className="text-sm text-red-900">🏚️ Estimativa Máxima (Em Andamento):</strong>
                      {houveAlteracao(item.estimativa_maxima_anterior, item.estimativa_maxima_novo) ? (
                        <div className="mt-2 flex items-center gap-2">
                          {item.estimativa_maxima_anterior !== null && item.estimativa_maxima_anterior !== undefined ? (
                            <span className="font-mono text-lg">{item.estimativa_maxima_anterior.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem informações</span>
                          )}
                          <span className="text-red-600">→</span>
                          {item.estimativa_maxima_novo !== null && item.estimativa_maxima_novo !== undefined ? (
                            <span className="font-mono text-lg font-bold text-red-700">
                              {item.estimativa_maxima_novo.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem informações</span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1">
                          {item.estimativa_maxima_novo !== null && item.estimativa_maxima_novo !== undefined ? (
                            <span className="font-mono text-lg font-bold text-red-700">
                              {item.estimativa_maxima_novo.toFixed(2)} pontos
                            </span>
                          ) : item.estimativa_maxima_anterior !== null && item.estimativa_maxima_anterior !== undefined ? (
                            <span className="font-mono text-lg text-red-700">
                              {item.estimativa_maxima_anterior.toFixed(2)} pontos
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Sem informações</span>
                          )}
                          <p className="text-xs text-gray-600 mt-1">Não houve alteração</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Justificativa */}
                  {(item.justificativa_parcial_anterior || item.justificativa_parcial_novo) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <strong className="text-sm text-yellow-900">📄 Justificativa Parcial:</strong>
                      {item.justificativa_parcial_anterior && (
                        <div className="mt-2">
                          <span className="text-xs text-yellow-700">Anterior:</span>
                          <p className="text-sm mt-1 text-gray-700">{item.justificativa_parcial_anterior}</p>
                        </div>
                      )}
                      {item.justificativa_parcial_novo && (
                        <div className="mt-2">
                          <span className="text-xs text-yellow-700 font-semibold">Novo:</span>
                          <p className="text-sm mt-1 text-gray-900 font-medium">{item.justificativa_parcial_novo}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Evidências */}
                  {item.link_evidencia_novo && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <strong className="text-sm text-indigo-900">🔍 Evidência:</strong>
                      <a
                        href={item.link_evidencia_novo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline block mt-1 break-all"
                      >
                        {item.link_evidencia_novo}
                      </a>
                    </div>
                  )}

                  {/* Observações */}
                  {item.observacoes_novo && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <strong className="text-sm text-gray-900">💬 Observações:</strong>
                      <p className="text-sm mt-1 text-gray-700">{item.observacoes_novo}</p>
                    </div>
                  )}

                  {/* Exibir mudanças nas atividades */}
                  {(item.atividades_anterior || item.atividades_novo) && (
                    <div className="text-sm mt-3 pt-3 border-t">
                      <strong className="block mb-2">🎯 Mudanças nas Atividades:</strong>
                      {compararAtividades(item.atividades_anterior, item.atividades_novo).length > 0 ? (
                        <ul className="list-none space-y-1 text-gray-700">
                          {compararAtividades(item.atividades_anterior, item.atividades_novo).map((mudanca, idx) => (
                            <li key={idx} className="text-xs leading-relaxed">{mudanca}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-500">Nenhuma mudança detectada</p>
                      )}
                    </div>
                  )}

                  {/* Exibir mudança de dificuldade */}
                  {(item.dificuldade_anterior || item.dificuldade_novo) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <strong className="text-sm text-orange-900">⚠️ Nível de Dificuldade:</strong>
                      <div className="mt-2 flex items-center gap-2">
                        {item.dificuldade_anterior && (
                          <Badge variant="outline" className={getDificuldadeTextColor(item.dificuldade_anterior)}>
                            {item.dificuldade_anterior}
                          </Badge>
                        )}
                        {item.dificuldade_anterior && item.dificuldade_novo && (
                          <span className="text-orange-600">→</span>
                        )}
                        {item.dificuldade_novo && (
                          <Badge className="bg-orange-600">{item.dificuldade_novo}</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ações Planejadas (campo legado) */}
                  {(item.acoes_planejadas_anterior || item.acoes_planejadas_novo) && (
                    <details className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <summary className="text-sm font-medium text-amber-900 cursor-pointer">
                        📋 Ações Planejadas (dados antigos)
                      </summary>
                      {item.acoes_planejadas_anterior && (
                        <div className="mt-2">
                          <span className="text-xs text-amber-700">Anterior:</span>
                          <p className="text-sm mt-1 text-gray-700">{item.acoes_planejadas_anterior}</p>
                        </div>
                      )}
                      {item.acoes_planejadas_novo && (
                        <div className="mt-2">
                          <span className="text-xs text-amber-700 font-semibold">Novo:</span>
                          <p className="text-sm mt-1 text-gray-900 font-medium">{item.acoes_planejadas_novo}</p>
                        </div>
                      )}
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricoPage;
