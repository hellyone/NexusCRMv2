
import { auth } from '@/auth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import CommercialPage from '@/app/(protected)/commercial/page';
import FieldPage from '@/app/(protected)/field/page';

export default async function DashboardPage({ searchParams }) {
  const session = await auth();
  const role = session?.user?.role || 'GUEST';

  // Role-Based Dashboard Routing
  switch (role) {
    case 'TECH_INTERNAL':
    case 'TECH_FIELD':
      return <FieldPage searchParams={searchParams} />;

    case 'BACKOFFICE':
    case 'COMERCIAL': // Just in case a legacy/manual role exists
      return <CommercialPage searchParams={searchParams} />;

    case 'ADMIN':
    default:
      return <AdminDashboard />;
  }
}
