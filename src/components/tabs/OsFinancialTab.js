'use client';

import PricingWizard from '../service-orders/PricingWizard';

export default function OsFinancialTab({ os, user }) {
    // Determine if read-only based on role or status if needed.
    // For Commercial tab, usually we want to allow editing if status allows.
    // PricingWizard handles logic internally or we pass isReadOnly.
    // If Status is APPROVED or CANCELED, maybe read-only? 
    // Let's assume always editable for Commercial unless final closed, 
    // BUT PricingWizard has logic for "Simulação" vs "Salvar".

    const isReadOnly = ['APPROVED', 'CANCELED', 'INVOICED', 'DISPATCHED', 'FINISHED'].includes(os.status);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 p-4 bg-orange-50 text-orange-800 rounded-lg text-sm">
                <p>Gestão comercial e precificação da Ordem de Serviço.</p>
            </div>
            <PricingWizard os={os} isReadOnly={isReadOnly} />
        </div>
    );
}
