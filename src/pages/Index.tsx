import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      const { data, error } = await supabase
        .from('metas_base')
        .select('id')
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        navigate('/setor-selection');
      } else {
        navigate('/import');
      }
    } catch (error) {
      console.error('Erro ao verificar banco de dados:', error);
      navigate('/import');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
};

export default Index;