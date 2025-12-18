import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

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
  created_at: string;
  meta?: {
    eixo: string;
    artigo: string;
    requisito: string;
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
      adicao_evidencia: 'Adição de Evidência',
      edicao_observacoes: 'Edição de Observações',
    };
    return labels[acao] || acao;
  };

  const getAcaoBadgeVariant = (acao: string): "default" | "secondary" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      criacao: 'default',
      atualizacao_status: 'secondary',
      adicao_evidencia: 'outline',
      edicao_observacoes: 'outline',
    };
    return variants[acao] || 'default';
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
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {item.meta?.requisito || 'Meta desconhecida'}
                      </CardTitle>
                      <CardDescription>
                        {item.meta?.artigo} - {item.meta?.eixo}
                      </CardDescription>
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
