# Atualização do Sistema de Histórico - 01/12/2025

## O que foi corrigido

### 1. ✅ Badge de Status Inconsistente no Modal
**Problema**: Ao abrir um requisito com badge "Em Andamento" e depois abrir outro com badge "Pendente", o status anterior permanecia.

**Solução**: 
- Modificado o `useEffect` para usar `meta?.id` como dependência
- Adicionado reset do estado do histórico ao fechar o modal
- Agora o estado é resetado corretamente ao trocar de meta

### 2. ✅ Histórico Mostrando Apenas Mudanças Parciais
**Problema**: O histórico só mostrava status, link de evidência e observações, mas não mostrava estimativa de cumprimento, pontos estimados, ações planejadas e justificativas.

**Solução**: 
- ✨ **Banco de Dados**: Adicionados novos campos na tabela `historico_alteracoes`
- ✨ **Trigger**: Atualizada função `registrar_historico()` para capturar TODOS os campos
- ✨ **Interface**: Expandida para mostrar comparação completa (antes/depois) de:
  - 📊 Status
  - ✅ Estimativa de Cumprimento
  - 🎯 Pontos Estimados
  - 📝 Ações Planejadas
  - 📋 Justificativa Parcial
  - 🔗 Link de Evidência
  - 💬 Observações

## Arquivos Modificados

### Frontend
- ✅ `src/components/MetaModal.tsx`
  - Interface `HistoricoAlteracao` expandida com todos os campos
  - useEffect corrigido com `meta?.id` como dependência
  - Exibição do histórico completamente refeita
  - Cada campo mostra valor anterior (riscado) e valor novo (destacado)
  - Ícones e formatação melhorados

### Backend/Database
- ✅ `supabase/migrations/20251201_schema_completo.sql`
  - Tabela `historico_alteracoes` com todos os campos
  - Função `registrar_historico()` captura todas as alterações
  - Comentários atualizados

- ✅ `supabase/migrations/20251201_update_historico_alteracoes.sql`
  - Script de atualização para bancos existentes
  - Adiciona novos campos sem perder dados

### TypeScript Types
- ✅ `src/integrations/supabase/types.ts`
  - Interface `historico_alteracoes` sincronizada com schema real

## Como Aplicar as Mudanças

### Se você JÁ rodou as migrações antigas:
1. Acesse o SQL Editor do Supabase
2. Execute o arquivo: `supabase/migrations/20251201_update_historico_alteracoes.sql`
3. Aguarde a mensagem de sucesso

### Se você ainda NÃO rodou nenhuma migração:
1. Acesse o SQL Editor do Supabase
2. Execute o arquivo: `supabase/migrations/20251201_schema_completo.sql`
3. Todo o schema será criado de uma vez

## Visualização do Histórico

Agora ao abrir um requisito no modal e clicar na aba "Histórico", você verá:

```
✨ Criação inicial
   por usuario@exemplo.com
   01/12/2025 14:30
   
   📊 Status: Pendente
   ✅ Estimativa: Não se Aplica
   🎯 Pontos: 0
   
🔄 Atualização completa
   por usuario@exemplo.com
   01/12/2025 15:45
   
   📊 Status: Pendente → Em Andamento
   ✅ Estimativa: Não se Aplica → Parcialmente Cumprido
   🎯 Pontos: 0 → 5
   📝 Ações Planejadas:
      Novo: "Foram implementadas as seguintes ações..."
   📋 Justificativa:
      Novo: "O cumprimento parcial se deve a..."
```

## Funcionalidades do Histórico

✅ **Todas as alterações rastreadas**
- Status
- Estimativa de cumprimento
- Pontos estimados
- Ações planejadas
- Justificativa parcial
- Link de evidência
- Observações

✅ **Comparação visual**
- Valores anteriores aparecem com `line-through` (riscado)
- Valores novos aparecem destacados
- Setas (→) indicam mudança

✅ **Informações de auditoria**
- Quem fez a alteração
- Data e hora exatas
- Tipo de ação realizada

✅ **Interface amigável**
- Timeline vertical com ícones
- ScrollArea para históricos longos
- Estado vazio quando não há alterações
- Loading state durante busca

## Testando

1. Abra um requisito no modal
2. Faça alterações na prestação de contas
3. Salve
4. Clique na aba "Histórico"
5. Você verá TODAS as alterações com comparação antes/depois
6. Feche o modal e abra outro requisito
7. O badge e histórico devem estar corretos para a nova meta
