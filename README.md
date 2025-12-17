# Eficiência em Ação - Prêmio CNJ de Qualidade TJPB 2026

> **Unidos por resultados: TJPB no padrão Excelência**

Sistema para gerenciamento e acompanhamento das metas do Prêmio CNJ de Qualidade do Tribunal de Justiça da Paraíba para o ano de 2026.

## 📋 Funcionalidades

### 🔐 Autenticação e Segurança
- ✅ **Login simplificado** baseado em lista de coordenadores autorizados
- ✅ **Controle de acesso** via email institucional
- ✅ **Sessão persistente** com expiração de 24 horas
- ✅ **Página "Minhas Metas"** para coordenadores logados
- ✅ **Histórico completo** - Rastreamento de todas as modificações com usuário e timestamp

### 📊 Prestação de Contas
- ✅ **Formulário estruturado** com 5 questões:
  1️⃣ Identificação do Coordenador Executivo (automático)
  2️⃣ Critério da prestação (automático)
  3️⃣ Estimativa de Cumprimento (Totalmente/Parcialmente/Não Cumprido/Não se Aplica)
  4️⃣ Percentual e pontos estimados para cumprimento parcial
  5️⃣ Ações Planejadas/Executadas
- ✅ **Pontuação parcial** - Sistema de percentual de cumprimento (0-100%)
- ✅ **Cálculo automático** - Pontos recebidos baseados no percentual
- ✅ **Justificativa obrigatória** para cumprimento parcial

### 📥 Importação e Exportação
- ✅ Importação via Excel/CSV com mapeamento automático de colunas
- ✅ Importação de coordenadores autorizados (Nome + Email)
- ✅ Importação com pontos já alcançados (opcional)
- ✅ Opção para limpar dados antigos antes de reimportar
- ✅ **Exportação de pontos** - Copia valores calculados para colar no Excel
- ✅ Preservação da ordem original da planilha

### 📈 Visualização e Acompanhamento
- ✅ Dashboard com progresso por setor/coordenador
- ✅ Consolidação de pontos recebidos vs aplicáveis
- ✅ Visualização por eixo temático (Eixo → Setor → Metas)
- ✅ Alertas de prazo próximo

## 🔧 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Shadcn-ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Cliente**: @supabase/supabase-js (comunicação direta)
- **Planilhas**: XLSX (importação de Excel)
- **Autenticação**: LocalStorage (sem Supabase Auth)

## 🚀 Início Rápido

### 1. Instalar Dependências

```powershell
npm install
```

### 2. Configurar Supabase

#### 2.1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta e um novo projeto
3. Escolha região **South America (São Paulo)**
4. Anote a senha do banco de dados

#### 2.2. Obter Credenciais

No dashboard do Supabase:
1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL**
   - **anon/public key**

#### 2.3. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```powershell
Copy-Item .env.example .env
```

Edite o `.env` com suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-aqui
VITE_SUPABASE_PROJECT_ID=seu-project-id

# Mock Mode (true = dados fictícios, false = Supabase real)
VITE_MOCK_MODE=false
```

**⚠️ IMPORTANTE:** O arquivo `.env` contém credenciais sensíveis e **NÃO deve ser commitado** no Git. Ele já está no `.gitignore`.

#### 2.4. Executar Migrations do Banco

No Supabase, vá em **SQL Editor** → **New query** e execute **na ordem**:

1. **Migration inicial** (`supabase/migrations/20251201_schema_completo.sql`):
   - ✅ Tabelas `metas_base` e `updates`
   - ✅ Índices para performance
   - ✅ Políticas RLS
   - ✅ Triggers automáticos

2. **Atualizar histórico** (`supabase/migrations/20251201_update_historico_alteracoes.sql`):
   - ✅ Tabela `historico_alteracoes`
   - ✅ Trigger de rastreamento

3. **Remover autenticação Supabase** (`supabase/migrations/20251211_remover_autenticacao.sql`):
   - ✅ Remove dependência do auth.uid()
   - ✅ Torna leitura pública

4. **Coordenadores autorizados** (`supabase/migrations/20251216_criar_coordenadores_autorizados.sql`):
   - ✅ Tabela `coordenadores_autorizados`
   - ✅ Políticas RLS públicas

### 3. Iniciar o Sistema

```powershell
npm run dev
```

Acesse: **http://localhost:8080**

## 🎭 Modo de Demonstração (Mock)

Para testar o sistema sem configurar o Supabase, use o modo mock:

```env
VITE_MOCK_MODE=true
```

**O que acontece:**
- ✅ Usa dados fictícios (8 metas de exemplo)
- ✅ Navegação completa funciona
- ❌ Importação desabilitada
- ❌ Alterações não são salvas

## 📊 Importação de Dados

### Importação de Coordenadores Autorizados

**🔐 Controle de Acesso:** Esta lista determina quem pode fazer login.

#### Formato do Arquivo

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Nome | Texto | ✅ Sim | João Silva Santos |
| Email | Texto | ✅ Sim | joao.silva@tjpb.jus.br |

#### Como Importar

1. Prepare Excel (.xlsx) ou CSV
2. Acesse **Importar → Aba Coordenadores**
3. Faça upload
4. Confirme mapeamento
5. Marque "Substituir lista existente" (se necessário)
6. Importe

**⚠️ Importante:**
- Apenas emails importados podem fazer login
- Emails convertidos automaticamente para minúsculas

### Importação de Metas

#### Formato do Arquivo

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Eixo | Texto | ✅ Sim | Governança e Gestão Judiciária |
| Item | Texto | ✅ Sim | Planejamento Estratégico |
| Artigo | Texto | ✅ Sim | Art. 1º |
| Requisito | Texto | ✅ Sim | I |
| Descrição | Texto | Não | Implementar sistema... |
| Pontos Aplicáveis | Número | ✅ Sim | 10 |
| **Pontos Recebidos** | **Número** | **Não** | **7.5** |
| Setor Executor | Texto | Não | TI |
| Coordenador | Texto | Não | João Silva |
| Deadline | Data | ✅ Sim | 31/12/2026 |

**💡 Pontos Recebidos (opcional):**
- Calcula automaticamente o **percentual**
- Define o **status** automaticamente:
  - 100%+ → "Totalmente Cumprido"
  - 1-99% → "Parcialmente Cumprido"
  - 0% → "Não Cumprido"
- Cria registro de prestação de contas

#### Como Importar

1. Prepare Excel (.xlsx) ou CSV
2. Acesse **Importar → Aba Metas**
3. Faça upload
4. Confirme mapeamento
5. Marque "Limpar dados antigos" (se necessário)
6. Importe

## 🎯 Como Usar o Sistema

### 1. Login Simplificado

**🔐 Sistema sem senha:**

1. Acesse http://localhost:8080/login
2. Informe seu email institucional
3. Clique em "Acessar Sistema"

**Como funciona:**
- ✅ Verifica se email está na lista de coordenadores
- ✅ Sessão válida por 24 horas
- ❌ Emails não cadastrados não podem acessar

### 2. Página "Minhas Metas"

Quando logado:
- ✅ Botão "Minhas Metas" no header
- ✅ Vê apenas suas metas (filtro por nome)
- ✅ Estrutura: Eixo → Setor → Metas
- ✅ Todos os accordions abertos por padrão
- ✅ Pode editar suas metas (modal editável)

### 3. Prestação de Contas

1. Clique em uma meta (card)
2. Preencha as 5 questões:
   - **1️⃣ Coordenador** (automático)
   - **2️⃣ Critério** (automático)
   - **3️⃣ Estimativa** (selecione)
   - **4️⃣ Percentual** (se parcial)
   - **5️⃣ Ações** (descreva)
3. Salve

### 4. Exportar Pontos

1. No Dashboard, clique **"Copiar Pontos Recebidos"**
2. Cole (Ctrl+V) no Excel
3. A ordem corresponde à planilha original

### 5. Ver Histórico

- Clique em **"Histórico"**
- Veja quem fez, quando e o que mudou

## 🔐 Segurança

### Autenticação LocalStorage

- ✅ Sem Supabase Auth
- ✅ Validação via lista de coordenadores
- ✅ Sessão de 24 horas
- ✅ Evento customizado 'auth-changed' para atualização de UI

### Políticas RLS

- ✅ Leitura pública (todos podem ver)
- ✅ Sem restrições de escrita (não usa auth.uid())
- ✅ Rastreamento por email do coordenador

## 🗄️ Estrutura do Banco

### Tabelas

1. **metas_base** - Metas importadas
2. **updates** - Acompanhamento de status
3. **historico_alteracoes** - Rastreamento de mudanças
4. **coordenadores_autorizados** - Lista de acesso

### Índices

8 índices para performance em:
- Busca por setor/coordenador
- Filtros por eixo/artigo/requisito
- Ordenação por deadline/status

## ⚠️ Troubleshooting

### Erro de Conexão
- Verifique `.env`
- Confirme projeto Supabase ativo

### Importação Falha
- Verifique campos obrigatórios mapeados
- Confira formato de datas

### Login não atualiza UI
- ✅ Implementado evento 'auth-changed'
- ✅ Delay de 100ms antes de navegar

### Erro "Target is not defined"
- ✅ Import do ícone Target adicionado

## 📁 Estrutura do Projeto

```
meta-tjpb-tracker/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn-ui
│   │   ├── MetaCard.tsx
│   │   └── MetaModal.tsx    # Dual mode (read/edit)
│   ├── pages/
│   │   ├── Index.tsx        # Rota "/"
│   │   ├── LandingPage.tsx  # Home
│   │   ├── LoginPage.tsx    # Login
│   │   ├── MinhasMetasPage.tsx  # Coordenador
│   │   ├── ImportPage.tsx   # Importação
│   │   ├── SetorSelectionPage.tsx
│   │   ├── TabelaCompletaPage.tsx
│   │   ├── VisaoAgregadaPage.tsx
│   │   └── DashboardPage.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx  # LocalStorage auth
│   ├── integrations/supabase/
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── services/
│   │   └── api.ts           # Supabase direto
│   └── lib/
│       ├── utils.ts
│       └── mockData.ts
├── supabase/migrations/
│   ├── 20251201_schema_completo.sql
│   ├── 20251201_update_historico_alteracoes.sql
│   ├── 20251211_remover_autenticacao.sql
│   └── 20251216_criar_coordenadores_autorizados.sql
└── .env                     # Não versionar!
```

## 🚢 Deploy

### Vercel (Recomendado)

1. Conecte repositório GitHub
2. Configure variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_MOCK_MODE=false`
3. Deploy

### Build Manual

```powershell
npm run build
npm run preview
```

## 🛠️ Desenvolvimento

### Comandos

```powershell
npm install        # Instalar
npm run dev        # Desenvolvimento
npm run build      # Build produção
npm run preview    # Preview build
npm run lint       # Lint
```

### Padrões de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 📝 Histórico de Atualizações

### 📋 Atualização: 16/12/2025 - Coordenadores e Autenticação

#### Novos Recursos
- ✅ Sistema de coordenadores autorizados
- ✅ Login simplificado (sem senha)
- ✅ Página "Minhas Metas" para coordenadores
- ✅ Hierarquia Eixo → Setor
- ✅ Modal dual-mode (consulta/edição)
- ✅ Importação com pontos já alcançados

#### Correções
- ✅ Evento 'auth-changed' para atualização de UI após login
- ✅ Import do ícone Target em MinhasMetasPage
- ✅ Estrutura HTML da LandingPage

## 📄 Licença

Este projeto é propriedade do **Tribunal de Justiça da Paraíba**.

## 📧 Contato

- **Repositório**: [github.com/lucasmedeirostjpb/meta-tjpb-tracker](https://github.com/lucasmedeirostjpb/meta-tjpb-tracker)
- **Issues**: [GitHub Issues](https://github.com/lucasmedeirostjpb/meta-tjpb-tracker/issues)

---

**Eficiência em Ação** | **Unidos por resultados: TJPB no padrão Excelência** | Prêmio CNJ de Qualidade 2026
