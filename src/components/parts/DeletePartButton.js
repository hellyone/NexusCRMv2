'use client';

import { Trash2 } from 'lucide-react';
import { deletePart } from '@/actions/parts';
import { useState } from 'react';

export function DeletePartButton({ id, name }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Tem certeza que deseja excluir o item "${name}"?`)) return;

        setLoading(true);
        const result = await deletePart(id);

        if (result.error) {
            alert(result.error);
        } else if (result.message) {
            // Optional: alert(result.message);
        }
        setLoading(false);
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="btn btn-ghost p-2 text-red-500 hover:bg-red-50 hover:text-red-700"
            title="Excluir"
        >
            <Trash2 size={16} />
        </button>
    );
}
