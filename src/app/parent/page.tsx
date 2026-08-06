"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { ProfileCard } from "@/components/ProfileCard";
import { getProfiles } from "@/lib/profiles";
import type { Profile } from "@/types/profile";

export default function ParentPortalPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-b from-violet-100 via-fuchsia-50 to-amber-50 px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-violet-700 sm:text-4xl">👨‍👩‍👧 Espace parent</h1>
        <p className="mt-2 text-violet-500">Choisis un profil pour voir ses statistiques</p>
      </div>

      {loading ? (
        <LoadingIndicator />
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onSelect={(p) => router.push(`/parent/${p.id}`)}
            />
          ))}
        </div>
      )}

      <button type="button" onClick={() => router.push("/")} className="text-sm text-violet-400 underline">
        ← Retour à l&apos;app
      </button>
    </main>
  );
}
