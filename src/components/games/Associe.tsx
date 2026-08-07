"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { GameHeader } from "./GameHeader";
import { MascotBubble } from "./MascotBubble";
import { recordAttempt } from "@/lib/attempts";
import { getProgressForProfile } from "@/lib/progress";
import { getMascotImage } from "@/lib/mascots";
import { playSuccessSound } from "@/lib/sound";
import { wasRecentlyMissed } from "@/lib/mascot-lines";
import type { Theme, Word } from "@/types/content";
import type { MascotId } from "@/types/profile";
import type { WordProgress } from "@/types/progress";

interface AssocieProps {
  profileId: string;
  mascotId: MascotId;
  theme: Theme;
  words: Word[];
  /** Bouton "← Retour" du header — abandonner en cours de bloc (session ou non). */
  onExit: () => void;
  /** Bouton "Terminé" une fois le bloc complété — si fourni, remplace `onExit` pour enchaîner directement au step suivant (SessionRunner). Sans effet sur "← Retour", qui appelle toujours `onExit`. */
  onItemComplete?: () => void;
}

const MAX_PAIRS = 6;

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function Associe({ profileId, mascotId, theme, words, onExit, onItemComplete }: AssocieProps) {
  const pool = useMemo(() => shuffle(words).slice(0, Math.min(MAX_PAIRS, words.length)), [words]);
  const emojiColumn = useMemo(() => shuffle(pool), [pool]);
  const wordColumn = useMemo(() => shuffle(pool), [pool]);

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<{ emoji: string; word: string } | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [progressMap, setProgressMap] = useState<Map<string, WordProgress>>(new Map());
  const [startTime] = useState(() => Date.now());

  const isComplete = matched.size === pool.length;
  const rememberedWord = pool.find((w) => wasRecentlyMissed(progressMap.get(w.id)));

  useEffect(() => {
    getProgressForProfile(profileId).then(setProgressMap);
  }, [profileId]);

  useEffect(() => {
    if (isComplete) playSuccessSound();
  }, [isComplete]);

  async function tryMatch(emojiWordId: string, wordWordId: string) {
    if (emojiWordId === wordWordId) {
      setMatched((prev) => new Set(prev).add(emojiWordId));
      setSelectedEmoji(null);
      setSelectedWord(null);

      const updated = await recordAttempt(
        {
          profileId,
          wordId: emojiWordId,
          themeId: theme.id,
          mode: "associe",
          correct: true,
          responseTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
        progressMap.get(emojiWordId)
      );
      setProgressMap((prev) => new Map(prev).set(emojiWordId, updated));
    } else {
      setWrongPair({ emoji: emojiWordId, word: wordWordId });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedEmoji(null);
        setSelectedWord(null);
      }, 600);
    }
  }

  function clickEmoji(wordId: string) {
    if (matched.has(wordId) || wrongPair) return;
    if (wordId === selectedEmoji) {
      setSelectedEmoji(null);
      return;
    }
    setSelectedEmoji(wordId);
    if (selectedWord) tryMatch(wordId, selectedWord);
  }

  function clickWord(wordId: string) {
    if (matched.has(wordId) || wrongPair) return;
    if (wordId === selectedWord) {
      setSelectedWord(null);
      return;
    }
    setSelectedWord(wordId);
    if (selectedEmoji) tryMatch(selectedEmoji, wordId);
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
      <GameHeader
        themeName={theme.name}
        themeIcon={theme.icon}
        progress={`${matched.size} / ${pool.length}`}
        onExit={onExit}
      />

      {isComplete ? (
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
          <p className="text-xl font-bold text-violet-700">Bien joué !</p>
          <button
            type="button"
            onClick={onItemComplete ?? onExit}
            className="rounded-full bg-violet-600 px-8 py-3 font-bold text-white shadow"
          >
            Terminé
          </button>
        </motion.div>
      ) : (
        <>
          <div className="w-full max-w-md">
            <MascotBubble
              mascotId={mascotId}
              text={
                rememberedWord
                  ? `Attention à "${rememberedWord.en}", tu l'avais raté la dernière fois !`
                  : "Relie chaque image à son mot !"
              }
            />
          </div>
          <div className="flex w-full max-w-md justify-between gap-6">
          <div className="flex flex-1 flex-col gap-3">
            {emojiColumn.map((word) => {
              const isMatched = matched.has(word.id);
              const isSelected = selectedEmoji === word.id;
              const isWrong = wrongPair?.emoji === word.id;
              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => clickEmoji(word.id)}
                  disabled={isMatched}
                  style={{ transform: isWrong ? "scale(0.9)" : "scale(1)" }}
                  className={`flex h-16 items-center justify-center rounded-2xl text-4xl shadow-md transition-all duration-200 ${
                    isMatched
                      ? "bg-emerald-200 opacity-60"
                      : isWrong
                        ? "bg-rose-300"
                        : isSelected
                          ? "bg-violet-400 ring-4 ring-violet-600"
                          : "bg-white"
                  }`}
                >
                  {word.emoji}
                </button>
              );
            })}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {wordColumn.map((word) => {
              const isMatched = matched.has(word.id);
              const isSelected = selectedWord === word.id;
              const isWrong = wrongPair?.word === word.id;
              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => clickWord(word.id)}
                  disabled={isMatched}
                  style={{ transform: isWrong ? "scale(0.9)" : "scale(1)" }}
                  className={`flex h-16 items-center justify-center rounded-2xl text-lg font-bold shadow-md transition-all duration-200 ${
                    isMatched
                      ? "bg-emerald-200 text-emerald-700 opacity-60"
                      : isWrong
                        ? "bg-rose-300 text-white"
                        : isSelected
                          ? "bg-violet-400 text-white ring-4 ring-violet-600"
                          : "bg-white text-violet-700"
                  }`}
                >
                  {word.en}
                </button>
              );
            })}
          </div>
          </div>
        </>
      )}
    </main>
  );
}
