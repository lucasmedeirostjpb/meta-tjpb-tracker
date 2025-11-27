import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Award } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Meta {
  id: string;
  eixo: string;
  item: string;
  artigo: string;
  requisito: string;
  descricao: string;
  pontos_aplicaveis: number;
  deadline: string;
  status?: string;
}

interface MetaCardProps {
  meta: Meta;
  onClick: () => void;
}

const getEixoColor = (eixo: string) => {
  if (eixo.toLowerCase().includes('governança')) return 'bg-eixo-governanca-light border-eixo-governanca';
  if (eixo.toLowerCase().includes('produtividade')) return 'bg-eixo-produtividade-light border-eixo-produtividade';
  if (eixo.toLowerCase().includes('dados')) return 'bg-eixo-dados-light border-eixo-dados';
  if (eixo.toLowerCase().includes('transparência')) return 'bg-eixo-transparencia-light border-eixo-transparencia';
  return 'bg-muted border-border';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Concluído':
      return 'bg-status-concluido text-status-concluido-foreground';
    case 'Em Andamento':
      return 'bg-status-andamento text-status-andamento-foreground';
    default:
      return 'bg-status-pendente text-status-pendente-foreground';
  }
};

const MetaCard = ({ meta, onClick }: MetaCardProps) => {
  const deadline = parseISO(meta.deadline);
  const daysUntilDeadline = differenceInDays(deadline, new Date());
  const isUrgent = daysUntilDeadline <= 30 && daysUntilDeadline >= 0;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-l-4 ${getEixoColor(meta.eixo)}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base line-clamp-2">{meta.requisito}</h3>
          <Badge className={getStatusColor(meta.status || 'Pendente')}>
            {meta.status || 'Pendente'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{meta.artigo}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span className="font-medium">{meta.pontos_aplicaveis} pontos</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 text-sm ${isUrgent ? 'text-prazo-urgente font-medium' : 'text-muted-foreground'}`}>
          <Calendar className="h-4 w-4" />
          <span>
            {format(deadline, "dd/MM/yyyy", { locale: ptBR })}
            {isUrgent && ` (${daysUntilDeadline} dias)`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetaCard;