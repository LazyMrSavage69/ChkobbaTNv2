"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/ui/Navbar";
import { Profile } from "@/types";
import { User, Trophy, Cigarette, Save, Crown, Skull } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasCigarette, setHasCigarette] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setHasCigarette(data?.has_cigarette || false);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ has_cigarette: hasCigarette })
        .eq("id", user.id);

      if (error) throw error;

      const toast = document.createElement("div");
      toast.className = "fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-dark/90 text-green-300 px-6 py-3 rounded-xl border border-green-500/30 z-50";
      toast.textContent = "Profile updated!";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen zellige-bg flex items-center justify-center">
        <Navbar />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 border-4 border-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const winRate = profile ? 
    Math.round((profile.wins / (profile.wins + profile.losses || 1)) * 100) : 0;

  return (
    <div className="min-h-screen zellige-bg">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 sm:p-10"
        >
          <div className="text-center mb-10">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-red-deep to-red-900 border-2 border-gold/50 mx-auto flex items-center justify-center mb-5">
              <User size={48} className="text-cream" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gold">{profile?.username || "Player"}</h1>
            <p className="text-cream/50 mt-2 text-lg">Win Rate: {winRate}%</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="glass-card p-5 text-center border-gold/20">
              <Crown size={28} className="text-gold mx-auto mb-3" />
              <p className="text-4xl font-bold text-green-400">{profile?.wins || 0}</p>
              <p className="text-cream/50 text-base mt-1">Wins</p>
            </div>
            <div className="glass-card p-5 text-center border-gold/20">
              <Skull size={28} className="text-gold mx-auto mb-3" />
              <p className="text-4xl font-bold text-red-400">{profile?.losses || 0}</p>
              <p className="text-cream/50 text-base mt-1">Losses</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gold border-b border-gold/20 pb-3">Settings</h2>

            <div className="flex items-center justify-between p-5 glass-card border-gold/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cream/5 flex items-center justify-center">
                  <Cigarette size={24} className="text-cream/60" />
                </div>
                <div>
                  <p className="text-cream font-semibold text-lg">Show Cigarette</p>
                  <p className="text-cream/40 text-sm">Display on your avatar</p>
                </div>
              </div>
              <button
                onClick={() => setHasCigarette(!hasCigarette)}
                className={`w-16 h-9 rounded-full transition-colors relative ${
                  hasCigarette ? "bg-gold" : "bg-cream/15"
                }`}
              >
                <motion.div
                  animate={{ x: hasCigarette ? 28 : 4 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="w-7 h-7 bg-cream rounded-full absolute top-1 shadow-lg"
                />
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={updateProfile}
              disabled={saving}
              className="w-full tunisian-btn flex items-center justify-center gap-3 disabled:opacity-50 text-lg"
            >
              <Save size={22} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
