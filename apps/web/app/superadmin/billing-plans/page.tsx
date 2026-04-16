import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../../components/AppShell';
import { superadminNav } from '../../../../components/nav-config';

export default function SuperadminBillingPlansPage() {
  return (
    <AppShell
      admin
      title="Billing & Plans"
      subtitle="Configure plans, pricing, and subscription/billing controls"
      navItems={superadminNav('Billing & Plans')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Plans & Billing Admin</h3>
        <p className="mt-2 text-sm text-slate-600">
          This page now opens from sidebar tabs and can host plan configuration and billing analytics.
        </p>
      </Card>
    </AppShell>
  );
}

