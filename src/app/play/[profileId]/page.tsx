"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { themesByKind } from "@/content";
import { getMascotImage } from "@/lib/mascots";
import { getProfile, updateProfileMascot } from "@/lib/profiles";
import { getProgressForProfile } from "@/lib/progress";
import { getThemeStats, type ThemeStats } from "@/lib/theme-suggestion";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { MascotPicker } from "@/components/MascotPicker";
import type { MascotId, Profile } from "@/types/profile";
import type { ThemeKind } from "@/types/content";

export default function PlayPage({ params }: { params: Promise<{ profileId: string }> }) {
  return (
    <Suspense fallback={<LoadingIndicator fullScreen />}>
      <PlayPageContent params={params} />
    </Suspense>
  );
}

function PlayPageContent({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const cat = searchParams.get("cat") as ThemeKind | null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeStats, setThemeStats] = useState<ThemeStats[]>([]);
  const [isChangingMascot, setIsChangingMascot] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const p = await getProfile(profileId);
      if (!p) {
        router.replace("/");
        return;
      }

      let stats: ThemeStats[] = [];
      if (cat) {
        const progressMap = await getProgressForProfile(profileId);
        stats = getThemeStats(themesByKind(cat), progressMap);
      }

      if (!cancelled) {
        setProfile(p);
        setThemeStats(stats);
        setLoading(false);
      }
    }

    load().catch(() => {
      if (!cancelled) setError("Impossible de charger le profil — vérifie ta connexion.");
    });
    return () => {
      cancelled = true;
    };
  }, [profileId, cat, router]);

  if (error) {
    return <LoadingIndicator fullScreen error={error} />;
  }

  if (loading || !profile) {
    return <LoadingIndicator fullScreen />;
  }

  async function handleChangeMascot(mascot: MascotId) {
    if (!profile) return;
    const updated = await updateProfileMascot(profile.id, mascot);
    setProfile(updated);
    setIsChangingMascot(false);
  }

  const header = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setIsChangingMascot(true)}
        aria-label="Changer de mascotte"
        className="relative rounded-full"
      >
        <Image
          src={getMascotImage(profile.mascot)}
          alt=""
          width={80}
          height={80}
          className="h-16 w-16 object-contain"
        />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-xs shadow">
          ✏️
        </span>
      </button>
      <div>
        <p className="text-sm text-violet-400">Salut</p>
        <h1 className="text-2xl font-extrabold text-violet-700">{profile.name} !</h1>
      </div>
    </div>
  );

  const mascotModal = isChangingMascot && (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4"
      onClick={() => setIsChangingMascot(false)}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-5 rounded-3xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-center text-2xl font-bold text-violet-700">Choisis ta mascotte</h2>
        <MascotPicker value={profile.mascot} onChange={handleChangeMascot} />
        <button
          type="button"
          onClick={() => setIsChangingMascot(false)}
          className="text-sm text-violet-400 underline"
        >
          Annuler
        </button>
      </motion.div>
    </div>
  );

  if (!cat) {
    return (
      <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
        {header}
        {mascotModal}

        <section className="flex w-full max-w-md flex-col items-center gap-2">
          <h2 className="mb-2 text-center text-lg font-bold text-violet-600">
            Qu&apos;est-ce qu&apos;on apprend aujourd&apos;hui ?
          </h2>
          <div className="grid w-full grid-cols-2 gap-4">
            <motion.button
              type="button"
              onClick={() => router.push(`/play/${profileId}?cat=mots`)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-2 rounded-3xl bg-white px-4 py-8 text-violet-600 shadow-md"
            >
              <span className="text-5xl">📚</span>
              <span className="text-base font-bold">Les mots</span>
            </motion.button>

            <button
              type="button"
              disabled
              className="relative flex flex-col items-center gap-2 rounded-3xl bg-white/50 px-4 py-8 text-violet-300 opacity-60 shadow-md"
            >
              <span className="absolute -top-2 -right-2 rounded-full bg-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-500">
                🔒 Bientôt
              </span>
              <span className="text-5xl">🏃</span>
              <span className="text-base font-bold">Les verbes</span>
            </button>
          </div>
        </section>

        <button type="button" onClick={() => router.push("/")} className="text-sm text-violet-400 underline">
          Changer de profil
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
      {header}
      {mascotModal}

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

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push(`/play/${profileId}`)}
          className="text-sm text-violet-400 underline"
        >
          ← Catégories
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-violet-400 underline"
        >
          Changer de profil
        </button>
      </div>
    </main>
  );
}
