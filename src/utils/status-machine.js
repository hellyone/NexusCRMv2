export const SERVICE_ORDER_STATUS = {
    OPEN: "Aberta",                    // Aguardando triagem
    IN_ANALYSIS: "Em Análise",         // Técnico avaliando
    PRICING: "Precificando",           // 3.1: Laudo pronto, orçando
    WAITING_APPROVAL: "Aguard. Aprovação", // 3.2: Orçamento enviado
    NEGOTIATING: "Negociando",         // 4.1: Cliente negociando
    APPROVED: "Aprovada",              // 4.2: Cliente aprovou
    REJECTED: "Reprovada",             // 4.3: Cliente não aprovou
    IN_PROGRESS: "Em Execução",        // 5.1: Serviço sendo feito
    WAITING_PARTS: "Aguard. Peças",    // 5.2: Pendente material
    PAUSED: "Pausada",                 // Solicitação do cliente
    TESTING: "Em Teste",               // 6.1: Validação técnica
    REWORK: "Retrabalho",              // 6.2: Falhou no teste
    FINISHED: "Concluída",             // 6.3: Serviço finalizado
    INVOICED: "Faturada",              // 7.1/7.2: Saiu da empresa
    WAITING_COLLECTION: "Aguard. Coleta", // 8.1: Expedição esperando
    WAITING_PICKUP: "Aguard. Retirada", // Alt: Cliente busca devolução
    DISPATCHED: "Expedido",            // 8.2: Saiu da empresa
    WARRANTY_RETURN: "Retorno Garantia", // 9.3: Voltou na garantia
    SCRAPPED: "Descartada",            // Alt: Cliente autorizou descarte
    ABANDONED: "Abandonada",           // Alt: Cliente sumiu 90d
    CANCELED: "Cancelada"              // OS cancelada
};

export const ALLOWED_TRANSITIONS = {
    OPEN: ["IN_ANALYSIS", "CANCELED"],
    IN_ANALYSIS: ["PRICING", "REJECTED", "FINISHED", "IN_PROGRESS", "CANCELED"], // IN_PROGRESS para garantia, FINISHED para garantia direto
    PRICING: ["WAITING_APPROVAL", "CANCELED"],
    WAITING_APPROVAL: ["APPROVED", "REJECTED", "NEGOTIATING", "ABANDONED", "CANCELED"], // Abandonar após 90d
    NEGOTIATING: ["APPROVED", "REJECTED", "CANCELED"],
    APPROVED: ["IN_PROGRESS", "CANCELED"],
    REJECTED: ["INVOICED", "FINISHED", "SCRAPPED", "CANCELED"], // Fluxo: Rejeitado -> Concluído (Técnico finalizou) -> Faturamento
    IN_PROGRESS: ["WAITING_PARTS", "PAUSED", "TESTING", "FINISHED", "CANCELED"],
    WAITING_PARTS: ["IN_PROGRESS", "CANCELED"],
    PAUSED: ["IN_PROGRESS", "CANCELED"],
    TESTING: ["FINISHED", "REWORK", "IN_PROGRESS", "CANCELED"],
    REWORK: ["TESTING", "IN_PROGRESS", "CANCELED"],
    FINISHED: ["INVOICED", "OPEN"],
    INVOICED: ["WAITING_COLLECTION", "WAITING_PICKUP", "DISPATCHED", "OPEN"],
    WAITING_COLLECTION: ["DISPATCHED", "OPEN"],
    WAITING_PICKUP: ["DISPATCHED", "SCRAPPED", "OPEN"], // Devolvido/Expedido
    DISPATCHED: ["WARRANTY_RETURN"],
    WARRANTY_RETURN: ["IN_ANALYSIS", "OPEN"],
    SCRAPPED: [],
    ABANDONED: [],
    CANCELED: []
};

// Define quais papéis podem realizar quais transições
export const WORKFLOW_ROLES = {
    // BACKOFFICE / COMERCIAL
    BACKOFFICE: {
        TRANSITIONS: ["PRICING", "WAITING_APPROVAL", "NEGOTIATING", "APPROVED", "REJECTED", "INVOICED", "CANCELED", "SCRAPPED", "ABANDONED", "OPEN"],
        DENY_FROM: ["IN_ANALYSIS", "IN_PROGRESS", "TESTING", "REWORK"],
        DENY_TO: ["IN_ANALYSIS", "IN_PROGRESS", "TESTING", "REWORK"]
    },

    // TÉCNICO
    TECH: {
        TRANSITIONS: ["IN_ANALYSIS", "PRICING", "IN_PROGRESS", "WAITING_PARTS", "PAUSED", "TESTING", "REWORK", "FINISHED", "WAITING_COLLECTION", "WAITING_PICKUP", "DISPATCHED", "WARRANTY_RETURN", "SCRAPPED"],
        DENY_TO: ["APPROVED", "INVOICED", "ABANDONED"],
    }
};

export function canTransition(currentStatus, newStatus, userRole = "ADMIN") {
    if (!currentStatus) return true; // Creation
    if (userRole === "ADMIN") return ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus);

    const isTech = userRole.startsWith("TECH");
    const roleConfig = isTech ? WORKFLOW_ROLES.TECH : WORKFLOW_ROLES.BACKOFFICE;

    const basicAllowed = ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus);
    if (!basicAllowed) return false;

    // Regras Específicas
    if (isTech) {
        if (roleConfig.DENY_TO.includes(newStatus)) return false;
    }
    if (userRole === "BACKOFFICE") {
        if (roleConfig.DENY_FROM?.includes(currentStatus)) return false;
        if (roleConfig.DENY_TO?.includes(newStatus)) return false;
    }

    return true;
}

export const PRIORITY_OPTIONS = {
    LOW: "Baixa",
    NORMAL: "Normal",
    HIGH: "Alta",
    URGENT: "Urgente"
};

export const SERVICE_LOCATIONS = {
    INTERNAL: "Oficina (Interno)",
    EXTERNAL: "Campo (Externo)"
};

export const MAINTENANCE_AREAS = {
    ELECTRONICS: 'Laboratório de Eletrônica',
    SERVOMOTOR: 'Laboratório de Servomotores',
    ENGINEERING: 'Engenharia',
    TECHNICAL_ASSISTANCE: 'Assistência Técnica'
};

// --- New Role-Based Status Logic to match user table perfectly ---

const STATUS_DISPLAY_CONFIG = {
    OPEN: {
        TECH: { label: "Na Fila", color: "bg-purple-100 text-purple-700" },
        COMMERCIAL: { label: "Aguardando Análise", color: "bg-purple-100 text-purple-700" }
    },
    IN_ANALYSIS: {
        TECH: { label: "Em Análise", color: "bg-blue-100 text-blue-700" },
        COMMERCIAL: { label: "Aguardando Laudo", color: "bg-blue-100 text-blue-700" }
    },
    // 3.1
    PRICING: {
        TECH: { label: "Laudo Emitido", color: "bg-yellow-100 text-yellow-800" },
        COMMERCIAL: { label: "Precificando", color: "bg-amber-100 text-amber-700 font-bold border-amber-200" }
    },
    // 3.2
    WAITING_APPROVAL: {
        TECH: { label: "Laudo Emitido", color: "bg-yellow-100 text-yellow-800" },
        COMMERCIAL: { label: "Orçamento Enviado", color: "bg-orange-100 text-orange-700" }
    },
    // 4.1
    NEGOTIATING: {
        TECH: { label: "Laudo Emitido", color: "bg-yellow-100 text-yellow-800" },
        COMMERCIAL: { label: "Negociando", color: "bg-indigo-100 text-indigo-700" }
    },
    // 4.2
    APPROVED: {
        TECH: { label: "Aguardando Reparo", color: "bg-pink-100 text-pink-700 border border-pink-200 font-bold" },
        COMMERCIAL: { label: "Aprovado", color: "bg-green-100 text-green-700" }
    },
    // 4.3 (Including 2.2 Sem Reparo outcome logic if needed, but usually 4.3)
    REJECTED: {
        TECH: { label: "Aguardando Liberação", color: "bg-red-50 text-red-600" },
        COMMERCIAL: { label: "Reprovado", color: "bg-red-50 text-red-600" } // Vermelho
    },
    // Alt Flow: Waiting Pickup (Devolução)
    WAITING_PICKUP: {
        TECH: { label: "Liberado p/ Devolução", color: "bg-gray-100 text-gray-600" },
        COMMERCIAL: { label: "Aguardando Devolução", color: "bg-gray-100 text-gray-600" } // Cinza
    },
    // 5.1
    IN_PROGRESS: {
        TECH: { label: "Em Reparo", color: "bg-blue-100 text-blue-700" },
        COMMERCIAL: { label: "Em Execução", color: "bg-blue-50 text-blue-600" }
    },
    // Garantia em IN_PROGRESS (mostra "Garantia" para técnico)
    IN_PROGRESS_WARRANTY: {
        TECH: { label: "Garantia", color: "bg-green-100 text-green-700 font-bold" },
        COMMERCIAL: { label: "Em Execução (Garantia)", color: "bg-green-50 text-green-600" }
    },
    // 5.2
    WAITING_PARTS: {
        TECH: { label: "Aguardando Peça", color: "bg-orange-50 text-orange-700" },
        COMMERCIAL: { label: "Em Execução", color: "bg-blue-50 text-blue-600" }
    },
    PAUSED: {
        TECH: { label: "Pausado", color: "bg-gray-100 text-gray-700" },
        COMMERCIAL: { label: "Em Execução (Pausa)", color: "bg-gray-100 text-gray-700" }
    },
    // 6.1
    TESTING: {
        TECH: { label: "Em Teste", color: "bg-cyan-100 text-cyan-700" },
        COMMERCIAL: { label: "Em Execução", color: "bg-blue-50 text-blue-600" }
    },
    // 6.2
    REWORK: {
        TECH: { label: "Em Retrabalho", color: "bg-red-50 text-red-600" },
        COMMERCIAL: { label: "Em Execução", color: "bg-blue-50 text-blue-600" } // Azul Claro
    },
    // 6.3
    FINISHED: {
        TECH: { label: "Concluído", color: "bg-green-100 text-green-700" }, // Verde
        COMMERCIAL: { label: "Aguardando Faturamento", color: "bg-yellow-100 text-yellow-800" }
    },
    // 7.1 / 7.2
    INVOICED: {
        TECH: { label: "Liberado p/ Expedição", color: "bg-indigo-100 text-indigo-700 font-bold" },
        COMMERCIAL: { label: "Faturado", color: "bg-green-100 text-green-700" } // Verde
    },
    // 8.1
    WAITING_COLLECTION: {
        TECH: { label: "Finalizado", color: "bg-green-100 text-green-700" },
        COMMERCIAL: { label: "Aguardando Coleta", color: "bg-gray-200 text-gray-700" } // Cinza
    },
    // 8.2 / 9.1 / 9.2 (Handled via logic below for Expiry)
    DISPATCHED: {
        TECH: { label: "Finalizado", color: "bg-green-100 text-green-700" },
        COMMERCIAL: { label: "Coletado/Entregue", color: "bg-green-800 text-white" } // Verde Escuro
    },
    // 9.3
    WARRANTY_RETURN: {
        TECH: { label: "Retorno em Garantia", color: "bg-orange-100 text-orange-700" }, // Laranja
        COMMERCIAL: { label: "Retorno em Garantia", color: "bg-orange-100 text-orange-700" } // Laranja
    },
    CANCELED: {
        TECH: { label: "Cancelada", color: "bg-red-50 text-red-600" },
        COMMERCIAL: { label: "Cancelada", color: "bg-red-50 text-red-600" }
    },
    SCRAPPED: {
        TECH: { label: "Descartado", color: "bg-black text-white" }, // Preto
        COMMERCIAL: { label: "Descartado", color: "bg-black text-white" }
    },
    ABANDONED: {
        TECH: { label: "Abandonado", color: "bg-black text-white" }, // Preto
        COMMERCIAL: { label: "Abandonado (Jurídico)", color: "bg-black text-white" }
    }
};

export function getPublicStatus(os, userRole = 'GUEST') {
    const rawStatus = os.status;
    const isTech = userRole && userRole.startsWith('TECH');
    const roleKey = isTech ? 'TECH' : 'COMMERCIAL';

    // GARANTIA: Técnico sempre vê "Garantia" até chegar na expedição (até INVOICED)
    if (os.type === 'WARRANTY' && isTech && rawStatus !== 'INVOICED' && rawStatus !== 'WAITING_COLLECTION' && rawStatus !== 'WAITING_PICKUP' && rawStatus !== 'DISPATCHED') {
        return { label: "Garantia", color: "bg-green-100 text-green-700 font-bold" };
    }

    // GARANTIA: Comercial vê "Aguardando Liberação" desde análise até expedição
    if (os.type === 'WARRANTY' && !isTech && rawStatus !== 'INVOICED' && rawStatus !== 'WAITING_COLLECTION' && rawStatus !== 'WAITING_PICKUP' && rawStatus !== 'DISPATCHED') {
        return { label: "Aguardando Liberação (Garantia)", color: "bg-blue-100 text-blue-700 font-bold" };
    }

    // REJECTED: Comercial vê "Aguardando Liberação Técnica" para emissão NF retorno
    if (rawStatus === 'REJECTED' && !isTech) {
        return { label: "Aguardando Liberação Técnica", color: "bg-orange-100 text-orange-700 font-bold" };
    }

    let config = STATUS_DISPLAY_CONFIG[rawStatus]?.[roleKey] || { label: rawStatus, color: "bg-gray-100" };

    // 4.4 Sem Resposta (7+ days) & 30 days Risk & 90 days Abandonment
    if (rawStatus === 'WAITING_APPROVAL' || rawStatus === 'LAUDO_EMITIDO' || rawStatus === 'PRICING') {
        const updateDate = new Date(os.updatedAt);
        const diffDays = Math.ceil((new Date() - updateDate) / (1000 * 60 * 60 * 24));

        if (diffDays > 90) return { label: "Abandonado", color: "bg-black text-white" }; // Preto
        if (diffDays > 30) return { label: "Risco de Abandono", color: "bg-red-600 text-white font-bold" }; // Vermelho
        if (diffDays > 7 && !isTech) return { label: "Sem Resposta", color: "bg-orange-500 text-white font-bold" }; // Laranja
    }

    // 9.2 Garantia Expirada (90+ days)
    if (rawStatus === 'DISPATCHED') {
        const dispatchDate = new Date(os.updatedAt);
        const diffDays = Math.ceil((new Date() - dispatchDate) / (1000 * 60 * 60 * 24));

        if (diffDays > 90) {
            return { label: "Garantia Expirada", color: "bg-gray-400 text-white" }; // Cinza
        }
    }

    return config;
}
