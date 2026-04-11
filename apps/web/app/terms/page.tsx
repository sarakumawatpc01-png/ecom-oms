import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900">Terms & Conditions</h1>
      <p className="mt-3 text-sm text-slate-600">
        This page is the public legal entry point for Agencyfic OMS. Superadmin can override this text via site settings key
        <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">legal.terms</code>.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-700">
        By using Agencyfic OMS, you agree to lawful use, accurate account information, and responsible operation of linked marketplace accounts.
      </div>
      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/privacy" className="text-violet-700 hover:underline">Privacy Policy</Link>
        <Link href="/refund" className="text-violet-700 hover:underline">Refund Policy</Link>
      </div>
    </main>
  );
}

