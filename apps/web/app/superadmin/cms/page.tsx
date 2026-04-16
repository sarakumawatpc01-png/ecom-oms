import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';
import { superadminNav } from '../../../components/nav-config';
import { getPublicBranding } from '../../../lib/public-site-content';

export const dynamic = 'force-dynamic';

export default async function SuperadminCmsPage() {
  const branding = await getPublicBranding();

  return (
    <AppShell
      admin
      title="CMS & Branding"
      subtitle="Manage legal pages, homepage content, and branding keys"
      navItems={superadminNav('CMS & Branding')}
    >
      <Card className="p-5">
        <h3 className="text-sm font-bold">Site Settings APIs</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>GET /api/site-settings</li>
          <li>PUT /api/site-settings/:key</li>
          <li>GET /api/site-settings/public/legal/:slug</li>
          <li>GET /api/site-settings/public/branding</li>
          <li>GET /api/site-settings/admin/communication-settings</li>
          <li>PUT /api/site-settings/admin/communication-settings</li>
        </ul>
      </Card>
      <Card className="mt-4 p-5">
        <h3 className="text-sm font-bold">Branding Keys</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p><span className="font-semibold">branding.logoUrl:</span> {branding.logoUrl || '(not set)'}</p>
          <p><span className="font-semibold">branding.faviconUrl:</span> {branding.faviconUrl || '(not set)'}</p>
          <p><span className="font-semibold">branding.primaryColor:</span> {branding.primaryColor}</p>
          <p><span className="font-semibold">branding.accentColor:</span> {branding.accentColor}</p>
        </div>
      </Card>
    </AppShell>
  );
}
