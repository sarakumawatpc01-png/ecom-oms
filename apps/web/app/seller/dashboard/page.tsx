import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';

const quickStats = [
  { label: 'Pending', value: '34' },
  { label: 'Ready to Ship', value: '21' },
  { label: 'Returns', value: '5' },
  { label: 'Credits Left', value: '2,781' },
];

export default function SellerDashboardPage() {
  return (
    <AppShell
      title="Seller Dashboard"
      subtitle="Unified order operations across Amazon, Flipkart, and Meesho"
      navItems={[
        { label: 'Dashboard', active: true },
        { label: 'Orders', badge: '34' },
        { label: 'Platform Connections' },
        { label: 'Labels & Invoices' },
        { label: 'Claims & Evidence' },
        { label: 'AI Tools' },
        { label: 'Billing' },
      ]}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="font-mono text-2xl font-extrabold">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-sm font-bold">Latest Orders</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Order ID</th>
              <th className="px-4 py-3 text-left">Platform</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium">MSH-ORDER-1001</td>
              <td className="px-4 py-3">Meesho</td>
              <td className="px-4 py-3">Ravi Kumar</td>
              <td className="px-4 py-3">₹899</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Pending</span>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}
