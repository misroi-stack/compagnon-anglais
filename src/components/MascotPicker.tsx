"use client";

import { motion } from "framer-motion";
import { MASCOTS } from "@/lib/mascots";
import type { MascotId } from "@/types/profile";

interface MascotPickerProps {
  value: MascotId | null;
  onChange: (mascot: MascotId) => void;
}

export function MascotPicker({ value, onChange }: MascotPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {MASCOTS.map((mascot) => {
        const selected = value === mascot.id;
        return (
          <motion.button
            key={mascot.id}
            type="button"
            onClick={() => onChange(mascot.id)}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className={`flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br ${mascot.gradient} p-4 text-white shadow-md transition-shadow ${
              selected ? "ring-4 ring-white ring-offset-2 ring-offset-violet-200" : ""
            }`}
          >
            <span className="text-4xl">{mascot.emoji}</span>
            <span className="text-xs font-semibold">{mascot.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
