#!/bin/sh
# Script de inicialização do banco de dados
# Executa migrações do Prisma e seed (opcional)

set -e

echo "🔍 Verificando conexão com banco de dados..."

# Aguardar até que o banco esteja pronto
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  echo "⏳ Aguardando banco de dados..."
  sleep 2
done

echo "✅ Banco de dados conectado!"

echo "📦 Executando migrações do Prisma..."
npx prisma migrate deploy

echo "✅ Migrações concluídas!"

# Opcional: executar seed se necessário
# Descomente a linha abaixo se quiser executar seed automaticamente
# echo "🌱 Executando seed..."
# npm run prisma:seed || echo "⚠️  Seed não executado (pode não existir)"

echo "✅ Inicialização do banco de dados concluída!"

