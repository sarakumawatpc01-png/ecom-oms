import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../../components/AppShell';
import { superadminNav } from '../../../../components/nav-config';

export default function SuperadminSystemMonitoringPage() {
  return (
    <AppShell
      admin
      title="System Monitoring"
      subtitle="Observe sessions, job queues, sync status, and system errors"
      navItems={superadminNav('System Monitoring')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Monitoring Console</h3>
        <p className="mt-2 text-sm text-slate-600">
          This section is now reachable from tabs and ready for session monitor, sync jobs, and logs.
        </p>
      </Card>
    </AppShell>
  );
}

