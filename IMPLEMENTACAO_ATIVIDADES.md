# Implementação do Campo Atividades

## ✅ O que foi implementado

### 1. Migration do Banco de Dados
**Arquivo:** `supabase/migrations/20250117_adicionar_atividades.sql`

- ✅ Adicionado campo `atividades` (JSONB) na tabela `updates`
- ✅ Adicionados campos `atividades_anterior` e `atividades_novo` na tabela `historico_alteracoes`
- ✅ Atualizada função `registrar_historico()` para rastrear mudanças nas atividades
- ✅ Novo tipo de ação: `atualizacao_atividades`
- ✅ Campo antigo `acoes_planejadas` MANTIDO para preservar dados históricos

### 2. Types do Supabase
**Arquivo:** `src/integrations/supabase/types.ts`

- ✅ Criado type `AtividadeStatus = 'Concluída' | 'Em andamento' | 'Não iniciada'`
- ✅ Criada interface `Atividade` com campos:
  - `id: string`
  - `acao: string`
  - `responsavel: string`
  - `prazo: string`
  - `status: AtividadeStatus`
- ✅ Adicionado campo `atividades?: Atividade[] | null` em:
  - `updates.Row`
  - `updates.Insert`
  - `updates.Update`
  - `historico_alteracoes.Row`
  - `historico_alteracoes.Insert`
  - `historico_alteracoes.Update`

### 3. Componente MetaModal
**Arquivo:** `src/components/MetaModal.tsx`

#### Imports atualizados:
- ✅ Importado `Plus` e `Trash2` do lucide-react
- ✅ Importado `Atividade` e `AtividadeStatus` dos types

#### State management:
- ✅ Adicionado state `atividades: Atividade[]`
- ✅ Função `generateId()` para IDs únicos
- ✅ Função `handleAddAtividade()` para adicionar nova atividade
- ✅ Função `handleRemoveAtividade()` para remover atividade
- ✅ Função `handleUpdateAtividade()` para atualizar campos da atividade

#### Interface (Modo Edição):
- ✅ Nova seção "Atividades" com botão "+ Adicionar Atividade"
- ✅ Cada atividade tem:
  - Campo "Ação" (texto, span 2 colunas)
  - Campo "Responsável" (texto)
  - Campo "Prazo" (date picker)
  - Campo "Status" (select: Concluída/Em andamento/Não iniciada)
  - Botão "🗑️" para remover
- ✅ Mensagem quando não há atividades
- ✅ Campo "Ações Planejadas" movido para `<details>` (dados antigos, colapsável)

#### Interface (Modo Visualização):
- ✅ Exibe lista de atividades com:
  - Numeração e descrição da ação
  - Grid com Responsável e Prazo
  - Badge colorido com status
- ✅ Campo "Ações Planejadas" exibido como "(histórico)" se existir

#### Funções auxiliares:
- ✅ `getAtividadeStatusColor()` para cores dos badges de status

### 4. API Service
**Arquivo:** `src/services/api.ts`

- ✅ Importado type `Atividade`
- ✅ Adicionado `atividades?: Atividade[] | null` em:
  - `UpdateData`
  - `Meta`
  - Parâmetro de `createUpdate()`
- ✅ Campo `atividades` incluído em:
  - UPDATE de updates existentes
  - INSERT de novos updates
- ✅ Campo já é retornado automaticamente pelo `select('*')`

## 📋 Próximos Passos

### Para Aplicar as Mudanças:

1. **Execute a Migration no Supabase:**
   ```sql
   -- Abra o Supabase → SQL Editor
   -- Cole e execute o arquivo:
   -- supabase/migrations/20250117_adicionar_atividades.sql
   ```

2. **Teste a Funcionalidade:**
   - Abra a página "Minhas Metas"
   - Clique em um requisito
   - Na seção "Atividades", clique em "+ Adicionar Atividade"
   - Preencha os campos:
     - Ação: "Implementar novo sistema"
     - Responsável: "João Silva"
     - Prazo: selecione uma data
     - Status: selecione o status
   - Adicione múltiplas atividades
   - Salve e verifique

3. **Verifique o Histórico:**
   - Altere atividades
   - Vá para a página de Histórico
   - Verifique se as mudanças estão sendo registradas

## 🔄 Compatibilidade com Dados Antigos

- ✅ Campo `acoes_planejadas` MANTIDO no banco
- ✅ Dados antigos continuam visíveis
- ✅ Interface mostra "Ações Planejadas (dados antigos)" colapsável
- ✅ Novos preenchimentos usam Atividades estruturadas
- ✅ Zero perda de dados históricos

## 🎨 Design da Interface

### Modo Edição:
- Seção "Atividades" com botão de adicionar no canto direito
- Cards brancos com borda para cada atividade
- Numeração "Atividade 1", "Atividade 2", etc.
- Botão vermelho de lixeira no canto superior direito
- Grid responsivo (1 coluna em mobile, 2 colunas em desktop)
- Emojis nos status: ✅ Concluída, 🔄 Em andamento, ⏸️ Não iniciada

### Modo Visualização:
- Lista de cards com atividades
- Layout flexível: descrição à esquerda, badge à direita
- Grid de informações (Responsável | Prazo)
- Cores de badge:
  - Verde: Concluída
  - Amarelo: Em andamento
  - Cinza: Não iniciada

## 📊 Estrutura de Dados

```typescript
// Exemplo de dado salvo no banco:
{
  "atividades": [
    {
      "id": "atividade-1705689123456-abc123",
      "acao": "Implementar módulo de relatórios",
      "responsavel": "João Silva",
      "prazo": "2026-03-15",
      "status": "Em andamento"
    },
    {
      "id": "atividade-1705689234567-def456",
      "acao": "Revisar documentação técnica",
      "responsavel": "Maria Santos",
      "prazo": "2026-02-28",
      "status": "Concluída"
    }
  ]
}
```

## ✨ Melhorias Futuras (Opcionais)

- [ ] Drag & drop para reordenar atividades
- [ ] Filtros por status na visualização
- [ ] Indicador de progresso (X de Y concluídas)
- [ ] Notificações de prazos próximos
- [ ] Anexos por atividade
- [ ] Comentários/observações por atividade
- [ ] Histórico de mudanças por atividade individual
