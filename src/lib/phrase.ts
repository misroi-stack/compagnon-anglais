import type { Word } from "@/types/content";

export interface PhraseQuestion {
  word: Word;
  /** Phrase anglaise avec le verbe remplacé par "___". */
  promptEn: string;
  /** Traduction de la phrase complète, affichée comme indice. */
  promptFr: string;
  correctAnswer: string;
  options: string[];
  /** Phrase anglaise complète, pour la réentendre en cas d'erreur. */
  fullSentenceEn: string;
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickDistractors(pool: string[], correct: string, count: number): string[] {
  const candidates = pool.filter((value) => value !== correct);
  return shuffle(candidates).slice(0, count);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Construit une question "complète la phrase" pour un verbe : le trou est
 * dérivé automatiquement en cherchant le verbe (mot entier, insensible à la
 * casse) dans une de ses phrases d'exemple. Retourne null si aucune phrase
 * ne contient le verbe — le composant doit alors sauter ce mot plutôt que
 * de planter (ne devrait jamais arriver si le contenu passe
 * scripts/verify-content.mjs, mais défensif au cas où).
 */
export function buildPhraseQuestion(word: Word, allWords: Word[]): PhraseQuestion | null {
  const phrases = word.phrases;
  if (!phrases || phrases.length === 0) return null;

  const pattern = new RegExp(`\\b${escapeRegex(word.en)}\\b`, "i");
  const candidates = phrases.filter((p) => pattern.test(p.en));
  if (candidates.length === 0) return null;

  const phrase = candidates[Math.floor(Math.random() * candidates.length)];
  const distractors = pickDistractors(
    allWords.map((w) => w.en),
    word.en,
    2
  );

  return {
    word,
    promptEn: phrase.en.replace(pattern, "___"),
    promptFr: phrase.fr,
    correctAnswer: word.en,
    options: shuffle([word.en, ...distractors]),
    fullSentenceEn: phrase.en,
  };
}
