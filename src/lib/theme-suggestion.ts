import { isDueForReview } from "@/lib/leitner";
import { wordsForAge } from "@/content";
import type { AgeGroup } from "@/types/content";
import type { Theme } from "@/types/content";
import type { WordProgress } from "@/types/progress";

/** Thème avec le plus de mots dus pour révision ou jamais essayés (voir PLAN.md). */
export function suggestTheme(
  themes: Theme[],
  age: AgeGroup,
  progressByWordId: Map<string, WordProgress>
): Theme {
  let best = themes[0];
  let bestScore = -1;

  for (const theme of themes) {
    const words = wordsForAge(theme, age);
    const score = words.reduce((count, word) => {
      const progress = progressByWordId.get(word.id);
      const due = !progress || isDueForReview(progress);
      return count + (due ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      best = theme;
    }
  }

  return best;
}
