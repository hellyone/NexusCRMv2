# Checklist de Deploy - Nexus OS

Use este checklist antes de fazer deploy em produção.

## 🔒 Segurança

- [ ] `AUTH_SECRET` configurado (mínimo 32 caracteres, gerado com `openssl rand -base64 32`)
- [ ] `POSTGRES_PASSWORD` forte configurado
- [ ] `NEXTAUTH_URL` configurado corretamente (domínio ou IP público)
- [ ] Credenciais não estão em código (usar variáveis de ambiente ou secrets)
- [ ] Porta 5432 do PostgreSQL não exposta publicamente
- [ ] HTTPS configurado (reverse proxy com SSL/TLS)
- [ ] Headers de segurança ativos (middleware)
- [ ] Upload de arquivos validado (magic numbers implementados)

## 🗄️ Banco de Dados

- [ ] PostgreSQL configurado e acessível
- [ ] `DATABASE_URL` configurada corretamente
- [ ] Migrations executadas: `npx prisma migrate deploy`
- [ ] Índices de performance aplicados
- [ ] Backup configurado (scripts ou automático)
- [ ] Teste de conexão bem-sucedido

## 🐳 Docker/Containers

- [ ] Docker e Docker Compose instalados
- [ ] `.env` configurado baseado em `.env.docker.example`
- [ ] Health checks funcionando: `curl http://localhost:3000/api/health`
- [ ] Containers com status "healthy": `docker-compose ps`
- [ ] Volumes persistentes configurados (postgres_data, uploads_data)
- [ ] Resource limits apropriados configurados
- [ ] Logs estruturados funcionando (JSON em produção)

## 📦 Aplicação

- [ ] Build executado sem erros: `docker-compose build`
- [ ] Containers iniciados: `docker-compose up -d`
- [ ] Aplicação acessível em `NEXTAUTH_URL`
- [ ] Login funcionando
- [ ] Upload de arquivos funcionando
- [ ] Health check respondendo: `/api/health`

## 📊 Monitoramento

- [ ] Logs sendo coletados (via `docker-compose logs` ou Portainer)
- [ ] Health checks configurados
- [ ] Alertas configurados (opcional, recomended)
- [ ] Backup automatizado configurado (opcional, recommended)

## 🧪 Testes

- [ ] Login/autenticação funciona
- [ ] Criar cliente funciona
- [ ] Criar OS funciona
- [ ] Upload de imagem funciona
- [ ] Listagens carregam corretamente
- [ ] Permissões de usuário funcionam (RBAC)

## 📝 Documentação

- [ ] Variáveis de ambiente documentadas
- [ ] Processo de backup documentado
- [ ] Processo de restore documentado
- [ ] Credenciais de acesso documentadas (em local seguro)
- [ ] `DEPLOY_DOCKER.md` lido e entendido

## 🔄 Após Deploy

- [ ] Primeiro login realizado
- [ ] Usuário admin criado
- [ ] Dados de teste importados (se necessário)
- [ ] Backup inicial executado
- [ ] Monitoramento ativo
- [ ] Equipe notificada sobre o deploy

## 🆘 Em Caso de Problemas

1. **Verificar logs:**
   ```bash
   docker-compose logs nexus-os
   docker-compose logs db
   ```

2. **Verificar health check:**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Verificar status dos containers:**
   ```bash
   docker-compose ps
   ```

4. **Verificar conexão com banco:**
   ```bash
   docker-compose exec db psql -U nexus -d nexus_os -c "SELECT 1"
   ```

5. **Verificar migrations:**
   ```bash
   docker-compose exec nexus-os npx prisma migrate status
   ```

6. **Restart containers:**
   ```bash
   docker-compose restart
   ```

## 📞 Contatos

- Documentação: `DEPLOY_DOCKER.md`
- Notas de migração: `MIGRATION_NOTES.md`
- Guia de deploy: `DEPLOY_GUIDE.md`

