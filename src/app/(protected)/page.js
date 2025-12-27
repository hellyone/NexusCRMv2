
import { auth } from '@/auth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import CommercialPage from '@/app/(protected)/commercial/page';
import TechDashboard from '@/components/dashboard/TechDashboard';

export default async function DashboardPage({ searchParams }) {
  const session = await auth();
  const role = session?.user?.role || 'GUEST';

  // Role-Based Dashboard Routing
  switch (role) {
    case 'TECH_INTERNAL':
    case 'TECH_FIELD':
      return <TechDashboard user={session.user} />;

    case 'BACKOFFICE':
    case 'COMERCIAL':
      return <CommercialPage searchParams={searchParams} />;

    case 'ADMIN':
    default:
      return <AdminDashboard />;
  }
}
