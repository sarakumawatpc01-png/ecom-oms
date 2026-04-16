import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';
import { sellerNav } from '../../../components/nav-config';

export default function SellerClaimsEvidencePage() {
  return (
    <AppShell
      title="Claims & Evidence"
      subtitle="Track returns, upload proofs, and manage claim submission workflows"
      navItems={sellerNav('Claims & Evidence')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Claims Workspace</h3>
        <p className="mt-2 text-sm text-slate-600">
          This page is now reachable and ready for active claims and history tabs defined in the product plan.
        </p>
      </Card>
    </AppShell>
  );
}
