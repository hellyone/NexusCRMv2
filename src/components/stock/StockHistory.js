'use client';

import { format } from 'date-fns';

export default function StockHistory({ history }) {
    if (!history || history.length === 0) {
        return <div className="text-gray-500 text-sm italic">Nenhum histórico de movimentação.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="table table-sm">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Qtd</th>
                        <th>Motivo</th>
                        <th>Usuário</th>
                        <th>Ref. OS</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((move) => (
                        <tr key={move.id}>
                            <td>{format(new Date(move.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                            <td>
                                <span className={`badge badge-sm ${move.type === 'IN' ? 'badge-success' : 'badge-error'}`}>
                                    {move.type}
                                </span>
                            </td>
                            <td className="font-mono">{move.quantity}</td>
                            <td className="text-xs">{move.reason}</td>
                            <td className="text-xs">{move.user?.name || '-'}</td>
                            <td className="text-xs">{move.serviceOrder?.code || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
