"use client";

import { useEffect, useState } from "react";

interface LoadingIndicatorProps {
  label?: string;
  /** Enveloppe dans un `<main>` plein écran — à utiliser quand rien d'autre n'est déjà affiché. */
  fullScreen?: boolean;
}

/** Au-delà de ce délai, on suppose que ça bloque vraiment et on propose de recharger. */
const SLOW_THRESHOLD_SEC = 8;

export function LoadingIndicator({ label = "Chargement…", fullScreen = false }: LoadingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-500" />
      <p className="text-violet-400">
        {label}
        {elapsed >= 2 ? ` (${elapsed}s)` : ""}
      </p>
      {elapsed >= SLOW_THRESHOLD_SEC && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="max-w-xs text-sm text-amber-500">
            Ça prend plus de temps que prévu — la connexion est peut-être lente.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-600"
          >
            🔄 Recharger la page
          </button>
        </div>
      )}
    </div>
  );

  if (!fullScreen) return content;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50">
      {content}
    </main>
  );
}
