'use client';

import { Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { deleteClient } from '@/actions/clients';
import { useRouter } from 'next/navigation';

export default function DeleteClientButton({ clientId }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
            return;
        }

        setLoading(true);
        try {
            const res = await deleteClient(clientId);
            if (res.error) {
                alert(res.error);
            } else {
                router.refresh();
            }
        } catch (error) {
            alert('Erro ao tentar excluir.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            className="btn btn-ghost p-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Excluir"
            disabled={loading}
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
    );
}
