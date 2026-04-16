import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../../components/AppShell';
import { superadminNav } from '../../../../components/nav-config';

export default function SuperadminPlatformIntegrationsPage() {
  return (
    <AppShell
      admin
      title="Platform Integrations"
      subtitle="Monitor and manage connector health across all marketplaces"
      navItems={superadminNav('Platform Integrations')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Integrations Control</h3>
        <p className="mt-2 text-sm text-slate-600">
          This page is now connected from the sidebar and ready for connector status/actions.
        </p>
      </Card>
    </AppShell>
  );
}

