'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { addEquipmentImage, deleteEquipmentImage, getEquipmentImages } from '@/actions/equipment-images';
import { useRouter } from 'next/navigation';

export default function EquipmentImageGallery({ equipmentId }) {
    const router = useRouter();
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadImages();
    }, [equipmentId]);

    const loadImages = async () => {
        try {
            const data = await getEquipmentImages(equipmentId);
            setImages(data);
        } catch (error) {
            console.error('Erro ao carregar imagens:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Tipo de arquivo não permitido. Use JPG, PNG ou WEBP');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Arquivo muito grande. Máximo 5MB');
            return;
        }

        setUploading(true);

        try {
            // Upload file
            const formData = new FormData();
            formData.append('file', file);
            formData.append('equipmentId', equipmentId);

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Erro no upload');
            }

            // Save image reference to database
            const result = await addEquipmentImage(equipmentId, uploadResult.url);

            if (result.error) {
                throw new Error(result.error);
            }

            // Reload images
            await loadImages();
            router.refresh();
        } catch (error) {
            alert('Erro ao fazer upload: ' + error.message);
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleDelete = async (imageId) => {
        if (!confirm('Deseja realmente excluir esta imagem?')) return;

        try {
            const result = await deleteEquipmentImage(imageId);
            if (result.error) {
                alert(result.error);
            } else {
                await loadImages();
                router.refresh();
            }
        } catch (error) {
            alert('Erro ao excluir imagem: ' + error.message);
        }
    };

    if (loading) {
        return <div className="text-center p-4 text-muted">Carregando imagens...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Imagens do Equipamento</h3>
                <label className="btn btn-outline btn-sm cursor-pointer">
                    <Upload size={16} />
                    Adicionar Imagem
                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
            </div>

            {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                    Fazendo upload da imagem...
                </div>
            )}

            {images.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <ImageIcon size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 mb-2">Nenhuma imagem adicionada</p>
                    <p className="text-sm text-gray-400">Clique em "Adicionar Imagem" para começar</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                        <div key={image.id} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                                <img
                                    src={image.url}
                                    alt={`Equipamento ${equipmentId}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                onClick={() => handleDelete(image.id)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Excluir imagem"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

