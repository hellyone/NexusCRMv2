'use client';

import { useState } from 'react';
import ServiceOrderCardMobile from './ServiceOrderCardMobile';
import { Plus, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FieldDashboard({ initialOrders }) {
    const [orders, setOrders] = useState(initialOrders?.serviceOrders || []);
    const router = useRouter();

    const refresh = () => {
        router.refresh();
    };

    return (
        <div className="p-4 relative min-h-[calc(100vh-60px)]">

            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <p>Nenhuma OS atribuída.</p>
                </div>
            ) : (
                <div className="pb-16">
                    {orders.map(os => (
                        <ServiceOrderCardMobile key={os.id} os={os} />
                    ))}
                </div>
            )}

            {/* FAB - Floating Action Button for New OS */}
            <button
                onClick={() => router.push('/service-orders/new')}
                className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-90 z-20 flex items-center justify-center"
                aria-label="Nova OS"
            >
                <Plus size={24} />
            </button>
        </div>
    );
}
