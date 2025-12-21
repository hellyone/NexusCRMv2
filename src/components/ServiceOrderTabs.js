'use client';

import { useState } from 'react';
import { ClipboardList, Wrench, Package, DollarSign, Clock, FileText } from 'lucide-react';
// We will implement sub-components for each tab content later
import OsGeneralTab from './tabs/OsGeneralTab';
import OsServicesTab from './tabs/OsServicesTab';
import OsPartsTab from './tabs/OsPartsTab';
import OsFinancialTab from './tabs/OsFinancialTab';
import OsStatusHistory from './tabs/OsStatusHistory';

export default function ServiceOrderTabs({ os, user }) {
    const [activeTab, setActiveTab] = useState('general');
    const role = user?.role || 'GUEST';
    const isCommercial = ['ADMIN', 'BACKOFFICE'].includes(role);

    const tabs = [
        { id: 'general', label: 'Visão Geral', icon: FileText },
        { id: 'services', label: 'Serviços', icon: Wrench },
        { id: 'parts', label: 'Peças', icon: Package },
        ...(isCommercial ? [{ id: 'financial', label: 'Financeiro', icon: DollarSign }] : []),
        { id: 'history', label: 'Histórico', icon: Clock },
    ];

    return (
        <div className="card p-0 overflow-hidden min-h-[500px] flex flex-col">
            <div className="flex border-b bg-gray-50">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 
                                ${activeTab === tab.id
                                    ? 'border-primary text-primary bg-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="p-6 flex-1">
                {activeTab === 'general' && <OsGeneralTab os={os} user={user} />}
                {activeTab === 'services' && <OsServicesTab os={os} user={user} />}
                {activeTab === 'parts' && <OsPartsTab os={os} user={user} />}
                {activeTab === 'financial' && <OsFinancialTab os={os} user={user} />}
                {activeTab === 'history' && <OsStatusHistory serviceOrderId={os.id} user={user} />}
            </div>
        </div>
    );
}
