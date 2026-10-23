"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  const menuVariants = {
    closed: { opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    open: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeInOut" } }
  };

  return (
    <header className="border-b border-border bg-surface/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="font-black text-lg tracking-wider text-text-primary flex items-center gap-2 hover:opacity-90">
          <span className="text-accent-gold">✦</span> FANDOM<span className="text-accent-cyan">RATES</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-black uppercase tracking-wider text-text-secondary">
          <Link href="/" className="hover:text-text-primary transition-colors">Explore</Link>
          <Link href="/battles" className="hover:text-text-primary transition-colors">Comparisons</Link>
          <Link href="/methodology" className="hover:text-text-primary transition-colors">Methodology</Link>
          <Link href="/submit" className="hover:text-text-primary transition-colors">Corrections</Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden min-h-11 min-w-11 p-2 text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* Mobile Sliding Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="md:hidden border-t border-border bg-surface/95 overflow-hidden"
          >
            <nav className="flex flex-col px-4 py-4 space-y-4 text-sm font-bold uppercase tracking-wider text-text-secondary">
              <Link 
                href="/" 
                onClick={() => setIsOpen(false)}
                className="py-2 hover:text-text-primary transition-colors border-b border-border/40"
              >
                Explore
              </Link>
              <Link 
                href="/battles" 
                onClick={() => setIsOpen(false)}
                className="py-2 hover:text-text-primary transition-colors border-b border-border/40"
              >
                Comparisons
              </Link>
              <Link 
                href="/methodology" 
                onClick={() => setIsOpen(false)}
                className="py-2 hover:text-text-primary transition-colors border-b border-border/40"
              >
                Methodology
              </Link>
              <Link 
                href="/submit" 
                onClick={() => setIsOpen(false)}
                className="py-2 hover:text-text-primary transition-colors"
              >
                Corrections
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
