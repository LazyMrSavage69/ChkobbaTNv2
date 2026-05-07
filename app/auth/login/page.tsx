"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArabesqueBorder } from "@/components/svg/ArabesqueBorder";
import { ZelligePattern } from "@/components/svg/ZelligePattern";
import { Eye, EyeOff, LogIn, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${username}@tunisiancards.local`,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError("Account not confirmed. Please sign up first.");
        } else if (error.message.includes("Invalid login credentials")) {
          setError("Invalid username or password.");
        } else {
          setError(error.message);
        }
        throw error;
      }

      if (data.user) {
        router.push("/lobby");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <div className="absolute inset-0 z-0">
        <ZelligePattern className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-brown-dark/95 via-brown-dark/80 to-brown-dark/95" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <ArabesqueBorder>
          <div className="glass-card p-8 sm:p-10">
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="inline-block mb-5"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-deep to-red-900 border-2 border-gold/50 flex items-center justify-center mx-auto">
                  <Sparkles size={36} className="text-gold" />
                </div>
              </motion.div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gold mb-3 tracking-tight">Welcome Back</h1>
              <p className="text-cream/60 text-lg">Enter the game room</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-gold text-base font-medium mb-3">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="tunisian-input"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-gold text-base font-medium mb-3">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="tunisian-input pr-14"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/50 hover:text-gold transition-colors"
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-400 text-base text-center bg-red-deep/20 p-4 rounded-xl border border-red-500/30"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="tunisian-btn w-full flex items-center justify-center gap-3 disabled:opacity-50 text-lg"
              >
                <LogIn size={22} />
                <span>{loading ? "Entering..." : "Login"}</span>
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-cream/50 text-base">
                New player?{" "}
                <Link href="/auth/signup" className="text-gold hover:text-gold-light hover:underline font-semibold transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </ArabesqueBorder>
      </motion.div>
    </div>
  );
}
