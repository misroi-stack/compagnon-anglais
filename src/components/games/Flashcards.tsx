"use client";

import { useEffect, useState } from "react";
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
  const [flipped, setFlipped] = useState(false);
  const word = words[index];
  const isLast = index === words.length - 1;

  useEffect(() => {
    setFlipped(false);
  }, [index]);

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

  function handleListen(e: React.MouseEvent) {
    e.stopPropagation();
    speak(word.en);
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
      <GameHeader
        themeName={theme.name}
        themeIcon={theme.icon}
        progress={`${index + 1} / ${words.length}`}
        onExit={onExit}
      />

      <div style={{ perspective: 1200 }} className="w-full max-w-md">
        <div
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setFlipped((f) => !f);
          }}
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
          className="relative h-80 w-full cursor-pointer transition-transform duration-500 ease-in-out"
        >
          {/* Face avant : mot en français */}
          <div
            style={{ backfaceVisibility: "hidden" }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-8 shadow-xl"
          >
            <span
              aria-hidden
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-lg text-violet-500"
            >
              🔄
            </span>
            <span className="text-7xl">{word.emoji}</span>
            <h2 className="text-4xl font-extrabold text-violet-700">{word.fr}</h2>
            <p className="mt-2 text-sm text-violet-300">👆 Touche la carte pour voir le mot en anglais</p>
          </div>

          {/* Face arrière : mot anglais + écoute + phrase */}
          <div
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-3xl bg-violet-600 p-8 text-center shadow-xl"
          >
            <span
              aria-hidden
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg text-white"
            >
              🔄
            </span>
            <span className="text-6xl">{word.emoji}</span>
            <h2 className="text-4xl font-extrabold text-white">{word.en}</h2>

            <button
              type="button"
              onClick={handleListen}
              className="rounded-full bg-amber-400 px-6 py-2 font-bold text-white shadow"
            >
              🔊 Écouter
            </button>

            {word.phrases?.[0] && (
              <div className="mt-2 rounded-2xl bg-white/10 px-4 py-3">
                <p className="font-semibold text-white">{word.phrases[0].en}</p>
                <p className="text-sm text-violet-200">{word.phrases[0].fr}</p>
              </div>
            )}
          </div>
        </div>
      </div>

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
