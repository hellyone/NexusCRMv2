import { notFound } from 'next/navigation';
import { getPart } from '@/actions/parts';
import { getStockHistory } from '@/actions/stock';
import PartDetailsView from '@/components/stock/PartDetailsView';

export default async function PartPage({ params }) {
    const { id } = await params;

    // Parallel fetching for performance
    const [part, history] = await Promise.all([
        getPart(id),
        getStockHistory(id)
    ]);

    if (!part) {
        notFound();
    }

    return <PartDetailsView part={part} history={history} />;
}
