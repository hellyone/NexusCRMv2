# Requisitos de Servidor - Nexus OS

Este documento detalha os requisitos mínimos e recomendados para hospedar a aplicação **Nexus OS**.

## 1. Stack Tecnológico Atual
*   **Framework**: Next.js 16 (React 19 RC)
*   **Banco de Dados**: SQLite (Atualmente configurado)
*   **Linguagem**: Node.js / JavaScript
*   **ORM**: Prisma

## 2. Requisitos de Hardware

### Mínimo (Pequena Escala / Testes)
*   **CPU**: 1 vCPU (Core compartilhado)
*   **RAM**: 1 GB
*   **Armazenamento**: 10 GB SSD
*   **Recomendação Ex**: AWS t3.micro, DigitalOcean Droplet Basic

### Recomendado (Produção / Múltiplos Usuários)
*   **CPU**: 2 vCPU
*   **RAM**: 2 GB ou superior (Next.js pode consumir memória durante o build/runtime)
*   **Armazenamento**: 20 GB SSD ou superior
*   **Recomendação Ex**: AWS t3.small, Vercel Pro, DigitalOcean 2GB

## 3. Requisitos de Software

### Sistema Operacional
*   **Linux (Recomendado)**: Ubuntu 22.04 LTS ou 24.04 LTS, Debian 11/12.
*   **Windows Server**: Possível, mas requer configuração adicional de proxy reverso (IIS/Nginx for Windows).

### Runtime e Ferramentas
*   **Node.js**: Versão 20.x (LTS) ou superior.
*   **Gerenciador de Pacotes**: npm ou pnpm.
*   **Process Manager**: PM2 (para manter a aplicação rodando em background).
*   **Web Server / Proxy Reverso**: Nginx (Recomendado) ou Apache.
    *   Necessário para redirecionar a porta 80/443 para a porta 3000 da aplicação.
    *   Necessário para gerenciar certificados SSL (HTTPS).

## 4. Banco de Dados (Considerações Futuras)

Atualmente o projeto utiliza **SQLite** (`provider = "sqlite"`).

*   **Vantagens**: Simples, arquivo local (`dev.db`), zero configuração externa.
*   **Limitações**: Não escala bem horizontalmente, backup requer cópia do arquivo, pode travar com muitas escritas simultâneas.

**Para Produção Futura (Recomendado):**
Migrar para **PostgreSQL**.
*   Alterar `schema.prisma` para `provider = "postgresql"`.
*   Necessita de um servidor PostgreSQL externo ou container Docker.
*   Permite backups automáticos, maior integridade e performance.

## 5. Variáveis de Ambiente (.env)

O servidor deve ter um arquivo `.env` configurado com:

```env
# Banco de Dados
DATABASE_URL="file:./dev.db"  # Ou string de conexão PostgreSQL futura

# Autenticação (NextAuth.js)
AUTH_SECRET="sua_chave_secreta_gerada_openssl" # Obrigatório para produção
AUTH_URL="https://seu-dominio.com" # URL canônica da aplicação

# Configurações Adicionais
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
```

## 6. Checklist de Deploy (Exemplo Ubuntu + Nginx)

1.  [ ] Provisionar servidor (VPS).
2.  [ ] Configurar Domínio (DNS A Record).
3.  [ ] Instalar Node.js 20+ e Nginx.
4.  [ ] Clonar repositório do Nexus OS.
5.  [ ] Executar `npm install` e `npm run build`.
6.  [ ] Executar `npx prisma migrate deploy` para criar/atualizar o banco.
7.  [ ] Configurar PM2: `pm2 start npm --name "nexus-os" -- start`.
8.  [ ] Configurar bloco de servidor Nginx (Proxy Pass port 3000).
9.  [ ] Instalar Certbot e gerar SSL (HTTPS).
