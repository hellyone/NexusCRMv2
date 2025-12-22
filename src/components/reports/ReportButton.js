'use client';

import { useState } from 'react';
import { FileDown, Loader } from 'lucide-react';

export default function ReportButton({ os }) {
    const [generating, setGenerating] = useState(false);

    const handleDownload = async () => {
        if (generating) return;

        try {
            setGenerating(true);

            // 1. Import dependencies ONLY when clicked to avoid hydration/render conflicts
            const { pdf } = await import('@react-pdf/renderer');
            const { default: ServiceOrderPdf } = await import('./ServiceOrderPdf');

            // 2. Generate PDF blob functionally (bypasses React component mounting issues)
            const doc = <ServiceOrderPdf os={os} />;
            const blob = await pdf(doc).toBlob();

            // 3. Trigger browser download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${os.code}_Laudo.pdf`;
            document.body.appendChild(link);
            link.click();

            // 4. Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Não foi possível gerar o PDF neste momento. Por favor, tente novamente ou verifique se há bloqueios no navegador.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
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
                    <FileDown size={18} />
                    {os.status === 'WAITING_APPROVAL' ? 'Baixar Orçamento' : 'Baixar Laudo'}
                </>
            )}
        </button>
    );
}
