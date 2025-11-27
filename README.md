# Sistema de Acompanhamento de Metas - Prêmio CNJ de Qualidade TJPB 2026

Sistema para gerenciamento e acompanhamento das metas do Prêmio CNJ de Qualidade do Tribunal de Justiça da Paraíba para o ano de 2026.

## 📋 Funcionalidades

- ✅ Importação de metas via arquivo Excel/CSV com mapeamento flexível de colunas
- ✅ Opção para limpar dados antigos antes de reimportar
- ✅ Visualização de metas por setor ou coordenador
- ✅ Acompanhamento de status (Pendente, Em Andamento, Concluído)
- ✅ Registro de evidências e observações
- ✅ Dashboard com progresso consolidado por setor
- ✅ Cálculo automático de pontuação
- ✅ Alertas de prazo próximo

## 🔧 Tecnologias

- **Frontend**: React + TypeScript + Vite
- **UI**: Shadcn-ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + API)
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

#### 2.4. Executar Migration do Banco

No Supabase, vá em **SQL Editor** → **New query** e cole o conteúdo completo de:
`supabase/migrations/20251127_inicial_completa.sql`

Clique em **Run** para criar:
- ✅ Tabela `metas_base` (com artigo, requisito e todos os campos)
- ✅ Tabela `updates` (para acompanhamento de status)
- ✅ Índices para performance
- ✅ Políticas RLS
- ✅ Triggers automáticos

#### 2.5. Verificar Instalação

Execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('metas_base', 'updates');

-- Verificar índices
SELECT COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('metas_base', 'updates');
```

Resultado esperado: 2 tabelas e 8 índices.

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

## 📊 Importação de Metas

### Formato do Arquivo Excel/CSV

| Campo | Tipo | Obrigatório | Exemplo |
|-------|------|-------------|---------|
| Eixo | Texto | ✅ Sim | Governança e Gestão Judiciária |
| Item | Texto | ✅ Sim | Planejamento Estratégico |
| Artigo | Texto | ✅ Sim | Art. 1º |
| Requisito | Texto | ✅ Sim | I |
| Descrição | Texto | Não | Implementar sistema... |
| Pontos Aplicáveis | Número | ✅ Sim | 10 |
| Setor Executor | Texto | Não | TI |
| Coordenador | Texto | Não | João Silva |
| Deadline | Data | ✅ Sim | 31/12/2026 |

### Como Importar

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

### Visão por Setor
1. Acesse a página inicial após importar
2. Clique em "Selecionar por Setor"
3. Escolha o setor desejado
4. Visualize todas as metas do setor

### Visão por Coordenador
1. Clique em "Selecionar por Coordenador"
2. Escolha o coordenador
3. Veja consolidação por setor + metas individuais

### Atualizar Meta
1. Clique em qualquer card de meta
2. No modal, atualize:
   - **Status**: Pendente → Em Andamento → Concluído
   - **Link de Evidência**: URL com comprovações
   - **Observações**: Notas sobre o andamento
3. Clique em "Salvar"

### Dashboard

- **Barra de Progresso**: Percentual de pontos conquistados
- **Agrupamento por Eixo**: Metas organizadas por categoria
- **Consolidação por Setor**: Para coordenadores, veja progresso de cada setor
- **Alertas de Prazo**: Metas com menos de 30 dias aparecem destacadas

## 🔐 Segurança

### Arquivo .env

- ✅ `.env` está no `.gitignore` (não é versionado)
- ✅ `.env.example` serve como template (SEM credenciais)
- ⚠️ **NUNCA commite o arquivo `.env` com credenciais reais**

### Supabase

O sistema usa Supabase com políticas RLS (Row Level Security) configuradas para acesso público. 

**Para adicionar autenticação:**

1. Ative um provider de autenticação no Supabase (Email, Google, etc.)
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
│   │   ├── client.ts        # Cliente configurado
│   │   └── types.ts         # Tipos do banco
│   └── lib/utils.ts
├── supabase/migrations/
│   └── 20251127_inicial_completa.sql  # Migration única
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
