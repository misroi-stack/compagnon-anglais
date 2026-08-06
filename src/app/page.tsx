"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MascotPicker } from "@/components/MascotPicker";
import { ProfileCard } from "@/components/ProfileCard";
import { getProfiles, createProfile } from "@/lib/profiles";
import type { MascotId, Profile } from "@/types/profile";

export default function Home() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [mascot, setMascot] = useState<MascotId | null>(null);

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch(() => setError("Impossible de charger les profils."))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setName("");
    setMascot(null);
    setIsCreating(false);
  }

  async function handleCreate() {
    if (!name.trim() || !mascot) return;
    setIsSaving(true);
    try {
      const profile = await createProfile({ name: name.trim(), mascot });
      setProfiles((prev) => [...prev, profile]);
      resetForm();
    } catch {
      setError("Impossible de créer le profil, réessaie.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-12">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-4xl font-extrabold text-violet-700 sm:text-5xl"
      >
        🌟 Compagnon Anglais 🌟
      </motion.h1>
      <p className="-mt-6 text-center text-lg text-violet-500">Qui joue aujourd&apos;hui ?</p>

      {error && (
        <p className="rounded-full bg-rose-100 px-4 py-2 text-sm text-rose-600">{error}</p>
      )}

      {loading ? (
        <p className="text-violet-400">Chargement des profils…</p>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onSelect={(p) => router.push(`/play/${p.id}`)}
            />
          ))}

          <motion.button
            type="button"
            onClick={() => setIsCreating(true)}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            className="flex h-[168px] w-[168px] flex-col items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-violet-300 text-violet-400 hover:border-violet-400 hover:text-violet-500"
          >
            <span className="text-5xl">+</span>
            <span className="text-sm font-semibold">Nouveau profil</span>
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/40 px-4"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-sm flex-col gap-5 rounded-3xl bg-white p-6 shadow-xl"
            >
              <h2 className="text-center text-2xl font-bold text-violet-700">Nouveau profil</h2>

              <label className="flex flex-col gap-1 text-sm font-semibold text-violet-600">
                Prénom
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Léo"
                  className="rounded-xl border-2 border-violet-200 px-4 py-2 text-base font-normal text-violet-900 outline-none focus:border-violet-400"
                />
              </label>

              <div className="flex flex-col gap-1 text-sm font-semibold text-violet-600">
                Mascotte
                <MascotPicker value={mascot} onChange={setMascot} />
              </div>

              <button
                type="button"
                onClick={handleCreate}
                disabled={!name.trim() || !mascot || isSaving}
                className="mt-2 rounded-xl bg-violet-600 py-3 font-bold text-white disabled:opacity-40"
              >
                {isSaving ? "Création…" : "Créer le profil"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => router.push("/parent")}
        className="text-sm text-violet-400 underline"
      >
        👨‍👩‍👧 Espace parent
      </button>
    </main>
  );
}
