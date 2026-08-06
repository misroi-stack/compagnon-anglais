import { wordsForLevel } from "@/content";
import type { Level, Theme } from "@/types/content";
import type { WordProgress } from "@/types/progress";

export interface LevelStats {
  level: Level;
  total: number;
  touched: number;
  mastered: number;
  unlocked: boolean;
  complete: boolean;
}

const LEVELS: Level[] = [1, 2, 3];

/** Un mot est "touché" dès qu'il a été réussi au moins une fois dans un mode noté. */
function isTouched(progress: WordProgress | undefined): boolean {
  return !!progress && progress.successModes.length > 0;
}

/**
 * Niveau 1 toujours débloqué. Niveau N+1 se débloque une fois que tous les
 * mots du niveau N ont été touchés au moins une fois — reste accessible
 * ensuite (on peut toujours revenir aux niveaux précédents).
 */
export function getLevelStats(theme: Theme, progressByWordId: Map<string, WordProgress>): LevelStats[] {
  const stats: LevelStats[] = [];
  let previousComplete = true;

  for (const level of LEVELS) {
    const words = wordsForLevel(theme, level);
    const touched = words.filter((w) => isTouched(progressByWordId.get(w.id))).length;
    const mastered = words.filter((w) => progressByWordId.get(w.id)?.mastered).length;
    const complete = words.length > 0 && touched === words.length;

    stats.push({
      level,
      total: words.length,
      touched,
      mastered,
      unlocked: previousComplete,
      complete,
    });

    previousComplete = complete;
  }

  return stats;
}
