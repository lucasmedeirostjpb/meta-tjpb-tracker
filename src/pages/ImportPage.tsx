import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle, Check, Users } from "lucide-react";
import { api } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  
  // Estados para importação de metas
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
    pontos_recebidos: '',
    setor_executor: '',
    coordenador: '',
    deadline: '',
    status: '',
    performance: '',
    acoes_legado: '',
    atividade_1: '',
    atividade_2: '',
    atividade_3: '',
    atividade_4: '',
    atividade_5: '',
    justificativa_parcial: '',
    observacoes: ''
  });

  // Estados para importação de coordenadores
  const [coordenadoresFile, setCoordenadoresFile] = useState<File | null>(null);
  const [coordenadoresLoading, setCoordenadoresLoading] = useState(false);
  const [coordenadoresHeaders, setCoordenadoresHeaders] = useState<string[]>([]);
  const [showCoordenadoresMapping, setShowCoordenadoresMapping] = useState(false);
  const [deleteCoordenadoresOldData, setDeleteCoordenadoresOldData] = useState(false);
  const [coordenadoresMapping, setCoordenadoresMapping] = useState({
    nome: '',
    email: ''
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
      pontos_recebidos: '',
      setor_executor: '',
      coordenador: '',
      deadline: '',
      status: '',
      performance: '',
      acoes_legado: '',
      atividade_1: '',
      atividade_2: '',
      atividade_3: '',
      atividade_4: '',
      atividade_5: '',
      justificativa_parcial: '',
      observacoes: ''
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
      // Mapeamento de Pontos Recebidos/Alcançados
      else if (
        (headerLower.includes('ponto') && (headerLower.includes('receb') || headerLower.includes('alcan') || headerLower.includes('conquist') || headerLower.includes('obtido') || headerLower.includes('atingido'))) ||
        headerLower.includes('pontos obtidos') ||
        headerLower.includes('pontos atingidos')
      ) {
        mapping.pontos_recebidos = header;
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
      // Mapeamento de Status/Estimativa
      else if (headerLower === 'status' || headerLower.includes('estimativa')) {
        mapping.status = header;
      }
      // Mapeamento de Performance
      else if (headerLower === 'performance' || (headerLower.includes('percentual') && headerLower.includes('cumprimento'))) {
        mapping.performance = header;
      }
      // Mapeamento de Ações - Legado
      else if ((headerLower.includes('aç') || headerLower.includes('ac')) && headerLower.includes('legado')) {
        mapping.acoes_legado = header;
      }
      // Mapeamento de Atividades 1-5
      else if (headerLower.includes('atividade 1') || headerLower === 'atividade 1') {
        mapping.atividade_1 = header;
      }
      else if (headerLower.includes('atividade 2') || headerLower === 'atividade 2') {
        mapping.atividade_2 = header;
      }
      else if (headerLower.includes('atividade 3') || headerLower === 'atividade 3') {
        mapping.atividade_3 = header;
      }
      else if (headerLower.includes('atividade 4') || headerLower === 'atividade 4') {
        mapping.atividade_4 = header;
      }
      else if (headerLower.includes('atividade 5') || headerLower === 'atividade 5') {
        mapping.atividade_5 = header;
      }
      // Mapeamento de Justificativa para Parcial
      else if (headerLower.includes('justificativa')) {
        mapping.justificativa_parcial = header;
      }
      // Mapeamento de Observações
      else if (headerLower.includes('observaç') || headerLower.includes('observac')) {
        mapping.observacoes = header;
      }
    });

    return mapping;
  };

  // Função para mapear valores de status
  const mapearStatus = (statusOriginal: string): string => {
    if (!statusOriginal) return '';
    
    const statusLower = statusOriginal.toLowerCase().trim();
    
    // Mapeamento de variações comuns
    const mapeamento: { [key: string]: string } = {
      'cumprido': 'Totalmente Cumprido',
      'totalmente cumprido': 'Totalmente Cumprido',
      'total': 'Totalmente Cumprido',
      '100%': 'Totalmente Cumprido',
      'completo': 'Totalmente Cumprido',
      'concluído': 'Totalmente Cumprido',
      'concluido': 'Totalmente Cumprido',
      'finalizado': 'Totalmente Cumprido',
      
      'parcial': 'Parcialmente Cumprido',
      'parcialmente': 'Parcialmente Cumprido',
      'parcialmente cumprido': 'Parcialmente Cumprido',
      
      'em andamento': 'Em Andamento',
      'andamento': 'Em Andamento',
      'progresso': 'Em Andamento',
      'em progresso': 'Em Andamento',
      
      'não cumprido': 'Não Cumprido',
      'nao cumprido': 'Não Cumprido',
      'não iniciado': 'Não Cumprido',
      'nao iniciado': 'Não Cumprido',
      'pendente': 'Não Cumprido',
      'não': 'Não Cumprido',
      'nao': 'Não Cumprido',
      '0%': 'Não Cumprido',
      'zero': 'Não Cumprido'
    };
    
    // Buscar correspondência no mapeamento
    if (mapeamento[statusLower]) {
      return mapeamento[statusLower];
    }
    
    // Se não encontrou, retornar o original (será tratado como valor válido se já estiver no formato correto)
    return statusOriginal.trim();
  };

  // Função para parsear atividade do formato CSV
  const parseAtividadeFromCSV = (atividadeTexto: string, index: number): any | null => {
    if (!atividadeTexto || atividadeTexto.trim() === '' || atividadeTexto === '-') {
      return null;
    }

    try {
      // Formato: "Ação | Resp: Responsável | Prazo: dd/MM/yyyy | Status: status | Andamento: descrição"
      const parts = atividadeTexto.split('|').map(p => p.trim());
      
      const acao = parts[0] || '';
      const responsavel = parts[1]?.replace('Resp:', '').trim() || '';
      const prazoStr = parts[2]?.replace('Prazo:', '').trim() || '';
      const status = parts[3]?.replace('Status:', '').trim() || 'Não iniciada';
      const andamento = parts[4]?.replace('Andamento:', '').trim() || '';

      // Converter prazo de dd/MM/yyyy para yyyy-MM-dd
      let prazo = '';
      if (prazoStr && prazoStr !== 'Sem prazo') {
        const prazoparts = prazoStr.split('/');
        if (prazoparts.length === 3) {
          prazo = `${prazoparts[2]}-${prazoparts[1]}-${prazoparts[0]}`;
        }
      }

      return {
        id: `atividade-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        acao,
        responsavel,
        prazo,
        status: status as any,
        andamento
      };
    } catch (error) {
      console.warn(`⚠️ Erro ao parsear atividade ${index + 1}:`, error);
      return null;
    }
  };

  // Funções para importação de coordenadores
  const handleCoordenadoresFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setCoordenadoresFile(selectedFile);
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { 
          type: 'array',
          codepage: 65001,
          raw: false,
          defval: ''
        });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
        
        if (data.length > 0) {
          const rawHeaders = (data[0] as string[]).map((h, idx) => {
            const header = String(h || '').trim();
            return header || `Coluna_${idx + 1}`;
          });
          
          const uniqueHeaders = rawHeaders.map((header, idx) => {
            const count = rawHeaders.slice(0, idx).filter(h => h === header).length;
            return count > 0 ? `${header}_${count + 1}` : header;
          });
          
          setCoordenadoresHeaders(uniqueHeaders);
          
          // Mapeamento automático
          const autoMapping = {
            nome: '',
            email: ''
          };

          uniqueHeaders.forEach(header => {
            const headerLower = header.toLowerCase().trim();
            if (headerLower.includes('nome') || headerLower === 'coordenador') {
              autoMapping.nome = header;
            } else if (headerLower.includes('email') || headerLower.includes('e-mail')) {
              autoMapping.email = header;
            }
          });

          setCoordenadoresMapping(autoMapping);
          setShowCoordenadoresMapping(true);
        }
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        toast.error('Erro ao ler arquivo. Verifique o formato.');
      }
    }
  };

  const handleCoordenadoresImport = async () => {
    if (!coordenadoresFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    // Validar mapeamento
    if (!coordenadoresMapping.nome || !coordenadoresMapping.email) {
      toast.error('Por favor, mapeie os campos Nome e Email');
      return;
    }

    setCoordenadoresLoading(true);
    try {
      const data = await coordenadoresFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Processar e validar dados
      const coordenadores = jsonData
        .filter(row => row[coordenadoresMapping.nome] && row[coordenadoresMapping.email])
        .map(row => ({
          nome: String(row[coordenadoresMapping.nome] || '').trim(),
          email: String(row[coordenadoresMapping.email] || '').trim().toLowerCase(),
        }))
        .filter(c => c.nome && c.email); // Filtrar vazios após trim

      if (coordenadores.length === 0) {
        toast.error('Nenhum coordenador válido encontrado no arquivo');
        return;
      }

      // Verificar duplicatas na planilha
      const emailsUnicos = new Set<string>();
      const duplicatasNaPlanilha: string[] = [];
      coordenadores.forEach(c => {
        if (emailsUnicos.has(c.email)) {
          duplicatasNaPlanilha.push(c.email);
        } else {
          emailsUnicos.add(c.email);
        }
      });

      if (duplicatasNaPlanilha.length > 0) {
        console.warn('⚠️ Duplicatas na planilha:', duplicatasNaPlanilha);
        toast.warning(`⚠️ ${duplicatasNaPlanilha.length} email(s) duplicado(s) na planilha. Apenas a última ocorrência será mantida.`);
      }

      // Remover duplicatas mantendo a última ocorrência
      const coordenadoresUnicos = Array.from(
        coordenadores.reduce((map, c) => {
          map.set(c.email, c); // Sobrescreve se já existir
          return map;
        }, new Map<string, { nome: string; email: string }>()).values()
      );

      console.log(`📊 Total de coordenadores únicos: ${coordenadoresUnicos.length}`);

      // Deletar dados antigos se a opção estiver marcada
      if (deleteCoordenadoresOldData) {
        console.log('🗑️ Deletando lista anterior...');
        await api.deleteAllCoordenadoresAutorizados();
        toast.success('Lista anterior removida');
      }

      // Importar coordenadores
      console.log('📤 Importando coordenadores...');
      await api.createCoordenadoresAutorizados(coordenadoresUnicos);

      toast.success(`✅ ${coordenadoresUnicos.length} coordenador(es) importado(s)/atualizado(s) com sucesso!`);
      
      // Limpar formulário
      setCoordenadoresFile(null);
      setShowCoordenadoresMapping(false);
      
    } catch (error: any) {
      console.error('❌ Erro ao importar coordenadores:', error);
      
      // Mensagem mais amigável baseada no tipo de erro
      if (error.code === '23505') {
        toast.error('❌ Erro de duplicata. Marque "Substituir lista existente" e tente novamente.');
      } else if (error.message) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error('Erro desconhecido ao importar coordenadores');
      }
    } finally {
      setCoordenadoresLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Extrair headers do arquivo com encoding UTF-8
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { 
          type: 'array',
          codepage: 65001,
          raw: false,
          defval: ''
        });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
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
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        toast.error('Erro ao ler arquivo. Verifique o formato.');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    // Validar mapeamento
    const requiredFields = ['eixo', 'item', 'artigo', 'requisito', 'pontos_aplicaveis', 'deadline'];
    const missingFields = requiredFields.filter(field => !columnMapping[field as keyof typeof columnMapping] || columnMapping[field as keyof typeof columnMapping] === '__none__');
    
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
      
      // Detectar separador do arquivo com UTF-8
      const text = new TextDecoder('utf-8').decode(data.slice(0, 1000));
      const firstLine = text.split('\n')[0];
      const hasSemicolon = firstLine.includes(';');
      const separator = hasSemicolon ? ';' : ',';
      
      console.log(`📊 Separador detectado: ${separator === ';' ? 'ponto e vírgula' : 'vírgula'}`);
      
      const workbook = XLSX.read(data, {
        raw: false,
        type: 'array',
        codepage: 65001, // UTF-8
        FS: separator
      });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: ''
      }) as any[];

      console.log(`📦 ${jsonData.length} linhas detectadas`);

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

        // Processar pontos recebidos se fornecido
        let pontos_recebidos: number | undefined;
        if (columnMapping.pontos_recebidos && columnMapping.pontos_recebidos !== '__none__' && row[columnMapping.pontos_recebidos] !== undefined && row[columnMapping.pontos_recebidos] !== null && row[columnMapping.pontos_recebidos] !== '') {
          const valorStr = String(row[columnMapping.pontos_recebidos]).replace(',', '.');
          pontos_recebidos = parseFloat(valorStr);
          
          if (isNaN(pontos_recebidos)) {
            pontos_recebidos = undefined;
          }
        }

        // Processar pontos aplicáveis
        let pontosAplicaveis = 0;
        if (columnMapping.pontos_aplicaveis && columnMapping.pontos_aplicaveis !== '__none__' && row[columnMapping.pontos_aplicaveis]) {
          const valorStr = String(row[columnMapping.pontos_aplicaveis]).replace(',', '.');
          pontosAplicaveis = parseInt(valorStr) || 0;
        }

        return {
          eixo: String(row[columnMapping.eixo] || '').trim(),
          item: String(row[columnMapping.item] || '').trim(),
          artigo: String(row[columnMapping.artigo] || '').trim(),
          requisito: String(row[columnMapping.requisito] || '').trim(),
          descricao: (columnMapping.descricao && columnMapping.descricao !== '__none__') ? String(row[columnMapping.descricao] || '').trim() : '',
          pontos_aplicaveis: pontosAplicaveis,
          setor_executor: (columnMapping.setor_executor && columnMapping.setor_executor !== '__none__') ? String(row[columnMapping.setor_executor] || '').trim() : '',
          coordenador: (columnMapping.coordenador && columnMapping.coordenador !== '__none__') ? String(row[columnMapping.coordenador] || '').trim() : '',
          deadline: deadlineFormatted,
          linha_planilha: index + 2,
          pontos_recebidos,
          // Dados adicionais para criar update
          _updateData: {
            status: (columnMapping.status && columnMapping.status !== '__none__') ? mapearStatus(String(row[columnMapping.status] || '').trim()) : '',
            performance: (columnMapping.performance && columnMapping.performance !== '__none__' && row[columnMapping.performance]) ? parseFloat(String(row[columnMapping.performance]).replace(',', '.').replace('%', '')) : undefined,
            acoes_planejadas: (columnMapping.acoes_legado && columnMapping.acoes_legado !== '__none__') ? String(row[columnMapping.acoes_legado] || '').trim() : '',
            justificativa_parcial: (columnMapping.justificativa_parcial && columnMapping.justificativa_parcial !== '__none__') ? String(row[columnMapping.justificativa_parcial] || '').trim() : '',
            observacoes: (columnMapping.observacoes && columnMapping.observacoes !== '__none__') ? String(row[columnMapping.observacoes] || '').trim() : '',
            atividades: [
              (columnMapping.atividade_1 && columnMapping.atividade_1 !== '__none__') ? parseAtividadeFromCSV(String(row[columnMapping.atividade_1] || ''), 0) : null,
              (columnMapping.atividade_2 && columnMapping.atividade_2 !== '__none__') ? parseAtividadeFromCSV(String(row[columnMapping.atividade_2] || ''), 1) : null,
              (columnMapping.atividade_3 && columnMapping.atividade_3 !== '__none__') ? parseAtividadeFromCSV(String(row[columnMapping.atividade_3] || ''), 2) : null,
              (columnMapping.atividade_4 && columnMapping.atividade_4 !== '__none__') ? parseAtividadeFromCSV(String(row[columnMapping.atividade_4] || ''), 3) : null,
              (columnMapping.atividade_5 && columnMapping.atividade_5 !== '__none__') ? parseAtividadeFromCSV(String(row[columnMapping.atividade_5] || ''), 4) : null,
            ].filter(Boolean)
          }
        };
      });

      console.log(`✅ ${metas.length} metas processadas`);

      // Separar _updateData antes de enviar para o banco
      const metasParaInserir = metas.map(({ _updateData, ...meta }) => meta);
      
      await api.createMetas(metasParaInserir);
      
      // Criar updates se houver dados adicionais
      const metasComUpdate = metas.filter(m => 
        m._updateData.status || 
        m._updateData.acoes_planejadas || 
        m._updateData.justificativa_parcial || 
        m._updateData.observacoes || 
        m._updateData.atividades.length > 0
      );
      
      if (metasComUpdate.length > 0) {
        console.log(`📋 Criando updates para ${metasComUpdate.length} metas...`);
        
        // Buscar apenas as metas recém-criadas usando os identificadores únicos
        const { data: metasCriadas } = await supabase
          .from('metas_base')
          .select('id, eixo, requisito, artigo')
          .in('eixo', [...new Set(metasComUpdate.map(m => m.eixo))]);
        
        if (!metasCriadas) {
          throw new Error('Erro ao buscar metas criadas');
        }
        
        // Preparar todos os updates em um array
        const updatesParaCriar = [];
        const valoresStatusValidos = ['Totalmente Cumprido', 'Parcialmente Cumprido', 'Em Andamento', 'Não Cumprido', 'Não se Aplica'];
        
        for (const meta of metasComUpdate) {
          const metaCriada = metasCriadas.find(m => 
            m.eixo === meta.eixo && 
            m.requisito === meta.requisito && 
            m.artigo === meta.artigo
          );
          
          if (metaCriada && meta._updateData) {
            // Usar percentual do CSV se disponível, senão calcular a partir de pontos
            let percentual = meta._updateData.performance;
            if (percentual === undefined && meta.pontos_recebidos !== undefined && meta.pontos_aplicaveis > 0) {
              percentual = (meta.pontos_recebidos / meta.pontos_aplicaveis) * 100;
            }

            // Validar se o status é um valor permitido pelo banco
            const statusValido = meta._updateData.status && valoresStatusValidos.includes(meta._updateData.status) 
              ? meta._updateData.status 
              : null;

            updatesParaCriar.push({
              meta_id: metaCriada.id,
              setor_executor: meta.setor_executor,
              estimativa_cumprimento: statusValido,
              acoes_planejadas: meta._updateData.acoes_planejadas || null,
              justificativa_parcial: meta._updateData.justificativa_parcial || null,
              observacoes: meta._updateData.observacoes || null,
              atividades: meta._updateData.atividades.length > 0 ? meta._updateData.atividades : null,
              pontos_estimados: meta.pontos_recebidos || null,
              percentual_cumprimento: percentual || null,
              data_prestacao: new Date().toISOString()
            });
          }
        }
        
        // Inserir todos os updates de uma vez
        if (updatesParaCriar.length > 0) {
          const { error: updateError } = await supabase
            .from('updates')
            .insert(updatesParaCriar);
          
          if (updateError) {
            console.error('❌ Erro ao criar updates:', updateError);
            throw updateError;
          }
          
          console.log(`✅ ${updatesParaCriar.length} updates criados com sucesso`);
        }
      }

      toast.success(`${metas.length} metas importadas com sucesso!`);
      
      // Aguardar antes de navegar e usar state para indicar que veio de importação
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/setor-selection', { 
        replace: true,
        state: { fromImport: true }
      });
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
          <CardTitle className="text-2xl">Eficiência em Ação - Importação de Dados</CardTitle>
          <CardDescription>
            Prêmio CNJ de Qualidade TJPB 2026
            <br />
            <span className="text-xs text-blue-700 font-semibold italic">
              Unidos por resultados: TJPB no padrão Excelência
            </span>
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
            <Tabs defaultValue="metas" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="metas" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Metas
                </TabsTrigger>
                <TabsTrigger value="coordenadores" className="gap-2">
                  <Users className="h-4 w-4" />
                  Coordenadores
                </TabsTrigger>
              </TabsList>

              {/* ABA DE METAS */}
              <TabsContent value="metas" className="space-y-4 mt-6">
                {!file ? (
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
                ) : (
                  showMapping && (
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

                        <div className="space-y-6">
                          {/* Campos Obrigatórios */}
                          <div>
                            <h4 className="text-sm font-semibold mb-3 text-gray-700">📋 Campos Obrigatórios</h4>
                            <div className="grid gap-4">
                              {Object.entries({
                                eixo: 'Eixo *',
                                item: 'Item *',
                                artigo: 'Artigo *',
                                requisito: 'Requisito *',
                                pontos_aplicaveis: 'Pontos Aplicáveis *',
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
                          </div>

                          {/* Campos Opcionais - Dados Base */}
                          <div>
                            <h4 className="text-sm font-semibold mb-3 text-gray-700">📝 Campos Opcionais</h4>
                            <div className="grid gap-4">
                              {Object.entries({
                                descricao: 'Descrição',
                                setor_executor: 'Setor Executor',
                                coordenador: 'Coordenador Executivo',
                                pontos_recebidos: 'Pontos Recebidos/Alcançados'
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
                                      <SelectValue placeholder="Selecione a coluna (opcional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">Nenhuma</SelectItem>
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
                          </div>

                          {/* Campos de Resposta/Updates */}
                          <div>
                            <h4 className="text-sm font-semibold mb-3 text-gray-700">✅ Campos de Prestação de Contas</h4>
                            <div className="grid gap-4">
                              {Object.entries({
                                status: 'Status/Estimativa de Cumprimento',
                                performance: 'Performance (%)',
                                acoes_legado: 'Ações - Legado',
                                justificativa_parcial: 'Justificativa para Parcial',
                                observacoes: 'Observações'
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
                                      <SelectValue placeholder="Selecione a coluna (opcional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">Nenhuma</SelectItem>
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
                          </div>

                          {/* Campos de Atividades */}
                          <div>
                            <h4 className="text-sm font-semibold mb-3 text-gray-700">🎯 Atividades (até 5)</h4>
                            <div className="grid gap-4">
                              {Object.entries({
                                atividade_1: 'Atividade 1',
                                atividade_2: 'Atividade 2',
                                atividade_3: 'Atividade 3',
                                atividade_4: 'Atividade 4',
                                atividade_5: 'Atividade 5'
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
                                      <SelectValue placeholder="Selecione a coluna (opcional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">Nenhuma</SelectItem>
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
                            <p className="text-xs text-muted-foreground mt-2">
                              💡 Formato esperado: "Ação | Resp: Responsável | Prazo: dd/MM/yyyy | Status: status | Andamento: descrição"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-blue-900">
                            <p className="font-medium mb-1">Campos marcados com * são obrigatórios</p>
                            <p className="mt-1">📊 <strong>Importação Completa:</strong> O sistema reconhece e importa TODAS as colunas da tabela</p>
                            <p className="mt-1">🎯 <strong>Atividades:</strong> Importa até 5 atividades por requisito com todas as informações</p>
                            <p className="mt-1">💡 <strong>Pontos Recebidos:</strong> Se informado, calcula automaticamente status e percentual</p>
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
                        {loading ? 'Importando...' : 'Importar Metas'}
                      </Button>
                    </div>
                  )
                )}
              </TabsContent>

              {/* ABA DE COORDENADORES */}
              <TabsContent value="coordenadores" className="space-y-4 mt-6">
                {!coordenadoresFile ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium mb-2">Importar Lista de Coordenadores Autorizados</p>
                          <p className="mb-2">Esta lista controla quem pode fazer login e alterações no sistema.</p>
                          <p className="text-xs">
                            <strong>Formato esperado:</strong> arquivo Excel/CSV com 2 colunas:
                          </p>
                          <ul className="text-xs mt-1 ml-4 list-disc">
                            <li><strong>Nome</strong> - Nome completo do coordenador</li>
                            <li><strong>Email</strong> - Email institucional</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleCoordenadoresFileChange}
                        className="hidden"
                        id="coordenadores-upload"
                      />
                      <label htmlFor="coordenadores-upload" className="cursor-pointer">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Arraste um arquivo ou clique para selecionar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Formatos: CSV, XLSX
                        </p>
                      </label>
                    </div>
                  </div>
                ) : (
                  showCoordenadoresMapping && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Check className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium">{coordenadoresFile.name}</span>
                      </div>

                      <div className="border rounded-lg p-4 space-y-4">
                        <div className="space-y-1">
                          <h3 className="font-medium">Mapeamento de Colunas</h3>
                          <p className="text-sm text-muted-foreground">
                            Selecione qual coluna corresponde a cada campo:
                          </p>
                        </div>

                        <div className="grid gap-4">
                          {Object.entries({
                            nome: 'Nome *',
                            email: 'Email *'
                          }).map(([field, label]) => (
                            <div key={field} className="grid gap-2">
                              <Label htmlFor={field} className="text-sm">
                                {label}
                              </Label>
                              <Select
                                value={coordenadoresMapping[field as keyof typeof coordenadoresMapping]}
                                onValueChange={(value) => setCoordenadoresMapping(prev => ({ ...prev, [field]: value }))}
                              >
                                <SelectTrigger id={field}>
                                  <SelectValue placeholder="Selecione a coluna" />
                                </SelectTrigger>
                                <SelectContent>
                                  {coordenadoresHeaders.map((header, idx) => (
                                    <SelectItem key={`${header}-${idx}`} value={header}>
                                      {header}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="deleteCoordenadoresOldData"
                            checked={deleteCoordenadoresOldData}
                            onChange={(e) => setDeleteCoordenadoresOldData(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300"
                          />
                          <div className="space-y-1">
                            <Label htmlFor="deleteCoordenadoresOldData" className="font-medium cursor-pointer">
                              Substituir lista existente
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              ⚠️ Isso removerá todos os coordenadores autorizados anteriores e importará apenas os novos
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleCoordenadoresImport}
                        disabled={coordenadoresLoading}
                        className="w-full"
                        size="lg"
                      >
                        {coordenadoresLoading ? 'Importando...' : 'Importar Coordenadores'}
                      </Button>
                    </div>
                  )
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportPage;