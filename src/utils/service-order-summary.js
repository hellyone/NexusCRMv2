/**
 * Utility function to generate a summary of what happened in a service order
 * Returns information about: warranty, rejected, approved, repaired, etc.
 */
export function getServiceOrderSummary(os) {
    const isWarranty = os.type === 'WARRANTY';
    const wasApproved = os.statusHistory?.some(h => 
        h.status === 'APPROVED' || h.toStatus === 'APPROVED' || h.fromStatus === 'APPROVED'
    );
    const wasFinished = ['FINISHED', 'INVOICED', 'WAITING_COLLECTION', 'WAITING_PICKUP', 'DISPATCHED'].includes(os.status);
    
    // Check if was rejected
    const wasRejected = os.statusHistory?.some(h => 
        h.status === 'REJECTED' || h.toStatus === 'REJECTED' || h.fromStatus === 'REJECTED'
    );
    
    // Differentiate between "Sem Reparo" (technical rejection) and "Reprovado" (commercial rejection)
    let rejectionType = null;
    if (wasRejected) {
        // Check if OS passed through commercial pricing/approval before being rejected
        const hadCommercialFlow = os.statusHistory?.some(h => 
            h.status === 'PRICING' || h.toStatus === 'PRICING' || h.fromStatus === 'PRICING' ||
            h.status === 'WAITING_APPROVAL' || h.toStatus === 'WAITING_APPROVAL' || h.fromStatus === 'WAITING_APPROVAL' ||
            h.status === 'NEGOTIATING' || h.toStatus === 'NEGOTIATING' || h.fromStatus === 'NEGOTIATING'
        );
        
        // If had commercial flow before rejection, it's "Reprovado" (client rejected)
        // Otherwise, it's "Sem Reparo" (technical rejection)
        rejectionType = hadCommercialFlow ? 'REPROVADO' : 'SEM_REPARO';
    }
    
    // Determine the outcome
    let label = '';
    let color = '';
    let bgColor = '';
    
    if (isWarranty) {
        label = 'Garantia';
        color = 'text-green-700';
        bgColor = 'bg-green-100 border-green-200';
    } else if (rejectionType === 'REPROVADO') {
        label = 'Reprovado';
        color = 'text-orange-700';
        bgColor = 'bg-orange-100 border-orange-200';
    } else if (rejectionType === 'SEM_REPARO') {
        label = 'Sem Reparo';
        color = 'text-red-700';
        bgColor = 'bg-red-100 border-red-200';
    } else if (wasApproved && wasFinished) {
        label = 'Reparado';
        color = 'text-blue-700';
        bgColor = 'bg-blue-100 border-blue-200';
    } else if (wasFinished) {
        label = 'Finalizado';
        color = 'text-gray-700';
        bgColor = 'bg-gray-100 border-gray-200';
    } else {
        label = 'Indefinido';
        color = 'text-gray-500';
        bgColor = 'bg-gray-50 border-gray-200';
    }
    
    return { label, color, bgColor, isWarranty, wasRejected: !!wasRejected, wasApproved, rejectionType };
}
