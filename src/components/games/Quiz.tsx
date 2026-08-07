"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { GameHeader } from "./GameHeader";
import { buildQuestion } from "@/lib/quiz";
import { speak } from "@/lib/speech";
import { recordAttempt } from "@/lib/attempts";
import { getProgressForProfile } from "@/lib/progress";
import { getMascotImage } from "@/lib/mascots";
import { playSuccessSound } from "@/lib/sound";
import type { Theme, Word } from "@/types/content";
import type { MascotId } from "@/types/profile";
import type { WordProgress } from "@/types/progress";

interface QuizProps {
  profileId: string;
  mascotId: MascotId;
  theme: Theme;
  words: Word[];
  onExit: () => void;
  /** Si fourni, remplace l'écran de fin habituel — utilisé par SessionRunner pour enchaîner directement au step suivant. Reçoit si la dernière réponse était correcte, pour le résumé de session. */
  onItemComplete?: (correct: boolean) => void;
  /** Pioche les distracteurs ici plutôt que dans `words` — nécessaire quand `words` ne contient qu'un seul mot (usage session). */
  distractorPool?: Word[];
}

export function Quiz({ profileId, mascotId, theme, words, onExit, onItemComplete, distractorPool }: QuizProps) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [progressMap, setProgressMap] = useState<Map<string, WordProgress>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(() => Date.now());

  const word = words[index];
  const question = useMemo(
    () => buildQuestion(word, words, index, distractorPool),
    [word, words, index, distractorPool]
  );
  const isLast = index === words.length - 1;
  const answered = selected !== null;

  useEffect(() => {
    getProgressForProfile(profileId).then(setProgressMap);
  }, [profileId]);

  useEffect(() => {
    if (finished) playSuccessSound();
  }, [finished]);

  useEffect(() => {
    setSelected(null);
    setStartTime(Date.now());
    if (question.type === "listen") speak(word.en);
  }, [index, question.type, word.en]);

  async function handleSelect(option: string) {
    if (answered) return;
    setSelected(option);
    const correct = option === question.correctAnswer;
    if (!correct) speak(word.en);

    const updated = await recordAttempt(
      {
        profileId,
        wordId: word.id,
        themeId: theme.id,
        mode: "quiz",
        correct,
        responseTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      progressMap.get(word.id)
    );
    setProgressMap((prev) => new Map(prev).set(word.id, updated));
  }

  function next() {
    if (isLast) {
      if (onItemComplete) {
        onItemComplete(selected === question.correctAnswer);
        return;
      }
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
          <p className="text-xl font-bold text-violet-700">Bien joué !</p>
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
        className="flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-white p-8 shadow-xl"
      >
        {question.type === "translation" ? (
          <>
            <p className="text-sm text-violet-400">Quelle est la traduction ?</p>
            <h2 className="text-4xl font-extrabold text-violet-700">{word.en}</h2>
          </>
        ) : (
          <>
            <p className="text-sm text-violet-400">Écoute et choisis le bon mot</p>
            <button
              type="button"
              onClick={() => speak(word.en)}
              className="rounded-full bg-amber-400 px-8 py-4 text-3xl shadow"
            >
              🔊
            </button>
          </>
        )}

        <div className="grid w-full grid-cols-2 gap-3">
          {question.options.map((option) => {
            const isCorrect = option === question.correctAnswer;
            const isChosen = option === selected;
            let style = "bg-violet-100 text-violet-700";
            if (answered && isCorrect) style = "bg-emerald-500 text-white";
            else if (answered && isChosen) style = "bg-rose-400 text-white";

            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={answered}
                className={`rounded-2xl px-4 py-3 font-bold shadow transition-colors ${style}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-2"
          >
            {selected === question.correctAnswer && (
              <Image
                src={getMascotImage(mascotId, "encourageant")}
                alt=""
                width={72}
                height={72}
                className="h-16 w-16 object-contain"
              />
            )}
            <p
              className={`font-semibold ${selected === question.correctAnswer ? "text-emerald-600" : "text-rose-500"}`}
            >
              {selected === question.correctAnswer ? "Bravo ! 🎉" : `C'était "${question.correctAnswer}"`}
            </p>
          </motion.div>
        )}
      </motion.div>

      {answered && (
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
