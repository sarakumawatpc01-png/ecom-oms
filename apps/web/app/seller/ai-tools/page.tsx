import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../../components/AppShell';
import { sellerNav } from '../../../../components/nav-config';

export default function SellerAiToolsPage() {
  return (
    <AppShell
      title="AI Tools"
      subtitle="Listing optimization and product image enhancement workflows"
      navItems={sellerNav('AI Tools')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">AI Tools Hub</h3>
        <p className="mt-2 text-sm text-slate-600">
          Sidebar navigation now opens this section, ready for listing optimizer and image generator modules.
        </p>
      </Card>
    </AppShell>
  );
}

