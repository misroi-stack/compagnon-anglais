-- Schéma Compagnon Anglais — à exécuter dans le SQL Editor de CHAQUE projet Supabase (dev puis prod)

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
  created_at timestamptz not null default now(),
  -- Accès au portail admin séparé (/admin) — gestion des codes, vue d'ensemble
  -- des familles, réactivation de profils désactivés.
  is_admin boolean not null default false
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mascot text not null check (mascot in ('renard', 'hibou', 'dragon', 'panda')),
  created_at timestamptz not null default now(),
  -- Désactivé plutôt que supprimé quand un parent "supprime" un profil depuis
  -- l'espace parent — masqué partout, réactivable plus tard via un futur portail admin.
  active boolean not null default true,
  parent_id uuid references parents(id) on delete cascade
);

create table if not exists word_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  word_id text not null,
  box smallint not null default 1 check (box between 1 and 5),
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  success_modes text[] not null default '{}',
  mastered boolean not null default false,
  unique (profile_id, word_id)
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  word_id text not null,
  theme_id text not null,
  mode text not null check (mode in ('flashcards', 'quiz', 'associe', 'repete')),
  correct boolean not null,
  response_time_ms integer not null,
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

alter table invite_codes enable row level security;
alter table parents enable row level security;
alter table profiles enable row level security;
alter table word_progress enable row level security;
alter table attempts enable row level security;

-- Accès verrouillé par famille : chaque parent ne voit que ses propres profils
-- enfants et leurs données (auth.uid() = le parent connecté).
create policy "parents can read own row" on parents for select using (auth.uid() = id);
create policy "parents can insert own row" on parents for insert with check (auth.uid() = id);

create policy "parents manage own children profiles" on profiles
  for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());

create policy "parents manage own children word_progress" on word_progress
  for all using (exists (
    select 1 from profiles where profiles.id = word_progress.profile_id and profiles.parent_id = auth.uid()
  ))
  with check (exists (
    select 1 from profiles where profiles.id = word_progress.profile_id and profiles.parent_id = auth.uid()
  ));

create policy "parents manage own children attempts" on attempts
  for all using (exists (
    select 1 from profiles where profiles.id = attempts.profile_id and profiles.parent_id = auth.uid()
  ))
  with check (exists (
    select 1 from profiles where profiles.id = attempts.profile_id and profiles.parent_id = auth.uid()
  ));

-- Portail admin (/admin) : accès total en lecture/gestion des codes et des
-- profils, en plus des policies ci-dessus qui limitent chaque parent normal
-- à sa propre famille.
create policy "admins manage invite_codes" on invite_codes
  for all using (
    exists (select 1 from parents me where me.id = auth.uid() and me.is_admin = true)
  )
  with check (
    exists (select 1 from parents me where me.id = auth.uid() and me.is_admin = true)
  );

create policy "admins can read all profiles" on profiles
  for select using (
    exists (select 1 from parents me where me.id = auth.uid() and me.is_admin = true)
  );

create policy "admins can update all profiles" on profiles
  for update using (
    exists (select 1 from parents me where me.id = auth.uid() and me.is_admin = true)
  )
  with check (
    exists (select 1 from parents me where me.id = auth.uid() and me.is_admin = true)
  );

-- Liste des comptes parents pour l'admin, avec dernière connexion. auth.users
-- n'est pas exposé via l'API REST (schéma protégé), donc on passe par une
-- fonction : elle vérifie elle-même que l'appelant est admin (sinon 0 ligne).
create or replace function admin_list_parents()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  signup_code text,
  is_admin boolean,
  last_sign_in_at timestamptz,
  profile_count bigint
)
language sql
security definer
set search_path = public
as $$
  select
    p.id, p.email, p.created_at, p.signup_code, p.is_admin,
    u.last_sign_in_at,
    (select count(*) from profiles pr where pr.parent_id = p.id) as profile_count
  from parents p
  join auth.users u on u.id = p.id
  where exists (select 1 from parents me where me.id = auth.uid() and me.is_admin = true)
  order by p.created_at desc;
$$;

grant execute on function admin_list_parents() to authenticated;
