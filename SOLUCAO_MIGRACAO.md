# Solução Imediata - Erro de Migration

## Problema

A migration `20251227155234_add_stock_service_column` está falhando porque tenta criar tabelas que já existem.

## Solução Rápida (Execute no Servidor)

### Passo 1: Marcar migration antiga como aplicada

```bash
sudo docker exec -u root nexus-os npx prisma migrate resolve --applied 20251227155234_add_stock_service_column
```

### Passo 2: Criar nova migration apenas com as alterações (serviceInvoiceNumber e deliveredToExpeditionAt)

Como o banco já existe, precisamos criar uma migration apenas com as novas colunas. Execute no servidor:

```bash
# Entrar no container
sudo docker exec -it -u root nexus-os sh

# Dentro do container, criar migration apenas com alterações
cd /app
npx prisma migrate dev --name add_service_invoice_and_delivery_tracking --create-only

# Sair do container
exit

# Aplicar a migration
sudo docker exec -u root nexus-os npx prisma migrate deploy
```

**OU** se preferir criar a migration SQL manualmente, execute no servidor:

```bash
# Conectar ao banco e adicionar as colunas manualmente
sudo docker exec -it nexus-db psql -U nexus -d nexus_os

# Dentro do psql, executar:
ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "serviceInvoiceNumber" TEXT;
ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "deliveredToExpeditionAt" TIMESTAMP(3);

# Sair do psql
\q

# Marcar migration como aplicada
sudo docker exec -u root nexus-os npx prisma migrate resolve --applied 20251227155234_add_stock_service_column
```

### Passo 3: Verificar se funcionou

```bash
# Verificar colunas adicionadas
sudo docker exec nexus-db psql -U nexus -d nexus_os -c "\d \"ServiceOrder\"" | grep -E "serviceInvoiceNumber|deliveredToExpeditionAt"

# Ver status das migrations
sudo docker exec -u root nexus-os npx prisma migrate status
```

## Alternativa: SQL Manual (MAIS RÁPIDO - Recomendado)

Se quiser adicionar as colunas diretamente sem criar migration:

```bash
# Opção 1: Usar o script SQL (já está no repositório)
sudo docker exec -i nexus-db psql -U nexus -d nexus_os < scripts/add_new_columns.sql

# Opção 2: Executar SQL diretamente
sudo docker exec nexus-db psql -U nexus -d nexus_os -c "ALTER TABLE \"ServiceOrder\" ADD COLUMN IF NOT EXISTS \"serviceInvoiceNumber\" TEXT;"
sudo docker exec nexus-db psql -U nexus -d nexus_os -c "ALTER TABLE \"ServiceOrder\" ADD COLUMN IF NOT EXISTS \"deliveredToExpeditionAt\" TIMESTAMP(3);"

# Depois marcar migration problemática como aplicada
sudo docker exec -u root nexus-os npx prisma migrate resolve --applied 20251227155234_add_stock_service_column

# Verificar se funcionou
sudo docker exec nexus-db psql -U nexus -d nexus_os -c "\d \"ServiceOrder\"" | grep -E "serviceInvoiceNumber|deliveredToExpeditionAt"
```

