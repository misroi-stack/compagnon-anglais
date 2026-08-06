"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { themes, getWordById } from "@/content";
import { getMascotImage } from "@/lib/mascots";
import { getProfile, deactivateProfile } from "@/lib/profiles";
import { getProgressForProfile } from "@/lib/progress";
import { getThemeStats, type ThemeStats } from "@/lib/theme-suggestion";
import { MODES } from "@/lib/modes";
import {
  getAttemptsForProfile,
  computeSessions,
  computeOverallStats,
  dailyPracticeBuckets,
  weeklyAccuracyBuckets,
  modeBreakdown,
  themeAttemptBreakdown,
  strugglingWords,
  strongWords,
  formatDuration,
  type AttemptRecord,
  type OverallStats,
  type DayBucket,
  type WeekBucket,
  type ModeStats,
  type ThemeAttemptStats,
  type WordStats,
} from "@/lib/parent-stats";
import type { Profile } from "@/types/profile";

interface DashboardData {
  profile: Profile;
  overall: OverallStats;
  dayBuckets: DayBucket[];
  weekBuckets: WeekBucket[];
  modeStats: ModeStats[];
  themeStats: ThemeStats[];
  themeAttempts: Map<string, ThemeAttemptStats>;
  struggling: WordStats[];
  strong: WordStats[];
  hasData: boolean;
}

export default function ParentDashboardPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const profile = await getProfile(profileId);
      if (!profile) {
        router.replace("/parent");
        return;
      }

      const [attempts, progressMap]: [AttemptRecord[], Awaited<ReturnType<typeof getProgressForProfile>>] =
        await Promise.all([getAttemptsForProfile(profileId), getProgressForProfile(profileId)]);

      const sessions = computeSessions(attempts);

      const result: DashboardData = {
        profile,
        overall: computeOverallStats(attempts, sessions),
        dayBuckets: dailyPracticeBuckets(sessions, 14),
        weekBuckets: weeklyAccuracyBuckets(attempts, 8),
        modeStats: modeBreakdown(attempts),
        themeStats: getThemeStats(themes, progressMap),
        themeAttempts: themeAttemptBreakdown(attempts),
        struggling: strugglingWords(attempts, 6),
        strong: strongWords(attempts, 6),
        hasData: attempts.length > 0,
      };

      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    }

    load().catch(() => {
      if (!cancelled) setError("Impossible de charger les statistiques — vérifie ta connexion.");
    });
    return () => {
      cancelled = true;
    };
  }, [profileId, router]);

  if (error) {
    return <LoadingIndicator fullScreen error={error} />;
  }

  if (loading || !data) {
    return <LoadingIndicator fullScreen />;
  }

  const { profile, overall, dayBuckets, weekBuckets, modeStats, themeStats, themeAttempts, struggling, strong } =
    data;

  const maxDayMinutes = Math.max(...dayBuckets.map((d) => d.minutes), 1);
  const modeById = new Map(MODES.map((m) => [m.id, m]));

  async function handleDelete() {
    setDeleting(true);
    try {
      await deactivateProfile(profileId);
      router.push("/parent");
    } catch {
      setDeleting(false);
      setError("Impossible de supprimer le profil — vérifie ta connexion.");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
      <div className="flex w-full max-w-4xl items-center gap-3">
        <button type="button" onClick={() => router.push("/parent")} className="text-sm text-violet-400 underline">
          ← Profils
        </button>
        <Image
          src={getMascotImage(profile.mascot)}
          alt=""
          width={56}
          height={56}
          className="ml-2 h-10 w-10 object-contain"
        />
        <h1 className="text-2xl font-extrabold text-violet-700">{profile.name}</h1>
      </div>

      {!data.hasData ? (
        <div className="flex w-full max-w-4xl flex-col items-center gap-3 rounded-3xl bg-white p-10 text-center shadow-xl">
          <p className="text-lg font-semibold text-violet-600">Pas encore de données</p>
          <p className="text-sm text-violet-400">
            Les statistiques apparaîtront ici dès que {profile.name} aura joué au Quiz, à Associe ou à Répète.
          </p>
        </div>
      ) : (
        <div className="flex w-full max-w-4xl flex-col gap-6">
          {/* Tuiles de stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatTile label="Aujourd'hui" value={formatDuration(overall.todayMs)} />
            <StatTile label="Cette semaine" value={formatDuration(overall.weekMs)} />
            <StatTile label="Ce mois" value={formatDuration(overall.monthMs)} />
            <StatTile label="Essais totaux" value={String(overall.totalAttempts)} />
            <StatTile label="Taux de réussite" value={`${overall.accuracyPercent}%`} accent />
          </div>

          {/* Pratique quotidienne */}
          <section className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 font-bold text-violet-700">Pratique des 14 derniers jours</h2>
            <div className="flex h-32 items-end gap-1.5">
              {dayBuckets.map((day) => (
                <div key={day.dateKey} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-24 w-full items-end">
                    <div
                      style={{ height: `${(day.minutes / maxDayMinutes) * 100}%` }}
                      className="w-full rounded-t-md bg-violet-400 transition-all duration-500"
                      title={`${day.minutes} min`}
                    />
                  </div>
                  <span className="text-[9px] text-violet-400">{day.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Évolution de la réussite */}
          <section className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 font-bold text-violet-700">Évolution de la réussite (8 dernières semaines)</h2>
            <div className="flex h-32 items-end gap-2">
              {weekBuckets.map((week, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-24 w-full items-end">
                    <div
                      style={{ height: `${week.accuracyPercent ?? 0}%` }}
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        week.accuracyPercent === null
                          ? "bg-violet-100"
                          : week.accuracyPercent >= 70
                            ? "bg-emerald-400"
                            : week.accuracyPercent >= 40
                              ? "bg-amber-400"
                              : "bg-rose-400"
                      }`}
                      title={week.accuracyPercent !== null ? `${week.accuracyPercent}%` : "Pas de pratique"}
                    />
                  </div>
                  <span className="text-[9px] text-violet-400">{week.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Par mode de jeu */}
          <section className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 font-bold text-violet-700">Par type de jeu</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {modeStats.map((stat) => {
                const mode = modeById.get(stat.mode);
                return (
                  <div key={stat.mode} className="rounded-2xl bg-violet-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xl">{mode?.emoji}</span>
                      <span className="font-semibold text-violet-700">{mode?.label ?? stat.mode}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-violet-100">
                      <div
                        style={{ width: `${stat.accuracyPercent}%` }}
                        className="h-full rounded-full bg-emerald-400"
                      />
                    </div>
                    <p className="mt-2 text-xs text-violet-500">
                      {stat.accuracyPercent}% de réussite · {stat.attempts} essais
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Mots à travailler / points forts */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <WordListCard
              title="🎯 Mots à travailler"
              emptyText="Pas de mot difficile identifié pour l'instant."
              words={struggling}
              tone="rose"
            />
            <WordListCard
              title="⭐ Points forts"
              emptyText="Pas encore de mot bien maîtrisé — ça viendra !"
              words={strong}
              tone="emerald"
            />
          </div>

          {/* Par thème */}
          <section className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 font-bold text-violet-700">Progression par thème</h2>
            <div className="flex flex-col gap-2">
              {themeStats.map((stats) => {
                const attemptStats = themeAttempts.get(stats.theme.id);
                const percent = Math.round(stats.progressPercent * 100);
                return (
                  <div key={stats.theme.id} className="flex items-center gap-3">
                    <span className="w-6 text-lg">{stats.theme.icon}</span>
                    <span className="w-28 shrink-0 text-xs font-semibold text-violet-600 sm:w-36">
                      {stats.theme.name}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-violet-100">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-emerald-400"
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-[10px] text-violet-400">
                      {stats.mastered}/{stats.total}
                    </span>
                    <span className="w-12 shrink-0 text-right text-[10px] text-violet-400">
                      {attemptStats ? `${attemptStats.accuracyPercent}%` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <section className="w-full max-w-4xl rounded-3xl border-2 border-rose-100 bg-white p-6">
        <h2 className="mb-3 font-bold text-rose-500">Zone dangereuse</h2>
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-500"
          >
            🗑️ Supprimer ce profil
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-violet-600">
              Le profil de {profile.name} et ses statistiques seront masqués de l&apos;app. Seul un accès admin
              pourra les récupérer plus tard.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-violet-600 shadow disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
              >
                {deleting ? "Suppression…" : "Oui, supprimer"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 text-center shadow-md ${accent ? "bg-violet-600 text-white" : "bg-white"}`}>
      <p className={`text-lg font-extrabold ${accent ? "text-white" : "text-violet-700"}`}>{value}</p>
      <p className={`text-[10px] ${accent ? "text-violet-100" : "text-violet-400"}`}>{label}</p>
    </div>
  );
}

function WordListCard({
  title,
  emptyText,
  words,
  tone,
}: {
  title: string;
  emptyText: string;
  words: WordStats[];
  tone: "rose" | "emerald";
}) {
  const toneClasses = tone === "rose" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600";

  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl">
      <h2 className="mb-4 font-bold text-violet-700">{title}</h2>
      {words.length === 0 ? (
        <p className="text-sm text-violet-400">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {words.map((w) => {
            const info = getWordById(w.wordId);
            return (
              <li
                key={w.wordId}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${toneClasses}`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <span>{info?.word.emoji ?? "❓"}</span>
                  <span>{info?.word.en ?? w.wordId}</span>
                  <span className="text-xs font-normal opacity-70">{info?.word.fr}</span>
                </span>
                <span className="text-xs font-semibold">{w.accuracyPercent}%</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
