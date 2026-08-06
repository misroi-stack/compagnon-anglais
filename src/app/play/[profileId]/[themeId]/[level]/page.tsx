"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { getTheme, wordsForLevel } from "@/content";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { MODES } from "@/lib/modes";
import { getProfile } from "@/lib/profiles";
import { getProgressForProfile } from "@/lib/progress";
import { getMascotImage } from "@/lib/mascots";
import { getThemeModeStats, type ThemeModeStats } from "@/lib/theme-mode-stats";
import type { Level, Theme } from "@/types/content";
import type { Profile } from "@/types/profile";

interface RouteParams {
  profileId: string;
  themeId: string;
  level: string;
}

export default function ModeHubPage({ params }: { params: Promise<RouteParams> }) {
  const { profileId, themeId, level: levelParam } = use(params);
  const router = useRouter();
  const level = Number(levelParam) as Level;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [modeStats, setModeStats] = useState<ThemeModeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (![1, 2, 3].includes(level)) {
      router.replace(`/play/${profileId}/${themeId}`);
      return;
    }

    let cancelled = false;

    async function load() {
      const p = await getProfile(profileId);
      const t = getTheme(themeId);
      if (!p || !t) {
        router.replace("/");
        return;
      }
      const progressMap = await getProgressForProfile(profileId);
      const stats = getThemeModeStats(t, level, progressMap);

      if (!cancelled) {
        setProfile(p);
        setTheme(t);
        setModeStats(stats);
        setLoading(false);
      }
    }

    load().catch(() => {
      if (!cancelled) setError("Impossible de charger le niveau — vérifie ta connexion.");
    });
    return () => {
      cancelled = true;
    };
  }, [profileId, themeId, level, router]);

  if (error) {
    return <LoadingIndicator fullScreen error={error} />;
  }

  if (loading || !profile || !theme) {
    return <LoadingIndicator fullScreen />;
  }

  const wordCount = wordsForLevel(theme, level).length;
  const allGradedComplete = modeStats.length > 0 && modeStats.every((s) => s.complete);
  const nextSuggestedMode = MODES.find((m) => {
    const stats = modeStats.find((s) => s.mode === m.id);
    return stats ? !stats.complete : m.id === "flashcards";
  })?.id;

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
      <div className="flex flex-col items-center gap-1">
        <span className="text-6xl">{theme.icon}</span>
        <h1 className="text-2xl font-extrabold text-violet-700">
          {theme.name} — Niveau {level}
        </h1>
        <p className="text-sm text-violet-400">{wordCount} mots à explorer</p>
      </div>

      {allGradedComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Image
            src={getMascotImage(profile.mascot, "celebration")}
            alt=""
            width={80}
            height={80}
            className="h-16 w-16 object-contain"
          />
          <p className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            Les 4 jeux sont faits pour ce niveau !
          </p>
          {level < 3 ? (
            <button
              type="button"
              onClick={() => router.push(`/play/${profileId}/${themeId}/${level + 1}`)}
              className="rounded-full bg-emerald-500 px-8 py-4 text-lg font-bold text-white shadow-lg"
            >
              Niveau {level + 1} →
            </button>
          ) : (
            <p className="text-sm font-semibold text-violet-500">
              🏆 Tous les niveaux de ce thème sont terminés !
            </p>
          )}
        </motion.div>
      )}

      <section className="w-full max-w-md">
        <p className="mb-3 text-center text-sm font-semibold text-violet-500">
          Fais les 4 jeux pour bien apprendre ce niveau
        </p>
        <div className="grid grid-cols-2 gap-4">
          {MODES.map((mode) => {
            const stats = modeStats.find((s) => s.mode === mode.id);
            const isSuggested = mode.id === nextSuggestedMode;
            return (
              <motion.button
                key={mode.id}
                type="button"
                onClick={() => router.push(`/play/${profileId}/${themeId}/${level}/${mode.id}`)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={`relative flex flex-col items-center gap-1 rounded-2xl px-4 py-5 shadow-md ${
                  isSuggested ? "bg-violet-500 text-white" : "bg-white text-violet-600"
                }`}
              >
                {stats?.complete && (
                  <span className="absolute -top-2 -right-2 rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-bold text-white">
                    ✓
                  </span>
                )}
                <span className="text-3xl">{mode.emoji}</span>
                <span className="text-sm font-semibold">{mode.label}</span>
                {stats && (
                  <span className={`text-[10px] ${isSuggested ? "text-white/80" : "text-violet-400"}`}>
                    {stats.done}/{stats.total} réussis
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        onClick={() => router.push(`/play/${profileId}/${themeId}`)}
        className="text-sm text-violet-400 underline"
      >
        Changer de niveau
      </button>
    </main>
  );
}
