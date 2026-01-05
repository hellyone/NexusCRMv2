# Guia de Deploy Docker/Portainer - Nexus OS

Este guia explica como fazer o deploy do Nexus OS usando Docker e Portainer.

## 📋 Pré-requisitos

- Docker e Docker Compose instalados
- Portainer instalado e configurado (opcional, mas recomendado)
- Acesso SSH ao servidor (se deploy remoto)

## 🚀 Deploy Rápido

### 1. Preparar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto baseado em `.env.docker.example`:

```bash
cp .env.docker.example .env
```

Edite o `.env` e configure:
- `DATABASE_URL`: String de conexão PostgreSQL
- `AUTH_SECRET`: Chave secreta forte (mínimo 32 caracteres)
- `NEXTAUTH_URL`: URL pública da aplicação
- `POSTGRES_PASSWORD`: Senha forte para o banco de dados

**Gerar AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Build e Iniciar Containers

```bash
# Build das imagens
docker-compose build

# Iniciar containers
docker-compose up -d

# Verificar logs
docker-compose logs -f nexus-os
```

### 3. Executar Migrações do Banco

```bash
# Executar migrações
docker-compose exec nexus-os npx prisma migrate deploy

# Ou usar o script de init
docker-compose exec nexus-os sh /app/scripts/init-db.sh
```

### 4. Verificar Health Check

```bash
# Verificar status dos containers
docker-compose ps

# Testar health check
curl http://localhost:3000/api/health
```

## 📦 Deploy via Portainer

### 1. Preparar Stack

1. Acesse o Portainer
2. Vá em **Stacks** > **Add Stack**
3. Cole o conteúdo do `docker-compose.yml`
4. Configure as variáveis de ambiente na seção **Environment variables**
5. Clique em **Deploy the stack**

### 2. Configurar Variáveis no Portainer

No Portainer, configure as seguintes variáveis de ambiente:

**Obrigatórias:**
- `DATABASE_URL`: `postgresql://nexus:SUA_SENHA@db:5432/nexus_os?schema=public`
- `AUTH_SECRET`: Sua chave secreta (gerada com `openssl rand -base64 32`)
- `NEXTAUTH_URL`: `https://seu-dominio.com` ou `http://SEU_IP:3000`

**Opcionais:**
- `APP_URL`: URL da aplicação
- `POSTGRES_USER`: Usuário do PostgreSQL (padrão: `nexus`)
- `POSTGRES_PASSWORD`: Senha do PostgreSQL
- `POSTGRES_DB`: Nome do banco (padrão: `nexus_os`)
- Variáveis SMTP (se usar notificações por email)

### 3. Usar Docker Secrets (Recomendado para Produção)

Para maior segurança, use Docker secrets ao invés de variáveis de ambiente:

1. No Portainer, vá em **Secrets** > **Add secret**
2. Crie secrets para:
   - `db_password`
   - `auth_secret`
   - `smtp_password` (se usar email)

3. No `docker-compose.yml`, use:
```yaml
secrets:
  - db_password
  - auth_secret

secrets:
  db_password:
    external: true
  auth_secret:
    external: true
```

## 🔧 Configurações Importantes

### Resource Limits

O `docker-compose.yml` já inclui limites de recursos:
- **nexus-os**: Máximo 2 CPU, 2GB RAM
- **db**: Máximo 1 CPU, 1GB RAM

Ajuste conforme necessário no Portainer ou no arquivo.

### Volumes Persistentes

- `postgres_data`: Dados do PostgreSQL
- `uploads_data`: Arquivos enviados pelos usuários

**Importante**: Faça backup regular dos volumes!

### Health Checks

Ambos os containers têm health checks configurados:
- **nexus-os**: Verifica `/api/health` a cada 30s
- **db**: Verifica se PostgreSQL está pronto

## 📊 Monitoramento

### Logs

```bash
# Logs da aplicação
docker-compose logs -f nexus-os

# Logs do banco
docker-compose logs -f db

# Logs de ambos
docker-compose logs -f
```

### Status dos Containers

```bash
docker-compose ps
```

No Portainer, vá em **Containers** para ver o status visual.

## 🔄 Atualizações

### 1. Fazer Backup Primeiro

```bash
# Backup do banco
./scripts/backup-db.sh

# Ou manualmente
docker-compose exec db pg_dump -U nexus nexus_os > backup_$(date +%Y%m%d).sql
```

### 2. Atualizar Código

```bash
# Pull das mudanças
git pull

# Rebuild
docker-compose build

# Reiniciar
docker-compose up -d
```

### 3. Executar Migrações

```bash
docker-compose exec nexus-os npx prisma migrate deploy
```

## 💾 Backup e Restore

### Backup Manual

```bash
# Usar o script
./scripts/backup-db.sh

# Ou diretamente
docker-compose exec db pg_dump -U nexus nexus_os -F c > backup.dump
```

### Restore

```bash
# Usar o script
./scripts/restore-db.sh backup.dump

# Ou diretamente
docker-compose exec -T db pg_restore -U nexus -d nexus_os --clean --if-exists < backup.dump
```

### Backup Automatizado

Considere configurar backups automáticos usando:
- Cron job no host
- Container separado para backups
- Serviço de backup gerenciado

## 🔒 Segurança

### Checklist de Produção

- [ ] AUTH_SECRET forte (32+ caracteres)
- [ ] POSTGRES_PASSWORD forte
- [ ] NEXTAUTH_URL configurado corretamente
- [ ] Porta 5432 do PostgreSQL não exposta publicamente
- [ ] Usar HTTPS (reverse proxy com SSL)
- [ ] Resource limits configurados
- [ ] Logs estruturados ativados
- [ ] Backups automatizados
- [ ] Monitoramento configurado

### Reverse Proxy (Recomendado)

Para produção, use um reverse proxy (Nginx/Traefik) ao invés de expor a porta diretamente:

**Nginx exemplo:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker-compose logs nexus-os

# Verificar health check
curl http://localhost:3000/api/health

# Verificar variáveis de ambiente
docker-compose config
```

### Banco de dados não conecta

```bash
# Verificar se db está rodando
docker-compose ps db

# Testar conexão
docker-compose exec db psql -U nexus -d nexus_os -c "SELECT 1"

# Verificar DATABASE_URL
docker-compose exec nexus-os env | grep DATABASE_URL
```

### Migrações falham

```bash
# Verificar status das migrações
docker-compose exec nexus-os npx prisma migrate status

# Resetar (CUIDADO: perde dados)
docker-compose exec nexus-os npx prisma migrate reset
```

## 📞 Suporte

Para mais informações, consulte:
- [README.md](./README.md)
- [SERVER_REQUIREMENTS.md](./SERVER_REQUIREMENTS.md)
- Issues no GitHub

