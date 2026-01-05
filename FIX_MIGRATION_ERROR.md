# Correção de Erro de Migration - Tabelas Já Existem

## Problema

A migration `20251227155234_add_stock_service_column` está falhando porque tenta criar tabelas que já existem no banco de dados:

```
ERROR: relation "Client" already exists
```

Isso acontece quando:
- O banco de dados já foi criado anteriormente
- A migration tenta criar todas as tabelas do zero
- As tabelas já existem no banco

## Solução

### Opção 1: Marcar Migration como Aplicada (Recomendado)

Se o banco já tem todas as tabelas necessárias, podemos marcar a migration como aplicada sem executá-la:

```bash
# Marcar a migration como aplicada (sem executar)
sudo docker exec -u root nexus-os npx prisma migrate resolve --applied 20251227155234_add_stock_service_column

# Depois verificar status
sudo docker exec -u root nexus-os npx prisma migrate status
```

### Opção 2: Criar Nova Migration Apenas com Alterações

Se você precisa das novas alterações (serviceInvoiceNumber, deliveredToExpeditionAt), vamos criar uma nova migration apenas com essas alterações:

```bash
# 1. Marcar migration atual como aplicada (se as tabelas já existem)
sudo docker exec -u root nexus-os npx prisma migrate resolve --applied 20251227155234_add_stock_service_column

# 2. Criar nova migration apenas com as alterações
sudo docker exec -u root nexus-os npx prisma migrate dev --name add_service_invoice_and_delivery_tracking --create-only

# 3. Aplicar a nova migration
sudo docker exec -u root nexus-os npx prisma migrate deploy
```

### Opção 3: Verificar o que a Migration Tenta Fazer

Primeiro, vamos verificar o que a migration tenta fazer:

```bash
# Ver conteúdo da migration
sudo docker exec nexus-os cat prisma/migrations/20251227155234_add_stock_service_column/migration.sql | head -50
```

Se a migration tenta criar tudo do zero, mas o banco já existe, a melhor solução é a Opção 1.

## Verificar Estado Atual

```bash
# Ver status das migrations
sudo docker exec -u root nexus-os npx prisma migrate status

# Ver tabelas existentes no banco
sudo docker exec nexus-db psql -U nexus -d nexus_os -c "\dt"

# Ver se as novas colunas já existem
sudo docker exec nexus-db psql -U nexus -d nexus_os -c "\d \"ServiceOrder\"" | grep -E "serviceInvoiceNumber|deliveredToExpeditionAt"
```

## Próximos Passos

1. **Verificar se as tabelas já existem**: Execute `\dt` no banco
2. **Se existem**: Marcar migration como aplicada (Opção 1)
3. **Se não existem as novas colunas**: Criar nova migration (Opção 2)
4. **Aplicar as novas alterações**: Executar `migrate deploy`

