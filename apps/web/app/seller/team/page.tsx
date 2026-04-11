import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';

export default function SellerTeamPage() {
  return (
    <AppShell
      title="Team Members"
      subtitle="Invite and manage sub-users with role-based permissions"
      navItems={[
        { label: 'Dashboard' },
        { label: 'Orders' },
        { label: 'Reports' },
        { label: 'Team', active: true },
        { label: 'Billing' },
      ]}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Sub-user Management APIs</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>GET /api/team</li>
          <li>POST /api/team/invite</li>
          <li>PATCH /api/team/:id</li>
        </ul>
      </Card>
    </AppShell>
  );
}
