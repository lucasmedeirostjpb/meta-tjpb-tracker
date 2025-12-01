import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react";
import { api } from "@/services/api";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MetaBase {
  eixo: string;
  item: string;
  artigo: string;
  requisito: string;
  descricao: string;
  pontos_aplicaveis: number;
  setor_executor: string;
  coordenador: string;
  deadline: string;
}

const ImportPage = () => {
  const navigate = useNavigate();
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<MetaBase[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [deleteOldData, setDeleteOldData] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    eixo: '',
    item: '',
    artigo: '',
    requisito: '',
    descricao: '',
    pontos_aplicaveis: '',
    setor_executor: '',
    coordenador: '',
    deadline: ''
  });

  // Função para mapear automaticamente as colunas
  const autoMapColumns = (headers: string[]) => {
    const mapping: typeof columnMapping = {
      eixo: '',
      item: '',
      artigo: '',
      requisito: '',
      descricao: '',
      pontos_aplicaveis: '',
      setor_executor: '',
      coordenador: '',
      deadline: ''
    };

    headers.forEach(header => {
      const headerLower = header.toLowerCase().trim();
      
      // Mapeamento de Eixo
      if (headerLower === 'eixo' || headerLower.includes('eixo')) {
        mapping.eixo = header;
      }
      // Mapeamento de Item
      else if (headerLower === 'item' || headerLower.includes('item')) {
        mapping.item = header;
      }
      // Mapeamento de Artigo
      else if (headerLower === 'art' || headerLower === 'artigo' || headerLower.includes('artigo')) {
        mapping.artigo = header;
      }
      // Mapeamento de Requisito
      else if (headerLower === 'requisito' || headerLower.includes('requisito')) {
        mapping.requisito = header;
      }
      // Mapeamento de Descrição
      else if (headerLower === 'descrição' || headerLower === 'descricao' || headerLower.includes('descriç')) {
        mapping.descricao = header;
      }
      // Mapeamento de Pontos Aplicáveis
      else if (headerLower.includes('ponto') && (headerLower.includes('aplic') || headerLower.includes('2026'))) {
        mapping.pontos_aplicaveis = header;
      }
      // Mapeamento de Setor Executor
      else if (headerLower.includes('setor') && headerLower.includes('exec')) {
        mapping.setor_executor = header;
      }
      // Mapeamento de Coordenador
      else if (headerLower.includes('coordenador') || headerLower.includes('executivo')) {
        mapping.coordenador = header;
      }
      // Mapeamento de Deadline
      else if (headerLower === 'deadline' || headerLower.includes('prazo') || headerLower.includes('data')) {
        mapping.deadline = header;
      }
    });

    return mapping;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Extrair headers do arquivo
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        if (data.length > 0) {
          // Filtrar headers vazios e garantir unicidade
          const rawHeaders = (data[0] as string[]).map((h, idx) => {
            const header = String(h || '').trim();
            return header || `Coluna_${idx + 1}`;
          });
          
          // Garantir que não há duplicatas
          const uniqueHeaders = rawHeaders.map((header, idx) => {
            const count = rawHeaders.slice(0, idx).filter(h => h === header).length;
            return count > 0 ? `${header}_${count + 1}` : header;
          });
          
          setHeaders(uniqueHeaders);
          
          // Mapeamento automático baseado em nomes comuns
          const autoMapping = autoMapColumns(uniqueHeaders);
          setColumnMapping(autoMapping);
          
          setShowMapping(true);
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    // Validar mapeamento
    const requiredFields = ['eixo', 'item', 'artigo', 'requisito', 'pontos_aplicaveis', 'deadline'];
    const missingFields = requiredFields.filter(field => !columnMapping[field as keyof typeof columnMapping]);
    
    if (missingFields.length > 0) {
      toast.error(`Campos obrigatórios não mapeados: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      // Deletar dados antigos se a opção estiver marcada
      if (deleteOldData) {
        await api.deleteAllMetas();
        toast.success('Dados antigos removidos com sucesso');
      }

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const metas = jsonData.filter(row => row[columnMapping.eixo]).map((row, index) => {
        let deadlineFormatted = null; // Usar null em vez de string vazia
        const deadlineValue = row[columnMapping.deadline];
        
        if (deadlineValue) {
          if (typeof deadlineValue === 'number') {
            // Tratar data serial do Excel
            const date = XLSX.SSF.parse_date_code(deadlineValue);
            deadlineFormatted = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else if (typeof deadlineValue === 'string' && deadlineValue.trim()) {
            // Tratar formato de string (dd/mm/yyyy)
            const parts = deadlineValue.trim().split('/');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2];
              deadlineFormatted = `${year}-${month}-${day}`;
            } else {
              // Tentar formato ISO ou outros formatos
              const parsedDate = new Date(deadlineValue);
              if (!isNaN(parsedDate.getTime())) {
                const year = parsedDate.getFullYear();
                const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const day = String(parsedDate.getDate()).padStart(2, '0');
                deadlineFormatted = `${year}-${month}-${day}`;
              }
            }
          }
        }
        
        // Se não conseguiu formatar a data, usar data padrão
        if (!deadlineFormatted) {
          deadlineFormatted = '2026-12-31'; // Data padrão do prêmio CNJ 2026
        }

        return {
          eixo: row[columnMapping.eixo] || '',
          item: row[columnMapping.item] || '',
          artigo: row[columnMapping.artigo] || '',
          requisito: row[columnMapping.requisito] || '',
          descricao: row[columnMapping.descricao] || '',
          pontos_aplicaveis: parseInt(row[columnMapping.pontos_aplicaveis] || '0'),
          setor_executor: row[columnMapping.setor_executor] || '',
          coordenador: row[columnMapping.coordenador] || '',
          deadline: deadlineFormatted,
          linha_planilha: index + 2,
        };
      });

      await api.createMetas(metas);

      toast.success(`${metas.length} metas importadas com sucesso!`);
      navigate('/setor-selection');
    } catch (error: any) {
      console.error('Erro ao importar dados:', error);
      toast.error('Erro ao importar os dados: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Importação de Metas</CardTitle>
          <CardDescription>
            Prêmio CNJ de Qualidade TJPB 2026
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isMockMode ? (
            <div className="border-2 border-dashed border-yellow-300 bg-yellow-50 rounded-lg p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
              <h3 className="font-semibold text-lg mb-2 text-yellow-900">Modo de Demonstração</h3>
              <p className="text-sm text-yellow-800 mb-4">
                A importação de dados está desabilitada no modo mock.
              </p>
              <p className="text-xs text-yellow-700">
                O sistema está usando dados fictícios para demonstração. Para importar dados reais, configure o arquivo .env com VITE_MOCK_MODE=false e as credenciais do Supabase.
              </p>
              <Button
                onClick={() => navigate('/setor-selection')}
                className="mt-6"
              >
                Visualizar Dados de Demonstração
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Arraste um arquivo ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos: CSV, XLSX
                </p>
              </label>
            </div>
          )}

          {file && showMapping && !isMockMode && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-medium">Mapeamento de Colunas</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione qual coluna da planilha corresponde a cada campo do sistema:
                  </p>
                </div>

                <div className="grid gap-4">
                  {Object.entries({
                    eixo: 'Eixo *',
                    item: 'Item *',
                    artigo: 'Artigo *',
                    requisito: 'Requisito *',
                    descricao: 'Descrição',
                    pontos_aplicaveis: 'Pontos Aplicáveis *',
                    setor_executor: 'Setor Executor',
                    coordenador: 'Coordenador',
                    deadline: 'Deadline *'
                  }).map(([field, label]) => (
                    <div key={field} className="grid gap-2">
                      <Label htmlFor={field} className="text-sm">
                        {label}
                      </Label>
                      <Select
                        value={columnMapping[field as keyof typeof columnMapping]}
                        onValueChange={(value) => setColumnMapping(prev => ({ ...prev, [field]: value }))}
                      >
                        <SelectTrigger id={field}>
                          <SelectValue placeholder="Selecione a coluna" />
                        </SelectTrigger>
                        <SelectContent>
                          {headers.map((header, idx) => (
                            <SelectItem key={`${header}-${idx}`} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900">
                    <p className="font-medium">Campos marcados com * são obrigatórios</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="deleteOldData"
                    checked={deleteOldData}
                    onChange={(e) => setDeleteOldData(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="deleteOldData" className="font-medium cursor-pointer">
                      Limpar dados antigos antes de importar
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Isso irá deletar permanentemente todas as metas e atualizações existentes no banco de dados antes de importar os novos dados.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleImport}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Importando...' : 'Importar Dados'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportPage;