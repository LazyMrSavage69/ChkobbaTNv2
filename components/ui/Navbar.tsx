"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { LogOut, User, Trophy, Gamepad2, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch - don't render until client-side mounted
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 navbar-glass h-16 sm:h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full" />
      </nav>
    );
  }

  if (!user) return null;

  const navLinks = [
    { href: "/lobby", label: "Lobby", icon: Gamepad2 },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 navbar-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/lobby" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-deep to-red-900 border border-gold/40 flex items-center justify-center group-hover:border-gold transition-all">
              <svg width="28" height="28" viewBox="0 0 36 36" className="text-gold">
                <path
                  d="M18,2 L22,14 L34,14 L24,22 L28,34 L18,26 L8,34 L12,22 L2,14 L14,14 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="18" cy="18" r="5" fill="currentColor" opacity="0.3" />
              </svg>
            </div>
            <span className="text-gold font-bold text-xl sm:text-2xl tracking-tight hidden sm:block">
              Chkobba TN
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-cream/70 hover:text-gold hover:bg-gold/10 transition-all text-base font-medium"
              >
                <link.icon size={20} />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right: User + Logout */}
          <div className="flex items-center gap-3">
            <span className="text-gold text-base font-medium hidden lg:block">
              {user.email?.split("@")[0] || "Player"}
            </span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={signOut}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-deep/30 border border-red-500/30 text-red-300 hover:bg-red-deep/50 hover:border-red-500/50 transition-all text-base font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </motion.button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-cream hover:bg-gold/10 transition-all"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-brown-dark/95 border-t border-gold/10 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-cream/70 hover:text-gold hover:bg-gold/10 transition-all text-lg font-medium"
                >
                  <link.icon size={22} />
                  <span>{link.label}</span>
                </Link>
              ))}
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-deep/20 transition-all text-lg font-medium"
              >
                <LogOut size={22} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
