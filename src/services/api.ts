import { supabase } from '@/integrations/supabase/client';
import type { Database, Atividade, Dificuldade } from '@/integrations/supabase/types';

type UpdateData = {
  id: string;
  estimativa_cumprimento?: string | null;
  pontos_estimados?: number | null;
  percentual_cumprimento?: number | null;
  acoes_planejadas?: string | null;
  justificativa_parcial?: string | null;
  atividades?: Atividade[] | null;
  dificuldade?: Dificuldade | null;
  updated_at: string;
};

type Meta = Database['public']['Tables']['metas_base']['Row'] & {
  link_evidencia?: string;
  observacoes?: string;
  update_id?: string;
  estimativa_cumprimento?: string;
  pontos_estimados?: number;
  percentual_cumprimento?: number;
  acoes_planejadas?: string;
  justificativa_parcial?: string;
  atividades?: Atividade[];
  dificuldade?: Dificuldade;
  updates?: UpdateData[];
};

type MetaBase = {
  eixo: string;
  artigo: string;
  requisito: string;
};

type HistoricoItem = Database['public']['Tables']['historico_alteracoes']['Row'] & {
  meta?: MetaBase;
  metas_base?: MetaBase | MetaBase[] | null;
};

export const api = {
  // ==================== AUTENTICAÇÃO ====================
  
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { token: data.session?.access_token, user: data.user };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { user: session?.user || null };
  },

  // ==================== METAS ====================

  async getMetas(filters?: { setor?: string; coordenador?: string }): Promise<Meta[]> {
    console.log('🔍 [API] Iniciando busca de metas com filtros:', filters);

    try {
      // Primeira query: buscar metas_base
      let queryMetas = supabase
        .from('metas_base')
        .select('*')
        .order('linha_planilha', { ascending: true, nullsFirst: false })
        .order('eixo', { ascending: true })
        .order('artigo', { ascending: true })
        .order('requisito', { ascending: true });

      // Aplicar filtros
      if (filters?.setor) {
        queryMetas = queryMetas.eq('setor_executor', filters.setor);
      }
      if (filters?.coordenador) {
        queryMetas = queryMetas.eq('coordenador', filters.coordenador);
      }

      const { data: metasData, error: metasError } = await queryMetas;

      if (metasError) {
        console.error('❌ [API] Erro ao buscar metas_base:', metasError);
        throw metasError;
      }

      console.log(`✅ [API] ${metasData?.length || 0} metas encontradas`);

      if (!metasData || metasData.length === 0) {
        console.warn('⚠️ [API] Nenhuma meta encontrada no banco');
        return [];
      }

      // Segunda query: buscar updates
      const { data: updatesData, error: updatesError } = await supabase
        .from('updates')
        .select('*');

      if (updatesError) {
        console.error('⚠️ [API] Erro ao buscar updates (continuando sem eles):', updatesError);
      }

      console.log(`✅ [API] ${updatesData?.length || 0} updates encontrados`);

      // Mapear metas com seus updates
      const metasComUpdates = metasData.map(meta => {
        const update = updatesData?.find(u => u.meta_id === meta.id);
        
        if (update && update.atividades) {
          console.log(`📋 [API] Meta ${meta.requisito.substring(0, 30)}... tem ${update.atividades.length} atividades`);
        }
        
        return {
          ...meta,
          link_evidencia: update?.link_evidencia || '',
          observacoes: update?.observacoes || '',
          update_id: update?.id,
          estimativa_cumprimento: update?.estimativa_cumprimento || 'Não se Aplica',
          pontos_estimados: update?.pontos_estimados || 0,
          percentual_cumprimento: update?.percentual_cumprimento || 0,
          acoes_planejadas: update?.acoes_planejadas || '',
          justificativa_parcial: update?.justificativa_parcial || '',
          atividades: update?.atividades || [],
          dificuldade: update?.dificuldade || 'Sem dificuldades',
        };
      });

      console.log('✅ [API] Metas processadas com sucesso:', metasComUpdates.length);
      return metasComUpdates;

    } catch (error) {
      console.error('❌ [API] Erro geral ao buscar metas:', error);
      throw error;
    }
  },

  async createMetas(metas: Array<Omit<Database['public']['Tables']['metas_base']['Insert'], 'id'> & { pontos_recebidos?: number }>) {
    console.log('📝 [API] Criando metas:', metas.length);
    
    // Separar pontos_recebidos dos dados de metas_base
    const metasBase = metas.map(({ pontos_recebidos, ...meta }) => meta);
    
    const { data: metasData, error } = await supabase
      .from('metas_base')
      .insert(metasBase)
      .select();

    if (error) {
      console.error('❌ [API] Erro ao criar metas:', error);
      throw error;
    }

    console.log('✅ [API] Metas criadas com sucesso');

    // Criar updates automaticamente para metas com pontos_recebidos
    if (metasData && metasData.length > 0) {
      const updatesData = [];
      
      for (let i = 0; i < metasData.length; i++) {
        const meta = metasData[i];
        const pontosRecebidos = metas[i].pontos_recebidos;

        // Se há pontos recebidos informados, criar update
        if (pontosRecebidos !== undefined && pontosRecebidos !== null && !isNaN(pontosRecebidos)) {
          const pontosAplicaveis = meta.pontos_aplicaveis || 0;
          const percentual = pontosAplicaveis > 0 ? (pontosRecebidos / pontosAplicaveis) * 100 : 0;

          // Determinar estimativa
          let estimativa: string;

          if (percentual >= 100) {
            estimativa = 'Totalmente Cumprido';
          } else if (percentual > 0) {
            estimativa = 'Parcialmente Cumprido';
          } else {
            estimativa = 'Não Cumprido';
          }

          updatesData.push({
            meta_id: meta.id,
            setor_executor: meta.setor_executor,
            estimativa_cumprimento: estimativa,
            pontos_estimados: pontosRecebidos,
            percentual_cumprimento: Math.min(percentual, 100),
            data_prestacao: new Date().toISOString(),
          });
        }
      }

      // Inserir updates se houver
      if (updatesData.length > 0) {
        const { error: updatesError } = await supabase
          .from('updates')
          .insert(updatesData);

        if (updatesError) {
          console.warn('⚠️ Erro ao criar updates automáticos:', updatesError);
        } else {
          console.log(`✅ ${updatesData.length} updates criados automaticamente com pontos já alcançados`);
        }
      }
    }
  },

  async deleteAllMetas() {
    console.log('🗑️ [API] Deletando todas as metas...');
    
    const { error } = await supabase
      .from('metas_base')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos

    if (error) {
      console.error('❌ [API] Erro ao deletar metas:', error);
      throw error;
    }

    console.log('✅ [API] Todas as metas foram deletadas');
  },

  // ==================== UPDATES (PRESTAÇÃO DE CONTAS) ====================

  async createUpdate(updateData: {
    meta_id: string;
    setor_executor: string;
    estimativa_cumprimento?: string;
    pontos_estimados?: number;
    percentual_cumprimento?: number;
    acoes_planejadas?: string;
    justificativa_parcial?: string;
    link_evidencia?: string;
    observacoes?: string;
    atividades?: Atividade[];
    dificuldade?: Dificuldade;
  }) {
    console.log('💾 [API] Salvando update para meta:', updateData.meta_id);
    console.log('📋 [API] Atividades recebidas:', {
      count: updateData.atividades?.length || 0,
      atividades: updateData.atividades
    });

    // Verificar se já existe um update para esta meta
    const { data: existing } = await supabase
      .from('updates')
      .select('id')
      .eq('meta_id', updateData.meta_id)
      .maybeSingle();

    if (existing) {
      console.log('📝 [API] Update existente encontrado, atualizando...');
      
      // Atualizar update existente
      const { error } = await supabase
        .from('updates')
        .update({
          setor_executor: updateData.setor_executor,
          estimativa_cumprimento: updateData.estimativa_cumprimento,
          pontos_estimados: updateData.pontos_estimados,
          percentual_cumprimento: updateData.percentual_cumprimento,
          acoes_planejadas: updateData.acoes_planejadas,
          justificativa_parcial: updateData.justificativa_parcial,
          link_evidencia: updateData.link_evidencia,
          observacoes: updateData.observacoes,
          atividades: updateData.atividades,
          dificuldade: updateData.dificuldade,
          data_prestacao: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('❌ [API] Erro ao atualizar update:', error);
        throw error;
      }

      console.log('✅ [API] Update atualizado com sucesso (incluindo atividades)');
    } else {
      console.log('➕ [API] Criando novo update...');
      
      // Criar novo update
      const { error } = await supabase
        .from('updates')
        .insert({
          meta_id: updateData.meta_id,
          setor_executor: updateData.setor_executor,
          estimativa_cumprimento: updateData.estimativa_cumprimento,
          pontos_estimados: updateData.pontos_estimados,
          percentual_cumprimento: updateData.percentual_cumprimento,
          acoes_planejadas: updateData.acoes_planejadas,
          justificativa_parcial: updateData.justificativa_parcial,
          link_evidencia: updateData.link_evidencia,
          observacoes: updateData.observacoes,
          atividades: updateData.atividades,
          dificuldade: updateData.dificuldade,
          data_prestacao: new Date().toISOString(),
        });

      if (error) {
        console.error('❌ [API] Erro ao criar update:', error);
        throw error;
      }

      console.log('✅ [API] Update criado com sucesso (incluindo atividades)');
    }
  },

  // ==================== DADOS AUXILIARES ====================

  async getSetores(): Promise<string[]> {
    console.log('📋 [API] Buscando lista de setores...');
    
    const { data, error } = await supabase
      .from('metas_base')
      .select('setor_executor')
      .not('setor_executor', 'is', null)
      .order('setor_executor');

    if (error) {
      console.error('❌ [API] Erro ao buscar setores:', error);
      throw error;
    }

    // Retornar lista única de setores
    const setores = [...new Set(data?.map(m => m.setor_executor).filter(Boolean) || [])];
    console.log(`✅ [API] ${setores.length} setores encontrados:`, setores);
    return setores.sort();
  },

  async getCoordenadores(): Promise<string[]> {
    console.log('👥 [API] Buscando lista de coordenadores...');
    
    const { data, error } = await supabase
      .from('metas_base')
      .select('coordenador')
      .not('coordenador', 'is', null)
      .order('coordenador');

    if (error) {
      console.error('❌ [API] Erro ao buscar coordenadores:', error);
      throw error;
    }

    // Retornar lista única de coordenadores
    const coordenadores = [...new Set(data?.map(m => m.coordenador).filter(Boolean) || [])];
    console.log(`✅ [API] ${coordenadores.length} coordenadores encontrados:`, coordenadores);
    return coordenadores.sort();
  },

  // ==================== HISTÓRICO ====================
  // Reescrito em 2026-01-12 - Incluir setor_executor e coordenador

  async getHistorico(limit = 100): Promise<HistoricoItem[]> {
    console.log(`📜 [API] Buscando histórico (limite: ${limit})`);
    
    const { data, error } = await supabase
      .from('historico_alteracoes')
      .select(`
        *,
        metas_base (
          eixo,
          artigo,
          requisito,
          setor_executor,
          coordenador
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ [API] Erro ao buscar histórico:', error);
      throw error;
    }

    console.log(`✅ [API] ${data?.length || 0} registros de histórico encontrados`);

    return (data || []).map(item => ({
      ...item,
      meta: item.metas_base ? {
        eixo: item.metas_base.eixo,
        artigo: item.metas_base.artigo,
        requisito: item.metas_base.requisito,
        setor_executor: item.metas_base.setor_executor,
        coordenador: item.metas_base.coordenador,
      } : undefined,
    }));
  },

  async getHistoricoByMeta(metaId: string): Promise<HistoricoItem[]> {
    console.log(`📜 [API] Buscando histórico da meta: ${metaId}`);
    
    const { data, error } = await supabase
      .from('historico_alteracoes')
      .select(`
        *,
        metas_base (
          eixo,
          artigo,
          requisito,
          setor_executor,
          coordenador
        )
      `)
      .eq('meta_id', metaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [API] Erro ao buscar histórico da meta:', error);
      throw error;
    }

    console.log(`✅ [API] ${data?.length || 0} registros de histórico encontrados para a meta`);
    
    return (data || []).map(item => ({
      ...item,
      meta: item.metas_base ? {
        eixo: item.metas_base.eixo,
        artigo: item.metas_base.artigo,
        requisito: item.metas_base.requisito,
        setor_executor: item.metas_base.setor_executor,
        coordenador: item.metas_base.coordenador,
      } : undefined,
    }));
  },

  // ==================== ESTATÍSTICAS ====================

  async getStats() {
    console.log('📊 [API] Calculando estatísticas...');

    try {
      // Buscar metas e updates separadamente (mesmo padrão de getMetas)
      const { data: metasData, error: metasError } = await supabase
        .from('metas_base')
        .select('*');

      if (metasError) {
        console.error('❌ [API] Erro ao buscar metas_base:', metasError);
        throw metasError;
      }

      const { data: updatesData, error: updatesError } = await supabase
        .from('updates')
        .select('*');

      if (updatesError) {
        console.error('⚠️ [API] Erro ao buscar updates (continuando sem eles):', updatesError);
      }

      console.log(`✅ [API] ${metasData?.length || 0} metas encontradas`);
      console.log(`✅ [API] ${updatesData?.length || 0} updates encontrados`);

      // Função para determinar cor do eixo
      const getEixoCor = (eixo: string): string => {
        const eixoLower = eixo.toLowerCase();
        if (eixoLower.includes('governança') || eixoLower.includes('governanca')) return 'blue';
        if (eixoLower.includes('produtividade')) return 'green';
        if (eixoLower.includes('transparência') || eixoLower.includes('transparencia')) return 'purple';
        if (eixoLower.includes('dados') || eixoLower.includes('tecnologia')) return 'orange';
        return 'gray';
      };

      // Agrupar por eixo
      const eixosMap = new Map<string, { 
        pontos: number; 
        pontosRecebidos: number; 
        total: number;
      }>();
      const setoresSet = new Set<string>();
      let totalRequisitos = 0;
      let totalPontos = 0;

      (metasData || []).forEach(meta => {
        totalRequisitos++;
        setoresSet.add(meta.setor_executor);

        // Buscar update correspondente
        const update = updatesData?.find(u => u.meta_id === meta.id);

        // Agregar por eixo
        const eixoData = eixosMap.get(meta.eixo) || { 
          pontos: 0, 
          pontosRecebidos: 0,
          total: 0
        };
        
        const pontosMeta = meta.pontos_aplicaveis || 10;
        eixoData.pontos += pontosMeta;
        eixoData.total++;

        // Calcular pontos recebidos usando pontos_estimados do update
        if (update) {
          const pontosRecebidos = update.pontos_estimados || 0;
          eixoData.pontosRecebidos += pontosRecebidos;
          totalPontos += pontosRecebidos;
          
          console.log(`📈 [API] Meta ${meta.artigo} ${meta.requisito}: ${pontosRecebidos}/${pontosMeta} pontos (${update.status})`);
        }

        eixosMap.set(meta.eixo, eixoData);
      });

      // Converter map para array com formato esperado pela página
      const eixosData = Array.from(eixosMap.entries()).map(([nome, dados]) => ({
        nome,
        pontos: dados.pontos,
        pontosRecebidos: dados.pontosRecebidos,
        percentual: dados.pontos > 0 ? (dados.pontosRecebidos / dados.pontos) * 100 : 0,
        cor: getEixoCor(nome),
      }));

      const totalPontosAplicaveis = metasData?.reduce((sum, m) => sum + (m.pontos_aplicaveis || 0), 0) || 0;
      const percentualGeral = totalPontosAplicaveis > 0 ? (totalPontos / totalPontosAplicaveis) * 100 : 0;

      const stats = {
        eixos: eixosMap.size,
        requisitos: totalRequisitos,
        pontosTotais: Math.round(totalPontos),
        pontosAplicaveis: totalPontosAplicaveis,
        percentualGeral: percentualGeral,
        setores: setoresSet.size,
        eixosData,
      };

      console.log('✅ [API] Estatísticas calculadas:', stats);
      return stats;

    } catch (error) {
      console.error('❌ [API] Erro ao calcular estatísticas:', error);
      throw error;
    }
  },

  // ==================== COORDENADORES AUTORIZADOS ====================

  async getCoordenadoresAutorizados(): Promise<Database['public']['Tables']['coordenadores_autorizados']['Row'][]> {
    console.log('👥 [API] Buscando coordenadores autorizados...');
    
    const { data, error } = await supabase
      .from('coordenadores_autorizados')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('❌ [API] Erro ao buscar coordenadores autorizados:', error);
      throw error;
    }

    console.log(`✅ [API] ${data?.length || 0} coordenadores autorizados encontrados`);
    return data || [];
  },

  async isEmailAutorizado(email: string): Promise<boolean> {
    console.log('🔍 [API] Verificando se email está autorizado:', email);
    
    const { data, error } = await supabase
      .from('coordenadores_autorizados')
      .select('email')
      .eq('email', email.toLowerCase())
      .eq('ativo', true)
      .maybeSingle();

    if (error) {
      console.error('❌ [API] Erro ao verificar email:', error);
      throw error;
    }

    const isAutorizado = !!data;
    console.log(isAutorizado ? '✅ [API] Email autorizado' : '❌ [API] Email não autorizado');
    return isAutorizado;
  },

  async getCoordenadorByEmail(email: string): Promise<Database['public']['Tables']['coordenadores_autorizados']['Row'] | null> {
    console.log('🔍 [API] Buscando coordenador por email:', email);
    
    const { data, error } = await supabase
      .from('coordenadores_autorizados')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('ativo', true)
      .maybeSingle();

    if (error) {
      console.error('❌ [API] Erro ao buscar coordenador:', error);
      throw error;
    }

    if (!data) {
      console.log('❌ [API] Coordenador não encontrado');
      return null;
    }

    console.log('✅ [API] Coordenador encontrado:', data.nome);
    return data;
  },

  async createCoordenadoresAutorizados(coordenadores: Array<{ nome: string; email: string }>) {
    console.log('📝 [API] Criando/atualizando coordenadores autorizados:', coordenadores.length);

    try {
      // Usar UPSERT para inserir ou atualizar se email já existir
      const { data, error } = await supabase
        .from('coordenadores_autorizados')
        .upsert(
          coordenadores.map(c => ({
            email: c.email.toLowerCase(), // Email é a chave única
            nome: c.nome,
            ativo: true,
          })),
          { 
            onConflict: 'email', // Se email já existe, atualiza
            ignoreDuplicates: false // Atualiza os dados existentes
          }
        )
        .select();

      if (error) throw error;

      console.log(`✅ [API] ${data?.length || 0} coordenadores autorizados criados/atualizados`);
      return data;
    } catch (error) {
      console.error('❌ [API] Erro ao criar coordenadores autorizados:', error);
      throw error;
    }
  },

  async deleteAllCoordenadoresAutorizados() {
    console.log('🗑️ [API] Deletando todos os coordenadores autorizados...');

    const { error } = await supabase
      .from('coordenadores_autorizados')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos

    if (error) {
      console.error('❌ [API] Erro ao deletar coordenadores autorizados:', error);
      throw error;
    }

    console.log('✅ [API] Todos os coordenadores autorizados foram deletados');
  },
};
