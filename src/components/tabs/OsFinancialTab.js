'use client';

import { useState } from 'react';
import { maskCurrency } from '@/utils/masks';
import { updateServiceOrderHeader } from '@/actions/service-orders';
import { Save, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OsFinancialTab({ os }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [laborHours, setLaborHours] = useState(os.laborHours?.toString() || '0');
    const [displacement, setDisplacement] = useState(os.displacement?.toString() || '0');
    const [discount, setDiscount] = useState(os.discount?.toString() || '0');
    
    // Calculate labor cost based on technician's cost per hour
    const technicianCostPerHour = os.technician?.costPerHour || 0;
    const calculatedLaborCost = parseFloat(laborHours) * technicianCostPerHour;
    
    // Totals are calculated on backend and passed via OS object.
    const grandTotal = os.total;
    const subtotal = os.totalServices + os.totalParts + (os.laborCost || 0) + (os.displacement || 0);

    const handleSave = async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append('laborHours', laborHours);
        formData.append('laborCost', calculatedLaborCost.toString());
        formData.append('displacement', displacement);
        formData.append('discount', discount);
        
        const result = await updateServiceOrderHeader(os.id, formData);
        if (result.error) {
            alert(result.error);
        } else {
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Costs Breakdown */}
            <div className="card border bg-white shadow-sm p-6">
                <h3 className="section-title mb-6">Detalhamento de Custos</h3>

                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                        <span className="text-muted text-sm">Serviços Executados</span>
                        <span className="font-medium">R$ {maskCurrency(os.totalServices.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                        <span className="text-muted text-sm">Peças e Materiais</span>
                        <span className="font-medium">R$ {maskCurrency(os.totalParts.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-muted text-sm">Mão de Obra</span>
                                {os.technician && (
                                    <span className="text-xs text-gray-400">
                                        ({os.technician.name}: R$ {maskCurrency(technicianCostPerHour.toFixed(2))}/h)
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    className="input text-sm w-20"
                                    value={laborHours}
                                    onChange={(e) => setLaborHours(e.target.value)}
                                    placeholder="Horas"
                                />
                                <span className="text-xs text-gray-500">horas</span>
                                {calculatedLaborCost > 0 && (
                                    <span className="text-xs text-blue-600 font-medium ml-auto">
                                        = R$ {maskCurrency(calculatedLaborCost.toFixed(2))}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                        <div className="flex-1">
                            <span className="text-muted text-sm block mb-1">Deslocamento / Outros</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input text-sm w-32"
                                value={displacement}
                                onChange={(e) => setDisplacement(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-dashed">
                        <div className="flex-1">
                            <span className="text-muted text-sm block mb-1">Desconto</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="input text-sm w-32"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="btn btn-primary w-full"
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Total Summary */}
            <div className="card bg-gray-50 border p-6 flex flex-col justify-center gap-6">
                <div className="space-y-1 text-center">
                    <p className="text-sm text-muted uppercase font-bold tracking-wide">Valor Total da OS</p>
                    <p className="text-4xl font-extrabold text-blue-600">
                        R$ {maskCurrency(grandTotal.toFixed(2))}
                    </p>
                </div>

                <hr className="border-gray-200" />

                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Serviços</span>
                        <span>R$ {maskCurrency(os.totalServices.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Peças</span>
                        <span>R$ {maskCurrency(os.totalParts.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Mão de Obra</span>
                        <span>R$ {maskCurrency((os.laborCost || 0).toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Deslocamento</span>
                        <span>R$ {maskCurrency((os.displacement || 0).toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 pt-2 border-t">
                        <span>Subtotal</span>
                        <span>R$ {maskCurrency(subtotal.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Descontos</span>
                        <span>- R$ {maskCurrency((os.discount || 0).toFixed(2))}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
