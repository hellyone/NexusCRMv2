# Migração Nexus OS: Docker/Linux → Vercel + Supabase

Guia para rodar o projeto na Vercel (front + API) e Supabase (PostgreSQL + Storage).

---

## 1. Supabase

### 1.1 Criar projeto
- Acesse [supabase.com](https://supabase.com) e crie um projeto.
- Anote: **Project URL**, **anon key**, e em **Settings → Database** a **Connection string** (URI).

### 1.2 Connection string para Vercel (serverless)
No Supabase: **Settings → Database → Connection string**:
- Use a **Connection pooling** (porta **6543**, modo Transaction), não a direta (5432).
- Formato: `postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
- No Vercel você vai colocar isso em `DATABASE_URL`.

### 1.3 Storage (fotos de equipamentos)
- **Storage → New bucket**: crie um bucket, ex: `uploads`.
- Deixe o bucket **público** (para ler imagens por URL) ou use políticas RLS e URLs assinadas.
- O código do projeto usa o bucket `uploads` com pasta `equipments`.

---

## 2. Vercel

### 2.1 Conectar o repositório
- [vercel.com](https://vercel.com) → Add New → Project → importe `hellyone/nexus-os`.
- Build: **Next.js** (detectado automaticamente).
- **Root Directory**: deixe em branco.
- Não use Docker na Vercel.

### 2.2 Variáveis de ambiente
Em **Settings → Environment Variables** do projeto na Vercel, configure:

| Variável | Valor | Observação |
|----------|--------|------------|
| `DATABASE_URL` | URI do Supabase (pooler, porta 6543) | Obrigatório |
| `AUTH_SECRET` | String longa e aleatória | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL do app na Vercel | Ex: `https://nexus-os.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | Mesma que `NEXTAUTH_URL` | Opcional |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase | Para upload de imagens |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role em API Keys | Para upload no backend (não anon) |

Para **upload no Storage** (recomendado na Vercel), use também:

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://[seu-projeto].supabase.co |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave **service_role** (Settings → API) |

---

## 3. Prisma

### 3.1 Schema
- O `schema.prisma` já usa `env("DATABASE_URL")`. Só garanta que no Supabase a URL seja a **pooler** (6543).
- Se quiser usar só na Vercel (sem Docker), pode remover `binaryTargets` ou deixar só `"native"` no `generator`.

### 3.2 Migrações
A Vercel **não** roda migrações automaticamente. Faça uma das opções:

**Opção A – Na sua máquina (recomendado)**  
Após criar o projeto no Supabase e ter a `DATABASE_URL`:
```bash
# .env.local com DATABASE_URL do Supabase (pooler)
npx prisma migrate deploy
npx prisma db seed
```

**Opção B – Script no postinstall (não recomendado em produção)**  
Evite rodar `migrate deploy` no build da Vercel; pode causar race e timeout.

---

## 4. Upload de imagens

Na Vercel o sistema de arquivos é efêmero: não dá para gravar em `public/uploads`.  
O projeto está preparado para usar **Supabase Storage** quando as variáveis de ambiente estiverem definidas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Se essas variáveis existirem, a API de upload envia o arquivo para o bucket `uploads` (pasta `equipments`) e devolve a URL pública. Se não existirem, a API de upload continua tentando gravar em disco (útil para desenvolvimento local).

---

## 5. Checklist rápido

- [ ] Projeto criado no Supabase; connection string **pooler** (6543) anotada.
- [ ] Bucket `uploads` criado no Storage (público ou com políticas).
- [ ] Projeto na Vercel conectado ao repo GitHub.
- [ ] Variáveis de ambiente configuradas na Vercel (incluindo `NEXTAUTH_URL` com a URL real do app).
- [ ] Migrações rodadas contra o banco Supabase (`prisma migrate deploy`).
- [ ] Seed executado se precisar de usuário inicial (`prisma db seed`).
- [ ] Teste de login (ex.: `admin` / `password` após o seed).
- [ ] Teste de upload de foto de equipamento (Storage no Supabase).

---

## 6. Diferenças em relação ao Docker

| Aspecto | Docker (Linux) | Vercel + Supabase |
|--------|-----------------|-------------------|
| Banco | PostgreSQL no container ou externo | Supabase (PostgreSQL gerenciado) |
| Arquivos | `public/uploads` no disco | Supabase Storage |
| Variáveis | `.env` ou docker-compose | Environment Variables na Vercel |
| Migrações | Você roda no host ou no container | Você roda local com `DATABASE_URL` do Supabase |
| Auth | NextAuth com `NEXTAUTH_URL` do host | NextAuth com `NEXTAUTH_URL` da URL da Vercel |

Depois da migração, você pode manter o Docker apenas para desenvolvimento local, usando no `.env.local` a mesma `DATABASE_URL` do Supabase (pooler) se quiser.
