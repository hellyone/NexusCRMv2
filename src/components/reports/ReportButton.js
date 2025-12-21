'use client';

import dynamic from 'next/dynamic';
import { FileDown, Loader } from 'lucide-react';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <button className="btn btn-ghost disabled"><Loader className="animate-spin" size={18} /></button>,
    }
);

import ServiceOrderPdf from './ServiceOrderPdf';

export default function ReportButton({ os }) {
    return (
        <PDFDownloadLink
            document={<ServiceOrderPdf os={os} />}
            fileName={`${os.code}_Laudo.pdf`}
            className="btn btn-outline gap-2 bg-white"
        >
            {({ blob, url, loading, error }) =>
                loading ? (
                    <>
                        <Loader className="animate-spin" size={18} />
                        Gerando...
                    </>
                ) : (
                    <>
                        <FileDown size={18} />
                        {os.status === 'WAITING_APPROVAL' ? 'Baixar Orçamento' : 'Baixar Laudo'}
                    </>
                )
            }
        </PDFDownloadLink>
    );
}
