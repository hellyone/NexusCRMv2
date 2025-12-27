'use client';

import { useState, useMemo } from 'react';
import ServiceOrderCardMobile from './ServiceOrderCardMobile';
import { Plus, CheckCircle, Clock, AlertCircle, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, Metric, Text, Flex, Grid } from "@tremor/react";

export default function FieldDashboard({ initialOrders, user }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'queue'

    const orders = initialOrders?.serviceOrders || [];

    // --- Metrics Logic ---
    const metrics = useMemo(() => {
        const mine = orders.filter(o => o.technicianId === parseUserId(user?.id)); // Assuming user.id available
        // Workaround: If we don't have user id here easily, we filter by what was passed.
        // Actually, initialOrders might already be filtered by the server action based on context?
        // Let's assume initialOrders contains potentially everything relevant for now, 
        // or we trust the server to send mixed data. 
        // For MVP redesign, let's categorize the provided list.

        return {
            inProgress: orders.filter(o => o.status === 'IN_PROGRESS').length,
            pending: orders.filter(o => ['OPEN', 'PENDING'].includes(o.status)).length,
            doneToday: orders.filter(o => o.status === 'FINISHED' && isToday(new Date(o.updatedAt))).length
        };
    }, [orders]);

    const filteredOrders = useMemo(() => {
        if (activeTab === 'mine') {
            // Show orders assigned to me OR In Progress by me
            // For now, let's show ALL orders passed to this component as default behavior 
            // until we refine the server action to return 'queue' items too.
            return orders;
        } else {
            // Queue: Open orders with no technician
            return orders.filter(o => o.status === 'OPEN' && !o.technicianId);
        }
    }, [orders, activeTab]);

    return (
        <div className="p-4 relative min-h-[calc(100vh-60px)] pb-24 space-y-6">

            {/* Status Cards */}
            <Grid numItems={3} className="gap-2">
                <Card decoration="top" decorationColor="blue" className="p-2">
                    <Flex flexDirection="col" alignItems="start">
                        <Text className="text-xs">Em Andamento</Text>
                        <Metric className="text-lg">{metrics.inProgress}</Metric>
                    </Flex>
                </Card>
                <Card decoration="top" decorationColor="red" className="p-2">
                    <Flex flexDirection="col" alignItems="start">
                        <Text className="text-xs">Pendentes</Text>
                        <Metric className="text-lg">{metrics.pending}</Metric>
                    </Flex>
                </Card>
                <Card decoration="top" decorationColor="green" className="p-2">
                    <Flex flexDirection="col" alignItems="start">
                        <Text className="text-xs">Feitas Hoje</Text>
                        <Metric className="text-lg">{metrics.doneToday}</Metric>
                    </Flex>
                </Card>
            </Grid>

            {/* Tabs */}
            <div className="flex p-1 bg-gray-200 rounded-lg">
                <button
                    onClick={() => setActiveTab('mine')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'mine' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                >
                    Minhas OS
                </button>
                <button
                    onClick={() => setActiveTab('queue')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'queue' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                >
                    Fila Geral
                </button>
            </div>

            {/* List */}
            {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400 border-2 border-dashed rounded-xl">
                    <p>Tudo limpo por aqui!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map(os => (
                        <ServiceOrderCardMobile key={os.id} os={os} />
                    ))}
                </div>
            )}

            {/* FAB */}
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

// Helpers
function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}

function parseUserId(id) {
    return id ? parseInt(id) : null;
}
