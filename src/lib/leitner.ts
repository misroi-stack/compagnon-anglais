import type { Attempt, GameMode, WordProgress } from "@/types/progress";

const BOX_INTERVAL_DAYS: Record<WordProgress["box"], number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 21,
};

const MODES_REQUIRED_FOR_MASTERY = 3;

export function createInitialProgress(wordId: string): WordProgress {
  return {
    wordId,
    box: 1,
    lastReviewedAt: null,
    nextReviewAt: null,
    successModes: [],
    mastered: false,
  };
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
}

function nextBox(box: WordProgress["box"], correct: boolean): WordProgress["box"] {
  if (!correct) return 1;
  return Math.min(box + 1, 5) as WordProgress["box"];
}

function withSuccessMode(modes: GameMode[], mode: GameMode, correct: boolean): GameMode[] {
  if (!correct || modes.includes(mode)) return modes;
  return [...modes, mode];
}

export function applyAttempt(progress: WordProgress, attempt: Attempt): WordProgress {
  const box = nextBox(progress.box, attempt.correct);
  const successModes = withSuccessMode(progress.successModes, attempt.mode, attempt.correct);
  const now = new Date(attempt.timestamp);

  return {
    ...progress,
    box,
    lastReviewedAt: now.toISOString(),
    nextReviewAt: addDays(now, BOX_INTERVAL_DAYS[box]),
    successModes,
    mastered: successModes.length >= MODES_REQUIRED_FOR_MASTERY,
  };
}

export function isDueForReview(progress: WordProgress, now: Date = new Date()): boolean {
  if (!progress.nextReviewAt) return true;
  return new Date(progress.nextReviewAt).getTime() <= now.getTime();
}
