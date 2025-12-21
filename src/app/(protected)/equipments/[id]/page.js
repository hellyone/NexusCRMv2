import { notFound } from 'next/navigation';
import { getEquipment } from '@/actions/equipments';
import EquipmentImageGallery from '@/components/equipment/EquipmentImageGallery';
import Link from 'next/link';
import { Edit, ArrowLeft, Package, Calendar, MapPin, AlertCircle, Clock, ExternalLink, History } from 'lucide-react';
import { getStatusBadge } from '@/utils/status-machine';

export default async function EquipmentDetailPage({ params }) {
    const { id } = await params;
    const equipment = await getEquipment(id);

    if (!equipment) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <Link href="/equipments" className="btn btn-ghost">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{equipment.name}</h1>
                        <p className="text-muted">
                            {equipment.brand} {equipment.model}
                        </p>
                    </div>
                </div>
                <Link href={`/equipments/${id}/edit`} className="btn btn-primary">
                    <Edit size={18} />
                    Editar
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Image Gallery */}
                    <div className="card p-6">
                        <EquipmentImageGallery equipmentId={equipment.id} />
                    </div>

                    {/* Equipment Details */}
                    <div className="card p-6">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Package className="text-primary" size={24} />
                                Informações Técnicas
                            </h2>
                            {equipment.partNumber && (
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Part Number</span>
                                    <span className="font-mono font-black text-primary tracking-tighter text-lg">{equipment.partNumber}</span>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Cliente</label>
                                <p className="font-bold text-gray-900 leading-tight">{equipment.client.name}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Status Atual</label>
                                <div>{getStatusBadge ? getStatusBadge(equipment.status) : equipment.status}</div>
                            </div>
                            {equipment.serialNumber && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Número de Série</label>
                                    <p className="font-mono font-bold text-gray-900 border bg-gray-50 px-2 py-0.5 rounded w-fit">{equipment.serialNumber}</p>
                                </div>
                            )}
                            {equipment.patrimony && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Patrimônio</label>
                                    <p className="font-medium text-gray-800">{equipment.patrimony}</p>
                                </div>
                            )}
                            {equipment.voltage && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Tensão de Trabalho</label>
                                    <p className="font-medium text-gray-800">{equipment.voltage}</p>
                                </div>
                            )}
                            {equipment.power && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Potência</label>
                                    <p className="font-medium text-gray-800">{equipment.power}</p>
                                </div>
                            )}
                            {equipment.location && (
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                                        <MapPin size={12} />
                                        Localização / Setor no Cliente
                                    </label>
                                    <p className="font-medium text-gray-700">{equipment.location}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="card p-6 border-t-4 border-t-primary/20">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <History className="text-primary" size={24} />
                            Histórico de Intervenções
                        </h2>

                        {equipment.serviceOrders?.length > 0 ? (
                            <div className="space-y-4">
                                {equipment.serviceOrders.map((os) => (
                                    <div key={os.id} className="group relative pl-6 border-l-2 border-gray-100 hover:border-primary transition-colors py-2">
                                        <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-white border-2 border-gray-200 group-hover:border-primary group-hover:bg-primary transition-all" />

                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-black text-sm text-gray-900">{os.code}</span>
                                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border">
                                                        {os.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    Há {Math.floor((new Date() - new Date(os.createdAt)) / (1000 * 60 * 60 * 24))} dias • {new Date(os.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-sm text-gray-700 mt-2 line-clamp-2 italic">
                                                    "{os.reportedDefect}"
                                                </p>
                                            </div>
                                            <Link
                                                href={`/service-orders/${os.id}`}
                                                className="btn btn-ghost btn-sm p-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Ver Ordem de Serviço"
                                            >
                                                <ExternalLink size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <Clock className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="text-gray-400 text-sm font-medium">Nenhuma Ordem de Serviço registrada para este equipamento ainda.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Dates */}
                    <div className="card p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Calendar size={18} />
                            Datas Importantes
                        </h3>
                        <div className="space-y-3 text-sm">
                            {equipment.manufactureDate && (
                                <div>
                                    <label className="text-muted">Data de Fabricação</label>
                                    <p className="font-medium">
                                        {new Date(equipment.manufactureDate).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            )}
                            {equipment.purchaseDate && (
                                <div>
                                    <label className="text-muted">Data de Compra</label>
                                    <p className="font-medium">
                                        {new Date(equipment.purchaseDate).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            )}
                            {equipment.warrantyEnd && (
                                <div>
                                    <label className="text-muted">Garantia até</label>
                                    <p className={`font-medium ${new Date(equipment.warrantyEnd) > new Date() ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {new Date(equipment.warrantyEnd).toLocaleDateString('pt-BR')}
                                        {new Date(equipment.warrantyEnd) < new Date() && (
                                            <span className="ml-2 text-xs">(Vencida)</span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="card p-6">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Package size={18} />
                            Estatísticas
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted">Criado em</span>
                                <span className="font-medium">
                                    {new Date(equipment.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Última atualização</span>
                                <span className="font-medium">
                                    {new Date(equipment.updatedAt).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

