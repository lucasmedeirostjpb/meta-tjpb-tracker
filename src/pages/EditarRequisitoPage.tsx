import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Lock, Search } from 'lucide-react';
import { getMetasWithUpdates } from '@/lib/mockData';

interface Meta {
  id: string;
  eixo: string;
  item: string;
  artigo: string;
  requisito: string;
  descricao: string;
  pontos_aplicaveis: number;
  setor_executor: string;
  coordenador?: string;
  deadline: string;
}

const EditarRequisitoPage = () => {
  const navigate = useNavigate();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';

  const [metas, setMetas] = useState<Meta[]>([]);
  const [selectedMetaId, setSelectedMetaId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    setSearchTerm(''); // Limpar busca ao selecionar
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
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
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Editar Requisitos</h1>
                  <p className="text-xs text-red-600">⚠️ Área Restrita - Administração</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Edição de Requisitos</CardTitle>
            <CardDescription>
              Selecione um requisito e edite seus atributos. Use com cuidado!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Campo de Busca */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar Requisito</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite artigo, requisito, eixo, setor ou coordenador..."
                  className="pl-9"
                />
              </div>
              {searchTerm && (
                <p className="text-xs text-muted-foreground">
                  {filteredMetas.length} requisito{filteredMetas.length !== 1 ? 's' : ''} encontrado{filteredMetas.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Seletor de Requisito */}
            <div className="space-y-2">
              <Label htmlFor="requisito-select">Selecionar Requisito</Label>
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
                  {filteredMetas.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum requisito encontrado
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedMetaId && (
              <>
                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold text-lg">Campos Editáveis</h3>

                  {/* Eixo */}
                  <div className="space-y-2">
                    <Label htmlFor="eixo">Eixo Temático</Label>
                    <Input
                      id="eixo"
                      value={eixo}
                      onChange={(e) => setEixo(e.target.value)}
                      placeholder="Ex: 1. Governança e Estratégia"
                    />
                  </div>

                  {/* Item */}
                  <div className="space-y-2">
                    <Label htmlFor="item">Item</Label>
                    <Input
                      id="item"
                      value={item}
                      onChange={(e) => setItem(e.target.value)}
                      placeholder="Ex: 1.1"
                    />
                  </div>

                  {/* Artigo */}
                  <div className="space-y-2">
                    <Label htmlFor="artigo">Artigo</Label>
                    <Input
                      id="artigo"
                      value={artigo}
                      onChange={(e) => setArtigo(e.target.value)}
                      placeholder="Ex: Art. 1º"
                    />
                  </div>

                  {/* Requisito */}
                  <div className="space-y-2">
                    <Label htmlFor="requisito">Requisito</Label>
                    <Input
                      id="requisito"
                      value={requisito}
                      onChange={(e) => setRequisito(e.target.value)}
                      placeholder="Nome do requisito"
                    />
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descrição detalhada do requisito"
                      rows={4}
                    />
                  </div>

                  {/* Pontos Aplicáveis */}
                  <div className="space-y-2">
                    <Label htmlFor="pontos">Pontos Aplicáveis</Label>
                    <Input
                      id="pontos"
                      type="number"
                      value={pontosAplicaveis}
                      onChange={(e) => setPontosAplicaveis(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>

                  {/* Setor Executor */}
                  <div className="space-y-2">
                    <Label htmlFor="setor">Setor Executor</Label>
                    <Input
                      id="setor"
                      value={setorExecutor}
                      onChange={(e) => setSetorExecutor(e.target.value)}
                      placeholder="Nome do setor"
                    />
                  </div>

                  {/* Coordenador */}
                  <div className="space-y-2">
                    <Label htmlFor="coordenador">Coordenador</Label>
                    <Input
                      id="coordenador"
                      value={coordenador}
                      onChange={(e) => setCoordenador(e.target.value)}
                      placeholder="Nome do coordenador"
                    />
                  </div>

                  {/* Deadline */}
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 gap-2"
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditarRequisitoPage;
