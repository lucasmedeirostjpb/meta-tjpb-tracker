import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  nome: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkSession = () => {
    try {
      const sessionStr = localStorage.getItem('auth_session');
      
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        
        // Verificar se a sessão não expirou (24 horas)
        const sessionTime = new Date(session.timestamp).getTime();
        const now = new Date().getTime();
        const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setUser(session.user);
          console.log('✅ Sessão válida:', session.user.nome);
        } else {
          console.log('⏰ Sessão expirada');
          localStorage.removeItem('auth_session');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      localStorage.removeItem('auth_session');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    // Escutar evento customizado de login
    const handleAuthChange = () => {
      console.log('🔄 Evento de autenticação detectado, recarregando sessão...');
      checkSession();
    };

    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  const signOut = () => {
    localStorage.removeItem('auth_session');
    setUser(null);
    // Disparar evento de mudança de autenticação
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/login');
  };

  const refreshUser = () => {
    checkSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
