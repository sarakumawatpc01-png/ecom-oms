import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';

export default function SellerReportsPage() {
  return (
    <AppShell
      title="Reports"
      subtitle="Sales, returns, and platform performance snapshots with export support"
      navItems={[
        { label: 'Dashboard' },
        { label: 'Orders' },
        { label: 'Reports', active: true },
        { label: 'Team' },
        { label: 'Billing' },
      ]}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <h3 className="text-sm font-bold">Sales Summary</h3>
          <p className="mt-2 text-sm text-slate-600">API: GET /api/reports/sales-summary</p>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold">Returns Analysis</h3>
          <p className="mt-2 text-sm text-slate-600">API: GET /api/reports/returns-analysis</p>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-bold">Platform Performance</h3>
          <p className="mt-2 text-sm text-slate-600">API: GET /api/reports/platform-performance</p>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <h3 className="text-sm font-bold">Export</h3>
        <p className="mt-2 text-sm text-slate-600">Download order export CSV using GET /api/reports/export/orders.csv</p>
      </Card>
    </AppShell>
  );
}

