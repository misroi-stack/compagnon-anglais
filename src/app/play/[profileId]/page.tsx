"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { themes } from "@/content";
import { getMascot } from "@/lib/mascots";
import { MODES } from "@/lib/modes";
import { getProfile } from "@/lib/profiles";
import { getProgressForProfile } from "@/lib/progress";
import { getThemeStats, type ThemeStats } from "@/lib/theme-suggestion";
import type { Profile } from "@/types/profile";
import type { GameMode } from "@/types/progress";

export default function PlayPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeStats, setThemeStats] = useState<ThemeStats[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [showAllThemes, setShowAllThemes] = useState(false);

  const THEME_PREVIEW_COUNT = 8;
  const visibleThemeStats = showAllThemes
    ? themeStats
    : themeStats.slice(0, THEME_PREVIEW_COUNT);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const p = await getProfile(profileId);
      if (!p) {
        router.replace("/");
        return;
      }
      const progressMap = await getProgressForProfile(profileId);
      const stats = getThemeStats(themes, p.age, progressMap);

      if (!cancelled) {
        setProfile(p);
        setThemeStats(stats);
        setSelectedThemeId(stats[0]?.theme.id ?? null);
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
          {visibleThemeStats.map((stats, i) => {
            const isSuggested = i === 0;
            const isSelected = stats.theme.id === selectedThemeId;
            const percent = Math.round(stats.progressPercent * 100);
            return (
              <motion.button
                key={stats.theme.id}
                type="button"
                onClick={() => setSelectedThemeId(stats.theme.id)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`relative flex flex-col items-center gap-1 rounded-2xl px-2 py-3 shadow-md ${
                  isSelected ? "bg-violet-500 text-white" : "bg-white text-violet-600"
                }`}
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
                <div
                  className={`h-1.5 w-full overflow-hidden rounded-full ${
                    isSelected ? "bg-white/30" : "bg-violet-100"
                  }`}
                >
                  <div
                    style={{ width: `${percent}%` }}
                    className={`h-full rounded-full ${isSelected ? "bg-white" : "bg-emerald-400"}`}
                  />
                </div>
                <span className={`text-[9px] ${isSelected ? "text-white/80" : "text-violet-400"}`}>
                  {stats.mastered}/{stats.total} maîtrisés
                </span>
              </motion.button>
            );
          })}
        </div>

        {themeStats.length > THEME_PREVIEW_COUNT && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllThemes((v) => !v)}
              className="text-sm font-semibold text-violet-500 underline"
            >
              {showAllThemes
                ? "Réduire ↑"
                : `Voir tous les thèmes (${themeStats.length}) ↓`}
            </button>
          </div>
        )}
      </section>

      {selectedThemeId && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <h2 className="mb-3 text-center text-lg font-bold text-violet-600">Choisis un jeu</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {MODES.map((mode) => (
              <motion.button
                key={mode.id}
                type="button"
                onClick={() => setSelectedMode(mode.id)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`flex flex-col items-center gap-1 rounded-2xl px-5 py-4 shadow-md ${
                  selectedMode === mode.id ? "bg-fuchsia-500 text-white" : "bg-white text-fuchsia-600"
                }`}
              >
                <span className="text-3xl">{mode.emoji}</span>
                <span className="text-sm font-semibold">{mode.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {selectedThemeId && selectedMode && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          type="button"
          onClick={() => router.push(`/play/${profileId}/${selectedThemeId}/${selectedMode}`)}
          className="rounded-full bg-violet-600 px-10 py-4 text-lg font-bold text-white shadow-lg"
        >
          Let&apos;s go ! →
        </motion.button>
      )}

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
