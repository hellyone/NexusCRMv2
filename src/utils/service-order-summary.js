/**
 * Utility function to generate a summary of what happened in a service order
 * Returns information about: warranty, rejected, approved, repaired, etc.
 */
export function getServiceOrderSummary(os) {
    const wasRejected = os.statusHistory?.some(h => 
        h.status === 'REJECTED' || h.toStatus === 'REJECTED' || h.fromStatus === 'REJECTED'
    );
    const isWarranty = os.type === 'WARRANTY';
    const wasApproved = os.statusHistory?.some(h => 
        h.status === 'APPROVED' || h.toStatus === 'APPROVED' || h.fromStatus === 'APPROVED'
    );
    const wasFinished = ['FINISHED', 'INVOICED', 'WAITING_COLLECTION', 'WAITING_PICKUP', 'DISPATCHED'].includes(os.status);
    
    // Determine the outcome
    let label = '';
    let color = '';
    let bgColor = '';
    
    if (isWarranty) {
        label = 'Garantia';
        color = 'text-green-700';
        bgColor = 'bg-green-100 border-green-200';
    } else if (wasRejected) {
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
    
    return { label, color, bgColor, isWarranty, wasRejected, wasApproved };
}
