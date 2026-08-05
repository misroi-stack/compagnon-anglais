"use client";

interface GameHeaderProps {
  themeName: string;
  themeIcon: string;
  progress: string;
  onExit: () => void;
}

export function GameHeader({ themeName, themeIcon, progress, onExit }: GameHeaderProps) {
  return (
    <div className="flex w-full max-w-2xl items-center justify-between px-2">
      <button
        type="button"
        onClick={onExit}
        className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-violet-600 shadow"
      >
        ← Retour
      </button>
      <span className="text-lg font-bold text-violet-700">
        {themeIcon} {themeName}
      </span>
      <span className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-violet-600 shadow">
        {progress}
      </span>
    </div>
  );
}
