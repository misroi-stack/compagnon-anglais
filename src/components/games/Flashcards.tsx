"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GameHeader } from "./GameHeader";
import { speak } from "@/lib/speech";
import type { Theme, Word } from "@/types/content";

interface FlashcardsProps {
  theme: Theme;
  words: Word[];
  onExit: () => void;
}

export function Flashcards({ theme, words, onExit }: FlashcardsProps) {
  const [index, setIndex] = useState(0);
  const word = words[index];
  const isLast = index === words.length - 1;

  function next() {
    if (isLast) {
      onExit();
      return;
    }
    setIndex((i) => i + 1);
  }

  function previous() {
    setIndex((i) => Math.max(0, i - 1));
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
        initial={{ opacity: 0, x: 40, rotate: 3 }}
        animate={{ opacity: 1, x: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-white p-10 shadow-xl"
      >
        <span className="text-7xl">{theme.icon}</span>
        <h2 className="text-4xl font-extrabold text-violet-700">{word.en}</h2>
        <p className="text-xl text-violet-400">{word.fr}</p>

        <button
          type="button"
          onClick={() => speak(word.en)}
          className="rounded-full bg-amber-400 px-6 py-2 font-bold text-white shadow"
        >
          🔊 Écouter
        </button>

        {word.phrases?.[0] && (
          <div className="mt-2 rounded-2xl bg-violet-50 px-4 py-3 text-center">
            <p className="font-semibold text-violet-700">{word.phrases[0].en}</p>
            <p className="text-sm text-violet-400">{word.phrases[0].fr}</p>
          </div>
        )}
      </motion.div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={previous}
          disabled={index === 0}
          className="rounded-full bg-white px-6 py-3 font-bold text-violet-600 shadow disabled:opacity-30"
        >
          ← Précédent
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-full bg-violet-600 px-8 py-3 font-bold text-white shadow"
        >
          {isLast ? "Terminé 🎉" : "Suivant →"}
        </button>
      </div>
    </main>
  );
}
