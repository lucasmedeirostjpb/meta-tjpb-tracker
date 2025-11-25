import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SetorSelectionPage = () => {
  const navigate = useNavigate();
  const [setores, setSetores] = useState<string[]>([]);
  const [selectedSetor, setSelectedSetor] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSetores();
  }, []);

  const fetchSetores = async () => {
    try {
      const { data, error } = await supabase
        .from('metas_base')
        .select('setor_executor');

      if (error) throw error;

      const uniqueSetores = [...new Set(data.map(item => item.setor_executor))].sort();
      setSetores(uniqueSetores);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      toast.error('Erro ao carregar os setores');
    } finally {
      setLoading(false);
    }
  };

  const handleAccess = () => {
    if (!selectedSetor) {
      toast.error('Por favor, selecione um setor');
      return;
    }
    navigate(`/dashboard?setor=${encodeURIComponent(selectedSetor)}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao Sistema</CardTitle>
          <CardDescription>
            Prêmio CNJ de Qualidade TJPB 2026
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Qual é o seu Setor?</label>
            <Select value={selectedSetor} onValueChange={setSelectedSetor}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione seu setor" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {loading ? (
                  <SelectItem value="loading" disabled>
                    Carregando...
                  </SelectItem>
                ) : (
                  setores.map((setor) => (
                    <SelectItem key={setor} value={setor}>
                      {setor}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAccess}
            disabled={!selectedSetor || loading}
            className="w-full"
            size="lg"
          >
            Acessar Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetorSelectionPage;