# Revisão do Fluxo - Nexus OS

## Contexto do Negócio

Sistema de gestão de ordens de serviço para assistência técnica de equipamentos industriais.

## Fluxo Completo Atual vs. Desejado

### 1. ENTRADA DO EQUIPAMENTO

**Situação Atual:**
- Equipamento chega na expedição (transportadora, coleta própria ou cliente)
- Comercial abre OS com: part number, serial, NF de entrada
- Foto do equipamento na recepção (registro de como chegou)

**Status no Sistema:** `OPEN` → `IN_ANALYSIS`

**Observações:**
- ✅ Funcionando corretamente
- ⚠️ Foto na recepção: Verificar se está sendo salva/cadastrada

---

### 2. ANÁLISE TÉCNICA

**Situação Atual:**
- Técnico retira equipamento da expedição
- Analisa e preenche **Laudo Técnico**: análises, defeitos, solução, causa provável
- Define componentes que serão usados

**Status no Sistema:** `IN_ANALYSIS` → `PRICING`

**Observações:**
- ✅ Funcionando corretamente
- ⚠️ Componentes no laudo: Verificar se está vinculando peças do estoque

---

### 3. LAUDO COMERCIAL / PRECIFICAÇÃO

**Situação Atual:**
- Comercial recebe notificação de laudo técnico realizado
- Preenche **Laudo Comercial**: valor de peças + serviços
- Envia orçamento ao cliente (email, WhatsApp, telefone)

**Status no Sistema:** `PRICING` → `WAITING_APPROVAL`

**Observações:**
- ✅ Funcionando corretamente
- ✅ Notificações funcionando

---

### 4. RESPOSTA DO CLIENTE

#### 4.1. CLIENTE REPROVA

**Fluxo Desejado:**
1. Cliente reprova
2. Comercial comunica setor técnico para liberação
3. Técnico libera equipamento na expedição
4. Comercial emite **NF de retorno**
5. Expedição aguarda coleta

**Status no Sistema Atual:**
- `REJECTED` → `FINISHED` (técnico libera) → `INVOICED` (comercial emite NF) → `WAITING_PICKUP`/`WAITING_COLLECTION`

**Problemas Identificados:**
- ❌ **FALTA**: Diferenciação entre NF de serviço (aprovado) e NF de retorno (reprovado)
- ⚠️ Técnico precisa marcar como `FINISHED` mesmo sem reparo (isso está OK, mas pode ser confuso)
- ⚠️ Comercial precisa indicar que é NF de retorno (existe `isRejectionFlow` no código, mas precisa validar)

#### 4.2. CLIENTE APROVA

**Fluxo Desejado:**
1. Cliente aprova
2. Comercial comunica setor técnico para prosseguir
3. Técnico faz reparo
4. Técnico indica que está pronto
5. Técnico imprime laudo técnico e leva equipamento + laudo à expedição
6. Comercial emite **NF de serviço + NF de retorno**
7. Comercial entrega à expedição
8. Expedição aguarda coleta e assinatura das NF

**Status no Sistema Atual:**
- `APPROVED` → `IN_PROGRESS` → `TESTING` → `FINISHED` → `INVOICED` → `WAITING_COLLECTION`/`WAITING_PICKUP` → `DISPATCHED`

**Problemas Identificados:**
- ✅ Fluxo está correto
- ⚠️ **FALTA**: Registro de que técnico entregou equipamento + laudo na expedição
- ⚠️ **FALTA**: Campos para diferenciar NF de serviço vs NF de retorno
- ⚠️ **CORRIGIDO**: Comercial escolhe método de coleta (já corrigido)

---

## PROBLEMAS IDENTIFICADOS E CORREÇÕES

### ✅ JÁ CORRIGIDO

1. **Comercial escolhe método de coleta**
   - ✅ Removido técnicos dos botões de escolha de método
   - ✅ Apenas comercial/admin podem escolher (transportadora, balcão, entrega própria)

### ⚠️ PROBLEMAS A CORRIGIR

#### 1. **Diferenciação NF de Serviço vs NF de Retorno**

**Problema:** Sistema não diferencia claramente quando é NF de serviço (aprovado) vs NF de retorno (reprovado)

**Solução Proposta:**
- ✅ Já existe campo `entryInvoiceNumber` e `exitInvoiceNumber` no modelo
- ⚠️ Precisa validar se está sendo usado corretamente
- ⚠️ Adicionar campo/lógica para indicar tipo de NF (serviço/retorno)

**Arquivos a revisar:**
- `src/components/commercial/CommercialDetailsModal.js`
- `prisma/schema.prisma` (verificar campos de NF)

#### 2. **Registro de Entrega do Equipamento na Expedição**

**Problema:** Não há registro de quando técnico entrega equipamento + laudo na expedição

**Solução Proposta:**
- Adicionar campo `deliveredToExpeditionAt` (timestamp)
- Técnico marca quando entrega na expedição
- Comercial só pode faturar após entrega na expedição

**Status Sugerido:**
- Novo status intermediário: `READY_FOR_INVOICING` ou usar campo adicional
- OU: Adicionar flag `deliveredToExpedition` no status `FINISHED`

#### 3. **Fluxo de Reprovação - Clarificação**

**Problema:** Técnico precisa marcar como `FINISHED` mesmo sem reparo (pode ser confuso)

**Solução Proposta:**
- Manter status `FINISHED` para ambos (reprovado sem reparo e aprovado reparado)
- Usar flag ou campo adicional para diferenciar
- OU: Criar status específico `READY_FOR_RETURN` para reprovação

#### 4. **Campos de NF no Faturamento**

**Problema:** Comercial precisa preencher NF de serviço e NF de retorno separadamente

**Solução Proposta:**
- Modal de faturamento deve ter campos separados:
  - NF de Serviço (quando aprovado)
  - NF de Retorno (sempre)
- Diferenciação clara entre fluxo de aprovação vs reprovação

#### 5. **Impressão de Laudo Técnico**

**Problema:** Técnico precisa imprimir laudo, mas sistema pode não ter funcionalidade

**Solução Proposta:**
- Adicionar botão "Imprimir Laudo Técnico" quando status for `FINISHED`
- Verificar se já existe funcionalidade de impressão

---

## MELHORIAS PROPOSTAS

### Prioridade ALTA

1. **Corrigir fluxo de faturamento para diferenciar NF de serviço vs retorno**
   - Adicionar campos/lógica para tipo de NF
   - Atualizar modal de faturamento

2. **Registro de entrega na expedição**
   - Técnico marca quando entrega equipamento na expedição
   - Comercial só pode faturar após entrega

### Prioridade MÉDIA

3. **Melhorar fluxo de reprovação**
   - Clarificar que `FINISHED` também significa "pronto para retorno" (sem reparo)
   - Adicionar mensagens/indicadores visuais

4. **Funcionalidade de impressão de laudo técnico**
   - Botão de impressão quando técnico marca como concluído

### Prioridade BAIXA

5. **Validações adicionais**
   - Verificar se componentes do laudo estão vinculando estoque
   - Validar campos obrigatórios no laudo técnico

---

## PRÓXIMOS PASSOS

1. Revisar campos de NF no schema Prisma
2. Propor correções para diferenciação de NF de serviço vs retorno
3. Propor solução para registro de entrega na expedição
4. Implementar melhorias prioritárias

