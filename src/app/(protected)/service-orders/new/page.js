import ServiceOrderForm from '@/components/ServiceOrderForm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function NewServiceOrderPage() {
    const session = await auth();
    const role = session?.user?.role;

    if (!['ADMIN', 'BACKOFFICE'].includes(role)) {
        redirect('/service-orders');
    }

    return (
        <div>
            <ServiceOrderForm />
        </div>
    );
}
