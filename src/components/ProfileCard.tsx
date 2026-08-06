"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { getMascot, getMascotImage } from "@/lib/mascots";
import type { Profile } from "@/types/profile";

interface ProfileCardProps {
  profile: Profile;
  onSelect: (profile: Profile) => void;
}

export function ProfileCard({ profile, onSelect }: ProfileCardProps) {
  const mascot = getMascot(profile.mascot);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(profile)}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03, rotate: -1 }}
      className={`flex flex-col items-center gap-2 rounded-3xl bg-gradient-to-br ${mascot.gradient} p-6 text-white shadow-lg`}
    >
      <Image
        src={getMascotImage(profile.mascot)}
        alt={mascot.label}
        width={112}
        height={112}
        className="h-24 w-24 object-contain"
      />
      <span className="text-xl font-bold">{profile.name}</span>
    </motion.button>
  );
}
