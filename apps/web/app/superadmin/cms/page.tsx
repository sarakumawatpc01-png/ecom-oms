import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';

export default function SuperadminCmsPage() {
  return (
    <AppShell
      admin
      title="CMS & Branding"
      subtitle="Manage legal pages, homepage content, and branding keys"
      navItems={[
        { label: 'Overview' },
        { label: 'Platform Integrations' },
        { label: 'Sellers' },
        { label: 'Billing & Plans' },
        { label: 'CMS & Branding', active: true },
      ]}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Site Settings APIs</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>GET /api/site-settings</li>
          <li>PUT /api/site-settings/:key</li>
          <li>GET /api/site-settings/public/legal/:slug</li>
        </ul>
      </Card>
    </AppShell>
  );
}

