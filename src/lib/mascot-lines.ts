import type { WordProgress } from "@/types/progress";

/** Petites relances neutres, tournent selon l'index du mot pour varier sans dépendre d'un état aléatoire. */
const GENERIC_PROMPTS = ["À toi de jouer !", "Tu vas y arriver !", "Montre-moi ce que tu sais !", "C'est parti !"];

const CELEBRATION_LINES = ["Tu l'as eu cette fois ! 🎉", "Tu t'en souviens, bravo !", "Cette fois c'est dans la poche !"];

/**
 * Un mot dont la dernière tentative a échoué repart en boîte 1 (voir
 * nextBox() dans leitner.ts) ; un mot jamais tenté a aussi box === 1 mais
 * lastReviewedAt est encore null. Cette combinaison distingue donc "raté la
 * dernière fois" de "jamais essayé", sans donnée ni migration supplémentaire.
 */
export function wasRecentlyMissed(progress: WordProgress | undefined): boolean {
  return !!progress && progress.lastReviewedAt !== null && progress.box === 1;
}

/** Ligne affichée dans la bulle de la mascotte avant que l'enfant réponde. */
export function pickPromptLine(progress: WordProgress | undefined, seed: number): string {
  if (wasRecentlyMissed(progress)) return "Tu avais eu du mal la dernière fois… on réessaie ensemble !";
  return GENERIC_PROMPTS[((seed % GENERIC_PROMPTS.length) + GENERIC_PROMPTS.length) % GENERIC_PROMPTS.length];
}

/** Ligne de célébration quand un mot précédemment raté vient d'être réussi. */
export function pickCelebrationLine(seed: number): string {
  return CELEBRATION_LINES[((seed % CELEBRATION_LINES.length) + CELEBRATION_LINES.length) % CELEBRATION_LINES.length];
}
