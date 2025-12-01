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
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Building2, Users, LogIn, LogOut, ArrowLeft, Scale, LayoutList, Check, ChevronsUpDown } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { getSetoresUnicos, getCoordenadoresUnicos } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";

const SetorSelectionPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const [setores, setSetores] = useState<string[]>([]);
  const [coordenadores, setCoordenadores] = useState<string[]>([]);
  const [selectedSetor, setSelectedSetor] = useState<string>("");
  const [selectedCoordenador, setSelectedCoordenador] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("setor");
  const [openSetor, setOpenSetor] = useState(false);
  const [openCoordenador, setOpenCoordenador] = useState(false);

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
        console.log('🌐 [SETOR SELECTION] Usando Supabase REAL');
        // Usar API
        const [setoresData, coordenadoresData] = await Promise.all([
          api.getSetores(),
          api.getCoordenadores(),
        ]);
        
        console.log('✅ [SETOR SELECTION] Setores recebidos:', setoresData.length, setoresData);
        console.log('✅ [SETOR SELECTION] Coordenadores recebidos:', coordenadoresData.length, coordenadoresData);
        
        setSetores(setoresData);
        setCoordenadores(coordenadoresData);
      }
    } catch (error: any) {
      console.error('❌ [SETOR SELECTION] Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleAccessSetor = () => {
    if (!selectedSetor) {
      toast.error('Por favor, selecione um setor');
      return;
    }
    navigate(`/requisitos?tipo=setor&nome=${encodeURIComponent(selectedSetor)}`);
  };

  const handleAccessCoordenador = () => {
    if (!selectedCoordenador) {
      toast.error('Por favor, selecione um coordenador');
      return;
    }
    navigate(`/requisitos?tipo=coordenador&nome=${encodeURIComponent(selectedCoordenador)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TJPB - Prêmio CNJ</h1>
                  <p className="text-xs text-gray-600">Qualidade 2026</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Badge variant="outline" className="gap-2">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    <span className="hidden sm:inline">{user.email}</span>
                    <span className="sm:hidden">Logado</span>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={signOut}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate('/login')} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-600 rounded-2xl">
                <Building2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Consultar Requisitos</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Escolha como deseja visualizar os requisitos do Prêmio CNJ de Qualidade 2026
            </p>
            {!user && (
              <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <p className="text-sm text-blue-800">
                  💡 <button onClick={() => navigate('/login')} className="underline font-medium">Faça login</button> para registrar prestações de contas
                </p>
              </div>
            )}
          </div>

          {/* Opções de Visualização */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Card Visão por Setor/Coordenador */}
            <Card className="border-2 hover:border-blue-500 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Meu Setor/Coordenação</CardTitle>
                </div>
                <CardDescription>
                  Visualize apenas os requisitos do seu setor ou coordenação específica
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
                      <label className="text-sm font-medium">Selecione seu setor</label>
                      <Popover open={openSetor} onOpenChange={setOpenSetor}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openSetor}
                            className="w-full justify-between"
                          >
                            {selectedSetor || "Pesquisar setor..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Pesquisar setor..." />
                            <CommandList>
                              <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                              <CommandGroup>
                                {loading ? (
                                  <CommandItem disabled>Carregando...</CommandItem>
                                ) : (
                                  setores.map((setor) => (
                                    <CommandItem
                                      key={setor}
                                      value={setor}
                                      onSelect={(currentValue) => {
                                        setSelectedSetor(currentValue === selectedSetor ? "" : currentValue);
                                        setOpenSetor(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          selectedSetor === setor ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      {setor}
                                    </CommandItem>
                                  ))
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button
                      onClick={handleAccessSetor}
                      disabled={!selectedSetor || loading}
                      className="w-full"
                      size="lg"
                    >
                      Ver Requisitos do Setor
                    </Button>
                  </TabsContent>

                  <TabsContent value="coordenador" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Selecione o coordenador</label>
                      <Popover open={openCoordenador} onOpenChange={setOpenCoordenador}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCoordenador}
                            className="w-full justify-between"
                          >
                            {selectedCoordenador || "Pesquisar coordenador..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Pesquisar coordenador..." />
                            <CommandList>
                              <CommandEmpty>Nenhum coordenador encontrado.</CommandEmpty>
                              <CommandGroup>
                                {loading ? (
                                  <CommandItem disabled>Carregando...</CommandItem>
                                ) : (
                                  coordenadores.map((coordenador) => (
                                    <CommandItem
                                      key={coordenador}
                                      value={coordenador}
                                      onSelect={(currentValue) => {
                                        setSelectedCoordenador(currentValue === selectedCoordenador ? "" : currentValue);
                                        setOpenCoordenador(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          selectedCoordenador === coordenador ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      {coordenador}
                                    </CommandItem>
                                  ))
                                )}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button
                      onClick={handleAccessCoordenador}
                      disabled={!selectedCoordenador || loading}
                      className="w-full"
                      size="lg"
                    >
                      Ver Requisitos do Coordenador
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Card Visão Consolidada */}
            <Card className="border-2 hover:border-purple-500 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <LayoutList className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Visão Consolidada</CardTitle>
                </div>
                <CardDescription>
                  Visualize todos os requisitos organizados por eixo e coordenador em uma visão completa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-900 font-medium mb-2">Inclui:</p>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>✓ Todos os 4 eixos temáticos</li>
                      <li>✓ Agrupamento por coordenador</li>
                      <li>✓ Progresso consolidado</li>
                      <li>✓ Visualização em acordeão</li>
                    </ul>
                  </div>
                  <Button
                    onClick={() => navigate('/consolidado')}
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                    size="lg"
                  >
                    Abrir Visão Consolidada
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetorSelectionPage;