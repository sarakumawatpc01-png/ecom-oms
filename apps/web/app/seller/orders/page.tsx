import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';
import { sellerNav } from '../../../components/nav-config';

export default function SellerOrdersPage() {
  return (
    <AppShell
      title="Orders"
      subtitle="Manage and process all marketplace orders from one queue"
      navItems={sellerNav('Orders')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Orders Workspace</h3>
        <p className="mt-2 text-sm text-slate-600">
          This section is now reachable from the sidebar and ready for order table/actions integration.
        </p>
      </Card>
    </AppShell>
  );
}
