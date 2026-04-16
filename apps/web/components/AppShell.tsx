'use client';

import { Button } from '@agencyfic/ui';
import Link from 'next/link';

export type NavItem = { label: string; href?: string; active?: boolean; badge?: string; disabled?: boolean };

export function AppShell({
  title,
  subtitle,
  navItems,
  children,
  admin = false,
}: {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children: React.ReactNode;
  admin?: boolean;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 w-60 border-r border-white/5 bg-sb text-white">
        <div className="border-b border-white/5 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-extrabold ${admin ? 'bg-violet-600' : 'bg-orange-500'}`}>
              A
            </div>
            <div className="text-sm font-extrabold tracking-tight">Agencyfic <span className="text-accent">OMS</span></div>
          </div>
        </div>
        <nav className="space-y-1 px-2 py-3">
          {navItems.map((item) => (
            item.href && !item.disabled ? (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  item.active ? 'bg-white/10 text-white' : 'text-[#7a85b0] hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {item.badge ? <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{item.badge}</span> : null}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                disabled
                aria-disabled
                className={`flex w-full cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-left text-sm opacity-70 ${
                  item.active ? 'bg-white/10 text-white' : 'text-[#7a85b0]'
                }`}
              >
                <span>{item.label}</span>
                {item.badge ? <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">{item.badge}</span> : null}
              </button>
            )
          ))}
        </nav>
      </aside>

      <main className="ml-60 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-6">
          <h1 className="flex-1 text-base font-bold">{title}</h1>
          <Button variant={admin ? 'admin' : 'primary'}>Quick Action</Button>
        </header>

        <section className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>
          {children}
        </section>
      </main>
    </div>
  );
}
