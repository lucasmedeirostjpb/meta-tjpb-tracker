import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, User, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface HistoricoAtividadeItem {
  id: string;
  meta_id: string;
  atividade_id: string;
  acao_descricao: string;
  usuario_nome: string;
  andamento_anterior: string | null;
  andamento_novo: string | null;
  created_at: string;
  meta?: {
    eixo: string;
    artigo: string;
    requisito: string;
    setor_executor?: string;
    coordenador?: string;
  };
}

const HistoricoAtividadesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<HistoricoAtividadeItem[]>([]);

  useEffect(() => {
    fetchHistorico();
  }, []);

  const fetchHistorico = async () => {
    try {
      const { data, error } = await supabase
        .from('historico_atividades')
        .select(`
          *,
          meta:metas_base(eixo, artigo, requisito, setor_executor, coordenador)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
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
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Histórico de Atividades</h1>
                <p className="text-sm text-muted-foreground">
                  Rastreamento de alterações no andamento das atividades
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {historico.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Nenhuma alteração em atividades registrada ainda.</p>
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
                        {item.meta?.requisito || 'Atividade'}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {item.meta?.artigo} - {item.meta?.eixo}
                      </CardDescription>
                    </div>
                    <Badge className="bg-blue-600 shrink-0">✏️ Edição de Andamento</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      <User className="h-3 w-3 mr-1" />
                      {item.usuario_nome}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(parseISO(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Descrição da Atividade */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <strong className="text-sm text-blue-900">📋 Atividade:</strong>
                    <p className="text-sm mt-1 text-gray-700">{item.acao_descricao}</p>
                  </div>

                  {/* Andamento */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <strong className="text-sm text-green-900">📝 Andamento:</strong>
                    {item.andamento_anterior === item.andamento_novo ? (
                      <div className="mt-1">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {item.andamento_novo || item.andamento_anterior || 'Sem informações'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Não houve alteração</p>
                      </div>
                    ) : (
                      <>
                        {item.andamento_anterior || item.andamento_novo ? (
                          <div className="mt-2 space-y-2">
                            <div>
                              <span className="text-xs text-green-700">Anterior:</span>
                              <p className="text-sm mt-1 text-gray-700 whitespace-pre-wrap">
                                {item.andamento_anterior || 'Sem informações'}
                              </p>
                            </div>
                            <div className="flex items-center justify-center">
                              <span className="text-green-600">↓</span>
                            </div>
                            <div>
                              <span className="text-xs text-green-700 font-semibold">Novo:</span>
                              <p className="text-sm mt-1 text-gray-900 font-medium whitespace-pre-wrap">
                                {item.andamento_novo || 'Sem informações'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 mt-2">Sem alterações registradas</p>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricoAtividadesPage;
