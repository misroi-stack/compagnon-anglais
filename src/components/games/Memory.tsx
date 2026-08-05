"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GameHeader } from "./GameHeader";
import { recordAttempt } from "@/lib/attempts";
import { getProgressForProfile } from "@/lib/progress";
import type { Theme, Word } from "@/types/content";
import type { WordProgress } from "@/types/progress";

interface MemoryProps {
  profileId: string;
  theme: Theme;
  words: Word[];
  onExit: () => void;
}

interface Card {
  cardId: string;
  wordId: string;
  kind: "emoji" | "word";
  display: string;
}

const MAX_PAIRS = 6;

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildDeck(words: Word[]): Card[] {
  const pool = shuffle(words).slice(0, Math.min(MAX_PAIRS, words.length));
  const cards: Card[] = pool.flatMap((word) => [
    { cardId: `${word.id}-emoji`, wordId: word.id, kind: "emoji", display: word.emoji },
    { cardId: `${word.id}-word`, wordId: word.id, kind: "word", display: word.en },
  ]);
  return shuffle(cards);
}

export function Memory({ profileId, theme, words, onExit }: MemoryProps) {
  const deck = useMemo(() => buildDeck(words), [words]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [progressMap, setProgressMap] = useState<Map<string, WordProgress>>(new Map());
  const [startTime] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);

  const totalPairs = deck.length / 2;
  const isComplete = matched.size === totalPairs;

  useEffect(() => {
    getProgressForProfile(profileId).then(setProgressMap);
  }, [profileId]);

  async function handleFlip(card: Card) {
    if (busy || flipped.includes(card.cardId) || matched.has(card.wordId)) return;

    const nextFlipped = [...flipped, card.cardId];
    setFlipped(nextFlipped);

    if (nextFlipped.length < 2) return;

    setBusy(true);
    const [firstId, secondId] = nextFlipped;
    const first = deck.find((c) => c.cardId === firstId)!;
    const second = deck.find((c) => c.cardId === secondId)!;

    if (first.wordId === second.wordId) {
      setMatched((prev) => new Set(prev).add(first.wordId));
      setFlipped([]);
      setBusy(false);

      const updated = await recordAttempt(
        {
          profileId,
          wordId: first.wordId,
          themeId: theme.id,
          mode: "memory",
          correct: true,
          responseTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
        progressMap.get(first.wordId)
      );
      setProgressMap((prev) => new Map(prev).set(first.wordId, updated));
    } else {
      setTimeout(() => {
        setFlipped([]);
        setBusy(false);
      }, 900);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
      <GameHeader
        themeName={theme.name}
        themeIcon={theme.icon}
        progress={`${matched.size} / ${totalPairs}`}
        onExit={onExit}
      />

      {isComplete ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 shadow-xl"
        >
          <p className="text-3xl">🎉</p>
          <p className="text-xl font-bold text-violet-700">Bien joué !</p>
          <button
            type="button"
            onClick={onExit}
            className="rounded-full bg-violet-600 px-8 py-3 font-bold text-white shadow"
          >
            Terminé
          </button>
        </motion.div>
      ) : (
        <div className="grid w-full max-w-2xl grid-cols-4 gap-3">
          {deck.map((card) => {
            const isFlipped = flipped.includes(card.cardId) || matched.has(card.wordId);
            return (
              <motion.button
                key={card.cardId}
                type="button"
                onClick={() => handleFlip(card)}
                whileTap={{ scale: 0.95 }}
                animate={{ rotateY: isFlipped ? 0 : 180 }}
                transition={{ duration: 0.3 }}
                className={`flex h-24 items-center justify-center rounded-2xl p-2 text-center shadow-md ${
                  matched.has(card.wordId)
                    ? "bg-emerald-200"
                    : isFlipped
                      ? "bg-white"
                      : "bg-violet-400"
                }`}
              >
                {isFlipped ? (
                  <span className={card.kind === "emoji" ? "text-4xl" : "text-lg font-bold text-violet-700"}>
                    {card.display}
                  </span>
                ) : (
                  <span className="text-2xl">❓</span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </main>
  );
}
