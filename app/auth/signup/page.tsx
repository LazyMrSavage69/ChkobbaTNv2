"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ArabesqueBorder } from "@/components/svg/ArabesqueBorder";
import { ZelligePattern } from "@/components/svg/ZelligePattern";
import { Eye, EyeOff, UserPlus, Crown } from "lucide-react";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    try {
      const email = `${username}@tunisiancards.local`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create account");
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (retryError) throw retryError;
      }

      router.push("/lobby");
      router.refresh();
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.message?.includes("User already registered")) {
        setError("Username already taken.");
      } else {
        setError(err.message || "Signup failed.");
      }
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
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/50 flex items-center justify-center mx-auto">
                  <Crown size={36} className="text-gold" />
                </div>
              </motion.div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gold mb-3 tracking-tight">Join the Table</h1>
              <p className="text-cream/60 text-lg">Create your player account</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-gold text-base font-medium mb-3">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="tunisian-input"
                  placeholder="Choose a username"
                  required
                  minLength={3}
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
                    placeholder="Create a password"
                    required
                    minLength={6}
                    autoComplete="new-password"
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

              <div>
                <label className="block text-gold text-base font-medium mb-3">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="tunisian-input"
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                />
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
                <UserPlus size={22} />
                <span>{loading ? "Creating..." : "Create Account"}</span>
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-cream/50 text-base">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-gold hover:text-gold-light hover:underline font-semibold transition-colors">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </ArabesqueBorder>
      </motion.div>
    </div>
  );
}
