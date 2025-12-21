'use client';

import { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/actions/product-catalog';
import { Plus, Edit, Trash, Search, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProductCatalogPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        partNumber: '',
        name: '',
        brand: '',
        model: '',
        description: ''
    });

    const loadProducts = async () => {
        setLoading(true);
        try {
            const res = await getProducts({ query: search, page });
            setProducts(res.products);
            setTotalPages(res.totalPages);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadProducts();
    }, [search, page]);

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                partNumber: product.partNumber,
                name: product.name,
                brand: product.brand || '',
                model: product.model || '',
                weight: product.weight || 0,
                description: product.description || ''
            });
        } else {
            setEditingProduct(null);
            setFormData({
                partNumber: '',
                name: '',
                brand: '',
                model: '',
                weight: '',
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = new FormData();
        Object.keys(formData).forEach(key => payload.append(key, formData[key]));

        if (editingProduct) {
            await updateProduct(editingProduct.id, payload);
        } else {
            const res = await createProduct(payload);
            if (res.error) {
                alert(res.error);
                return;
            }
        }
        setIsModalOpen(false);
        loadProducts();
    };

    const handleDelete = async (id) => {
        if (confirm('Tem certeza que deseja desativar este produto?')) {
            await deleteProduct(id);
            loadProducts();
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Catálogo de Equipamentos</h1>
                    <p className="text-gray-600">Modelos de equipamentos atendidos.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary gap-2">
                    <Plus size={18} /> Novo Equipamento
                </button>
            </div>

            <div className="bg-white rounded-lg shadow border p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        className="input pl-10"
                        placeholder="Buscar por Part Number, Nome ou Marca..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow border overflow-hidden">
                <table className="table w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Part Number</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Marca/Modelo</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Peso (Kg)</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="p-4 text-center">Carregando...</td></tr>
                        ) : products.length === 0 ? (
                            <tr><td colSpan="4" className="p-4 text-center text-muted">Nenhum registro encontrado.</td></tr>
                        ) : (
                            products.map(p => (
                                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="py-3 px-4 font-mono text-blue-700 font-medium">{p.partNumber}</td>
                                    <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                                    <td className="py-3 px-4 text-gray-600">{p.brand} {p.model}</td>
                                    <td className="py-3 px-4 text-gray-600">{p.weight ? `${p.weight} kg` : '-'}</td>
                                    <td className="py-3 px-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(p)} className="btn btn-sm btn-ghost text-blue-600">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-ghost text-red-600">
                                            <Trash size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination if needed */}
            <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <span>Página {page} de {totalPages}</span>
                <div className="gap-2 flex">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm btn-outline">Anterior</button>
                    <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-sm btn-outline">Próxima</button>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">{editingProduct ? 'Editar Equipamento' : 'Novo Equipamento'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="form-group">
                                <label className="label">Part Number <span className="text-red-500">*</span></label>
                                <input
                                    className="input"
                                    required
                                    value={formData.partNumber}
                                    onChange={e => setFormData({ ...formData, partNumber: e.target.value.toUpperCase() })}
                                    placeholder="Ex: PN-123456"
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Nome do Equipamento <span className="text-red-500">*</span></label>
                                <input
                                    className="input"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Inversor de Frequência"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="label">Marca</label>
                                    <input
                                        className="input"
                                        value={formData.brand}
                                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">Modelo</label>
                                    <input
                                        className="input"
                                        value={formData.model}
                                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Peso (Kg)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="input"
                                    value={formData.weight}
                                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Descrição</label>
                                <textarea
                                    className="input"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancelar</button>
                                <button type="submit" className="btn btn-primary"><Save size={18} className="mr-2" /> Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
