import type { NavItem } from './AppShell';

const sellerNavBase: NavItem[] = [
  { label: 'Dashboard', href: '/seller/dashboard' },
  { label: 'Orders', href: '/seller/orders', badge: '34' },
  { label: 'Reports', href: '/seller/reports' },
  { label: 'Team', href: '/seller/team' },
  { label: 'Platform Connections', href: '/seller/platform-connections' },
  { label: 'Labels & Invoices', href: '/seller/labels-invoices' },
  { label: 'Claims & Evidence', href: '/seller/claims-evidence' },
  { label: 'AI Tools', href: '/seller/ai-tools' },
  { label: 'Billing', href: '/seller/billing' },
];

const superadminNavBase: NavItem[] = [
  { label: 'Overview', href: '/superadmin' },
  { label: 'Platform Integrations', href: '/superadmin/platform-integrations' },
  { label: 'Sellers', href: '/superadmin/sellers', badge: '12' },
  { label: 'Billing & Plans', href: '/superadmin/billing-plans' },
  { label: 'CMS & Branding', href: '/superadmin/cms' },
  { label: 'System Settings', href: '/superadmin/system-settings' },
  { label: 'System Monitoring', href: '/superadmin/system-monitoring' },
  { label: 'Activity Log', href: '/superadmin/activity-log' },
];

function activate(items: NavItem[], activeLabel: string): NavItem[] {
  return items.map((item) => ({ ...item, active: item.label === activeLabel }));
}

export function sellerNav(activeLabel: string): NavItem[] {
  return activate(sellerNavBase, activeLabel);
}

export function superadminNav(activeLabel: string): NavItem[] {
  return activate(superadminNavBase, activeLabel);
}
