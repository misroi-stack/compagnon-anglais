import type { AgeGroup } from "./content";

export type MascotId = "renard" | "hibou" | "dragon" | "panda";

export interface Profile {
  id: string;
  name: string;
  age: AgeGroup;
  mascot: MascotId;
  createdAt: string;
}
