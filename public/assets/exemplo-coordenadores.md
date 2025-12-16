# Exemplo de Planilha de Coordenadores Autorizados

Para importar coordenadores autorizados no sistema, crie uma planilha Excel (.xlsx) ou CSV com as seguintes colunas:

## Formato

| Nome | Email |
|------|-------|
| João Silva Santos | joao.silva@tjpb.jus.br |
| Maria Oliveira Costa | maria.oliveira@tjpb.jus.br |
| Pedro Almeida Souza | pedro.almeida@tjpb.jus.br |
| Ana Paula Rodrigues | ana.rodrigues@tjpb.jus.br |
| Carlos Eduardo Lima | carlos.lima@tjpb.jus.br |

## Instruções

1. **Nome**: Nome completo do coordenador (obrigatório)
2. **Email**: Email institucional do coordenador (obrigatório)
   - Deve ser um email válido
   - Será convertido automaticamente para minúsculas
   - Apenas coordenadores nesta lista poderão fazer login no sistema

## Como Importar

1. Acesse a página de **Importação** no sistema
2. Clique na aba **Coordenadores**
3. Faça upload da planilha
4. Confirme o mapeamento das colunas
5. Marque "Substituir lista existente" se quiser remover coordenadores anteriores
6. Clique em **Importar Coordenadores**

## Exemplo em CSV

```csv
Nome,Email
João Silva Santos,joao.silva@tjpb.jus.br
Maria Oliveira Costa,maria.oliveira@tjpb.jus.br
Pedro Almeida Souza,pedro.almeida@tjpb.jus.br
Ana Paula Rodrigues,ana.rodrigues@tjpb.jus.br
Carlos Eduardo Lima,carlos.lima@tjpb.jus.br
```

## Segurança

- ✅ Apenas emails importados podem criar conta
- ✅ Apenas emails importados podem fazer login
- ✅ Emails podem ser desativados sem deletar (campo `ativo`)
- ✅ Lista pode ser atualizada a qualquer momento
