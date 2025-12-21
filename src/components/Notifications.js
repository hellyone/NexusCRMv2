'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, AlertCircle, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getUnreadNotificationCount } from '@/actions/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const NOTIFICATION_ICONS = {
    INFO: Info,
    WARNING: AlertTriangle,
    ERROR: AlertCircle,
    SUCCESS: CheckCircle,
};

const NOTIFICATION_COLORS = {
    INFO: 'bg-blue-50 border-blue-200 text-blue-800',
    WARNING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    ERROR: 'bg-red-50 border-red-200 text-red-800',
    SUCCESS: 'bg-green-50 border-green-200 text-green-800',
};

export default function Notifications() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadNotifications = async () => {
        try {
            const [notifs, count] = await Promise.all([
                getUserNotifications({ unreadOnly: false, limit: 20 }),
                getUnreadNotificationCount(),
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    };

    useEffect(() => {
        loadNotifications();

        // Trigger background checks
        import('@/actions/jobs').then(mod => {
            mod.checkDocumentExpirations().catch(console.error);
        });

        // Refresh notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            loadNotifications();
        }
    };

    const handleMarkAsRead = async (id) => {
        setLoading(true);
        await markNotificationAsRead(id);
        await loadNotifications();
        router.refresh();
        setLoading(false);
    };

    const handleMarkAllAsRead = async () => {
        setLoading(true);
        await markAllNotificationsAsRead();
        await loadNotifications();
        router.refresh();
        setLoading(false);
    };

    const handleDelete = async (id) => {
        setLoading(true);
        await deleteNotification(id);
        await loadNotifications();
        router.refresh();
        setLoading(false);
    };

    return (
        <div className="relative">
            <button
                onClick={handleToggle}
                className="relative btn btn-ghost p-2"
                title="Notificações"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold">Notificações</h3>
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        disabled={loading}
                                        className="btn btn-ghost btn-sm text-xs"
                                        title="Marcar todas como lidas"
                                    >
                                        <CheckCheck size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="btn btn-ghost btn-sm p-1"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-muted">
                                    <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p>Nenhuma notificação</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map((notif) => {
                                        const Icon = NOTIFICATION_ICONS[notif.type] || Info;
                                        const colorClass = NOTIFICATION_COLORS[notif.type] || NOTIFICATION_COLORS.INFO;

                                        return (
                                            <div
                                                key={notif.id}
                                                className={`p-4 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''
                                                    }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colorClass} flex items-center justify-center`}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <h4 className="font-semibold text-sm">{notif.title}</h4>
                                                            {!notif.read && (
                                                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(notif.createdAt).toLocaleString('pt-BR', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                {!notif.read && (
                                                                    <button
                                                                        onClick={() => handleMarkAsRead(notif.id)}
                                                                        disabled={loading}
                                                                        className="btn btn-ghost btn-xs p-1"
                                                                        title="Marcar como lida"
                                                                    >
                                                                        <Check size={14} />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDelete(notif.id)}
                                                                    disabled={loading}
                                                                    className="btn btn-ghost btn-xs p-1 text-red-600 hover:bg-red-50"
                                                                    title="Excluir"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {notif.link && (
                                                            <Link
                                                                href={notif.link}
                                                                onClick={() => setIsOpen(false)}
                                                                className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                                                            >
                                                                Ver detalhes →
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

