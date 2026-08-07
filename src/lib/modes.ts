import { themeKind } from "@/content";
import type { Theme, ThemeKind } from "@/types/content";
import type { GameMode } from "@/types/progress";

export interface ModeInfo {
  id: GameMode;
  label: string;
  emoji: string;
  description: string;
}

/** Catalogue de tous les modes existants (libellés/emoji) — utilisé partout où on affiche un mode par son id, quelle que soit la catégorie. */
export const MODES: ModeInfo[] = [
  { id: "flashcards", label: "Flashcards", emoji: "🃏", description: "Découvre les mots" },
  { id: "quiz", label: "Quiz", emoji: "❓", description: "Teste-toi" },
  { id: "associe", label: "Associe", emoji: "🔗", description: "Relie l'image au mot" },
  { id: "phrase", label: "Phrase", emoji: "📝", description: "Complète la phrase" },
  { id: "repete", label: "Répète", emoji: "🎤", description: "Prononce le mot" },
  { id: "tpr", label: "Fais l'action", emoji: "🤸", description: "Bouge comme le mot !" },
];

/** Quels modes chaque catégorie de thème utilise réellement, dans l'ordre d'affichage. */
export const MODES_BY_KIND: Record<ThemeKind, GameMode[]> = {
  mots: ["flashcards", "quiz", "associe", "repete"],
  verbes: ["flashcards", "quiz", "phrase", "repete"],
};

const modeInfoById = new Map(MODES.map((m) => [m.id, m]));

export function modesForKind(kind: ThemeKind): ModeInfo[] {
  return MODES_BY_KIND[kind].map((id) => modeInfoById.get(id)!);
}

/** Modes affichés pour CE thème précis : ceux de sa catégorie, plus "tpr" si le thème l'active (verbes de mouvement physiquement mimables, ex. Bouger). */
export function modesForTheme(theme: Theme): ModeInfo[] {
  const ids: GameMode[] = theme.tpr
    ? [...MODES_BY_KIND[themeKind(theme)], "tpr"]
    : MODES_BY_KIND[themeKind(theme)];
  return ids.map((id) => modeInfoById.get(id)!);
}
