import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FandomRates — Anime Rating Integrity Dashboard',
  description: 'Tracking platform scoring manipulations, anomalies, and review bombs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary min-h-screen flex flex-col">
        <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-extrabold text-xl tracking-wider text-text-primary flex items-center gap-2 hover:opacity-90">
                <span className="text-accent-gold">✦</span> FANDOM<span className="text-accent-cyan">RATES</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
                <Link href="/" className="hover:text-text-primary transition-colors">Dashboard</Link>
                <Link href="/methodology" className="hover:text-text-primary transition-colors">Methodology</Link>
                <Link href="/submit" className="hover:text-text-primary transition-colors">Submit Evidence</Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-border py-8 bg-surface/50 mt-12 text-center text-xs text-text-secondary">
          <p>© {new Date().getFullYear()} FandomRates. Engineered for high-integrity anime evaluation.</p>
        </footer>
      </body>
    </html>
  );
}
