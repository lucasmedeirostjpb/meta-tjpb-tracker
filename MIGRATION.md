# 🔄 Migração para Supabase Direto

## 📋 O que mudou?

### ❌ Antes (API Intermediária)
```
Frontend → api.ts → API Backend (Node.js) → Supabase
```

### ✅ Agora (Supabase Direto)
```
Frontend → api.ts → @supabase/supabase-js → Supabase
```

## 🎯 Benefícios

- ✅ **Menos complexidade** - Sem necessidade de API intermediária
- ✅ **Melhor performance** - Comunicação direta com o banco
- ✅ **Real-time ready** - Pronto para subscriptions do Supabase
- ✅ **Menos custos** - Não precisa hospedar API separada
- ✅ **Mais seguro** - RLS (Row Level Security) no banco de dados
- ✅ **Type-safe** - Tipos TypeScript gerados do schema

## 🔧 Mudanças Técnicas

### 1. Nova Dependência

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x"
  }
}
```

### 2. Estrutura Supabase

```
src/integrations/supabase/
├── client.ts    # Cliente configurado
├── types.ts     # Tipos do banco de dados
└── index.ts     # Exports públicos
```

### 3. Variáveis de Ambiente

**Antes (.env):**
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MOCK_MODE=false
```

**Agora (.env):**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-aqui
VITE_SUPABASE_PROJECT_ID=seu-project-id
VITE_MOCK_MODE=false
```

### 4. API Service (src/services/api.ts)

**Antes:**
```typescript
class ApiService {
  private async request<T>(endpoint: string, options: RequestInit) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    return response.json();
  }
  
  async getMetas() {
    return this.request('/metas');
  }
}
```

**Agora:**
```typescript
import { supabase } from '@/integrations/supabase/client';

export const api = {
  async getMetas() {
    const { data, error } = await supabase
      .from('metas_base')
      .select('*')
      .order('eixo');
    
    if (error) throw error;
    return data;
  }
}
```

## 📊 Endpoints Convertidos

### Autenticação

| Método | Antes | Agora |
|--------|-------|-------|
| Sign Up | `POST /auth/signup` | `supabase.auth.signUp()` |
| Sign In | `POST /auth/signin` | `supabase.auth.signInWithPassword()` |
| Sign Out | `POST /auth/signout` | `supabase.auth.signOut()` |
| Get Session | `GET /auth/session` | `supabase.auth.getSession()` |

### Metas

| Método | Antes | Agora |
|--------|-------|-------|
| Listar | `GET /metas?setor=X` | `supabase.from('metas_base').select()` |
| Criar | `POST /metas` | `supabase.from('metas_base').insert()` |
| Deletar | `DELETE /metas` | `supabase.from('metas_base').delete()` |

### Updates

| Método | Antes | Agora |
|--------|-------|-------|
| Criar | `POST /updates` | `supabase.from('updates').insert()` |
| Atualizar | `PUT /updates/:id` | `supabase.from('updates').update()` |

### Auxiliares

| Método | Antes | Agora |
|--------|-------|-------|
| Setores | `GET /setores` | `supabase.from('metas_base').select('setor_executor')` |
| Coordenadores | `GET /coordenadores` | `supabase.from('metas_base').select('coordenador')` |
| Histórico | `GET /historico` | `supabase.from('historico_alteracoes').select()` |

## 🚀 Como Migrar

### Passo 1: Instalar Dependência

```powershell
npm install @supabase/supabase-js
```

### Passo 2: Criar Estrutura Supabase

Arquivos já criados:
- ✅ `src/integrations/supabase/client.ts`
- ✅ `src/integrations/supabase/types.ts`
- ✅ `src/integrations/supabase/index.ts`

### Passo 3: Atualizar Variáveis de Ambiente

1. Copie `.env.example` para `.env`
2. Adicione suas credenciais do Supabase:
   - Project URL (Settings → API)
   - Publishable Key (Settings → API)
   - Project ID (Settings → General)

### Passo 4: API Service Atualizado

O arquivo `src/services/api.ts` foi **completamente reescrito** para usar Supabase diretamente.

### Passo 5: Testar

```powershell
# Build para verificar erros
npm run build

# Desenvolvimento
npm run dev
```

## 🎭 Modo Mock Continua Funcionando

O modo mock permanece **intacto** e continua funcionando da mesma forma:

```env
VITE_MOCK_MODE=true  # Usa dados fictícios
VITE_MOCK_MODE=false # Usa Supabase real
```

## ⚠️ Cuidados

### Row Level Security (RLS)

Com comunicação direta, as políticas RLS são **críticas**:

```sql
-- Leitura pública (já configurado)
CREATE POLICY "Allow public read" 
ON metas_base FOR SELECT 
TO public 
USING (true);

-- Escrita apenas autenticada (já configurado)
CREATE POLICY "Allow authenticated write" 
ON metas_base FOR ALL 
TO authenticated 
USING (true);
```

### Segurança da Chave

- ✅ Use **anon/public key** (não a service_role key)
- ✅ Mantenha `.env` no `.gitignore`
- ✅ Configure RLS em todas as tabelas
- ❌ **NUNCA** exponha a `service_role_key` no frontend

## 🔍 Debugging

### Verificar Conexão

```typescript
// Console do navegador (F12)
const { data, error } = await supabase.from('metas_base').select('count');
console.log('Conexão:', data ? 'OK' : error);
```

### Logs do Supabase

No dashboard do Supabase:
1. Vá em **Logs** → **API Logs**
2. Veja todas as queries em tempo real
3. Identifique erros de permissão (RLS)

### Common Errors

| Erro | Causa | Solução |
|------|-------|---------|
| `Invalid API key` | Chave errada/expirada | Verificar `.env` |
| `new row violates row-level security` | RLS bloqueando | Ajustar políticas |
| `relation does not exist` | Tabela não criada | Executar migrations |

## 📈 Performance

### Queries Otimizadas

**Antes (múltiplas requisições):**
```typescript
const metas = await api.getMetas();
const updates = await api.getUpdates();
// Merge manual
```

**Agora (join no banco):**
```typescript
const { data } = await supabase
  .from('metas_base')
  .select(`
    *,
    updates (*)
  `);
// Já vem com updates incluídos
```

### Índices

Certifique-se que os índices foram criados (migration):
- `idx_setor_executor`
- `idx_coordenador`
- `idx_eixo`
- `idx_deadline`

## 🎉 Conclusão

A migração está **completa** e o sistema agora:

- ✅ Usa Supabase diretamente
- ✅ Mantém toda funcionalidade existente
- ✅ Melhora performance
- ✅ Reduz complexidade
- ✅ Pronto para produção

**Nenhuma mudança necessária nas páginas** - a interface do `api.ts` permanece a mesma! 🎊
