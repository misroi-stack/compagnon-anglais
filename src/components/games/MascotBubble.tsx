"use client";

import Image from "next/image";
import { getMascotImage, type MascotPose } from "@/lib/mascots";
import type { MascotId } from "@/types/profile";

interface MascotBubbleProps {
  mascotId: MascotId;
  pose?: MascotPose;
  text: string;
}

/** La mascotte pose la question plutôt que l'UI seule — bulle additive, à côté du texte d'instruction existant. */
export function MascotBubble({ mascotId, pose = "attentif", text }: MascotBubbleProps) {
  return (
    <div className="flex items-center gap-3 self-start">
      <Image
        src={getMascotImage(mascotId, pose)}
        alt=""
        width={56}
        height={56}
        className="h-12 w-12 shrink-0 object-contain"
      />
      <div className="rounded-2xl rounded-bl-none bg-white px-4 py-2 text-sm font-semibold text-violet-600 shadow-md">
        {text}
      </div>
    </div>
  );
}
