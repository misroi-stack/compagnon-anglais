"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Quiz } from "./Quiz";
import { Phrase } from "./Phrase";
import { RepeatCheck } from "./RepeatCheck";
import { Associe } from "./Associe";
import { getMascotImage } from "@/lib/mascots";
import { playSuccessSound } from "@/lib/sound";
import { getProgressForProfile } from "@/lib/progress";
import type { SessionPlan } from "@/lib/session";
import type { MascotId } from "@/types/profile";
import type { Word } from "@/types/content";
import type { WordProgress } from "@/types/progress";

interface SessionRunnerProps {
  profileId: string;
  mascotId: MascotId;
  plan: SessionPlan;
  onExit: () => void;
}

interface StepResult {
  word: Word;
  correct: boolean;
}

export function SessionRunner({ profileId, mascotId, plan, onExit }: SessionRunnerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"playing" | "summary">("playing");
  const [newlyMastered, setNewlyMastered] = useState<Word[]>([]);
  const initialProgressRef = useRef<Map<string, WordProgress> | null>(null);
  // Ref plutôt que state : évite les lectures obsolètes de résultats dans un
  // closure quand on calcule le résumé juste après le dernier setStepIndex.
  const resultsRef = useRef<StepResult[]>([]);

  useEffect(() => {
    getProgressForProfile(profileId).then((map) => {
      initialProgressRef.current = map;
    });
  }, [profileId]);

  useEffect(() => {
    if (phase === "summary") playSuccessSound();
  }, [phase]);

  const step = plan.steps[stepIndex];
  const isLastStep = stepIndex === plan.steps.length - 1;

  async function advance() {
    if (isLastStep) {
      await finalizeSummary();
      setPhase("summary");
      return;
    }
    setStepIndex((i) => i + 1);
  }

  async function finalizeSummary() {
    const initial = initialProgressRef.current;
    if (!initial) {
      setPhase("summary");
      return;
    }
    const latest = await getProgressForProfile(profileId);
    const uniqueWords = Array.from(new Map(resultsRef.current.map((r) => [r.word.id, r.word])).values());
    const justMastered = uniqueWords.filter(
      (w) => !initial.get(w.id)?.mastered && latest.get(w.id)?.mastered
    );
    setNewlyMastered(justMastered);
  }

  function handleSingleComplete(word: Word, correct: boolean) {
    resultsRef.current.push({ word, correct });
    advance();
  }

  function handleAssocieComplete(words: Word[]) {
    resultsRef.current.push(...words.map((w) => ({ word: w, correct: true })));
    advance();
  }

  if (phase === "summary") {
    const results = resultsRef.current;
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-10">
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
          <p className="text-xl font-bold text-violet-700">Session terminée !</p>
          <p className="text-sm text-violet-500">
            {total} mot{total > 1 ? "s" : ""} pratiqué{total > 1 ? "s" : ""} · {accuracy}% de réussite
          </p>

          {newlyMastered.length > 0 && (
            <div className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-50 px-4 py-3 text-center">
              {newlyMastered.slice(0, 2).map((w) => (
                <p key={w.id} className="text-sm font-semibold text-emerald-700">
                  ⭐ {w.en} progresse !
                </p>
              ))}
            </div>
          )}

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
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-center gap-2 bg-violet-600 py-2 text-sm font-semibold text-white">
        ⭐ Session du jour · {stepIndex + 1} / {plan.steps.length}
      </div>

      {step.kind === "associe" ? (
        <Associe
          key={`associe-${stepIndex}`}
          profileId={profileId}
          mascotId={mascotId}
          theme={step.theme}
          words={step.words}
          onExit={onExit}
          onItemComplete={() => handleAssocieComplete(step.words)}
        />
      ) : step.mode === "quiz" ? (
        <Quiz
          key={`quiz-${stepIndex}`}
          profileId={profileId}
          mascotId={mascotId}
          theme={step.theme}
          words={[step.word]}
          distractorPool={step.theme.words}
          onExit={onExit}
          onItemComplete={(correct) => handleSingleComplete(step.word, correct)}
        />
      ) : step.mode === "phrase" ? (
        <Phrase
          key={`phrase-${stepIndex}`}
          profileId={profileId}
          mascotId={mascotId}
          theme={step.theme}
          words={[step.word]}
          distractorPool={step.theme.words}
          onExit={onExit}
          onItemComplete={(correct) => handleSingleComplete(step.word, correct)}
        />
      ) : (
        <RepeatCheck
          key={`repete-${stepIndex}`}
          profileId={profileId}
          mascotId={mascotId}
          theme={step.theme}
          words={[step.word]}
          onExit={onExit}
          onItemComplete={(correct) => handleSingleComplete(step.word, correct)}
        />
      )}
    </div>
  );
}
