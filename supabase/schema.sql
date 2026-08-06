-- Schéma Compagnon Anglais — à exécuter dans le SQL Editor de CHAQUE projet Supabase (dev puis prod)

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mascot text not null check (mascot in ('renard', 'hibou', 'dragon', 'panda')),
  created_at timestamptz not null default now()
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

alter table profiles enable row level security;
alter table word_progress enable row level security;
alter table attempts enable row level security;

-- Pas de système d'authentification utilisateur prévu (app familiale, usage local) :
-- accès complet via la clé publique, protégé uniquement par la confidentialité de l'URL/clé du projet.
create policy "allow all on profiles" on profiles for all using (true) with check (true);
create policy "allow all on word_progress" on word_progress for all using (true) with check (true);
create policy "allow all on attempts" on attempts for all using (true) with check (true);
