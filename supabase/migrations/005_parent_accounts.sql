-- Comptes parents (via Supabase Auth) + rattachement des profils enfants +
-- codes d'invitation pour limiter les inscriptions.

create table if not exists invite_codes (
  code text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into invite_codes (code) values ('BONJOUR') on conflict (code) do nothing;

-- Une ligne par parent, id = auth.users.id (Supabase Auth gère le hash du mot de passe).
create table if not exists parents (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  signup_code text not null references invite_codes(code),
  created_at timestamptz not null default now()
);

-- Bloque la création d'un compte parent si le code n'est pas actif, même si le
-- client contourne la vérification côté app (voir is_invite_code_active) —
-- filet de sécurité en plus de la validation faite avant signup.
create or replace function validate_active_invite_code()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from invite_codes where code = new.signup_code and active = true) then
    raise exception 'invalid_or_inactive_code';
  end if;
  return new;
end;
$$;

drop trigger if exists check_invite_code_active on parents;
create trigger check_invite_code_active
before insert on parents
for each row execute function validate_active_invite_code();

-- Vérifie un code depuis l'écran d'inscription (avant création du compte auth,
-- pour éviter un utilisateur auth "orphelin" créé sur un code invalide). Ne
-- révèle jamais la liste des codes eux-mêmes — juste vrai/faux pour un code donné.
create or replace function is_invite_code_active(check_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from invite_codes where code = check_code and active = true);
$$;

grant execute on function is_invite_code_active(text) to anon, authenticated;

alter table profiles add column if not exists parent_id uuid references parents(id) on delete cascade;

alter table invite_codes enable row level security;
alter table parents enable row level security;

create policy "parents can read own row" on parents for select using (auth.uid() = id);
create policy "parents can insert own row" on parents for insert with check (auth.uid() = id);

-- Verrouille l'accès aux données par famille maintenant qu'il y a de vrais comptes
-- (remplace les policies "allow all" ouvertes à tous, datant d'avant l'authentification).
drop policy if exists "allow all on profiles" on profiles;
create policy "parents manage own children profiles" on profiles
  for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());

drop policy if exists "allow all on word_progress" on word_progress;
create policy "parents manage own children word_progress" on word_progress
  for all using (exists (
    select 1 from profiles where profiles.id = word_progress.profile_id and profiles.parent_id = auth.uid()
  ))
  with check (exists (
    select 1 from profiles where profiles.id = word_progress.profile_id and profiles.parent_id = auth.uid()
  ));

drop policy if exists "allow all on attempts" on attempts;
create policy "parents manage own children attempts" on attempts
  for all using (exists (
    select 1 from profiles where profiles.id = attempts.profile_id and profiles.parent_id = auth.uid()
  ))
  with check (exists (
    select 1 from profiles where profiles.id = attempts.profile_id and profiles.parent_id = auth.uid()
  ));
