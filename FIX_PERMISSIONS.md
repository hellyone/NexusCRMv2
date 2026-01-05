# Correção de Permissões - Prisma Migrate no Docker

## Problema

Ao executar `npx prisma migrate deploy` no container, o erro indica que o Prisma não pode escrever em `/app/node_modules/@prisma/engines`.

Isso acontece porque o container roda com um usuário não-root (`nextjs`), mas os diretórios podem ter permissões incorretas.

## Soluções

### Solução 1: Executar como root (Temporária)

```bash
# Executar migration como root
docker exec -u root nexus-os npx prisma migrate deploy
```

### Solução 2: Ajustar permissões do diretório

```bash
# Ajustar permissões do diretório node_modules
docker exec -u root nexus-os chown -R nextjs:nodejs /app/node_modules/@prisma

# Depois executar a migration normalmente
docker exec nexus-os npx prisma migrate deploy
```

### Solução 3: Usar init-db.sh (Recomendado)

O script `init-db.sh` já deve rodar as migrations automaticamente. Se não funcionou, verifique os logs:

```bash
# Ver logs do container
docker logs nexus-os | grep -i prisma

# Ou verificar se o script foi executado
docker logs nexus-os | tail -50
```

### Solução 4: Rebuild do container (Se necessário)

Se o problema persistir, pode ser necessário fazer rebuild:

```bash
# Parar container
docker stop nexus-os

# Rebuild (ajustar conforme necessário)
docker compose build nexus-os

# Iniciar novamente
docker compose up -d nexus-os

# As migrations devem rodar automaticamente via init-db.sh
```

## Para o Futuro

Se o problema persistir, podemos ajustar o Dockerfile para garantir que o diretório node_modules tenha as permissões corretas antes de mudar para o usuário `nextjs`.

