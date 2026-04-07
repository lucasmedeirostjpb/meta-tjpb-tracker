import { format, parseISO, isValid, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Tenta parsear uma data de forma robusta, suportando:
 * - ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss.sssZ)
 * - Brasileiro (DD/MM/YYYY)
 * - Objeto Date
 */
export const parseDateSafe = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value !== 'string') return null;
  
  const trimmedValue = value.trim();
  if (!trimmedValue || trimmedValue === '-' || trimmedValue.toLowerCase() === 'sem prazo') {
    return null;
  }

  // 1. Tentar parseISO (padrão para o que vem do banco geralmente)
  let parsed = parseISO(trimmedValue);
  if (isValid(parsed) && !isNaN(parsed.getTime())) {
    return parsed;
  }

  // 2. Tentar formato brasileiro DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmedValue)) {
    parsed = parse(trimmedValue, 'dd/MM/yyyy', new Date());
    if (isValid(parsed)) return parsed;
  }

  // 3. Tentar formatar DD/MM/YYYY com espaços ou outros separadores se necessário
  // Mas por enquanto vamos focar nos mais comuns.

  // 4. Última tentativa: New Date() - lida com formatos que o navegador entende
  parsed = new Date(trimmedValue);
  if (isValid(parsed) && !isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
};

/**
 * Formata uma data de forma segura com fallback
 */
export const formatDateSafe = (
  value: string | Date | null | undefined, 
  formatStr: string = 'dd/MM/yyyy',
  fallback: string = '-'
): string => {
  const parsed = parseDateSafe(value);
  if (!parsed) return fallback;
  
  try {
    return format(parsed, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error, value);
    return fallback;
  }
};
