#!/bin/sh
# Script de restore do PostgreSQL
# Uso: ./scripts/restore-db.sh <arquivo-backup.dump>

set -e

if [ -z "$1" ]; then
    echo "❌ Erro: Especifique o arquivo de backup"
    echo "Uso: $0 <arquivo-backup.dump>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Erro: Arquivo de backup não encontrado: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER o banco de dados atual!"
echo "Pressione Ctrl+C para cancelar ou Enter para continuar..."
read

echo "🔄 Restaurando backup: $BACKUP_FILE"

# Extrair informações da DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não está definida"
    exit 1
fi

# Usar pg_restore via docker se estiver em container, ou diretamente
if command -v pg_restore > /dev/null 2>&1; then
    pg_restore -d "$DATABASE_URL" --clean --if-exists "$BACKUP_FILE"
elif [ -n "$DOCKER_CONTAINER" ]; then
    # Se estiver rodando em container, usar docker exec
    cat "$BACKUP_FILE" | docker exec -i "$DOCKER_CONTAINER" pg_restore -d "$DATABASE_URL" --clean --if-exists
else
    echo "❌ Erro: pg_restore não encontrado. Instale PostgreSQL client ou use Docker."
    exit 1
fi

echo "✅ Restore concluído!"

