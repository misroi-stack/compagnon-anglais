import { supabase } from "@/lib/supabase";

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return false;

  const { data, error } = await supabase
    .from("parents")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error || !data) return false;
  return data.is_admin === true;
}

export interface AdminParent {
  id: string;
  email: string;
  createdAt: string;
  signupCode: string;
  isAdmin: boolean;
  lastSignInAt: string | null;
  profileCount: number;
}

interface AdminParentRow {
  id: string;
  email: string;
  created_at: string;
  signup_code: string;
  is_admin: boolean;
  last_sign_in_at: string | null;
  profile_count: number;
}

export async function listParents(): Promise<AdminParent[]> {
  const { data, error } = await supabase.rpc("admin_list_parents");
  if (error) throw error;

  return (data as AdminParentRow[]).map((row) => ({
    id: row.id,
    email: row.email,
    createdAt: row.created_at,
    signupCode: row.signup_code,
    isAdmin: row.is_admin,
    lastSignInAt: row.last_sign_in_at,
    profileCount: row.profile_count,
  }));
}

export interface InviteCode {
  code: string;
  active: boolean;
  createdAt: string;
}

interface InviteCodeRow {
  code: string;
  active: boolean;
  created_at: string;
}

export async function listInviteCodes(): Promise<InviteCode[]> {
  const { data, error } = await supabase
    .from("invite_codes")
    .select("code, active, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as InviteCodeRow[]).map((row) => ({
    code: row.code,
    active: row.active,
    createdAt: row.created_at,
  }));
}

export async function createInviteCode(code: string): Promise<void> {
  const { error } = await supabase.from("invite_codes").insert({ code: code.trim().toUpperCase() });
  if (error) throw error;
}

export async function setInviteCodeActive(code: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("invite_codes").update({ active }).eq("code", code);
  if (error) throw error;
}

export interface DeactivatedProfile {
  id: string;
  name: string;
  parentId: string;
}

interface DeactivatedProfileRow {
  id: string;
  name: string;
  parent_id: string;
}

export async function listDeactivatedProfiles(): Promise<DeactivatedProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, parent_id")
    .eq("active", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as DeactivatedProfileRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
  }));
}

export async function reactivateProfile(profileId: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ active: true }).eq("id", profileId);
  if (error) throw error;
}
