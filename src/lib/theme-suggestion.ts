import { isDueForReview } from "@/lib/leitner";
import { wordsForAge } from "@/content";
import type { AgeGroup, Theme } from "@/types/content";
import type { WordProgress } from "@/types/progress";

export interface ThemeStats {
  theme: Theme;
  total: number;
  mastered: number;
  due: number;
  /** Progression graduelle (0-1) basée sur la boîte Leitron de chaque mot — avance dès la première bonne réponse. */
  progressPercent: number;
}

function wordProgressFraction(progress: WordProgress | undefined): number {
  if (!progress) return 0;
  return (progress.box - 1) / 4;
}

/**
 * Stats par thème (mots adaptés à l'âge uniquement), thèmes sans aucun mot
 * pour cet âge exclus (ex: "Jours de la semaine" est réservé aux 9 ans).
 * Triés du moins avancé au plus avancé pour encourager à travailler
 * les thèmes délaissés (voir PLAN.md, suggestion de session).
 */
export function getThemeStats(
  themes: Theme[],
  age: AgeGroup,
  progressByWordId: Map<string, WordProgress>
): ThemeStats[] {
  return themes
    .map((theme) => {
      const words = wordsForAge(theme, age);
      const mastered = words.filter((w) => progressByWordId.get(w.id)?.mastered).length;
      const due = words.filter((w) => {
        const progress = progressByWordId.get(w.id);
        return !progress || isDueForReview(progress);
      }).length;
      const progressSum = words.reduce(
        (sum, w) => sum + wordProgressFraction(progressByWordId.get(w.id)),
        0
      );

      return {
        theme,
        total: words.length,
        mastered,
        due,
        progressPercent: words.length ? progressSum / words.length : 0,
      };
    })
    .filter((stats) => stats.total > 0)
    .sort((a, b) => a.progressPercent - b.progressPercent || b.due - a.due);
}
