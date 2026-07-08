import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

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
        {/* Responsive, Animated Header Navbar component */}
        <Navbar />
        
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        
        <footer className="border-t border-border py-8 bg-surface/50 mt-12 text-center text-xs text-text-secondary">
          <p>© {new Date().getFullYear()} FandomRates. Built by fans who got tired of wondering.</p>
        </footer>
      </body>
    </html>
  );
}
