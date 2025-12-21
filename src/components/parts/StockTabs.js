'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils'; // Assuming cn exists or use simpler class manipulation

export function StockTabs() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'sales'; // 'sales' | 'service'

    const handleTabChange = (tab) => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', tab);
        params.set('page', '1'); // Reset page on tab switch
        router.push(`/parts?${params.toString()}`);
    };

    return (
        <div className="flex border-b border-gray-200 mb-6">
            <button
                onClick={() => handleTabChange('sales')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${currentTab === 'sales'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-gray-900'
                    }`}
            >
                Estoque de Vendas
            </button>
            <button
                onClick={() => handleTabChange('service')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${currentTab === 'service'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-gray-900'
                    }`}
            >
                Estoque de Consumo (OS)
            </button>
        </div>
    );
}
