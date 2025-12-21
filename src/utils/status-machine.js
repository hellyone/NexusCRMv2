export const SERVICE_ORDER_STATUS = {
    OPEN: "Aberta",                    // Aguardando triagem
    IN_ANALYSIS: "Em Análise",         // Técnico avaliando
    WAITING_APPROVAL: "Aguard. Aprovação", // Orçamento enviado
    APPROVED: "Aprovada",              // Cliente aprovou
    REJECTED: "Reprovada",             // Cliente não aprovou
    IN_PROGRESS: "Em Execução",        // Serviço sendo feito
    WAITING_PARTS: "Aguard. Peças",    // Pendente material
    PAUSED: "Pausada",                 // Solicitação do cliente
    FINISHED: "Concluída",             // Serviço finalizado
    INVOICED: "Faturada",              // NF emitida
    CANCELED: "Cancelada"              // OS cancelada
};

export const ALLOWED_TRANSITIONS = {
    OPEN: ["IN_ANALYSIS", "CANCELED"],
    IN_ANALYSIS: ["WAITING_APPROVAL", "CANCELED"],
    WAITING_APPROVAL: ["APPROVED", "REJECTED", "CANCELED"],
    APPROVED: ["IN_PROGRESS", "CANCELED"],
    REJECTED: ["FINISHED", "CANCELED", "OPEN"], // Devolve sem reparo ou tenta reabrir
    IN_PROGRESS: ["WAITING_PARTS", "PAUSED", "FINISHED", "CANCELED"],
    WAITING_PARTS: ["IN_PROGRESS", "CANCELED"],
    PAUSED: ["IN_PROGRESS", "CANCELED"],
    FINISHED: ["INVOICED", "OPEN"], // OPEN se precisar reabrir por garantia/erro
    INVOICED: [],
    CANCELED: []
};

// Define quais papéis podem realizar quais transições
export const WORKFLOW_ROLES = {
    // ADMIN pode tudo (será tratado via override)

    // BACKOFFICE / COMERCIAL
    BACKOFFICE: {
        TRANSITIONS: ["APPROVED", "REJECTED", "INVOICED", "CANCELED", "OPEN"],
        DENY_FROM: ["IN_ANALYSIS", "IN_PROGRESS"] // Não pode tirar dessas fases
    },

    // TÉCNICO
    TECH: {
        TRANSITIONS: ["IN_ANALYSIS", "WAITING_APPROVAL", "IN_PROGRESS", "WAITING_PARTS", "PAUSED", "FINISHED"],
        DENY_TO: ["APPROVED", "INVOICED"], // Jamais aprova orçamento ou fatura. PODE REJEITADO -> FINISHED (Devolução)
    }
};

export function canTransition(currentStatus, newStatus, userRole = "ADMIN") {
    if (!currentStatus) return true; // Creation
    if (userRole === "ADMIN") return ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus);

    const isTech = userRole.startsWith("TECH");
    const roleConfig = isTech ? WORKFLOW_ROLES.TECH : WORKFLOW_ROLES.BACKOFFICE;

    // 1. Verifica se a transição básica é permitida pela máquina de estados
    const basicAllowed = ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus);
    if (!basicAllowed) return false;

    // 2. Regras do Técnico
    if (isTech) {
        if (roleConfig.DENY_TO.includes(newStatus)) return false;
    }

    // 3. Regras do Comercial (Backoffice)
    if (userRole === "BACKOFFICE") {
        if (roleConfig.DENY_FROM.includes(currentStatus)) return false;
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
