"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getTheme } from "@/content";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { getProfile } from "@/lib/profiles";
import { getProgressForProfile } from "@/lib/progress";
import { getLevelStats, type LevelStats } from "@/lib/level-progress";
import type { Theme } from "@/types/content";
import type { Profile } from "@/types/profile";

const LEVEL_LABELS: Record<number, string> = {
  1: "Niveau 1",
  2: "Niveau 2",
  3: "Niveau 3",
};

export default function LevelPickerPage({
  params,
}: {
  params: Promise<{ profileId: string; themeId: string }>;
}) {
  const { profileId, themeId } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [levelStats, setLevelStats] = useState<LevelStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const p = await getProfile(profileId);
      const t = getTheme(themeId);
      if (!p || !t) {
        router.replace("/");
        return;
      }
      const progressMap = await getProgressForProfile(profileId);
      const stats = getLevelStats(t, progressMap);

      if (!cancelled) {
        setProfile(p);
        setTheme(t);
        setLevelStats(stats);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profileId, themeId, router]);

  if (loading || !profile || !theme) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
      <div className="flex flex-col items-center gap-1">
        <span className="text-6xl">{theme.icon}</span>
        <h1 className="text-2xl font-extrabold text-violet-700">{theme.name}</h1>
        <p className="text-sm text-violet-400">Choisis un niveau</p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-4">
        {levelStats.map((stats) => {
          const percent = stats.total ? Math.round((stats.touched / stats.total) * 100) : 0;
          return (
            <motion.button
              key={stats.level}
              type="button"
              disabled={!stats.unlocked}
              onClick={() => router.push(`/play/${profileId}/${themeId}/${stats.level}`)}
              whileTap={stats.unlocked ? { scale: 0.97 } : undefined}
              whileHover={stats.unlocked ? { scale: 1.02 } : undefined}
              className={`flex items-center gap-4 rounded-2xl p-4 text-left shadow-md ${
                stats.unlocked ? "bg-white" : "bg-white/50 opacity-60"
              }`}
            >
              <span className="text-4xl">{stats.unlocked ? "🔓" : "🔒"}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-violet-700">{LEVEL_LABELS[stats.level]}</span>
                  {stats.complete && (
                    <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-bold text-white">
                      ✓
                    </span>
                  )}
                </div>
                {stats.unlocked ? (
                  <>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-emerald-400"
                      />
                    </div>
                    <p className="mt-1 text-xs text-violet-400">
                      {stats.touched}/{stats.total} mots vus • {stats.mastered}/{stats.total} maîtrisés
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-violet-400">
                    Termine le niveau {stats.level - 1} pour débloquer
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => router.push(`/play/${profileId}`)}
        className="text-sm text-violet-400 underline"
      >
        Changer de thème
      </button>
    </main>
  );
}
