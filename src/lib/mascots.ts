import type { MascotId } from "@/types/profile";

export interface MascotInfo {
  id: MascotId;
  emoji: string;
  label: string;
  gradient: string;
}

export const MASCOTS: MascotInfo[] = [
  { id: "renard", emoji: "🦊", label: "Renard", gradient: "from-orange-400 to-amber-500" },
  { id: "hibou", emoji: "🦉", label: "Hibou", gradient: "from-indigo-400 to-violet-500" },
  { id: "dragon", emoji: "🐉", label: "Dragon", gradient: "from-emerald-400 to-teal-500" },
  { id: "panda", emoji: "🐼", label: "Panda", gradient: "from-pink-400 to-rose-500" },
];

export function getMascot(id: MascotId): MascotInfo {
  return MASCOTS.find((m) => m.id === id) ?? MASCOTS[0];
}
