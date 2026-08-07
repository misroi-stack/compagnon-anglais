import type { WordProgress } from "@/types/progress";

/** Petites relances neutres, tournent selon l'index du mot pour varier sans dépendre d'un état aléatoire. */
const GENERIC_PROMPTS = ["À toi de jouer !", "Tu vas y arriver !", "Montre-moi ce que tu sais !", "C'est parti !"];

const CELEBRATION_LINES = ["Tu l'as eu cette fois ! 🎉", "Tu t'en souviens, bravo !", "Cette fois c'est dans la poche !"];

/**
 * Un mot dont la dernière tentative a échoué repart en boîte 1 (voir
 * nextBox() dans leitner.ts) ; un mot jamais tenté a aussi box === 1 mais
 * lastReviewedAt est encore null — ça distingue déjà "raté" de "jamais
 * essayé au sens strict". Mais box === 1 + lastReviewedAt non-null est AUSSI
 * vrai pour un mot dont c'était la toute première tentative, ratée : il n'a
 * alors aucun succès enregistré (successModes vide). Dans ce cas on n'a rien
 * à "se souvenir" — l'enfant vient de le découvrir à l'instant, ce n'est pas
 * un mot qu'il connaissait et a raté "la dernière fois". D'où l'exigence
 * d'au moins un succès passé (observé en base : plusieurs mots avec 2-3
 * succès puis un seul raté juste après, ex. via Répète qui reconnaît mal la
 * voix, déclenchaient à tort le rappel dès l'exercice suivant du même mot).
 */
export function wasRecentlyMissed(progress: WordProgress | undefined): boolean {
  return (
    !!progress &&
    progress.lastReviewedAt !== null &&
    progress.box === 1 &&
    progress.successModes.length > 0
  );
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
