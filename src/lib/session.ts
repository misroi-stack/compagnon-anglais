import { themeKind, wordsUpToLevel } from "@/content";
import { getLevelStats } from "@/lib/level-progress";
import { getThemeStats } from "@/lib/theme-suggestion";
import { isDueForReview } from "@/lib/leitner";
import type { Level, Theme, Word } from "@/types/content";
import type { GameMode, WordProgress } from "@/types/progress";

/** Combien de mots dus / nouveaux viser par session — ~10 mots au total. */
const TARGET_DUE = 6;
const TARGET_NEW = 4;
const SESSION_TARGET = TARGET_DUE + TARGET_NEW;
/** Un seul bloc Associe par session, pour ne pas déséquilibrer l'alternance. */
const ASSOCIATE_BATCH_SIZE = 5;

const MOTS_MODES: readonly GameMode[] = ["quiz", "repete"];
const VERBES_MODES: readonly GameMode[] = ["quiz", "phrase", "repete"];

export interface EligibleWord {
  word: Word;
  theme: Theme;
  progress: WordProgress | undefined;
}

export type SessionStep =
  | { kind: "single"; word: Word; theme: Theme; mode: "quiz" | "phrase" | "repete" }
  | { kind: "associe"; theme: Theme; words: Word[] };

export interface SessionPlan {
  steps: SessionStep[];
  newCount: number;
  dueCount: number;
  /** Rien de dû ni de nouveau (rare) — session de révision libre plutôt qu'un bouton désactivé. */
  isFallbackReview: boolean;
}

function maxUnlockedLevel(theme: Theme, progressByWordId: Map<string, WordProgress>): Level {
  let max: Level = 1;
  for (const stats of getLevelStats(theme, progressByWordId)) {
    if (stats.unlocked) max = stats.level;
  }
  return max;
}

/** Tous les mots des niveaux débloqués, toutes catégories et tous thèmes confondus. */
function getEligibleWords(themes: Theme[], progressByWordId: Map<string, WordProgress>): EligibleWord[] {
  const result: EligibleWord[] = [];
  for (const theme of themes) {
    const level = maxUnlockedLevel(theme, progressByWordId);
    for (const word of wordsUpToLevel(theme, level)) {
      result.push({ word, theme, progress: progressByWordId.get(word.id) });
    }
  }
  return result;
}

/**
 * isDueForReview() vaut true à la fois pour un mot jamais tenté (pas de
 * nextReviewAt) et pour un mot dû après révision — deux catégories
 * pédagogiques différentes qu'on affiche séparément à l'enfant.
 */
function splitNewVsDue(words: EligibleWord[]): { newWords: EligibleWord[]; dueWords: EligibleWord[] } {
  const newWords: EligibleWord[] = [];
  const dueWords: EligibleWord[] = [];
  for (const ew of words) {
    if (!ew.progress) newWords.push(ew);
    else if (isDueForReview(ew.progress)) dueWords.push(ew);
  }
  return { newWords, dueWords };
}

/** Classement des thèmes du moins avancé au plus avancé (réutilise le tri de la grille de thèmes). */
function themeOrderRank(themes: Theme[], progressByWordId: Map<string, WordProgress>): Map<string, number> {
  const rank = new Map<string, number>();
  getThemeStats(themes, progressByWordId).forEach((s, i) => rank.set(s.theme.id, i));
  return rank;
}

/**
 * Alterne mots/verbes plutôt que de trier tout l'ensemble par rang de thème :
 * quand beaucoup de thèmes sont également à 0% (profil qui vient de commencer
 * une catégorie), le tri par rang seul favorise systématiquement les mots —
 * ils occupent les positions 0-23 de `themes` (src/content/index.ts), les
 * verbes 24-27, et un tri stable préserve cet ordre à égalité de rang. Sans
 * cette alternance explicite, une session peut ne piocher aucun verbe malgré
 * des dizaines de mots disponibles, ce qui viole le mélange mots+verbes voulu.
 */
function pickNewWords(newWords: EligibleWord[], count: number, themeRank: Map<string, number>): EligibleWord[] {
  const byRank = (a: EligibleWord, b: EligibleWord) =>
    (themeRank.get(a.theme.id) ?? 0) - (themeRank.get(b.theme.id) ?? 0);
  const mots = newWords.filter((ew) => themeKind(ew.theme) === "mots").sort(byRank);
  const verbes = newWords.filter((ew) => themeKind(ew.theme) === "verbes").sort(byRank);

  const result: EligibleWord[] = [];
  let mi = 0;
  let vi = 0;
  while (result.length < count && (mi < mots.length || vi < verbes.length)) {
    if (mi < mots.length) result.push(mots[mi++]);
    if (result.length >= count) break;
    if (vi < verbes.length) result.push(verbes[vi++]);
  }
  return result;
}

function nextReviewTime(ew: EligibleWord): number {
  return ew.progress?.nextReviewAt ? new Date(ew.progress.nextReviewAt).getTime() : 0;
}

function pickDueWords(dueWords: EligibleWord[], count: number): EligibleWord[] {
  return [...dueWords].sort((a, b) => nextReviewTime(a) - nextReviewTime(b)).slice(0, count);
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickModeForWord(ew: EligibleWord): "quiz" | "phrase" | "repete" {
  const available = themeKind(ew.theme) === "verbes" ? VERBES_MODES : MOTS_MODES;
  const successModes = ew.progress?.successModes ?? [];
  const unused = available.filter((m) => !successModes.includes(m));
  const pool = unused.length > 0 ? unused : available;
  return pool[Math.floor(Math.random() * pool.length)] as "quiz" | "phrase" | "repete";
}

/**
 * Regroupe les mots "mots" (pas "verbes") par thème d'origine ; le plus grand
 * groupe d'au moins 2 mots devient l'unique bloc Associe de la session — les
 * autres mots (verbes, mots isolés, ou en trop du thème choisi) deviennent
 * des items simples. L'ordre final est mélangé pour un vrai interleaving.
 */
function buildSteps(selected: EligibleWord[]): SessionStep[] {
  const motsByTheme = new Map<string, EligibleWord[]>();
  const singles: EligibleWord[] = [];

  for (const ew of selected) {
    if (themeKind(ew.theme) === "mots") {
      const list = motsByTheme.get(ew.theme.id) ?? [];
      list.push(ew);
      motsByTheme.set(ew.theme.id, list);
    } else {
      singles.push(ew);
    }
  }

  let associeThemeId: string | null = null;
  let associeGroup: EligibleWord[] = [];
  for (const [themeId, group] of motsByTheme) {
    if (group.length >= 2 && group.length > associeGroup.length) {
      associeThemeId = themeId;
      associeGroup = group;
    }
  }

  for (const [themeId, group] of motsByTheme) {
    if (themeId !== associeThemeId) singles.push(...group);
  }

  const steps: SessionStep[] = [];

  if (associeThemeId) {
    const batch = associeGroup.slice(0, ASSOCIATE_BATCH_SIZE);
    steps.push({ kind: "associe", theme: batch[0].theme, words: batch.map((ew) => ew.word) });
    singles.push(...associeGroup.slice(ASSOCIATE_BATCH_SIZE));
  }

  for (const ew of singles) {
    steps.push({ kind: "single", word: ew.word, theme: ew.theme, mode: pickModeForWord(ew) });
  }

  return shuffle(steps);
}

export function buildSessionPlan(
  allThemes: Theme[],
  progressByWordId: Map<string, WordProgress>
): SessionPlan {
  const eligible = getEligibleWords(allThemes, progressByWordId);
  const { newWords, dueWords } = splitNewVsDue(eligible);
  const themeRank = themeOrderRank(allThemes, progressByWordId);

  let selectedDue = pickDueWords(dueWords, TARGET_DUE);
  let selectedNew = pickNewWords(newWords, TARGET_NEW, themeRank);
  const usedIds = new Set([...selectedDue, ...selectedNew].map((ew) => ew.word.id));
  let total = selectedDue.length + selectedNew.length;

  // Un des deux quotas n'est pas atteint (peu de mots dus, ou enfant qui a
  // déjà tout essayé) : combler avec l'autre catégorie pour viser ~10 mots.
  if (total < SESSION_TARGET) {
    const more = pickDueWords(
      dueWords.filter((ew) => !usedIds.has(ew.word.id)),
      SESSION_TARGET - total
    );
    more.forEach((ew) => usedIds.add(ew.word.id));
    selectedDue = [...selectedDue, ...more];
    total = selectedDue.length + selectedNew.length;
  }
  if (total < SESSION_TARGET) {
    const more = pickNewWords(
      newWords.filter((ew) => !usedIds.has(ew.word.id)),
      SESSION_TARGET - total,
      themeRank
    );
    more.forEach((ew) => usedIds.add(ew.word.id));
    selectedNew = [...selectedNew, ...more];
    total = selectedDue.length + selectedNew.length;
  }

  if (total === 0) {
    const fallback = eligible
      .filter((ew) => ew.progress?.mastered)
      .sort((a, b) => {
        const ta = a.progress?.lastReviewedAt ? new Date(a.progress.lastReviewedAt).getTime() : 0;
        const tb = b.progress?.lastReviewedAt ? new Date(b.progress.lastReviewedAt).getTime() : 0;
        return ta - tb;
      })
      .slice(0, SESSION_TARGET);

    return { steps: buildSteps(fallback), newCount: 0, dueCount: fallback.length, isFallbackReview: true };
  }

  return {
    steps: buildSteps([...selectedDue, ...selectedNew]),
    newCount: selectedNew.length,
    dueCount: selectedDue.length,
    isFallbackReview: false,
  };
}
