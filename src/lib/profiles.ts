import type { Profile } from "@/types/profile";

const STORAGE_KEY = "compagnon-anglais:profiles";

/**
 * Stockage local temporaire le temps de brancher Supabase (voir PLAN.md).
 * À remplacer par des appels Supabase une fois les projets dev/prod créés.
 */
export function getProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Profile[];
  } catch {
    return [];
  }
}

export function saveProfile(profile: Profile): Profile[] {
  const profiles = getProfiles().filter((p) => p.id !== profile.id);
  const updated = [...profiles, profile];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteProfile(profileId: string): Profile[] {
  const updated = getProfiles().filter((p) => p.id !== profileId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
