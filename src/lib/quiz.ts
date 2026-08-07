import type { Word } from "@/types/content";

export type QuestionType = "translation" | "listen" | "sentence";

export interface Question {
  type: QuestionType;
  word: Word;
  correctAnswer: string;
  options: string[];
  /** Phrase anglaise complète à écouter — uniquement pour le type "sentence". */
  promptEn?: string;
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickDistractors(pool: string[], correct: string, count: number): string[] {
  const candidates = pool.filter((value) => value !== correct);
  return shuffle(candidates).slice(0, count);
}

/**
 * Alterne entre "mot -> traduction" et "écoute -> choix" (voir PLAN.md, mode Quiz).
 * `distractorPool` permet de piocher les mauvaises réponses ailleurs que dans
 * `allWords` — nécessaire quand `allWords` ne contient qu'un seul mot (usage
 * "item unique" par SessionRunner, voir PLAN-SESSION.md).
 *
 * Pour un mot de niveau 3 (le plus avancé) avec des phrases d'exemple, un 3ᵉ
 * type "sentence" vient s'ajouter à la rotation (compréhension orale d'une
 * phrase entière plutôt que d'un mot isolé) — voir IDEAS.md priorité 4,
 * point 4. Réservé au niveau 3 plutôt qu'à un âge, l'app n'a plus de notion
 * d'âge dans son modèle de données.
 */
export function buildQuestion(word: Word, allWords: Word[], index: number, distractorPool?: Word[]): Question {
  const pool = distractorPool ?? allWords;
  const phrasePool = pool.flatMap((w) => (w.phrases ?? []).map((p) => p.fr));
  const sentenceEligible = word.level === 3 && !!word.phrases?.length && phrasePool.length >= 4;

  const type: QuestionType = sentenceEligible
    ? (["translation", "listen", "sentence"] as const)[index % 3]
    : index % 2 === 0
      ? "translation"
      : "listen";

  if (type === "sentence") {
    const phrases = word.phrases!;
    const phrase = phrases[index % phrases.length];
    const correctAnswer = phrase.fr;
    const distractors = pickDistractors(phrasePool, correctAnswer, 3);
    return { type, word, correctAnswer, options: shuffle([correctAnswer, ...distractors]), promptEn: phrase.en };
  }

  if (type === "translation") {
    const correctAnswer = word.fr;
    const distractors = pickDistractors(
      pool.map((w) => w.fr),
      correctAnswer,
      3
    );
    return { type, word, correctAnswer, options: shuffle([correctAnswer, ...distractors]) };
  }

  const correctAnswer = word.en;
  const distractors = pickDistractors(
    pool.map((w) => w.en),
    correctAnswer,
    3
  );
  return { type, word, correctAnswer, options: shuffle([correctAnswer, ...distractors]) };
}
