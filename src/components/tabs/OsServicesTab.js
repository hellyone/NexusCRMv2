'use client';

import { useState, useEffect } from 'react';
import { getServicesForSelect } from '@/actions/services';
import { addServiceToServiceOrder, removeServiceFromServiceOrder, updateServiceOrderItem } from '@/actions/service-order-items';
import { getTechniciansForSelect } from '@/actions/technicians';
import { Plus, Trash2, Wrench, Edit2, Check, X } from 'lucide-react';
import { maskCurrency } from '@/utils/masks';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContainer';

export default function OsServicesTab({ os }) {
    const router = useRouter();
    const toast = useToast();
    const [availableServices, setAvailableServices] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addItemLoading, setAddItemLoading] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({ quantity: '', unitPrice: '', technicianId: '' });

    // Form State
    const [selectedService, setSelectedService] = useState('');
    const [selectedTech, setSelectedTech] = useState('');

    useEffect(() => {
        const load = async () => {
            const [srvs, techs] = await Promise.all([
                getServicesForSelect(),
                getTechniciansForSelect()
            ]);
            setAvailableServices(srvs);
            setTechnicians(techs);
        };
        load();
    }, []);

    const handleAddService = async (e) => {
        e.preventDefault();
        if (!selectedService) return;

        setAddItemLoading(true);
        const res = await addServiceToServiceOrder(os.id, selectedService, selectedTech || null);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success('Serviço adicionado com sucesso');
            setSelectedService('');
            setSelectedTech('');
            router.refresh();
        }
        setAddItemLoading(false);
    };

    const handleRemoveService = async (itemId) => {
        if (!confirm('Remover este serviço?')) return;
        setLoading(true);
        const res = await removeServiceFromServiceOrder(itemId);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success('Serviço removido com sucesso');
            router.refresh();
        }
        setLoading(false);
    };

    const handleStartEdit = (item) => {
        setEditingItem(item.id);
        setEditForm({
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            technicianId: item.technicianId?.toString() || '',
        });
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setEditForm({ quantity: '', unitPrice: '', technicianId: '' });
    };

    const handleSaveEdit = async (itemId) => {
        setLoading(true);
        const result = await updateServiceOrderItem(
            itemId,
            editForm.quantity,
            editForm.unitPrice,
            editForm.technicianId || null
        );
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success('Serviço atualizado com sucesso');
            setEditingItem(null);
            router.refresh();
        }
        setLoading(false);
    };

    // Calculate total on client side or use os.totalServices?
    // Using os.services list which is updated via props from page refresh.
    // If we rely on router.refresh() inside action, props are updated.

    return (
        <div className="flex flex-col gap-6">

            {/* Add Service Form */}
            <div className="card bg-gray-50 border-dashed border-2 border-gray-200 p-4">
                <form onSubmit={handleAddService} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="label text-xs uppercase text-muted font-bold">Adicionar Serviço</label>
                        <select
                            className="input bg-white"
                            value={selectedService}
                            onChange={e => setSelectedService(e.target.value)}
                        >
                            <option value="">Selecione um serviço...</option>
                            {availableServices.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} - R$ {maskCurrency(s.price.toFixed(2))}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full md:w-64">
                        <label className="label text-xs uppercase text-muted font-bold">Técnico (Opcional)</label>
                        <select
                            className="input bg-white"
                            value={selectedTech}
                            onChange={e => setSelectedTech(e.target.value)}
                        >
                            <option value="">Padrão da OS</option>
                            {technicians.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={!selectedService || addItemLoading}
                        className="btn btn-primary whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Adicionar
                    </button>
                </form>
            </div>

            {/* Services List */}
            <div className="table-container border rounded-lg">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Serviço</th>
                            <th>Técnico Executante</th>
                            <th className="text-right">Valor Unit.</th>
                            <th className="text-right text-gray-500 w-16">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {os.services && os.services.map(item => (
                            <tr key={item.id} className={editingItem === item.id ? 'bg-blue-50' : ''}>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <Wrench size={16} className="text-muted" />
                                        <span className="font-medium">{item.service.name}</span>
                                    </div>
                                </td>
                                <td>
                                    {editingItem === item.id ? (
                                        <select
                                            className="input text-sm"
                                            value={editForm.technicianId}
                                            onChange={(e) => setEditForm({ ...editForm, technicianId: e.target.value })}
                                        >
                                            <option value="">Padrão da OS</option>
                                            {technicians.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        item.technicianId ? (
                                            <span className="text-sm">
                                                {technicians.find(t => t.id === item.technicianId)?.name || 'Outro'}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-muted italic">Padrão da OS</span>
                                        )
                                    )}
                                </td>
                                <td className="text-right">
                                    {editingItem === item.id ? (
                                        <div className="flex items-center gap-2 justify-end">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="input text-sm w-24 text-right"
                                                value={editForm.unitPrice}
                                                onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                                            />
                                            <span className="text-xs text-muted">x</span>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0.1"
                                                className="input text-sm w-20 text-right"
                                                value={editForm.quantity}
                                                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                                            />
                                        </div>
                                    ) : (
                                        <span className="font-mono">
                                            R$ {maskCurrency(item.unitPrice.toFixed(2))} x {item.quantity}
                                        </span>
                                    )}
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {editingItem === item.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleSaveEdit(item.id)}
                                                    disabled={loading}
                                                    className="btn btn-ghost text-green-600 hover:bg-green-50 p-2 h-8 w-8"
                                                    title="Salvar"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    disabled={loading}
                                                    className="btn btn-ghost text-gray-600 hover:bg-gray-50 p-2 h-8 w-8"
                                                    title="Cancelar"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleStartEdit(item)}
                                                    disabled={loading}
                                                    className="btn btn-ghost text-blue-600 hover:bg-blue-50 p-2 h-8 w-8"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveService(item.id)}
                                                    disabled={loading}
                                                    className="btn btn-ghost text-red-600 hover:bg-red-50 p-2 h-8 w-8"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {(!os.services || os.services.length === 0) && (
                            <tr>
                                <td colSpan="4" className="text-center p-8 text-muted italic">
                                    Nenhum serviço adicionado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {os.services && os.services.length > 0 && (
                        <tfoot>
                            <tr className="bg-gray-50 font-bold">
                                <td colSpan="2" className="text-right uppercase text-xs text-muted">Total Serviços:</td>
                                <td className="text-right">R$ {maskCurrency(os.totalServices.toFixed(2))}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
