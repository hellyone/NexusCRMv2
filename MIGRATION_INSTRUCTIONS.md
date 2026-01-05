# Instruções de Migração - Melhorias do Fluxo

## Campos Adicionados ao Schema

1. **serviceInvoiceNumber** (String?): NF de Serviço (quando OS aprovada)
2. **deliveredToExpeditionAt** (DateTime?): Timestamp de quando técnico entrega equipamento na expedição

## Migração do Banco de Dados

Execute no servidor após fazer pull:

```bash
# 1. Fazer backup (importante!)
docker exec nexus-db pg_dump -U nexus nexus_os > backup_antes_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. Executar migration
docker exec nexus-os npx prisma migrate deploy

# OU se estiver rodando localmente:
npx prisma migrate deploy
```

## Funcionalidades Implementadas

### 1. Diferenciação de NF de Serviço vs NF de Retorno

- ✅ Campo `serviceInvoiceNumber` adicionado
- ✅ Modal de faturamento atualizado com 3 campos:
  - NF Entrada (entryInvoiceNumber)
  - NF de Serviço (serviceInvoiceNumber) - apenas para OS aprovadas
  - NF de Retorno (exitInvoiceNumber) - sempre emitida
- ✅ Diferenciação visual entre fluxo de aprovação vs reprovação

### 2. Registro de Entrega na Expedição

- ✅ Campo `deliveredToExpeditionAt` adicionado
- ✅ Função `markDeliveredToExpedition` criada
- ✅ Botão "Confirmar Entrega na Expedição" para técnicos
- ✅ Comercial só pode faturar após técnico entregar (para fluxo de aprovação)
- ✅ Validação: técnico não pode entregar se status não for FINISHED

### 3. Fluxo Corrigido

- ✅ Comercial escolhe método de coleta (transportadora, balcão, entrega própria)
- ✅ Técnicos não podem escolher método de coleta
- ✅ Mensagens claras para cada papel

## Arquivos Modificados

- `prisma/schema.prisma` - Campos adicionados
- `src/actions/service-orders.js` - Função `markDeliveredToExpedition` e atualização de `updateCommercialDetails`
- `src/components/commercial/CommercialDetailsModal.js` - Modal atualizado com campos separados
- `src/components/tabs/OsGeneralTab.js` - Botão de entrega e validações
- `src/lib/validation.js` - Schema de validação atualizado

## Testes Recomendados

1. **Testar fluxo de aprovação:**
   - Técnico marca como FINISHED
   - Técnico marca "Confirmar Entrega na Expedição"
   - Comercial deve conseguir faturar (com campos NF de Serviço e NF de Retorno)
   - Comercial escolhe método de coleta

2. **Testar fluxo de reprovação:**
   - Cliente reprova
   - Técnico marca como FINISHED
   - Comercial deve conseguir faturar (apenas NF de Retorno)
   - Comercial escolhe método de coleta

3. **Validações:**
   - Comercial não deve conseguir faturar se técnico não entregou (fluxo de aprovação)
   - Técnico não deve conseguir entregar se status não for FINISHED
   - Modal deve mostrar campos corretos dependendo do fluxo

