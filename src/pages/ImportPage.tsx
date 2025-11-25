import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MetaBase {
  eixo: string;
  item: string;
  subitem: string;
  descricao: string;
  pontos_aplicaveis: number;
  setor_executor: string;
  deadline: string;
}

const ImportPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<MetaBase[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    eixo: '',
    item: '',
    subitem: '',
    descricao: '',
    pontos_aplicaveis: '',
    setor_executor: '',
    deadline: ''
  });

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
          setHeaders(data[0] as string[]);
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
    const requiredFields = ['eixo', 'item', 'descricao', 'pontos_aplicaveis', 'deadline'];
    const missingFields = requiredFields.filter(field => !columnMapping[field as keyof typeof columnMapping]);
    
    if (missingFields.length > 0) {
      toast.error(`Campos obrigatórios não mapeados: ${missingFields.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const metas = jsonData.filter(row => row[columnMapping.eixo]).map(row => {
        let deadlineFormatted = '';
        const deadlineValue = row[columnMapping.deadline];
        
        if (deadlineValue) {
          if (typeof deadlineValue === 'number') {
            // Tratar data serial do Excel
            const date = XLSX.SSF.parse_date_code(deadlineValue);
            deadlineFormatted = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else if (typeof deadlineValue === 'string') {
            // Tratar formato de string (dd/mm/yyyy)
            const parts = deadlineValue.split('/');
            if (parts.length === 3) {
              deadlineFormatted = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        }

        return {
          eixo: row[columnMapping.eixo] || '',
          item: row[columnMapping.item] || '',
          subitem: row[columnMapping.subitem] || '',
          descricao: row[columnMapping.descricao] || '',
          pontos_aplicaveis: parseInt(row[columnMapping.pontos_aplicaveis] || '0'),
          setor_executor: row[columnMapping.setor_executor] || '',
          deadline: deadlineFormatted,
        };
      });

      const { error } = await supabase.from('metas_base').insert(metas);

      if (error) throw error;

      toast.success(`${metas.length} metas importadas com sucesso!`);
      navigate('/setor-selection');
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      toast.error('Erro ao importar os dados. Tente novamente.');
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

          {file && showMapping && (
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
                    subitem: 'Subitem/Requisito',
                    descricao: 'Descrição *',
                    pontos_aplicaveis: 'Pontos Aplicáveis *',
                    setor_executor: 'Setor Executor',
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
                          {headers.map(header => (
                            <SelectItem key={header} value={header}>
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