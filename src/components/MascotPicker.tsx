"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MASCOTS, getMascotImage } from "@/lib/mascots";
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
            className={`flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br ${mascot.gradient} p-2 text-white shadow-md transition-shadow ${
              selected ? "ring-4 ring-white ring-offset-2 ring-offset-violet-200" : ""
            }`}
          >
            <Image
              src={getMascotImage(mascot.id)}
              alt={mascot.label}
              width={64}
              height={64}
              className="h-14 w-14 object-contain"
            />
            <span className="text-xs font-semibold">{mascot.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
