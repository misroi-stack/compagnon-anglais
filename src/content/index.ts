import type { AgeGroup, Theme } from "@/types/content";
import animaux from "./themes/animaux.json";
import couleurs from "./themes/couleurs.json";
import nombres from "./themes/nombres.json";

export const themes: Theme[] = [animaux, couleurs, nombres] as Theme[];

export function getTheme(themeId: string): Theme | undefined {
  return themes.find((theme) => theme.id === themeId);
}

export function wordsForAge(theme: Theme, age: AgeGroup) {
  return theme.words.filter((word) => word.ageGroups.includes(age));
}
