'use client';

import { useState } from 'react';
import { Printer, Loader } from 'lucide-react';

export default function ReportButton({ os }) {
    const [generating, setGenerating] = useState(false);

    const handlePrint = async () => {
        if (generating) return;

        try {
            setGenerating(true);

            // 1. Import dependencies ONLY when clicked to avoid hydration/render conflicts
            const { pdf } = await import('@react-pdf/renderer');
            const { default: ServiceOrderPdf } = await import('./ServiceOrderPdf');

            // 2. Generate PDF blob functionally (bypasses React component mounting issues)
            const doc = <ServiceOrderPdf os={os} />;
            const blob = await pdf(doc).toBlob();

            // 3. Open PDF in new window for printing
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                    // Cleanup after a delay to allow print dialog to open
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                    }, 1000);
                };
            } else {
                // Fallback: if popup is blocked, create download link
                const link = document.createElement('a');
                link.href = url;
                link.download = `${os.code}_Laudo.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Não foi possível gerar o PDF neste momento. Por favor, tente novamente ou verifique se há bloqueios no navegador.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <button
            onClick={handlePrint}
            disabled={generating}
            className="btn btn-outline gap-2 bg-white min-w-[160px] justify-center"
        >
            {generating ? (
                <>
                    <Loader className="animate-spin" size={18} />
                    Gerando...
                </>
            ) : (
                <>
                    <Printer size={18} />
                    {os.status === 'WAITING_APPROVAL' ? 'Imprimir Orçamento' : 'Imprimir Laudo'}
                </>
            )}
        </button>
    );
}
