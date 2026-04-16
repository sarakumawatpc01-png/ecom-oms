import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';
import { sellerNav } from '../../../components/nav-config';

export default function SellerLabelsInvoicesPage() {
  return (
    <AppShell
      title="Labels & Invoices"
      subtitle="Generate labels, create invoices, and review print/download history"
      navItems={sellerNav('Labels & Invoices')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Labels & Invoice Center</h3>
        <p className="mt-2 text-sm text-slate-600">
          Tab navigation now works and this page can host print formats, generation actions, and history tables.
        </p>
      </Card>
    </AppShell>
  );
}
