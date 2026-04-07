import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { getMetasWithUpdates } from '@/lib/mockData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save, Lock, Search, Calendar as CalendarIcon, Trash2, ChevronRight, FileText } from 'lucide-react';
import { formatDateSafe, parseDateSafe } from '@/lib/date-utils';
import { Meta } from '@/services/api';


const EditarRequisitoPage = () => {
  const navigate = useNavigate();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const selectedRef = useRef<HTMLDivElement>(null);

  const [metas, setMetas] = useState<Meta[]>([]);
  const [selectedMetaId, setSelectedMetaId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Campos editáveis
  const [eixo, setEixo] = useState('');
  const [item, setItem] = useState('');
  const [artigo, setArtigo] = useState('');
  const [requisito, setRequisito] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pontosAplicaveis, setPontosAplicaveis] = useState(0);
  const [setorExecutor, setSetorExecutor] = useState('');
  const [coordenador, setCoordenador] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    fetchMetas();
  }, []);

  const fetchMetas = async () => {
    setLoading(true);
    try {
      if (isMockMode) {
        const data = getMetasWithUpdates();
        setMetas(data);
      } else {
        const data = await api.getMetas();
        setMetas(data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar metas:', error);
      toast.error('Erro ao carregar requisitos');
    } finally {
      setLoading(false);
    }
  };

  const handleMetaSelect = (metaId: string) => {
    setSelectedMetaId(metaId);
    const meta = metas.find(m => m.id === metaId);
    
    if (meta) {
      setEixo(meta.eixo);
      setItem(meta.item);
      setArtigo(meta.artigo);
      setRequisito(meta.requisito);
      setDescricao(meta.descricao || '');
      setPontosAplicaveis(meta.pontos_aplicaveis);
      setSetorExecutor(meta.setor_executor);
      setCoordenador(meta.coordenador || '');
      setDeadline(meta.deadline);
    }

    // Scroll to top of form on mobile
    setTimeout(() => {
      selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Filtrar metas baseado na busca
  const filteredMetas = metas.filter(meta => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      meta.artigo.toLowerCase().includes(search) ||
      meta.requisito.toLowerCase().includes(search) ||
      meta.eixo.toLowerCase().includes(search) ||
      meta.setor_executor.toLowerCase().includes(search) ||
      (meta.coordenador && meta.coordenador.toLowerCase().includes(search))
    );
  });

  // Agrupar metas por eixo para a sidebar
  const metasByEixo = filteredMetas.reduce((acc, meta) => {
    const eixoKey = meta.eixo;
    if (!acc[eixoKey]) acc[eixoKey] = [];
    acc[eixoKey].push(meta);
    return acc;
  }, {} as Record<string, Meta[]>);

  const handleSave = async () => {
    if (!selectedMetaId) {
      toast.error('Selecione um requisito primeiro');
      return;
    }

    setSaving(true);
    try {
      const updatedMeta = {
        id: selectedMetaId,
        eixo,
        item,
        artigo,
        requisito,
        descricao,
        pontos_aplicaveis: pontosAplicaveis,
        setor_executor: setorExecutor,
        coordenador,
        deadline,
      };

      if (isMockMode) {
        toast.info('Modo mock: alterações não serão salvas');
        console.log('Dados que seriam salvos:', updatedMeta);
      } else {
        await api.updateMeta(selectedMetaId, updatedMeta);
        toast.success('Requisito atualizado com sucesso!');
        await fetchMetas();
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMetaId) return;

    setDeleting(true);
    try {
      if (isMockMode) {
        toast.info('Modo mock: exclusão não será realizada');
      } else {
        await api.deleteMeta(selectedMetaId);
        toast.success('Requisito excluído com sucesso!');
        setSelectedMetaId('');
        await fetchMetas();
      }
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir requisito');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const getEixoColor = (eixo: string) => {
    const e = eixo.toLowerCase();
    if (e.includes('governança')) return 'bg-blue-500';
    if (e.includes('produtividade')) return 'bg-green-500';
    if (e.includes('transparência') || e.includes('transparencia')) return 'bg-purple-500';
    if (e.includes('dados') || e.includes('tecnologia')) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  const selectedMeta = metas.find(m => m.id === selectedMetaId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 rounded-lg">
                  <Lock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Editar Requisitos</h1>
                  <p className="text-[11px] text-red-600">⚠️ Área Restrita - Administração</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-xs text-gray-500">
              {metas.length} requisitos
            </Badge>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar - Lista de Requisitos */}
        <div className="w-80 lg:w-96 border-r bg-white flex flex-col shrink-0 hidden md:flex">
          {/* Search */}
          <div className="p-3 border-b bg-gray-50/80">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar requisito..."
                className="pl-8 h-8 text-xs bg-white"
              />
            </div>
            {searchTerm && (
              <p className="text-[10px] text-muted-foreground mt-1.5 pl-1">
                {filteredMetas.length} encontrado{filteredMetas.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Lista agrupada por eixo */}
          <div className="flex-1 overflow-y-auto">
            {Object.entries(metasByEixo)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([eixoName, eixoMetas]) => (
                <div key={eixoName}>
                  {/* Header do eixo */}
                  <div className="sticky top-0 z-10 px-3 py-1.5 bg-gray-100/95 backdrop-blur-sm border-b flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getEixoColor(eixoName)}`}></div>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider truncate">
                      {eixoName.replace(/^\d+\.\s*/, '')}
                    </span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-auto shrink-0">
                      {eixoMetas.length}
                    </Badge>
                  </div>

                  {/* Items do eixo */}
                  {eixoMetas
                    .sort((a, b) => a.artigo.localeCompare(b.artigo))
                    .map((meta) => (
                      <div
                        key={meta.id}
                        onClick={() => handleMetaSelect(meta.id)}
                        className={cn(
                          "px-3 py-2.5 border-b border-gray-100 cursor-pointer transition-all text-left w-full",
                          "hover:bg-blue-50/50",
                          selectedMetaId === meta.id
                            ? "bg-blue-50 border-l-2 border-l-blue-600"
                            : "border-l-2 border-l-transparent"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-blue-700 mb-0.5">
                              {meta.artigo}
                            </p>
                            <p className="text-xs text-gray-800 line-clamp-2 leading-tight">
                              {meta.requisito}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                              {meta.setor_executor}
                            </p>
                          </div>
                          {selectedMetaId === meta.id && (
                            <ChevronRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            {filteredMetas.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum requisito encontrado
              </div>
            )}
          </div>
        </div>

        {/* Content - Formulário de edição */}
        <div className="flex-1 overflow-y-auto" ref={selectedRef}>
          <div className="max-w-3xl mx-auto p-6">
            {/* Seletor mobile (visível apenas em telas pequenas) */}
            <div className="md:hidden mb-6 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar requisito..."
                  className="pl-9"
                />
              </div>
              <Select value={selectedMetaId} onValueChange={handleMetaSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um requisito para editar..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredMetas.map(meta => (
                    <SelectItem key={meta.id} value={meta.id}>
                      {meta.artigo} - {meta.requisito}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedMetaId ? (
              /* Estado vazio */
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="p-6 bg-gray-100 rounded-2xl mb-6">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Selecione um requisito
                </h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Escolha um requisito na lista ao lado para visualizar e editar seus atributos.
                </p>
              </div>
            ) : (
              /* Formulário de edição */
              <div className="space-y-6">
                {/* Header do requisito selecionado */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${getEixoColor(eixo)}`}></div>
                      <Badge variant="outline" className="text-[10px]">
                        {eixo.replace(/^\d+\.\s*/, '')}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{artigo}</h2>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{requisito}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {pontosAplicaveis} pts
                  </Badge>
                </div>

                <div className="border-t pt-6 space-y-4">
                  {/* Grid 2 colunas para campos menores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Eixo */}
                    <div className="space-y-1.5">
                      <Label htmlFor="eixo" className="text-xs font-semibold text-gray-500 uppercase">Eixo Temático</Label>
                      <Input
                        id="eixo"
                        value={eixo}
                        onChange={(e) => setEixo(e.target.value)}
                        placeholder="Ex: 1. Governança e Estratégia"
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Item */}
                    <div className="space-y-1.5">
                      <Label htmlFor="item" className="text-xs font-semibold text-gray-500 uppercase">Item</Label>
                      <Input
                        id="item"
                        value={item}
                        onChange={(e) => setItem(e.target.value)}
                        placeholder="Ex: 1.1"
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Artigo */}
                    <div className="space-y-1.5">
                      <Label htmlFor="artigo" className="text-xs font-semibold text-gray-500 uppercase">Artigo</Label>
                      <Input
                        id="artigo"
                        value={artigo}
                        onChange={(e) => setArtigo(e.target.value)}
                        placeholder="Ex: Art. 1º"
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Pontos Aplicáveis */}
                    <div className="space-y-1.5">
                      <Label htmlFor="pontos" className="text-xs font-semibold text-gray-500 uppercase">Pontos Aplicáveis</Label>
                      <Input
                        id="pontos"
                        type="number"
                        value={pontosAplicaveis}
                        onChange={(e) => setPontosAplicaveis(Number(e.target.value))}
                        placeholder="0"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Requisito */}
                  <div className="space-y-1.5">
                    <Label htmlFor="requisito" className="text-xs font-semibold text-gray-500 uppercase">Requisito</Label>
                    <Input
                      id="requisito"
                      value={requisito}
                      onChange={(e) => setRequisito(e.target.value)}
                      placeholder="Nome do requisito"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* Descrição */}
                  <div className="space-y-1.5">
                    <Label htmlFor="descricao" className="text-xs font-semibold text-gray-500 uppercase">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descrição detalhada do requisito"
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  {/* Grid 2 colunas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Setor Executor */}
                    <div className="space-y-1.5">
                      <Label htmlFor="setor" className="text-xs font-semibold text-gray-500 uppercase">Setor Executor</Label>
                      <Input
                        id="setor"
                        value={setorExecutor}
                        onChange={(e) => setSetorExecutor(e.target.value)}
                        placeholder="Nome do setor"
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Coordenador */}
                    <div className="space-y-1.5">
                      <Label htmlFor="coordenador" className="text-xs font-semibold text-gray-500 uppercase">Coordenador</Label>
                      <Input
                        id="coordenador"
                        value={coordenador}
                        onChange={(e) => setCoordenador(e.target.value)}
                        placeholder="Nome do coordenador"
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="space-y-1.5">
                    <Label htmlFor="deadline" className="text-xs font-semibold text-gray-500 uppercase">Deadline</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full md:w-1/2 justify-start text-left font-normal h-9 text-sm",
                            !deadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deadline ? formatDateSafe(deadline) : "Selecione a data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={deadline ? parseDateSafe(deadline) : undefined}
                          onSelect={(date) => setDeadline(date ? format(date, 'yyyy-MM-dd') : '')}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMetaId('')}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={saving}
                    className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Excluir Requisito
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-3">
              <p>Tem certeza que deseja excluir este requisito?</p>
              {selectedMeta && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                  <p className="font-semibold text-red-900 text-sm">{selectedMeta.artigo}</p>
                  <p className="text-red-800 text-xs">{selectedMeta.requisito}</p>
                  <p className="text-red-600 text-[11px]">
                    {selectedMeta.setor_executor} • {selectedMeta.pontos_aplicaveis} pts
                  </p>
                </div>
              )}
              <p className="text-red-600 font-medium text-xs">
                ⚠️ Esta ação é irreversível. Todos os updates e histórico associados também serão excluídos.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditarRequisitoPage;
