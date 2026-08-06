"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { themes } from "@/content";
import { getMascot } from "@/lib/mascots";
import { getProfile } from "@/lib/profiles";
import { getProgressForProfile } from "@/lib/progress";
import { getThemeStats, type ThemeStats } from "@/lib/theme-suggestion";
import type { Profile } from "@/types/profile";

export default function PlayPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeStats, setThemeStats] = useState<ThemeStats[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const p = await getProfile(profileId);
      if (!p) {
        router.replace("/");
        return;
      }
      const progressMap = await getProgressForProfile(profileId);
      const stats = getThemeStats(themes, progressMap);

      if (!cancelled) {
        setProfile(p);
        setThemeStats(stats);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profileId, router]);

  if (loading || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50">
        <p className="text-violet-400">Chargement…</p>
      </main>
    );
  }

  const mascot = getMascot(profile.mascot);

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
      <div className="flex items-center gap-3">
        <span className="text-5xl">{mascot.emoji}</span>
        <div>
          <p className="text-sm text-violet-400">Salut</p>
          <h1 className="text-2xl font-extrabold text-violet-700">{profile.name} !</h1>
        </div>
      </div>

      <section className="w-full max-w-3xl">
        <h2 className="mb-1 text-center text-lg font-bold text-violet-600">Choisis un thème</h2>
        <p className="mb-4 text-center text-xs text-violet-400">
          Les thèmes les moins avancés sont proposés en premier ✨
        </p>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {themeStats.map((stats, i) => {
            const isSuggested = i === 0;
            const percent = Math.round(stats.progressPercent * 100);
            return (
              <motion.button
                key={stats.theme.id}
                type="button"
                onClick={() => router.push(`/play/${profileId}/${stats.theme.id}`)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className="relative flex flex-col items-center gap-1 rounded-2xl bg-white px-2 py-3 text-violet-600 shadow-md"
              >
                {isSuggested && (
                  <span className="absolute -top-2 -right-2 rounded-full bg-amber-300 px-1.5 py-0.5 text-[9px] font-bold text-amber-900">
                    ✨
                  </span>
                )}
                <span className="text-2xl">{stats.theme.icon}</span>
                <span className="text-center text-[11px] font-semibold leading-tight">
                  {stats.theme.name}
                </span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
                  <div
                    style={{ width: `${percent}%` }}
                    className="h-full rounded-full bg-emerald-400"
                  />
                </div>
                <span className="text-[9px] text-violet-400">
                  {stats.mastered}/{stats.total} maîtrisés
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={() => router.push("/")}
        className="text-sm text-violet-400 underline"
      >
        Changer de profil
      </button>
    </main>
  );
}
