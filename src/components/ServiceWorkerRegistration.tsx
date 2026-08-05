"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation PWA non disponible, l'app reste utilisable dans le navigateur
      });
    }
  }, []);

  return null;
}
