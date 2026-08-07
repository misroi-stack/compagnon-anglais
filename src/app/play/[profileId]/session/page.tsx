"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { themes } from "@/content";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { SessionRunner } from "@/components/games/SessionRunner";
import { getProfile } from "@/lib/profiles";
import { getProgressForProfile } from "@/lib/progress";
import { buildSessionPlan, type SessionPlan } from "@/lib/session";
import type { Profile } from "@/types/profile";

export default function SessionPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const p = await getProfile(profileId);
      if (!p) {
        router.replace("/");
        return;
      }
      const progressMap = await getProgressForProfile(profileId);
      const sessionPlan = buildSessionPlan(themes, progressMap);

      if (!cancelled) {
        setProfile(p);
        setPlan(sessionPlan);
        setLoading(false);
      }
    }

    load().catch(() => {
      if (!cancelled) setError("Impossible de préparer la session — vérifie ta connexion.");
    });
    return () => {
      cancelled = true;
    };
  }, [profileId, router]);

  if (error) {
    return <LoadingIndicator fullScreen error={error} />;
  }

  if (loading || !profile || !plan) {
    return <LoadingIndicator fullScreen />;
  }

  return (
    <SessionRunner
      profileId={profileId}
      mascotId={profile.mascot}
      plan={plan}
      onExit={() => router.push(`/play/${profileId}`)}
    />
  );
}
