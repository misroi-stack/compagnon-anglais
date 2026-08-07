"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { GameHeader } from "./GameHeader";
import { speak } from "@/lib/speech";
import { getMascotImage } from "@/lib/mascots";
import { playSuccessSound } from "@/lib/sound";
import type { Theme, Word } from "@/types/content";
import type { MascotId } from "@/types/profile";

interface TPRProps {
  mascotId: MascotId;
  theme: Theme;
  words: Word[];
  onExit: () => void;
}

/**
 * Mode "Fais l'action" (Total Physical Response) : l'app dit un verbe de
 * mouvement, l'enfant le mime physiquement. Aucune détection réelle du geste
 * n'est possible sans caméra — le mode est donc auto-validé, sans tentative
 * enregistrée en base, au même titre que Flashcards (découverte libre).
 */
export function TPR({ mascotId, theme, words, onExit }: TPRProps) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const word = words[index];
  const isLast = index === words.length - 1;

  useEffect(() => {
    setCelebrating(false);
    if (word) speak(word.en);
  }, [index, word]);

  useEffect(() => {
    if (finished) playSuccessSound();
  }, [finished]);

  function next() {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  }

  if (finished) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 shadow-xl"
        >
          <Image
            src={getMascotImage(mascotId, "celebration")}
            alt=""
            width={112}
            height={112}
            className="h-24 w-24 object-contain"
          />
          <p className="text-xl font-bold text-violet-700">Bien joué, tu as tout bougé !</p>
          <button
            type="button"
            onClick={onExit}
            className="rounded-full bg-violet-600 px-8 py-3 font-bold text-white shadow"
          >
            Terminé
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
      <GameHeader
        themeName={theme.name}
        themeIcon={theme.icon}
        progress={`${index + 1} / ${words.length}`}
        onExit={onExit}
      />

      <motion.div
        key={word.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-md flex-col items-center gap-5 rounded-3xl bg-white p-8 shadow-xl"
      >
        <Image
          src={getMascotImage(mascotId, celebrating ? "celebration" : "encourageant")}
          alt=""
          width={96}
          height={96}
          className="h-20 w-20 object-contain"
        />
        <p className="text-sm text-violet-400">On bouge ! Fais l&apos;action :</p>
        <span className="text-7xl">{word.emoji}</span>
        <h2 className="text-4xl font-extrabold text-violet-700">{word.en.toUpperCase()} !</h2>
        <p className="text-violet-400">{word.fr}</p>

        <button
          type="button"
          onClick={() => speak(word.en)}
          className="rounded-full bg-amber-400 px-6 py-2 font-bold text-white shadow"
        >
          🔊 Écouter
        </button>

        {!celebrating ? (
          <button
            type="button"
            onClick={() => setCelebrating(true)}
            className="rounded-full bg-emerald-500 px-8 py-4 text-xl font-bold text-white shadow-lg"
          >
            ✅ Je l&apos;ai fait !
          </button>
        ) : (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-semibold text-emerald-600">
            Bravo ! 🎉
          </motion.p>
        )}
      </motion.div>

      {celebrating && (
        <button
          type="button"
          onClick={next}
          className="rounded-full bg-violet-600 px-8 py-3 font-bold text-white shadow"
        >
          {isLast ? "Terminé 🎉" : "Suivant →"}
        </button>
      )}
    </main>
  );
}
