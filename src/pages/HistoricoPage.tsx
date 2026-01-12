import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, Building2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Atividade, Dificuldade } from '@/integrations/supabase/types';

// Versão: 2026-01-12 - Com setor e coordenador
interface HistoricoItem {
  id: string;
  meta_id: string;
  usuario_email: string;
  acao: string;
  status_anterior: string | null;
  status_novo: string | null;
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
    setor_executor?: string;
    coordenador?: string;
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
                            <Users className="h-3 w-3 mr-1" />
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
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-600">
                    <strong>Usuário:</strong> {item.usuario_email}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Data:</strong>{' '}
                    {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </div>

                  {item.status_anterior && item.status_novo && (
                    <div className="text-sm">
                      <strong>Status:</strong>{' '}
                      <span className="text-red-600">{item.status_anterior}</span>
                      {' → '}
                      <span className="text-green-600">{item.status_novo}</span>
                    </div>
                  )}

                  {item.link_evidencia_novo && (
                    <div className="text-sm">
                      <strong>Evidência:</strong>{' '}
                      <a
                        href={item.link_evidencia_novo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {item.link_evidencia_novo}
                      </a>
                    </div>
                  )}

                  {item.observacoes_novo && (
                    <div className="text-sm">
                      <strong>Observações:</strong>
                      <p className="mt-1 text-gray-700">{item.observacoes_novo}</p>
                    </div>
                  )}

                  {/* Exibir mudanças nas atividades */}
                  {(item.atividades_anterior || item.atividades_novo) && (
                    <div className="text-sm mt-3 pt-3 border-t">
                      <strong className="block mb-2">Mudanças nas Atividades:</strong>
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
                  {item.dificuldade_anterior && item.dificuldade_novo && item.dificuldade_anterior !== item.dificuldade_novo && (
                    <div className="text-sm mt-3 pt-3 border-t">
                      <strong>Nível de Dificuldade:</strong>{' '}
                      <span className={getDificuldadeTextColor(item.dificuldade_anterior)}>
                        {item.dificuldade_anterior}
                      </span>
                      {' → '}
                      <span className={getDificuldadeTextColor(item.dificuldade_novo)}>
                        {item.dificuldade_novo}
                      </span>
                    </div>
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
