import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Scale, Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.trim()) {
      toast.error('Por favor, informe seu email');
      return;
    }

    setLoading(true);

    try {
      console.log('🔐 Tentando login com email:', email);
      
      // Verificar se o email está na lista de coordenadores autorizados
      const isAutorizado = await api.isEmailAutorizado(email);
      
      if (!isAutorizado) {
        toast.error('Email não autorizado. Apenas coordenadores cadastrados podem acessar o sistema.');
        setLoading(false);
        return;
      }

      // Buscar dados completos do coordenador
      const coordenador = await api.getCoordenadorByEmail(email);
      
      if (!coordenador) {
        toast.error('Erro ao buscar dados do coordenador');
        setLoading(false);
        return;
      }

      // Salvar sessão no localStorage
      const session = {
        user: {
          email: coordenador.email,
          nome: coordenador.nome,
          id: coordenador.id,
        },
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem('auth_session', JSON.stringify(session));
      
      // Disparar evento customizado para notificar o AuthContext
      window.dispatchEvent(new Event('auth-changed'));
      
      toast.success(`Bem-vindo(a), ${coordenador.nome}!`);
      
      // Aguardar um pouco para garantir que o evento foi processado
      setTimeout(() => {
        navigate('/');
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      toast.error('Erro ao fazer login: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full">
              <Scale className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              Eficiência em Ação
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sistema de Acompanhamento de Metas<br />
              <span className="font-semibold">Prêmio CNJ de Qualidade - TJPB 2026</span>
              <br />
              <span className="text-xs text-blue-700 font-semibold italic mt-1 block">
                Unidos por resultados: TJPB no padrão Excelência
              </span>
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                Email Institucional
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@tjpb.jus.br"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                required
                disabled={loading}
                className="h-12 text-base"
                autoComplete="email"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use o email cadastrado na lista de coordenadores autorizados
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Lock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">🔒 Login Simplificado</p>
                  <p className="text-xs">
                    Apenas coordenadores cadastrados na lista de importação podem acessar o sistema.
                    Não é necessário senha - o acesso é controlado pelo email autorizado.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-pulse">Verificando acesso...</span>
                </>
              ) : (
                'Acessar Sistema'
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/')}
                className="text-sm text-muted-foreground"
              >
                Voltar para a página inicial
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
