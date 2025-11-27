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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSetoresUnicos, getCoordenadoresUnicos } from "@/lib/mockData";

const SetorSelectionPage = () => {
  const navigate = useNavigate();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const [setores, setSetores] = useState<string[]>([]);
  const [coordenadores, setCoordenadores] = useState<string[]>([]);
  const [selectedSetor, setSelectedSetor] = useState<string>("");
  const [selectedCoordenador, setSelectedCoordenador] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("setor");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (isMockMode) {
        // Usar dados mock
        setSetores(getSetoresUnicos());
        setCoordenadores(getCoordenadoresUnicos());
      } else {
        // Usar dados reais do Supabase
        const { data, error } = await supabase
          .from('metas_base')
          .select('setor_executor, coordenador');

        if (error) throw error;

        const uniqueSetores = [...new Set(data.map(item => item.setor_executor).filter(Boolean))].sort();
        const uniqueCoordenadores = [...new Set(data.map(item => item.coordenador).filter(Boolean))].sort();
        
        setSetores(uniqueSetores);
        setCoordenadores(uniqueCoordenadores);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessSetor = () => {
    if (!selectedSetor) {
      toast.error('Por favor, selecione um setor');
      return;
    }
    navigate(`/dashboard?tipo=setor&nome=${encodeURIComponent(selectedSetor)}`);
  };

  const handleAccessCoordenador = () => {
    if (!selectedCoordenador) {
      toast.error('Por favor, selecione um coordenador');
      return;
    }
    navigate(`/dashboard?tipo=coordenador&nome=${encodeURIComponent(selectedCoordenador)}`);
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
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setor" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Setor
              </TabsTrigger>
              <TabsTrigger value="coordenador" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Coordenador
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setor" className="space-y-4 mt-6">
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
                onClick={handleAccessSetor}
                disabled={!selectedSetor || loading}
                className="w-full"
                size="lg"
              >
                Acessar Dashboard
              </Button>
            </TabsContent>

            <TabsContent value="coordenador" className="space-y-4 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Qual é o seu nome?</label>
                <Select value={selectedCoordenador} onValueChange={setSelectedCoordenador}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione seu nome" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {loading ? (
                      <SelectItem value="loading" disabled>
                        Carregando...
                      </SelectItem>
                    ) : (
                      coordenadores.map((coordenador) => (
                        <SelectItem key={coordenador} value={coordenador}>
                          {coordenador}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAccessCoordenador}
                disabled={!selectedCoordenador || loading}
                className="w-full"
                size="lg"
              >
                Acessar Dashboard
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetorSelectionPage;