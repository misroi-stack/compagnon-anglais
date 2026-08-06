export type MascotId = "renard" | "hibou" | "dragon" | "panda";

export interface Profile {
  id: string;
  name: string;
  mascot: MascotId;
  createdAt: string;
}
