export type Level = 1 | 2 | 3;

export type ThemeKind = "mots" | "verbes";

export interface Phrase {
  en: string;
  fr: string;
}

/** Formes conjuguées — non utilisées en v1 (verbes à l'infinitif), prévues pour un futur niveau de conjugaison. */
export interface VerbForms {
  thirdPerson: string;
  past: string;
}

export interface Word {
  id: string;
  en: string;
  fr: string;
  image: string;
  /** Placeholder emoji utilisé tant que les vraies illustrations ne sont pas prêtes. */
  emoji: string;
  audio?: string;
  /** Niveau de difficulté au sein du thème (1 = de base, 3 = le plus avancé). */
  level: Level;
  phrases?: Phrase[];
  forms?: VerbForms;
}

export interface Theme {
  id: string;
  name: string;
  icon: string;
  /** Absent = "mots" (tous les thèmes existants avant l'ajout des verbes). */
  kind?: ThemeKind;
  words: Word[];
}
