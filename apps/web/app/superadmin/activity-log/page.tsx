import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';
import { superadminNav } from '../../../components/nav-config';

export default function SuperadminActivityLogPage() {
  return (
    <AppShell
      admin
      title="Activity Log"
      subtitle="Audit and review administrative actions across the platform"
      navItems={superadminNav('Activity Log')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Admin Activity Audit</h3>
        <p className="mt-2 text-sm text-slate-600">
          Sidebar links now open this page, ready for searchable actor/action audit trails.
        </p>
      </Card>
    </AppShell>
  );
}
