import type { Word } from "@/types/content";

export type QuestionType = "translation" | "listen";

export interface Question {
  type: QuestionType;
  word: Word;
  correctAnswer: string;
  options: string[];
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
 */
export function buildQuestion(word: Word, allWords: Word[], index: number, distractorPool?: Word[]): Question {
  const type: QuestionType = index % 2 === 0 ? "translation" : "listen";
  const pool = distractorPool ?? allWords;

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
