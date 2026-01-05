#!/bin/bash
# Script de atualização da aplicação em produção
# Use este script para atualizar a aplicação sem perder dados

set -e  # Parar em caso de erro

echo "🚀 Iniciando atualização do Nexus OS..."
echo ""

# Detectar comando docker-compose (versão antiga) ou docker compose (versão nova)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Erro: docker-compose ou 'docker compose' não encontrado!"
    echo "Instale Docker Compose ou use 'docker compose' (Docker 20.10+)"
    exit 1
fi

echo "📋 Usando: $DOCKER_COMPOSE"
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Fazer backup do banco de dados
echo -e "${YELLOW}📦 Passo 1: Fazendo backup do banco de dados...${NC}"
BACKUP_DIR="./backups"
BACKUP_NAME="backup_pre_update_$(date +%Y%m%d_%H%M%S).sql"

mkdir -p "$BACKUP_DIR"

# Backup do PostgreSQL
docker exec nexus-db pg_dump -U nexus nexus_os > "$BACKUP_DIR/$BACKUP_NAME" 2>/dev/null || {
    echo -e "${RED}❌ Erro ao fazer backup. Continuando mesmo assim...${NC}"
}

if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
    echo -e "${GREEN}✅ Backup criado: $BACKUP_DIR/$BACKUP_NAME (${BACKUP_SIZE})${NC}"
else
    echo -e "${YELLOW}⚠️  Backup não foi criado. Continuando...${NC}"
fi

echo ""

# 2. Parar containers
echo -e "${YELLOW}⏸️  Passo 2: Parando containers...${NC}"
$DOCKER_COMPOSE stop nexus-os
echo -e "${GREEN}✅ Container nexus-os parado${NC}"
echo ""

# 3. Atualizar código (se usando git)
if [ -d ".git" ]; then
    echo -e "${YELLOW}📥 Passo 3: Atualizando código do Git...${NC}"
    git pull origin main || {
        echo -e "${YELLOW}⚠️  Git pull falhou ou não há mudanças. Continuando...${NC}"
    }
    echo -e "${GREEN}✅ Código atualizado${NC}"
    echo ""
fi

# 4. Rebuild da imagem
echo -e "${YELLOW}🔨 Passo 4: Reconstruindo imagem Docker...${NC}"
$DOCKER_COMPOSE build nexus-os
echo -e "${GREEN}✅ Imagem reconstruída${NC}"
echo ""

# 5. Executar migrations
echo -e "${YELLOW}🗄️  Passo 5: Executando migrations do banco de dados...${NC}"
$DOCKER_COMPOSE up -d nexus-os
echo "Aguardando container iniciar..."
sleep 5

# Executar migrations
docker exec nexus-os npx prisma migrate deploy || {
    echo -e "${YELLOW}⚠️  Migration falhou. Verifique os logs.${NC}"
    echo "Logs: docker logs nexus-os"
}
echo -e "${GREEN}✅ Migrations executadas${NC}"
echo ""

# 6. Verificar health check
echo -e "${YELLOW}🏥 Passo 6: Verificando health check...${NC}"
sleep 3

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Health check OK (Status: $HEALTH_CHECK)${NC}"
else
    echo -e "${RED}❌ Health check falhou (Status: $HEALTH_CHECK)${NC}"
    echo "Verifique os logs: docker logs nexus-os"
fi
echo ""

# 7. Status final
echo -e "${YELLOW}📊 Passo 7: Status final...${NC}"
$DOCKER_COMPOSE ps
echo ""

echo -e "${GREEN}✅ Atualização concluída!${NC}"
echo ""
echo "📝 Verificações recomendadas:"
echo "  - Ver logs: docker logs nexus-os"
echo "  - Ver logs do banco: docker logs nexus-db"
echo "  - Testar aplicação: http://localhost:3000"
echo "  - Health check: curl http://localhost:3000/api/health"
echo ""
echo "💾 Backup salvo em: $BACKUP_DIR/$BACKUP_NAME"

