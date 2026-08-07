export type GameMode = "flashcards" | "quiz" | "associe" | "repete" | "phrase" | "tpr";

export interface Attempt {
  profileId: string;
  wordId: string;
  themeId: string;
  mode: GameMode;
  correct: boolean;
  responseTimeMs: number;
  timestamp: string;
}

/** Progression d'un mot pour un profil donné (système à boîtes type Leitner). */
export interface WordProgress {
  wordId: string;
  box: 1 | 2 | 3 | 4 | 5;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  /** Modes dans lesquels ce mot a été réussi, sur des sessions différentes. */
  successModes: GameMode[];
  mastered: boolean;
}
