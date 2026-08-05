import { wordsForAge } from "@/content";
import type { AgeGroup, Theme } from "@/types/content";
import type { GameMode, WordProgress } from "@/types/progress";

export interface ThemeModeStats {
  mode: GameMode;
  done: number;
  total: number;
  complete: boolean;
}

const GRADED_MODES: GameMode[] = ["quiz", "associe", "repete"];

/** Pour les 3 modes notés, combien de mots du thème ont déjà été réussis au moins une fois dans ce mode. */
export function getThemeModeStats(
  theme: Theme,
  age: AgeGroup,
  progressByWordId: Map<string, WordProgress>
): ThemeModeStats[] {
  const words = wordsForAge(theme, age);

  return GRADED_MODES.map((mode) => {
    const done = words.filter((w) => progressByWordId.get(w.id)?.successModes.includes(mode)).length;
    return { mode, done, total: words.length, complete: words.length > 0 && done === words.length };
  });
}
