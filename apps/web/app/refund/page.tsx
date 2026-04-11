import Link from 'next/link';
import { getPublicLegalContent } from '../../lib/public-site-content';

export const dynamic = 'force-dynamic';

export default async function RefundPage() {
  const content = await getPublicLegalContent('refund');

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Refund Policy</h1>
      <p className="mt-3 text-sm text-slate-600">
        This page can be managed by superadmin via site settings key
        <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">legal.refund</code>.
      </p>
      <div className="mt-6 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-700">{content}</div>
      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/terms" className="text-violet-700 hover:underline">Terms & Conditions</Link>
        <Link href="/privacy" className="text-violet-700 hover:underline">Privacy Policy</Link>
      </div>
    </main>
  );
}
