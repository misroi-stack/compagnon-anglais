"use client";

import { motion } from "framer-motion";
import { getMascot } from "@/lib/mascots";
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
      <span className="text-6xl">{mascot.emoji}</span>
      <span className="text-xl font-bold">{profile.name}</span>
    </motion.button>
  );
}
