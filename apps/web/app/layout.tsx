import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ethiopian Hotel Management System (EHMS)',
  description: 'Enterprise Hospitality Management System for Ethiopian & Global Hotel Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}
