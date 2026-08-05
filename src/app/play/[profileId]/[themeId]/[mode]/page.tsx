"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTheme, wordsForAge } from "@/content";
import { Flashcards } from "@/components/games/Flashcards";
import { Quiz } from "@/components/games/Quiz";
import { Associe } from "@/components/games/Associe";
import { RepeatCheck } from "@/components/games/RepeatCheck";
import { getProfile } from "@/lib/profiles";
import type { Theme, Word } from "@/types/content";
import type { Profile } from "@/types/profile";
import type { GameMode } from "@/types/progress";

const VALID_MODES: GameMode[] = ["flashcards", "quiz", "associe", "repete"];

interface RouteParams {
  profileId: string;
  themeId: string;
  mode: string;
}

export default function GamePage({ params }: { params: Promise<RouteParams> }) {
  const { profileId, themeId, mode } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  const isValidMode = VALID_MODES.includes(mode as GameMode);

  useEffect(() => {
    if (!isValidMode) {
      router.replace(`/play/${profileId}`);
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
      if (!cancelled) {
        setProfile(p);
        setTheme(t);
        setWords(wordsForAge(t, p.age));
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profileId, themeId, isValidMode, router]);

  function exitToThemeHub() {
    router.push(`/play/${profileId}/${themeId}`);
  }

  if (loading || !profile || !theme) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50">
        <p className="text-violet-400">Chargement…</p>
      </main>
    );
  }

  switch (mode as GameMode) {
    case "flashcards":
      return <Flashcards theme={theme} words={words} onExit={exitToThemeHub} />;
    case "quiz":
      return (
        <Quiz profileId={profileId} theme={theme} words={words} onExit={exitToThemeHub} />
      );
    case "associe":
      return (
        <Associe profileId={profileId} theme={theme} words={words} onExit={exitToThemeHub} />
      );
    case "repete":
      return (
        <RepeatCheck
          profileId={profileId}
          theme={theme}
          words={words}
          onExit={exitToThemeHub}
        />
      );
    default:
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50">
          <p className="text-violet-500">Ce mode arrive très bientôt 🚧</p>
          <button
            type="button"
            onClick={exitToThemeHub}
            className="rounded-full bg-violet-600 px-6 py-3 font-bold text-white shadow"
          >
            Retour
          </button>
        </main>
      );
  }
}
