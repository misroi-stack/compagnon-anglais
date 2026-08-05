export type AgeGroup = "6" | "9";

export interface Phrase {
  en: string;
  fr: string;
}

export interface Word {
  id: string;
  en: string;
  fr: string;
  image: string;
  audio?: string;
  ageGroups: AgeGroup[];
  phrases?: Phrase[];
}

export interface Theme {
  id: string;
  name: string;
  icon: string;
  words: Word[];
}
