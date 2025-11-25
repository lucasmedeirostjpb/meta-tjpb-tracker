import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const parsedData: MetaBase[] = jsonData.map(row => ({
        eixo: row.Eixo || row.eixo || '',
        item: row.Item || row.item || '',
        subitem: row.Subitem || row.subitem || '',
        descricao: row.Descricao || row.descricao || '',
        pontos_aplicaveis: parseInt(row.PontosAplicaveis || row.pontos_aplicaveis || '0'),
        setor_executor: row.SetorExecutor || row.setor_executor || '',
        deadline: row.Deadline || row.deadline || '',
      }));

      setPreview(parsedData.slice(0, 5));
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast.error('Erro ao processar o arquivo. Verifique o formato.');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const metas = jsonData.map(row => {
        const deadlineStr = row.Deadline || row.deadline || '';
        let deadlineFormatted = '';
        
        if (deadlineStr) {
          const parts = deadlineStr.split('/');
          if (parts.length === 3) {
            deadlineFormatted = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }

        return {
          eixo: row.Eixo || row.eixo || '',
          item: row.Item || row.item || '',
          subitem: row.Subitem || row.subitem || '',
          descricao: row.Descricao || row.descricao || '',
          pontos_aplicaveis: parseInt(row.PontosAplicaveis || row.pontos_aplicaveis || '0'),
          setor_executor: row.SetorExecutor || row.setor_executor || '',
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

          {file && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Prévia dos dados:</p>
                  <div className="bg-muted p-3 rounded-lg text-xs">
                    <p>{preview.length} registro(s) detectado(s)</p>
                    <p className="mt-1 text-muted-foreground">
                      Primeiro registro: {preview[0]?.subitem || 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900">
              <p className="font-medium mb-1">Colunas obrigatórias:</p>
              <p>Eixo, Item, Subitem, Descricao, PontosAplicaveis, SetorExecutor, Deadline</p>
            </div>
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Importando...' : 'Salvar Dados'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportPage;