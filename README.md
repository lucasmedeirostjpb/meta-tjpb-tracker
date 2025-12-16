# Sistema de Acompanhamento de Metas - Prêmio CNJ de Qualidade TJPB 2026

Sistema para gerenciamento e acompanhamento das metas do Prêmio CNJ de Qualidade do Tribunal de Justiça da Paraíba para o ano de 2026.

## 📋 Funcionalidades

### 🔐 Autenticação e Segurança
- ✅ **Login/Cadastro de usuários** - Autenticação obrigatória para alterações
- ✅ **Histórico completo** - Rastreamento de todas as modificações com usuário e timestamp

### 📊 Prestação de Contas
- ✅ **Formulário estruturado** baseado no Forms atual do TJPB com 5 questões:
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
- ✅ Opção para limpar dados antigos antes de reimportar
- ✅ **Exportação de pontos** - Copia valores calculados para colar no Excel
- ✅ Preservação da ordem original da planilha

### 📈 Visualização e Acompanhamento
- ✅ Dashboard com progresso por setor/coordenador
- ✅ Consolidação de pontos recebidos vs aplicáveis
- ✅ Visualização por eixo temático
- ✅ Alertas de prazo próximo

## 🔧 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **UI**: Shadcn-ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Cliente**: @supabase/supabase-js (comunicação direta)
- **Planilhas**: XLSX (importação de Excel)

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

**1. Migration inicial** (`supabase/migrations/20251127_inicial_completa.sql`):
- ✅ Tabela `metas_base` (com artigo, requisito e todos os campos)
- ✅ Tabela `updates` (para acompanhamento de status)
- ✅ Índices para performance
- ✅ Políticas RLS
- ✅ Triggers automáticos

**2. Adicionar linha_planilha** (`supabase/migrations/20251128_add_linha_planilha.sql`):
- ✅ Campo `linha_planilha` para ordenação correta na exportação

**3. Adicionar autenticação e histórico** (`supabase/migrations/20251128_add_auth_and_history.sql`):
- ✅ Tabela `historico_alteracoes` (rastreamento completo de alterações)
- ✅ Políticas RLS atualizadas (leitura pública, escrita apenas autenticada)
- ✅ Trigger automático para registrar histórico

**4. Adicionar sistema de prestação de contas** (`supabase/migrations/20251128_add_prestacao_contas.sql`):
- ✅ Campos: `estimativa_cumprimento`, `percentual_cumprimento`, `pontos_estimados`
- ✅ Campos: `acoes_planejadas`, `justificativa_parcial`, `data_prestacao`
- ✅ Função `fn_calcular_pontos_recebidos()` para cálculo automático
- ✅ View `vw_prestacao_contas` para consultas consolidadas

#### 2.5. Habilitar Autenticação

No Supabase:
1. Vá em **Authentication** → **Providers**
2. Habilite **Email** provider
3. Configure confirmação de email se desejado

#### 2.6. Verificar Instalação

Execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('metas_base', 'updates', 'historico_alteracoes');

-- Verificar view criada
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'vw_prestacao_contas';

-- Verificar função
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'fn_calcular_pontos_recebidos';
```

Resultado esperado: 3 tabelas, 1 view, 1 função.

### 3. Iniciar o Sistema

```powershell
npm run dev
```

Acesse: **http://localhost:8080**

## 🎭 Modo de Demonstração (Mock)

Para testar o sistema sem configurar o Supabase, use o modo mock:

### Ativar Modo Mock

No arquivo `.env`, configure:

```env
VITE_MOCK_MODE=true
```

### O que acontece no modo mock:

- ✅ Sistema usa dados fictícios (8 metas de exemplo)
- ✅ Todos os setores e coordenadores estão disponíveis
- ✅ Navegação completa funciona normalmente
- ❌ **Importação desabilitada** (mostra aviso)
- ❌ **Alterações não são salvas** (apenas visualização)

### Quando usar modo mock:

- 🔹 Demonstrações e apresentações
- 🔹 Testes de interface
- 🔹 Desenvolvimento sem acesso ao banco
- 🔹 Treinamento de usuários

### Para usar dados reais:

```env
VITE_MOCK_MODE=false
```

E configure as credenciais do Supabase normalmente.

## 📊 Importação de Dados

### Importação de Metas

#### Formato do Arquivo Excel/CSV

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

**💡 Novo:** Ao importar com a coluna **Pontos Recebidos**, o sistema:
- Calcula automaticamente o **percentual de cumprimento** (pontos recebidos / pontos aplicáveis × 100)
- Define o **status** automaticamente:
  - 100%+ → "Totalmente Cumprido" (Concluído)
  - 1-99% → "Parcialmente Cumprido" (Em Andamento)
  - 0% → "Não Cumprido" (Pendente)
- Cria o registro de **prestação de contas** com a data de importação

### Importação de Coordenadores Autorizados

**🔐 Controle de Acesso:** O sistema usa esta lista para autorizar login e alterações.

#### Formato do Arquivo Excel/CSV

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Nome | Texto | ✅ Sim | João Silva Santos |
| Email | Texto | ✅ Sim | joao.silva@tjpb.jus.br |

#### Como Importar Coordenadores

1. **Preparar Arquivo**: Excel (.xlsx) ou CSV com as 2 colunas acima
2. **Acessar Sistema**: http://localhost:8080
3. **Aba Coordenadores**: Clique na aba "Coordenadores"
4. **Upload**: Clique ou arraste o arquivo
5. **Mapear Colunas**: Confirme o mapeamento automático
6. **Opção de Substituição**: Marque "Substituir lista existente" para limpar a lista anterior
7. **Importar**: Clique em "Importar Coordenadores"

**⚠️ Importante:**
- Apenas emails importados poderão criar conta e fazer login
- Ao reimportar com "Substituir lista existente", os coordenadores anteriores serão removidos
- Emails são convertidos automaticamente para minúsculas

### Como Importar Metas

1. **Preparar Arquivo**: Excel (.xlsx) ou CSV com as colunas acima
2. **Acessar Sistema**: http://localhost:8080
3. **Upload**: Clique ou arraste o arquivo na área de importação
4. **Mapear Colunas**: Selecione qual coluna da planilha corresponde a cada campo
5. **Opção de Limpeza**: Marque "Limpar dados antigos" se quiser reimportar tudo do zero
6. **Importar**: Clique em "Importar Dados"

### Datas

O sistema aceita datas em formato:
- **DD/MM/AAAA**: 31/12/2026
- **Data serial do Excel**: Converte automaticamente

## 🎯 Como Usar o Sistema

### 1. Login Simplificado

**🔐 Sistema sem senha tradicional:**

1. **Acesse**: http://localhost:8080/login
2. **Informe seu email institucional** cadastrado na lista de coordenadores
3. **Clique em "Acessar Sistema"**

**Como funciona:**
- ✅ O sistema verifica se seu email está na lista de coordenadores autorizados
- ✅ Se autorizado, você acessa diretamente (sem senha)
- ✅ Sessão válida por 24 horas
- ✅ Nome do usuário exibido no topo das páginas
- ❌ Emails não cadastrados não conseguem acessar

**⚠️ Importante:**
- Apenas emails importados na aba "Coordenadores" podem fazer login
- Para adicionar novos usuários, reimporte a lista com os emails atualizados
- Primeiro acesso: importe a lista de coordenadores antes de tentar fazer login

### 2. Importar Coordenadores (Primeira Vez)

**Antes de fazer login, você precisa importar a lista de coordenadores:**

1. Acesse a página inicial (sem login necessário)
2. Clique em "Importar Dados"
3. Vá na aba **"Coordenadores"**
4. Faça upload da planilha com Nome e Email
5. Confirme o mapeamento
6. Clique em "Importar Coordenadores"

**Agora os emails da lista podem fazer login!**

### 3. Importar Metas
1. Faça **login** (requer autenticação)
2. Acesse **Importar Dados** 
3. Aba **"Metas"**
4. Faça upload do arquivo Excel/CSV
5. As colunas serão mapeadas automaticamente
6. Ajuste mapeamentos se necessário
7. Marque "Limpar dados antigos" se for reimportar
8. Clique em **Importar Metas**

### 4. Visão por Setor
1. Acesse "Selecionar por Setor"
2. Escolha o setor desejado
3. Visualize todas as metas do setor
4. Clique em uma meta para atualizar status

### 4. Visão por Coordenador
1. Clique em "Selecionar por Coordenador"
2. Escolha o coordenador
3. Veja consolidação por setor + metas individuais

### 6. Prestação de Contas
1. **Faça login** com seu email autorizado
2. Clique em qualquer card de meta para abrir o formulário
3. Preencha as **5 questões obrigatórias**:

**1️⃣ Identificação do Coordenador** (preenchido automaticamente)
- Sistema identifica o usuário logado pelo nome

**2️⃣ Critério desta prestação** (preenchido automaticamente)
- Exibe artigo, requisito e descrição da meta

**3️⃣ Estimativa de Cumprimento** (selecione):
- ✅ Totalmente Cumprido (100%)
- ⚠️ Parcialmente Cumprido (definir %)
- ❌ Não Cumprido (0%)
- ➖ Não se Aplica (0%)

**4️⃣ Percentual e Pontos Estimados**:
- Se "Parcialmente Cumprido":
  - Use o controle deslizante (0-100%)
  - Informe **justificativa obrigatória**
  - Sistema calcula pontos automaticamente
- Outros casos: "Não se aplica"

**5️⃣ Ações Planejadas/Executadas**:
- Descreva iniciativas e medidas adotadas
- Campo de texto livre

**📎 Informações Complementares** (opcionais):
- Link de Evidência (URL com documentos)
- Observações Adicionais

3. Clique em **"💾 Salvar Prestação de Contas"**
4. **Histórico registrado automaticamente** com seu email e timestamp

### 6. Exportar Pontos Recebidos
1. No Dashboard, clique em **"Copiar Pontos Recebidos"**
2. Valores são copiados para área de transferência
3. Cole (Ctrl+V) na coluna "Pontos Recebidos 2026" do Excel
4. A ordem corresponde exatamente à planilha original

### 7. Ver Histórico de Alterações
1. No Dashboard, clique em **"Histórico"**
2. Visualize todas as alterações:
   - Quem fez a alteração (email)
   - Quando foi feito (data/hora)
   - O que foi alterado (status, evidências, observações)
   - Valores anteriores e novos

### Dashboard

- **Barra de Progresso**: Percentual de pontos conquistados
- **Agrupamento por Eixo**: Metas organizadas por categoria
- **Consolidação por Setor**: Para coordenadores, veja progresso de cada setor
- **Alertas de Prazo**: Metas com menos de 30 dias aparecem destacadas
- **Botões de Ação**: Histórico, Exportar, Sair

## 🔐 Segurança e Autenticação

### Arquivo .env

- ✅ `.env` está no `.gitignore` (não é versionado)
- ✅ `.env.example` serve como template (SEM credenciais)
- ⚠️ **NUNCA commite o arquivo `.env` com credenciais reais**

### Sistema de Autenticação

**Políticas de acesso implementadas:**

- ✅ **Leitura pública**: Qualquer pessoa pode visualizar metas e progresso
- 🔒 **Escrita autenticada**: Apenas usuários logados podem:
  - Importar metas
  - Atualizar status, evidências e observações
  - Criar/editar registros

### Histórico de Alterações

**Rastreamento automático:**
- ✅ Toda alteração é registrada com:
  - Email do usuário responsável
  - ID do usuário autenticado
  - Timestamp exato da modificação
  - Valores anteriores e novos
  - Tipo de ação (criação, atualização de status, etc.)

### RLS (Row Level Security)

Políticas configuradas no Supabase garantem que:
1. Todos podem **ler** dados (visualização pública)
2. Apenas usuários autenticados podem **escrever**
3. Histórico só pode ser inserido pelo próprio usuário
4. Triggers automáticos garantem integridade dos dados
2. Atualize as políticas RLS para validar `auth.uid()`
3. Implemente componentes de login no frontend

### Modo Mock

- Use `VITE_MOCK_MODE=true` para demonstrações públicas
- Nenhuma credencial real é necessária
- Dados fictícios não expõem informações sensíveis

## 🗄️ Estrutura do Banco de Dados

### Tabela `metas_base`
Armazena as metas importadas:
- `id`, `eixo`, `item`, `artigo`, `requisito`
- `descricao`, `pontos_aplicaveis`
- `setor_executor`, `coordenador`
- `deadline`, `created_at`

### Tabela `updates`
Acompanhamento de status (1 por meta):
- `meta_id` (FK para metas_base)
- `status`, `link_evidencia`, `observacoes`
- `setor_executor`, `updated_at`

### Índices
8 índices para performance otimizada em:
- Buscas por setor e coordenador
- Filtros por eixo, artigo, requisito
- Ordenação por deadline e status

## 🛠️ Manutenção

### Limpar Dados do Banco

Execute no SQL Editor do Supabase:

```sql
-- Deletar TUDO (cuidado!)
DELETE FROM public.metas_base;

-- Ou deletar apenas um setor
DELETE FROM public.metas_base WHERE setor_executor = 'Nome do Setor';
```

### Backup

No Supabase:
1. Vá em **Database** → **Backups**
2. Clique em "Create backup"
3. Plano Free: 7 dias de retenção

### Exportar Dados

```sql
-- Exportar todas as metas com status
SELECT 
  m.*,
  u.status,
  u.link_evidencia,
  u.observacoes,
  u.updated_at
FROM metas_base m
LEFT JOIN updates u ON u.meta_id = m.id
ORDER BY m.eixo, m.artigo, m.requisito;
```

## ⚠️ Troubleshooting

### Erro de Conexão
- Verifique variáveis `.env`
- Confirme que o projeto Supabase está ativo
- Teste a URL no navegador

### Erro na Importação
- Certifique-se que todos os campos obrigatórios foram mapeados
- Verifique formato das datas
- Confirme que a migration foi executada

### Dados Não Aparecem
- Verifique se a migration criou as tabelas
- Confirme políticas RLS no Table Editor
- Veja logs de erro no console do navegador (F12)

### Performance Lenta
- Certifique-se que os índices foram criados
- Verifique se há muitos dados (plano Free: 500MB)
- Considere adicionar filtros nas queries

## 📝 Estrutura do Projeto

```
meta-tjpb-tracker/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes shadcn-ui
│   │   ├── MetaCard.tsx     # Card de meta (requisito + artigo)
│   │   └── MetaModal.tsx    # Modal de edição
│   ├── pages/
│   │   ├── ImportPage.tsx   # Importação + mapeamento
│   │   ├── SetorSelectionPage.tsx
│   │   └── DashboardPage.tsx
│   ├── integrations/supabase/
│   │   ├── client.ts        # Cliente Supabase configurado
│   │   ├── types.ts         # Tipos TypeScript do banco
│   │   └── index.ts         # Exports públicos
│   ├── services/
│   │   └── api.ts           # Camada de serviço (usa Supabase diretamente)
│   └── lib/
│       ├── utils.ts         # Utilitários
│       └── mockData.ts      # Dados para modo demo
├── supabase/migrations/
│   ├── 20251127_inicial_completa.sql
│   ├── 20251128_add_linha_planilha.sql
│   ├── 20251128_add_auth_and_history.sql
│   └── 20251128_add_prestacao_contas.sql
└── .env                     # Credenciais (não versionar!)
```

## 🚢 Deploy

### Opções de Deploy

#### Vercel (Recomendado)

1. Crie uma conta em [https://vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_MOCK_MODE` (false para produção)
4. Clique em Deploy

#### Netlify

1. Crie uma conta em [https://netlify.com](https://netlify.com)
2. Conecte seu repositório
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Configure as variáveis de ambiente
6. Deploy

#### Build Manual

```powershell
# Gerar build de produção
npm run build

# Testar build localmente
npm run preview
```

O build estará em `dist/` pronto para deploy em qualquer servidor estático.

## 🛠️ Desenvolvimento

### Estrutura de Branches

- `main` - Produção estável
- `develop` - Desenvolvimento
- `feature/*` - Novas funcionalidades

### Comandos Úteis

```powershell
# Instalar dependências
npm install

# Desenvolvimento com hot reload
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

### Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/MinhaFeature`
3. Commit: `git commit -m 'feat: Adiciona MinhaFeature'`
4. Push: `git push origin feature/MinhaFeature`
5. Abra um Pull Request

### Padrões de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 📄 Licença

Este projeto é propriedade do **Tribunal de Justiça da Paraíba**.

## 📧 Contato

Para dúvidas ou suporte:
- **Repositório**: [github.com/lucasmedeirostjpb/meta-tjpb-tracker](https://github.com/lucasmedeirostjpb/meta-tjpb-tracker)
- **Issues**: Reporte bugs ou sugira melhorias nas [Issues do GitHub](https://github.com/lucasmedeirostjpb/meta-tjpb-tracker/issues)

---

**Desenvolvido para o Tribunal de Justiça da Paraíba** | Prêmio CNJ de Qualidade 2026
