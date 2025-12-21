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
    IN_ANALYSIS: ["WAITING_APPROVAL", "IN_PROGRESS", "CANCELED"],
    WAITING_APPROVAL: ["APPROVED", "REJECTED", "CANCELED"],
    APPROVED: ["IN_PROGRESS", "CANCELED"],
    REJECTED: ["CANCELED", "OPEN"], // Pode reabrir para nova análise
    IN_PROGRESS: ["WAITING_PARTS", "PAUSED", "FINISHED", "CANCELED"],
    WAITING_PARTS: ["IN_PROGRESS", "CANCELED"],
    PAUSED: ["IN_PROGRESS", "CANCELED"],
    FINISHED: ["INVOICED", "OPEN"], // OPEN se precisar reabrir por garantia/erro
    INVOICED: [],
    CANCELED: []
};

export function canTransition(currentStatus, newStatus) {
    if (!currentStatus) return true; // Creation
    // Admin override could bypass this, but for now strict:
    return ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus);
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
