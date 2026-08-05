import type { GameMode } from "@/types/progress";

export interface ModeInfo {
  id: GameMode;
  label: string;
  emoji: string;
  description: string;
}

export const MODES: ModeInfo[] = [
  { id: "flashcards", label: "Flashcards", emoji: "🃏", description: "Découvre les mots" },
  { id: "quiz", label: "Quiz", emoji: "❓", description: "Teste-toi" },
  { id: "memory", label: "Memory", emoji: "🧠", description: "Associe les cartes" },
  { id: "repete", label: "Répète", emoji: "🎤", description: "Prononce le mot" },
];
