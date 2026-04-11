import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agencyfic OMS',
  description: 'Multi-tenant order management SaaS platform',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
