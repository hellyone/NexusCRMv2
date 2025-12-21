# Nexus OS 🚀

Sistema Integrado de Gestão para Assistência Técnica e Manutenção Industrial.
Desenvolvido com **Next.js 16**, **React 19**, **TailwindCSS** e **Prisma**.

## 📋 Sobre o Projeto

O **Nexus OS** é uma plataforma completa para gerenciamento de ordens de serviço (OS), focado em empresas de manutenção industrial e assistência técnica. O sistema centraliza o controle de clientes, equipamentos, estoques, técnicos e serviços financeiros.

### Principais Módulos

*   **🛠️ Ordens de Serviço (OS)**: Abertura inteligente de chamados (Interno/Externo), rastreabilidade por Serial Number, e fluxo de status (Aberto -> Em Andamento -> Finalizado).
*   **🏭 Gestão de Ativos**: Cadastro detalhado de equipamentos industriais (Torno CNC, Injetoras, PLCs) com histórico de manutenção e garantias.
*   **📦 Controle de Estoque**: Gestão de peças com controle de entrada/saída, separação por estoque de Venda vs. Consumo e baixa automática em OS.
*   **👥 CRM e Equipe**: Cadastro completo de clientes (PJ/PF) e gestão de técnicos com controle de especialidades (Eletrônica, Mecânica, etc.).
*   **📊 Financeiro e KPIs**: Dashboard com indicadores de performance, faturamento e alertas de estoque baixo.

## 🚀 Tecnologias Utilizadas

*   **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS, Lucide Icons, Shadcn/UI.
*   **Backend**: Server Actions (Next.js), Prisma ORM.
*   **Banco de Dados**: SQLite (Desenvolvimento) / PostgreSQL (Produção - Recomendado).
*   **Segurança**: NextAuth.js (v5) para autenticação e controle de acesso.
*   **PDF**: @react-pdf/renderer para geração de laudos técnicos.

## ⚙️ Pré-requisitos

*   Node.js 20.x ou superior.
*   NPM ou PNPM.

## 🔧 Instalação e Configuração

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/hellyone/nexus-os.git
    cd nexus-os
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configuração de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto com as chaves necessárias (veja `.env.example` se houver, ou use o template abaixo):
    ```env
    DATABASE_URL="file:./dev.db"
    AUTH_SECRET="sua-chave-secreta-aqui"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```

4.  **Configuração do Banco de Dados:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Executar o Projeto:**
    ```bash
    npm run dev
    ```
    Acesse [http://localhost:3000](http://localhost:3000).

## 📱 Funcionalidades Específicas

### 🔧 Modo Assistência Técnica (Campo)
O sistema possui uma interface otimizada para técnicos de campo (`/field`), com foco em:
*   Abertura rápida de OS.
*   Preenchimento inteligente de endereço (CEP).
*   Funcionamento otimizado para mobile.

### 📄 Relatórios Técnicos
Geração automática de laudos técnicos em PDF com diagnóstico, solução, peças utilizadas e valores.

## 📞 Suporte ou Contato

Desenvolvido por **Guilherme**.
Para dúvidas ou suporte, entre em contato via issues no GitHub.
