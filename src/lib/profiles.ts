import { supabase } from "@/lib/supabase";
import type { AgeGroup } from "@/types/content";
import type { MascotId, Profile } from "@/types/profile";

interface ProfileRow {
  id: string;
  name: string;
  age: string;
  mascot: string;
  created_at: string;
}

function fromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    age: row.age as AgeGroup,
    mascot: row.mascot as MascotId,
    createdAt: row.created_at,
  };
}

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as ProfileRow[]).map(fromRow);
}

export async function createProfile(input: {
  name: string;
  age: AgeGroup;
  mascot: MascotId;
}): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .insert({ name: input.name, age: input.age, mascot: input.mascot })
    .select()
    .single();

  if (error) throw error;
  return fromRow(data as ProfileRow);
}

export async function deleteProfile(profileId: string): Promise<void> {
  const { error } = await supabase.from("profiles").delete().eq("id", profileId);
  if (error) throw error;
}
