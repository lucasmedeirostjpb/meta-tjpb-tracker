import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Meta {
  id: string;
  eixo: string;
  item: string;
  artigo: string;
  requisito: string;
  descricao: string;
  pontos_aplicaveis: number;
  setor_executor: string;
  deadline: string;
  status?: string;
  link_evidencia?: string;
  observacoes?: string;
  update_id?: string;
}

interface MetaModalProps {
  meta: Meta | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const MetaModal = ({ meta, open, onClose, onUpdate }: MetaModalProps) => {
  const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true';
  const [status, setStatus] = useState<string>('Pendente');
  const [linkEvidencia, setLinkEvidencia] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (meta) {
      setStatus(meta.status || 'Pendente');
      setLinkEvidencia(meta.link_evidencia || '');
      setObservacoes(meta.observacoes || '');
    }
  }, [meta]);

  const handleSave = async () => {
    if (!meta) return;

    if (isMockMode) {
      toast.warning('Modo de demonstração: alterações não são salvas');
      onClose();
      return;
    }

    setSaving(true);
    try {
      if (meta.update_id) {
        const { error } = await supabase
          .from('updates')
          .update({
            status,
            link_evidencia: linkEvidencia,
            observacoes,
          })
          .eq('id', meta.update_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('updates')
          .insert({
            meta_id: meta.id,
            setor_executor: meta.setor_executor,
            status,
            link_evidencia: linkEvidencia,
            observacoes,
          });

        if (error) throw error;
      }

      toast.success('Atualização salva com sucesso!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar a atualização');
    } finally {
      setSaving(false);
    }
  };

  if (!meta) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{meta.artigo} - {meta.requisito}</DialogTitle>
          <DialogDescription>{meta.item}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Eixo</p>
              <p className="font-medium">{meta.eixo}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Pontos</p>
              <p className="font-medium">{meta.pontos_aplicaveis}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prazo</p>
              <p className="font-medium">
                {format(parseISO(meta.deadline), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Setor</p>
              <p className="font-medium">{meta.setor_executor}</p>
            </div>
          </div>

          {meta.descricao && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Descrição</p>
              <p className="text-sm">{meta.descricao}</p>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link de Evidência</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://..."
                value={linkEvidencia}
                onChange={(e) => setLinkEvidencia(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Adicione observações sobre o andamento..."
                rows={4}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          {isMockMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800">
                ⚠️ Modo de demonstração: as alterações não serão salvas
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : isMockMode ? 'Visualizar (não salva)' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MetaModal;