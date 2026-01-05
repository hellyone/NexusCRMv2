-- Script para adicionar as novas colunas ao ServiceOrder
-- Execute este script no banco de dados se a migration falhar

-- Adicionar coluna serviceInvoiceNumber (NF de Serviço)
ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "serviceInvoiceNumber" TEXT;

-- Adicionar coluna deliveredToExpeditionAt (timestamp de entrega na expedição)
ALTER TABLE "ServiceOrder" ADD COLUMN IF NOT EXISTS "deliveredToExpeditionAt" TIMESTAMP(3);

