#!/bin/sh
# Script de backup do PostgreSQL
# Uso: ./scripts/backup-db.sh [nome-do-backup]

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${1:-nexus_os_backup_${TIMESTAMP}}"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

echo "📦 Iniciando backup do banco de dados..."

# Extrair informações da DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erro: DATABASE_URL não está definida"
    exit 1
fi

# Usar pg_dump via docker se estiver em container, ou diretamente
if command -v pg_dump > /dev/null 2>&1; then
    pg_dump "$DATABASE_URL" -F c -f "${BACKUP_DIR}/${BACKUP_NAME}.dump"
elif [ -n "$DOCKER_CONTAINER" ]; then
    # Se estiver rodando em container, usar docker exec
    docker exec "$DOCKER_CONTAINER" pg_dump "$DATABASE_URL" -F c > "${BACKUP_DIR}/${BACKUP_NAME}.dump"
else
    echo "❌ Erro: pg_dump não encontrado. Instale PostgreSQL client ou use Docker."
    exit 1
fi

echo "✅ Backup criado: ${BACKUP_DIR}/${BACKUP_NAME}.dump"
echo "📊 Tamanho: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}.dump" | cut -f1)"

