import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-3 text-4xl font-extrabold">Agencyfic OMS</h1>
      <p className="mb-8 text-slate-600">One dashboard for Amazon, Flipkart, and Meesho order operations.</p>
      <div className="flex gap-3">
        <Link className="rounded-lg bg-violet-600 px-5 py-2.5 font-semibold text-white" href="/superadmin">
          Open Superadmin
        </Link>
        <Link className="rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white" href="/seller/dashboard">
          Open Seller Dashboard
        </Link>
      </div>
    </main>
  );
}
