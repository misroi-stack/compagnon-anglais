import { supabase } from "@/lib/supabase";
import type { MascotId, Profile } from "@/types/profile";

interface ProfileRow {
  id: string;
  name: string;
  mascot: string;
  created_at: string;
}

function fromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    mascot: row.mascot as MascotId,
    createdAt: row.created_at,
  };
}

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as ProfileRow[]).map(fromRow);
}

export async function getProfile(profileId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  return data ? fromRow(data as ProfileRow) : null;
}

export async function createProfile(input: { name: string; mascot: MascotId }): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({ name: input.name, mascot: input.mascot })
    .select()
    .single();

  if (error) throw error;
  return fromRow(data as ProfileRow);
}

export async function updateProfileMascot(profileId: string, mascot: MascotId): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ mascot })
    .eq("id", profileId)
    .select()
    .single();

  if (error) throw error;
  return fromRow(data as ProfileRow);
}

/** "Supprime" un profil sans perdre ses données — masqué partout, réactivable
 *  plus tard (base de données seulement, pour l'instant) via un futur portail admin. */
export async function deactivateProfile(profileId: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ active: false }).eq("id", profileId);
  if (error) throw error;
}

export async function deleteProfile(profileId: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", profileId);
  if (error) throw error;
}
