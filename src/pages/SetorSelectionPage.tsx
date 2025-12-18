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
import { Building2, Users, ArrowLeft, Scale, LayoutList, Check, ChevronsUpDown, Target, FileText, LogOut, LogIn, Edit } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("coordenador");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="gap-2 hover:bg-blue-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Eficiência em Ação
                  </h1>
                  <p className="text-xs text-gray-600">TJPB - Prêmio CNJ 2026</p>
                </div>
              </div>
            </div>
            
            {/* Informações do usuário ou Login */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.nome}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate('/minhas-metas')}
                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Minhas Metas</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-xl opacity-50"></div>
                <div className="relative p-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl">
                  <img 
                    src="/assets/images/tjpb_grande.png" 
                    alt="TJPB" 
                    className="h-14 w-14 object-contain brightness-0 invert"
                  />
                </div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Consultar Requisitos
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Escolha a melhor forma de consultar os requisitos do Prêmio CNJ de Qualidade 2026
            </p>
            <p className="text-sm text-blue-700 font-semibold italic">
              Unidos por resultados: TJPB no padrão Excelência
            </p>
          </div>

          {/* Opções de Visualização */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card Visão por Setor/Coordenador */}
            <Card className="border-2 border-blue-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300">
                    <Building2 className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <CardTitle className="text-xl font-bold">{activeTab === "coordenador" ? "Por Coordenador" : "Por Setor"}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Consulte os requisitos de um setor ou coordenação específica
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="coordenador" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Coordenador
                    </TabsTrigger>
                    <TabsTrigger value="setor" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Setor
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
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      size="lg"
                    >
                      <Building2 className="mr-2 h-5 w-5" />
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
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      size="lg"
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Ver Requisitos do Coordenador
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Card Visão Consolidada */}
            <Card className="border-2 border-purple-200 hover:border-purple-400 hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl group-hover:from-purple-500 group-hover:to-purple-600 transition-all duration-300">
                    <LayoutList className="h-7 w-7 text-purple-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <CardTitle className="text-xl font-bold">Visão Consolidada</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Visualize todos os requisitos organizados em uma visão completa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-sm text-purple-900 font-medium">Escolha o tipo de consolidação:</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => navigate('/consolidado?tipo=coordenador')}
                      variant="outline"
                      className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-400 h-auto py-5 flex-col gap-2 transition-all duration-300"
                    >
                      <Users className="h-7 w-7" />
                      <div className="text-center">
                        <div className="font-bold text-sm">Coordenador</div>
                        <div className="text-xs text-muted-foreground">Eixos → Coords</div>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={() => navigate('/consolidado?tipo=setor')}
                      variant="outline"
                      className="border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-400 h-auto py-5 flex-col gap-2 transition-all duration-300"
                    >
                      <Building2 className="h-7 w-7" />
                      <div className="text-center">
                        <div className="font-bold text-sm">Setor</div>
                        <div className="text-xs text-muted-foreground">Eixos → Setores</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Tabela Completa */}
            <Card className="border-2 border-green-200 hover:border-green-400 hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl group-hover:from-green-500 group-hover:to-green-600 transition-all duration-300">
                    <FileText className="h-7 w-7 text-green-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <CardTitle className="text-xl font-bold">Tabela Completa</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Visualize todos os requisitos em formato de tabela com filtros avançados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/tabela')}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-12"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Abrir Tabela Completa
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetorSelectionPage;