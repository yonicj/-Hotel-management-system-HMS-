import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          🇪🇹 Ethiopian Enterprise PMS & POS Core
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Hotel Management System
        </h1>
        <p className="text-slate-400 text-base md:text-lg">
          High-performance shared Next.js frontend with Tauri 2 desktop & mobile support, NestJS core API, and offline sync outbox.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-medium text-white shadow-lg transition"
          >
            Launch Dashboard
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium text-white transition border border-slate-700"
          >
            Staff Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
