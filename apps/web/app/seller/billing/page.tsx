import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';
import { sellerNav } from '../../../components/nav-config';

export default function SellerBillingPage() {
  return (
    <AppShell
      title="Billing"
      subtitle="Plans, usage credits, payment history, and invoices from Agencyfic"
      navItems={sellerNav('Billing')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Billing Console</h3>
        <p className="mt-2 text-sm text-slate-600">
          This page now opens from the sidebar and can host plan upgrades, invoices, and transaction history.
        </p>
      </Card>
    </AppShell>
  );
}
