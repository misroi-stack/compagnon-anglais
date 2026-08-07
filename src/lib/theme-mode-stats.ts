import { themeKind, wordsForLevel } from "@/content";
import { MODES_BY_KIND } from "@/lib/modes";
import type { Level, Theme } from "@/types/content";
import type { GameMode, WordProgress } from "@/types/progress";

export interface ThemeModeStats {
  mode: GameMode;
  done: number;
  total: number;
  complete: boolean;
}

/** Pour les modes notés (tous sauf flashcards et tpr, découverte/action libres), combien de mots de ce niveau ont déjà été réussis au moins une fois dans ce mode. */
export function getThemeModeStats(
  theme: Theme,
  level: Level,
  progressByWordId: Map<string, WordProgress>
): ThemeModeStats[] {
  const words = wordsForLevel(theme, level);
  const gradedModes = MODES_BY_KIND[themeKind(theme)].filter((m) => m !== "flashcards" && m !== "tpr");

  return gradedModes.map((mode) => {
    const done = words.filter((w) => progressByWordId.get(w.id)?.successModes.includes(mode)).length;
    return { mode, done, total: words.length, complete: words.length > 0 && done === words.length };
  });
}
