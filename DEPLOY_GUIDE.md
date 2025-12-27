# Guia de Deploy: Nexus OS (Docker + GitHub)

Este guia orienta como configurar seu servidor Linux para rodar o Nexus OS usando Docker e atualizações automáticas via GitHub.

## 1. Preparação do Servidor (Linux)

Acesse seu servidor via SSH e instale o Docker e Docker Compose.

```bash
# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verifique a instalação
docker --version
docker compose version
```

## 2. Clonando o Projeto (Via GitHub)

No servidor, em vez de copiar arquivos manualmente, vamos puxar direto do seu repositório (já que estamos enviando tudo para lá).

```bash
# Crie uma pasta e clone o repositório
cd /home/ubuntu  # ou sua pasta de preferência
git clone https://github.com/hellyone/nexus-os.git
cd nexus-os
```

> **IMPORTANTE: Erro de Senha?**
> O GitHub não aceita mais sua senha normal de login para o terminal.
> Você precisa criar um **Token de Acesso Pessoal (PAT)**.
>
> 1. Vá em [GitHub Settings > Developer Settings > Tokens](https://github.com/settings/tokens).
> 2. Clique em "Generate new token (classic)".
> 3. Marque a opção **repo** (full control of private repositories).
> 4. Gere o token e **copie** (ele começa com `ghp_...`).
> 5. Use esse código **como sua senha** quando o terminal pedir.

## 3. Subindo o Sistema (Docker)

No servidor, entre na pasta do projeto e inicie os containers:

```bash
cd nexus-os
docker compose up -d
```

Isso vai iniciar 2 serviços:
- `nexus-os` (Aplicação na porta 3000)
- `db` (Banco de Dados Postgres)

## 4. Fluxo de Atualização (CI/CD Básico)

Agora que você clonou o projeto, o fluxo de atualização é simples:

1.  **No Windows (Desenvolvimento)**:
    - Faça suas alterações.
    - `git push origin main`

2.  **No Servidor (Produção)**:
    - Rode o script de deploy que já criamos:

```bash
cd nexus-os
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

O script vai fazer o `git pull` automático e recriar os containers com a nova versão.

---

### Endereços de Acesso
- **Aplicação**: `http://SEU_IP_DO_SERVIDOR:3000`

## 5. Manutenção e Limpeza

### Como reiniciar do Zero? (Limpar tudo)
Se você quiser apagar todo o banco de dados e configurações antigas (incluindo o Gitea que removemos) para começar limpo:

```bash
# O flag '-v' apaga também os Volumes (Banco de Dados)
docker compose down -v --remove-orphans

# Depois suba novamente
docker compose up -d --build
```
