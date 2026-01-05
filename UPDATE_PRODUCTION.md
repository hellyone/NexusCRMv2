# Guia de Atualização em Produção - Nexus OS

Este guia explica como atualizar a aplicação Nexus OS em um servidor Ubuntu/Docker que já está rodando.

## 📋 Situação Atual

Você já tem a aplicação rodando:
- Container `nexus-os` na porta 3000
- Container `nexus-db` (PostgreSQL)
- Dados em volumes persistentes (não serão perdidos)

## ✅ Opção Recomendada: Atualização In-Place

**Você NÃO precisa recriar tudo!** Basta atualizar o container da aplicação.

Os dados estão seguros porque:
- ✅ Banco de dados está em volume persistente (`postgres_data`)
- ✅ Uploads estão em volume persistente (se configurado)
- ✅ Apenas o container da aplicação será atualizado

## 🚀 Passo a Passo de Atualização

**Nota**: Se você usar `docker compose` (com espaço) ao invés de `docker-compose` (com hífen), o script detecta automaticamente. A versão moderna do Docker usa `docker compose`.

### Método 1: Usando o Script Automático (Recomendado)

1. **Conectar ao servidor:**
   ```bash
   ssh ubuntu@poseidon
   ```

2. **Navegar para o diretório da aplicação:**
   ```bash
   cd /caminho/do/nexus-os  # Ajuste conforme seu diretório
   ```

3. **Tornar o script executável:**
   ```bash
   chmod +x scripts/update-production.sh
   ```

4. **Executar o script de atualização:**
   ```bash
   ./scripts/update-production.sh
   ```

O script faz automaticamente:
- ✅ Backup do banco de dados
- ✅ Para o container
- ✅ Atualiza código (git pull)
- ✅ Rebuild da imagem
- ✅ Executa migrations
- ✅ Verifica health check

### Método 2: Manual (Passo a Passo)

#### Passo 1: Fazer Backup do Banco de Dados (IMPORTANTE!)

```bash
# Criar diretório de backups
mkdir -p backups

# Fazer backup do PostgreSQL
docker exec nexus-db pg_dump -U nexus nexus_os > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar se o backup foi criado
ls -lh backups/
```

#### Passo 2: Atualizar Código (se usando Git)

```bash
# Navegar para o diretório da aplicação
cd /caminho/do/nexus-os

# Atualizar código
git pull origin main
```

**OU** se você fez upload manual:
```bash
# Copiar novos arquivos via SCP/SFTP ou fazer git clone em outro diretório
```

#### Passo 3: Parar Container da Aplicação

```bash
# Parar apenas o container da aplicação (banco continua rodando)
docker-compose stop nexus-os

# OU usando docker diretamente:
docker stop nexus-os
```

#### Passo 4: Reconstruir Imagem

```bash
# Se usando docker-compose (versão antiga):
docker-compose build nexus-os

# OU se usando docker compose (versão moderna, Docker 20.10+):
docker compose build nexus-os

# OU se usando docker diretamente (ajuste conforme necessário):
docker build -t nexus-os-nexus-os .
```

#### Passo 5: Iniciar Container e Executar Migrations

```bash
# Iniciar container
docker-compose up -d nexus-os

# OU:
docker start nexus-os

# Aguardar container iniciar (5-10 segundos)
sleep 5

# Executar migrations do Prisma
docker exec nexus-os npx prisma migrate deploy
```

#### Passo 6: Verificar Health Check

```bash
# Verificar se a aplicação está respondendo
curl http://localhost:3000/api/health

# Deve retornar: {"status":"ok","timestamp":"...","checks":{...}}
```

#### Passo 7: Verificar Logs

```bash
# Ver logs da aplicação
docker logs nexus-os

# Ver logs do banco (se necessário)
docker logs nexus-db

# Acompanhar logs em tempo real
docker logs -f nexus-os
```

#### Passo 8: Verificar Status dos Containers

```bash
# Ver status de todos os containers
docker ps

# OU usando docker-compose:
docker-compose ps
```

## 🔄 Atualização Completa (Se Necessário)

Se você precisar recriar TUDO (não recomendado, apenas se houver problemas):

### ⚠️ ATENÇÃO: Isto irá PARAR todos os containers!

```bash
# 1. Fazer backup completo (MUITO IMPORTANTE!)
docker exec nexus-db pg_dump -U nexus nexus_os > backup_completo_$(date +%Y%m%d_%H%M%S).sql

# 2. Parar todos os containers
docker-compose down

# 3. Atualizar código (git pull)

# 4. Rebuild
docker-compose build

# 5. Iniciar tudo novamente
docker-compose up -d

# 6. Executar migrations
docker exec nexus-os npx prisma migrate deploy
```

## 🐛 Troubleshooting

### Problema: Container não inicia

```bash
# Ver logs detalhados
docker logs nexus-os

# Verificar se banco está acessível
docker exec nexus-db psql -U nexus -d nexus_os -c "SELECT 1"
```

### Problema: Migration falha

```bash
# Ver status das migrations
docker exec nexus-os npx prisma migrate status

# Ver logs do Prisma
docker logs nexus-os | grep -i prisma
```

### Problema: Health check falha

```bash
# Verificar se container está rodando
docker ps | grep nexus-os

# Ver logs
docker logs nexus-os --tail 50

# Verificar conectividade com banco
docker exec nexus-os env | grep DATABASE_URL
```

### Problema: Porta 3000 em uso

```bash
# Verificar o que está usando a porta
sudo lsof -i :3000

# Parar processo conflitante ou ajustar porta no docker-compose.yml
```

### Restaurar Backup (Se Necessário)

```bash
# Restaurar backup do banco
cat backups/backup_YYYYMMDD_HHMMSS.sql | docker exec -i nexus-db psql -U nexus -d nexus_os

# OU copiar arquivo para container primeiro
docker cp backups/backup_YYYYMMDD_HHMMSS.sql nexus-db:/tmp/
docker exec nexus-db psql -U nexus -d nexus_os < /tmp/backup_YYYYMMDD_HHMMSS.sql
```

## 📝 Checklist Pós-Atualização

- [ ] Backup do banco criado antes da atualização
- [ ] Código atualizado (git pull ou upload manual)
- [ ] Imagem reconstruída com sucesso
- [ ] Migrations executadas sem erros
- [ ] Health check retorna 200 OK
- [ ] Container está com status "Up"
- [ ] Logs não mostram erros críticos
- [ ] Aplicação acessível em http://servidor:3000
- [ ] Login funciona
- [ ] Funcionalidades principais testadas

## 🔒 Segurança

Após atualização, verifique:

- [ ] `AUTH_SECRET` ainda está configurado corretamente
- [ ] `DATABASE_URL` está correta
- [ ] Headers de segurança estão ativos (verificar no navegador)
- [ ] Upload de arquivos funciona com validação melhorada

## 📞 Comandos Úteis

```bash
# Ver logs em tempo real
docker logs -f nexus-os

# Entrar no container
docker exec -it nexus-os sh

# Ver uso de recursos
docker stats nexus-os nexus-db

# Reiniciar apenas a aplicação (sem rebuild)
docker restart nexus-os

# Ver variáveis de ambiente do container
docker exec nexus-os env | grep -E "DATABASE_URL|AUTH_SECRET|NODE_ENV"
```

## ⚠️ Importante

1. **SEMPRE faça backup antes de atualizar!**
2. O banco de dados **NÃO será afetado** (está em volume)
3. Uploads **podem estar em volume** - verifique antes
4. Apenas o código da aplicação será atualizado
5. Migrations são executadas automaticamente após atualização

## 🎯 Resumo Rápido (TL;DR)

```bash
# 1. Backup
docker exec nexus-db pg_dump -U nexus nexus_os > backup.sql

# 2. Atualizar código
cd /caminho/do/nexus-os && git pull

# 3. Rebuild e restart
docker-compose stop nexus-os
docker-compose build nexus-os
docker-compose up -d nexus-os

# 4. Migrations
docker exec nexus-os npx prisma migrate deploy

# 5. Verificar
curl http://localhost:3000/api/health
docker logs nexus-os
```

---

**Recomendação**: Use o script `scripts/update-production.sh` para atualização automática e segura!

