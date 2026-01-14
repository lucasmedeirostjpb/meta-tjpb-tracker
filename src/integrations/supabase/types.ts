export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AtividadeStatus = 'Concluída' | 'Em andamento' | 'Não iniciada';
export type Dificuldade = 'Sem dificuldades' | 'Alerta' | 'Situação crítica';

export interface Atividade {
  id: string;
  acao: string;
  responsavel: string;
  prazo: string;
  status: AtividadeStatus;
}

export interface Database {
  public: {
    Tables: {
      metas_base: {
        Row: {
          id: string
          linha_planilha: number | null
          eixo: string
          artigo: string
          requisito: string
          especificacao_requisito: string
          responsavel_cnj: string | null
          setor_executor: string
          coordenador: string | null
          prazo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          linha_planilha?: number | null
          eixo: string
          artigo: string
          requisito: string
          especificacao_requisito: string
          responsavel_cnj?: string | null
          setor_executor: string
          coordenador?: string | null
          prazo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          linha_planilha?: number | null
          eixo?: string
          artigo?: string
          requisito?: string
          especificacao_requisito?: string
          responsavel_cnj?: string | null
          setor_executor?: string
          coordenador?: string | null
          prazo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      updates: {
        Row: {
          id: string
          meta_id: string
          setor_executor: string
          status: string
          data_prestacao: string
          estimativa_cumprimento: string | null
          pontos_estimados: number | null
          percentual_cumprimento: number | null
          acoes_planejadas: string | null
          justificativa_parcial: string | null
          link_evidencia: string | null
          observacoes: string | null
          atividades: Atividade[] | null
          dificuldade: Dificuldade | null
          estimativa_maxima: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          meta_id: string
          setor_executor: string
          status: string
          data_prestacao?: string
          estimativa_cumprimento?: string | null
          pontos_estimados?: number | null
          percentual_cumprimento?: number | null
          acoes_planejadas?: string | null
          justificativa_parcial?: string | null
          link_evidencia?: string | null
          observacoes?: string | null
          atividades?: Atividade[] | null
          dificuldade?: Dificuldade | null
          estimativa_maxima?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          meta_id?: string
          setor_executor?: string
          status?: string
          data_prestacao?: string
          estimativa_cumprimento?: string | null
          pontos_estimados?: number | null
          percentual_cumprimento?: number | null
          acoes_planejadas?: string | null
          justificativa_parcial?: string | null
          link_evidencia?: string | null
          observacoes?: string | null
          atividades?: Atividade[] | null
          dificuldade?: Dificuldade | null
          estimativa_maxima?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      historico_alteracoes: {
        Row: {
          id: string
          meta_id: string
          usuario_email: string
          usuario_id: string
          acao: string
          status_anterior: string | null
          status_novo: string | null
          estimativa_cumprimento_anterior: string | null
          estimativa_cumprimento_novo: string | null
          pontos_estimados_anterior: number | null
          pontos_estimados_novo: number | null
          acoes_planejadas_anterior: string | null
          acoes_planejadas_novo: string | null
          justificativa_parcial_anterior: string | null
          justificativa_parcial_novo: string | null
          link_evidencia_anterior: string | null
          link_evidencia_novo: string | null
          observacoes_anterior: string | null
          observacoes_novo: string | null
          atividades_anterior: Atividade[] | null
          atividades_novo: Atividade[] | null
          dificuldade_anterior: Dificuldade | null
          dificuldade_novo: Dificuldade | null
          created_at: string
        }
        Insert: {
          id?: string
          meta_id: string
          usuario_email: string
          usuario_id: string
          acao: string
          status_anterior?: string | null
          status_novo?: string | null
          estimativa_cumprimento_anterior?: string | null
          estimativa_cumprimento_novo?: string | null
          pontos_estimados_anterior?: number | null
          pontos_estimados_novo?: number | null
          acoes_planejadas_anterior?: string | null
          acoes_planejadas_novo?: string | null
          justificativa_parcial_anterior?: string | null
          justificativa_parcial_novo?: string | null
          link_evidencia_anterior?: string | null
          link_evidencia_novo?: string | null
          observacoes_anterior?: string | null
          observacoes_novo?: string | null
          atividades_anterior?: Atividade[] | null
          atividades_novo?: Atividade[] | null
          dificuldade_anterior?: Dificuldade | null
          dificuldade_novo?: Dificuldade | null
          created_at?: string
        }
        Update: {
          id?: string
          meta_id?: string
          usuario_email?: string
          usuario_id?: string
          acao?: string
          status_anterior?: string | null
          status_novo?: string | null
          estimativa_cumprimento_anterior?: string | null
          estimativa_cumprimento_novo?: string | null
          pontos_estimados_anterior?: number | null
          pontos_estimados_novo?: number | null
          acoes_planejadas_anterior?: string | null
          acoes_planejadas_novo?: string | null
          justificativa_parcial_anterior?: string | null
          justificativa_parcial_novo?: string | null
          link_evidencia_anterior?: string | null
          link_evidencia_novo?: string | null
          observacoes_anterior?: string | null
          observacoes_novo?: string | null
          atividades_anterior?: Atividade[] | null
          atividades_novo?: Atividade[] | null
          dificuldade_anterior?: Dificuldade | null
          dificuldade_novo?: Dificuldade | null
          created_at?: string
        }
      }
      coordenadores_autorizados: {
        Row: {
          id: string
          nome: string
          email: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          email: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
