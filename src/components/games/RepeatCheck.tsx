"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { GameHeader } from "./GameHeader";
import { speak } from "@/lib/speech";
import {
  isSpeechRecognitionSupported,
  listenOnce,
  normalizeForCompare,
} from "@/lib/speech-recognition";
import { recordAttempt } from "@/lib/attempts";
import { getProgressForProfile } from "@/lib/progress";
import { getMascotImage, type MascotPose } from "@/lib/mascots";
import type { Theme, Word } from "@/types/content";
import type { MascotId } from "@/types/profile";
import type { WordProgress } from "@/types/progress";

interface RepeatCheckProps {
  profileId: string;
  mascotId: MascotId;
  theme: Theme;
  words: Word[];
  onExit: () => void;
}

type Status =
  | "idle"
  | "listening"
  | "correct"
  | "incorrect"
  | "unsupported"
  | "mic-error"
  | "no-speech";

/** Après ce nombre d'essais infructueux sur le même mot, on valide quand même —
 *  la reconnaissance vocale confond souvent des mots proches (ex: "tree"/"three")
 *  et ça ne doit pas décourager un enfant qui prononce correctement. */
const MAX_ATTEMPTS_BEFORE_AUTO_SUCCESS = 3;

export function RepeatCheck({ profileId, mascotId, theme, words, onExit }: RepeatCheckProps) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [heard, setHeard] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [progressMap, setProgressMap] = useState<Map<string, WordProgress>>(new Map());
  const [startTime, setStartTime] = useState(() => Date.now());

  const word = words[index];
  const isLast = index === words.length - 1;
  const answered = status === "correct" || status === "incorrect";

  useEffect(() => {
    getProgressForProfile(profileId).then(setProgressMap);
  }, [profileId]);

  useEffect(() => {
    setStatus(isSpeechRecognitionSupported() ? "idle" : "unsupported");
    setHeard(null);
    setAttemptCount(0);
    setStartTime(Date.now());
  }, [index]);

  async function handleListen() {
    if (status === "listening") return;
    setStatus("listening");
    setHeard(null);

    const outcome = await listenOnce("en-US");

    if (outcome.status === "unsupported") {
      setStatus("unsupported");
      return;
    }
    if (outcome.status === "not-allowed") {
      setStatus("mic-error");
      return;
    }
    if (outcome.status !== "result") {
      setStatus("no-speech");
      return;
    }

    setHeard(outcome.transcript);
    const recognized = normalizeForCompare(outcome.transcript) === normalizeForCompare(word.en);

    let correct = recognized;
    if (!recognized) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      if (newAttemptCount >= MAX_ATTEMPTS_BEFORE_AUTO_SUCCESS) {
        correct = true;
      }
    }

    setStatus(correct ? "correct" : "incorrect");
    if (!correct) speak(word.en);

    const updated = await recordAttempt(
      {
        profileId,
        wordId: word.id,
        themeId: theme.id,
        mode: "repete",
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
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  }

  function retry() {
    setStatus("idle");
    setHeard(null);
    setStartTime(Date.now());
  }

  const mascotPose: MascotPose =
    status === "listening" ? "attentif" : status === "correct" ? "encourageant" : "neutre";

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

      <div className="relative w-full max-w-md">
        <Image
          src={getMascotImage(mascotId, mascotPose)}
          alt=""
          width={80}
          height={80}
          className="absolute -top-6 -right-4 z-10 h-16 w-16 object-contain sm:-right-14"
        />

        <motion.div
          key={word.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full flex-col items-center gap-5 rounded-3xl bg-white p-10 shadow-xl"
        >
          <span className="text-7xl">{word.emoji}</span>
          <h2 className="text-4xl font-extrabold text-violet-700">{word.en}</h2>

          <button
            type="button"
            onClick={() => speak(word.en)}
            className="rounded-full bg-amber-400 px-6 py-2 font-bold text-white shadow"
          >
            🔊 Écouter
          </button>

          {status === "unsupported" ? (
            <p className="text-center text-sm text-rose-500">
              La reconnaissance vocale n&apos;est pas disponible sur cet appareil/navigateur.
            </p>
          ) : status === "mic-error" ? (
            <p className="text-center text-sm text-rose-500">
              Accès au micro refusé — autorise le micro pour ce site puis réessaie.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleListen}
              disabled={status === "listening" || answered}
              className="rounded-full bg-violet-600 px-8 py-4 text-2xl text-white shadow disabled:opacity-50"
            >
              {status === "listening" ? "🎙️ J'écoute…" : "🎤 Répète le mot"}
            </button>
          )}

          {status === "no-speech" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-semibold text-amber-500"
            >
              🤔 Je n&apos;ai rien entendu — appuie sur le micro et réessaie !
            </motion.p>
          )}

          {status === "correct" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-semibold text-emerald-600"
            >
              Parfait ! 🎉
            </motion.p>
          )}

          {status === "incorrect" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl bg-rose-50 px-4 py-3 text-center"
            >
              <p className="font-semibold text-rose-500">Presque ! Essaie encore 💪</p>
              <p className="mt-1 text-sm text-rose-400">
                J&apos;ai entendu &quot;{heard}&quot;, le mot est &quot;{word.en}&quot;
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {status === "incorrect" && (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={retry}
            className="rounded-full bg-violet-600 px-8 py-3 font-bold text-white shadow"
          >
            🔁 Réessayer
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-white px-6 py-3 font-bold text-violet-600 shadow"
          >
            Passer →
          </button>
        </div>
      )}

      {(status === "correct" || status === "unsupported" || status === "mic-error") && (
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
