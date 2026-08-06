import { supabase } from "@/lib/supabase";

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string, inviteCode: string): Promise<void> {
  const { data: isValid, error: codeError } = await supabase.rpc("is_invite_code_active", {
    check_code: inviteCode,
  });
  if (codeError) throw codeError;
  if (!isValid) throw new Error("invalid_code");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("signup_incomplete");

  if (!data.session) {
    // Confirmation email activée côté projet Supabase : pas de session tout de
    // suite, donc pas moyen de créer la ligne "parents" (RLS) avant confirmation.
    throw new Error("email_confirmation_required");
  }

  const { error: parentError } = await supabase
    .from("parents")
    .insert({ id: data.user.id, email, signup_code: inviteCode });
  if (parentError) throw parentError;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
