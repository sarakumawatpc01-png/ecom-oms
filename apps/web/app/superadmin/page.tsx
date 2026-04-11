import { Card } from '@agencyfic/ui';
import { AppShell } from '../../components/AppShell';

const metrics = [
  { label: 'Active Sellers', value: '142' },
  { label: 'Orders Synced (24h)', value: '12,894' },
  { label: 'API Success Rate', value: '99.2%' },
  { label: 'Queue Backlog', value: '37' },
];

export default function SuperadminPage() {
  return (
    <AppShell
      admin
      title="Superadmin Control Center"
      subtitle="Platform integrations, billing, seller management, and system monitoring"
      navItems={[
        { label: 'Overview', active: true },
        { label: 'Platform Integrations' },
        { label: 'Sellers', badge: '12' },
        { label: 'Billing & Plans' },
        { label: 'CMS & Branding' },
        { label: 'System Monitoring' },
        { label: 'Activity Log' },
      ]}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="font-mono text-2xl font-extrabold">{metric.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-bold">Platform Integrations</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <span>Amazon SP-API</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Healthy</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <span>Flipkart API</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Healthy</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <span>Meesho Automation</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Attention</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-bold">Recent Admin Activity</h3>
          <div className="space-y-3 text-sm text-slate-700">
            <p>Updated Flipkart credentials • 2 min ago</p>
            <p>Added credits to seller account • 9 min ago</p>
            <p>Disabled inactive sub-user • 25 min ago</p>
            <p>Triggered order sync for all accounts • 38 min ago</p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
