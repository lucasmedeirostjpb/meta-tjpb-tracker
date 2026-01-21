import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Award, Building2 } from "lucide-react";
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
  setor_executor: string;
  coordenador?: string;
  deadline: string;
  status?: string;
  estimativa_cumprimento?: string;
}

interface MetaCardProps {
  meta: Meta;
  onClick: () => void;
}

const getEixoColor = (eixo: string) => {
  const eixoLower = eixo.toLowerCase();
  
  // Eixo 1: Governança - Azul
  if (eixoLower.includes('governança')) {
    return 'bg-blue-50 border-blue-500';
  }
  
  // Eixo 2: Produtividade - Verde
  if (eixoLower.includes('produtividade')) {
    return 'bg-green-50 border-green-500';
  }
  
  // Eixo 3: Transparência - Roxo/Purple
  if (eixoLower.includes('transparência') || eixoLower.includes('transparencia')) {
    return 'bg-purple-50 border-purple-500';
  }
  
  // Eixo 4: Dados e Tecnologia - Laranja
  if (eixoLower.includes('dados') || eixoLower.includes('tecnologia')) {
    return 'bg-orange-50 border-orange-500';
  }
  
  // Fallback para eixos não identificados
  return 'bg-gray-50 border-gray-400';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Concluído':
      return 'bg-green-500 text-white hover:bg-green-500 border-green-600';
    case 'Em Andamento':
      return 'bg-yellow-500 text-white hover:bg-yellow-500 border-yellow-600';
    case 'Parcialmente Cumprido':
      return 'bg-orange-500 text-white hover:bg-orange-500 border-orange-600';
    case 'Não Cumprido':
      return 'bg-red-500 text-white hover:bg-red-500 border-red-600';
    case 'Pendente':
      return 'bg-gray-500 text-white hover:bg-gray-500 border-gray-600';
    default:
      return 'bg-gray-500 text-white hover:bg-gray-500 border-gray-600';
  }
};

const getStatusLabel = (meta: Meta) => {
  // Se tem estimativa_cumprimento, usar ela para determinar o label
  if (meta.estimativa_cumprimento) {
    // Detectar requisitos nunca analisados ou "Não Cumprido" sem evidência = Pendente
    const temEvidencia = meta.link_evidencia && meta.link_evidencia.trim().length >= 5;
    
    if (meta.estimativa_cumprimento === 'Não se Aplica' && !temEvidencia) {
      return 'Pendente';
    }
    if (meta.estimativa_cumprimento === 'Não Cumprido' && !temEvidencia) {
      return 'Pendente';
    }
    if (meta.estimativa_cumprimento === 'Totalmente Cumprido') return 'Concluído';
    if (meta.estimativa_cumprimento === 'Parcialmente Cumprido') return 'Parcialmente Cumprido';
    if (meta.estimativa_cumprimento === 'Em Andamento') return 'Em Andamento';
    if (meta.estimativa_cumprimento === 'Não Cumprido') return 'Não Cumprido';
    if (meta.estimativa_cumprimento === 'Não se Aplica') return 'N/A';
  }
  // Fallback para o status direto
  return meta.status || 'Pendente';
};

const MetaCard = ({ meta, onClick }: MetaCardProps) => {
  const deadline = parseISO(meta.deadline);
  const daysUntilDeadline = differenceInDays(deadline, new Date());
  const isUrgent = daysUntilDeadline <= 30 && daysUntilDeadline >= 0;
  const statusLabel = getStatusLabel(meta);

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-l-4 ${getEixoColor(meta.eixo)}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
            <Building2 className="h-3 w-3 text-blue-600" />
            <span className="font-medium text-blue-700">{meta.setor_executor}</span>
          </div>
          <Badge className={getStatusColor(statusLabel)}>
            {statusLabel}
          </Badge>
        </div>
        <h3 className="font-semibold text-base line-clamp-2">{meta.requisito}</h3>
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