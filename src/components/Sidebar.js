'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Wrench, Settings, ClipboardList, Package, Zap, Menu, X, LogOut, ChevronLeft, ChevronRight, DollarSign, TrendingUp } from 'lucide-react';
import { countServiceOrdersByStatus } from '@/actions/service-orders';
import { cn } from '@/lib/utils';
import SignOutButton from './SignOutButton';
import Notifications from './Notifications';

const allNavItems = [
    { name: 'Dashboard', href: '/', icon: Home, roles: ['ADMIN', 'BACKOFFICE', 'TECH_INTERNAL', 'TECH_FIELD'] },
    { name: 'Comercial', href: '/commercial', icon: DollarSign, roles: ['ADMIN', 'BACKOFFICE'] },
    { name: 'Financeiro', href: '/finance', icon: TrendingUp, roles: ['ADMIN', 'BACKOFFICE'] },
    { name: 'Ordens de Serviço', href: '/service-orders', icon: ClipboardList, roles: ['ADMIN', 'BACKOFFICE', 'TECH_INTERNAL', 'TECH_FIELD'] },
    { name: 'Clientes', href: '/clients', icon: Users, roles: ['ADMIN', 'BACKOFFICE', 'TECH_INTERNAL'] },
    { name: 'Equipamentos', href: '/equipments', icon: Wrench, roles: ['ADMIN', 'BACKOFFICE', 'TECH_INTERNAL'] },
    { name: 'Peças & Estoque', href: '/parts', icon: Package, roles: ['ADMIN', 'BACKOFFICE', 'TECH_INTERNAL', 'TECH_FIELD'] },
    // Admin config
    { name: 'Configurações', href: '/settings', icon: Settings, roles: ['ADMIN'] },
    // Field Tech
    { name: 'Área Técnica', href: '/field', icon: Zap, roles: ['TECH_FIELD', 'TECH_INTERNAL'] },
];

export default function Sidebar({ user }) {
    const pathname = usePathname();
    const role = user?.role || 'GUEST';
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Simple state for desktop collapse if we wanted it, but let's keep it fixed for now
    const [collapsed, setCollapsed] = useState(false);
    const [pricingCount, setPricingCount] = useState(0);

    // Fetch pricing count
    useEffect(() => {
        console.log('Sidebar Effect Triggered. Role:', role);
        if (['ADMIN', 'BACKOFFICE'].includes(role)) {
            const fetchCount = async () => {
                try {
                    const count = await countServiceOrdersByStatus(['PRICING', 'WAITING_APPROVAL', 'FINISHED']);
                    console.log('Fetched Pricing Count:', count);
                    setPricingCount(count);
                } catch (err) {
                    console.error('Error fetching count in sidebar:', err);
                }
            };
            fetchCount();
            // Refresh every minute
            const interval = setInterval(fetchCount, 60000);
            return () => clearInterval(interval);
        } else {
            console.log('Sidebar: UseEffect skipped because role is not authorized:', role);
        }
    }, [role]);

    const visibleItems = allNavItems.filter(item => item.roles.includes(role));

    return (
        <>
            {/* Mobile Header Bar (Only visible on mobile) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-40 flex items-center px-4 justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="btn btn-ghost p-1"
                        aria-label="Open menu"
                    >
                        <Menu size={24} className="text-gray-700" />
                    </button>
                    <span className="font-bold text-lg text-primary">Nexus OS</span>
                </div>
                <Notifications />
            </div>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside className={cn(
                'fixed top-0 bottom-0 left-0 z-50 bg-[#1F3E56] text-white border-r border-[#1F3E56] shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 w-64',
                mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            )}>
                <div className="flex flex-col h-full">

                    {/* Header */}
                    <div className="h-16 flex items-center px-6 border-b border-white/10 bg-[#1F3E56]">
                        <div className="flex-1 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#00D4C4] flex items-center justify-center text-[#1F3E56]">
                                <Zap size={18} fill="currentColor" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-none tracking-tight text-white">Nexus OS</h1>
                                <p className="text-[10px] uppercase font-bold text-[#00D4C4] tracking-wider mt-1">{role.replace('_', ' ')}</p>
                            </div>
                        </div>
                        {/* Close button for mobile inside drawer */}
                        <button
                            className="lg:hidden text-white/70 hover:text-white"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                        {visibleItems.map((item) => {
                            const Icon = item.icon;
                            // Check exact match for root or startsWith for sub-pages
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium group',
                                        isActive
                                            ? 'bg-[#00D4C4]/10 text-[#00D4C4] shadow-sm'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    )}
                                >
                                    <Icon size={18} className={cn("transition-colors", isActive ? "text-[#00D4C4]" : "text-gray-400 group-hover:text-white")} />
                                    <span className="flex-1">{item.name}</span>
                                    {item.href === '/commercial' && pricingCount > 0 && (
                                        <span className="bg-rose-500 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-sm ml-auto">
                                            {pricingCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer / Profile */}
                    <div className="p-4 border-t border-white/10 bg-[#1F3E56]">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-[#00D4C4] flex items-center justify-center text-[#1F3E56] font-bold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium truncate text-white">{user?.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <SignOutButton />
                    </div>
                </div>
            </aside>
        </>
    );
}
