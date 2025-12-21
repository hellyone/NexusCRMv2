'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, PackagePlus, History, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import StockAdjustmentModal from './StockAdjustmentModal';
import StockHistory from './StockHistory';
import { maskCurrency } from '@/utils/masks';

export default function PartDetailsView({ part, history }) {
    const [activeTab, setActiveTab] = useState('details');
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const router = useRouter();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="btn btn-ghost btn-circle btn-sm">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">{part.name}</h1>
                        <p className="text-muted-foreground text-sm">SKU: {part.sku || '-'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAdjustmentModal(true)}
                        className="btn btn-outline gap-2"
                    >
                        <PackagePlus size={18} /> Ajustar Estoque
                    </button>
                    <Link href={`/parts/${part.id}/edit`} className="btn btn-primary gap-2">
                        <Edit size={18} /> Editar
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="text-muted-foreground text-xs uppercase font-bold">Estoque Atual</div>
                    <div className={`text-2xl font-bold ${part.stockQuantity <= part.minStock ? 'text-red-600' : 'text-primary'}`}>
                        {part.stockQuantity} <span className="text-sm font-normal text-gray-500">{part.unit}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="text-muted-foreground text-xs uppercase font-bold">Custo Médio</div>
                    <div className="text-2xl font-bold">{maskCurrency(part.costPrice)}</div>
                </div>
                <div className="stat-card">
                    <div className="text-muted-foreground text-xs uppercase font-bold">Preço Venda</div>
                    <div className="text-2xl font-bold">{maskCurrency(part.salePrice)}</div>
                </div>
                <div className="stat-card">
                    <div className="text-muted-foreground text-xs uppercase font-bold">Localização</div>
                    <div className="text-2xl font-bold truncate" title={part.location}>{part.location || '-'}</div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-border">
                <div className="flex gap-6">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-primary text-primary font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileText size={18} /> Detalhes
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'border-primary text-primary font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <History size={18} /> Histórico de Movimentação
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-border min-h-[400px]">
                {activeTab === 'details' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                        <div>
                            <h3 className="section-title">Identificação</h3>
                            <dl className="space-y-2 mt-2">
                                <div className="grid grid-cols-3"><dt className="text-muted-foreground">Marca:</dt> <dd className="col-span-2 font-medium">{part.brand || '-'}</dd></div>
                                <div className="grid grid-cols-3"><dt className="text-muted-foreground">Modelo:</dt> <dd className="col-span-2 font-medium">{part.model || '-'}</dd></div>
                                <div className="grid grid-cols-3"><dt className="text-muted-foreground">Part Number:</dt> <dd className="col-span-2 font-medium">{part.partNumber || '-'}</dd></div>
                                <div className="grid grid-cols-3"><dt className="text-muted-foreground">Categoria:</dt> <dd className="col-span-2 font-medium">{part.category || '-'}</dd></div>
                            </dl>
                        </div>
                        <div>
                            <h3 className="section-title">Parâmetros de Estoque</h3>
                            <dl className="space-y-2 mt-2">
                                <div className="grid grid-cols-3"><dt className="text-muted-foreground">Mínimo:</dt> <dd className="col-span-2 font-medium">{part.minStock}</dd></div>
                                <div className="grid grid-cols-3"><dt className="text-muted-foreground">Máximo:</dt> <dd className="col-span-2 font-medium">{part.maxStock || 'Indefinido'}</dd></div>
                                <div className="grid grid-cols-3"><dt className="text-muted-foreground">NCM:</dt> <dd className="col-span-2 font-medium">{part.ncm || '-'}</dd></div>
                            </dl>
                        </div>
                        <div className="col-span-full">
                            <h3 className="section-title">Descrição</h3>
                            <p className="mt-2 text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-100">
                                {part.description || 'Sem descrição.'}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <StockHistory history={history} />
                )}
            </div>

            {/* Modal */}
            {showAdjustmentModal && (
                <StockAdjustmentModal
                    partId={part.id}
                    currentStock={part.stockQuantity}
                    onClose={() => setShowAdjustmentModal(false)}
                />
            )}
        </div>
    );
}
