import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';
import { superadminNav } from '../../../components/nav-config';

export default function SuperadminSellersPage() {
  return (
    <AppShell
      admin
      title="Sellers"
      subtitle="View, filter, and manage seller lifecycle and account health"
      navItems={superadminNav('Sellers')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Seller Management</h3>
        <p className="mt-2 text-sm text-slate-600">
          Sidebar navigation now opens this section, ready for seller table and profile drill-down features.
        </p>
      </Card>
    </AppShell>
  );
}
