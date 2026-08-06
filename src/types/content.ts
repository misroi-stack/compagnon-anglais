export type Level = 1 | 2 | 3;

export interface Phrase {
  en: string;
  fr: string;
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
}

export interface Theme {
  id: string;
  name: string;
  icon: string;
  words: Word[];
}
