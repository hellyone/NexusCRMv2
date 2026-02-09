# Nexus CRM v2

Sistema integrado de gestão para assistência técnica e ordens de serviço. Desenvolvido com **Next.js 16**, **React 19**, **TailwindCSS**, **Prisma** e preparado para **Vercel** e **Supabase**.

## Sobre o projeto

O Nexus CRM v2 centraliza o controle de **ordens de serviço (OS)**, **clientes**, **equipamentos**, **técnicos**, **estoque** e **financeiro**, com fluxo completo desde a abertura da OS até a emissão de NF e liberação para expedição.

### Principais módulos

- **Ordens de Serviço** – Abertura, análise técnica, orçamento, aprovação/reprovação, execução, conclusão e entrega na expedição (com diferenciação entre NF de serviço e NF de retorno).
- **Comercial** – Laudo comercial, precificação, aprovação do cliente, faturamento e listas (em orçamento, aguardando aprovação, para faturar, finalizadas).
- **Gestão de ativos** – Cadastro de equipamentos com histórico, fotos (upload local ou Supabase Storage) e detecção de possível retorno em garantia.
- **Estoque** – Peças com estoque de venda e consumo, movimentações e baixa em OS.
- **Clientes e técnicos** – Cadastro PJ/PF, endereço por CEP e técnicos com especialidades.
- **Financeiro** – Dashboard, faturamento e indicadores.
- **Área do técnico** – Interface para técnicos de campo (`/field`) com abertura rápida de OS e uso em mobile.

### Stack

| Camada      | Tecnologia                          |
|------------|--------------------------------------|
| Frontend   | Next.js 16 (App Router), React 19, TailwindCSS, Lucide |
| Backend    | Server Actions, Prisma ORM           |
| Banco      | SQLite (dev) / PostgreSQL via Supabase (produção) |
| Auth       | NextAuth.js v5 (credentials)         |
| Deploy     | Vercel                               |
| Storage    | Supabase Storage (fotos de equipamentos em produção) |
| PDF        | @react-pdf/renderer (laudos técnicos) |

## Pré-requisitos

- **Node.js** 20.x ou superior  
- **npm** ou pnpm  

## Instalação e execução local

1. **Clone o repositório**
   ```bash
   git clone https://github.com/hellyone/NexusCRMv2.git
   cd NexusCRMv2
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o ambiente**
   Copie `.env.example` para `.env` e ajuste se necessário. Para desenvolvimento local com SQLite:
   ```env
   DATABASE_URL="file:./dev.db"
   AUTH_SECRET="uma-chave-secreta-longa-e-aleatoria"
   ```

4. **Banco de dados**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Inicie o projeto**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000).

### Acesso padrão (após o seed)

- **Usuário:** `admin`  
- **Senha:** `password`  

Altere a senha após o primeiro acesso em produção.

## Deploy (Vercel + Supabase)

O deploy em produção é feito na **Vercel**, com banco e arquivos no **Supabase** (PostgreSQL + Storage). O guia completo está em:

**[VERCEL_SUPABASE_MIGRATION.md](./VERCEL_SUPABASE_MIGRATION.md)**

Resumo:

1. Criar projeto no [Supabase](https://supabase.com) e anotar a **connection string (pooler, porta 6543)** e as chaves de API.
2. Criar o bucket `uploads` no Storage (para fotos de equipamentos).
3. Importar o repositório na [Vercel](https://vercel.com) e configurar as variáveis de ambiente (`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Rodar migrações e seed contra o banco Supabase a partir da sua máquina:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

## Scripts úteis

| Comando              | Descrição                    |
|----------------------|------------------------------|
| `npm run dev`        | Servidor de desenvolvimento  |
| `npm run build`      | Build de produção             |
| `npm run start`      | Inicia o app em modo produção |
| `npx prisma studio`  | Abre interface do banco       |

## Contato

Desenvolvido por **Guilherme**. Dúvidas ou sugestões: abra uma [issue](https://github.com/hellyone/NexusCRMv2/issues) no repositório.
