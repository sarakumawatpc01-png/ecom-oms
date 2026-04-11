import { Card } from '@agencyfic/ui';
import { AppShell } from '../../../components/AppShell';
import { SuperadminCommunicationSettings } from '../../../components/SuperadminCommunicationSettings';

export default function SuperadminSystemSettingsPage() {
  return (
    <AppShell
      admin
      title="System Settings"
      subtitle="Global controls for OTP, email, SMS, and notification delivery channels"
      navItems={[
        { label: 'Overview' },
        { label: 'Platform Integrations' },
        { label: 'Sellers' },
        { label: 'Billing & Plans' },
        { label: 'CMS & Branding' },
        { label: 'System Settings', active: true },
      ]}
    >
      <SuperadminCommunicationSettings />
      <Card className="mt-4 p-5">
        <h3 className="text-sm font-bold">Settings API Endpoints</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>GET /api/site-settings/admin/communication-settings</li>
          <li>PUT /api/site-settings/admin/communication-settings</li>
        </ul>
      </Card>
    </AppShell>
  );
}
