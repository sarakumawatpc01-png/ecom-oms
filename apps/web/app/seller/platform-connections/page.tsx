import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';
import { sellerNav } from '../../../components/nav-config';

export default function SellerPlatformConnectionsPage() {
  return (
    <AppShell
      title="Platform Connections"
      subtitle="Connect, validate, and monitor marketplace account integrations"
      navItems={sellerNav('Platform Connections')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Marketplace Integrations</h3>
        <p className="mt-2 text-sm text-slate-600">
          This section is now accessible and ready for Meesho, Amazon, and Flipkart connection controls.
        </p>
      </Card>
    </AppShell>
  );
}
