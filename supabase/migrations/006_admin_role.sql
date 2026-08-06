-- Rôle admin pour le futur portail admin (gestion des codes d'invitation,
-- vue d'ensemble des familles, réactivation de profils désactivés).

alter table parents add column if not exists is_admin boolean not null default false;

-- Admins : gestion complète des codes d'invitation (les parents normaux n'ont
-- aucun accès direct à cette table — la validation au signup passe par
-- is_invite_code_active(), qui ne révèle jamais la liste des codes).
create policy "admins manage invite_codes" on invite_codes
  for all using (
    exists (select 1 from parents me where me.id = auth.uid() and me.is_admin = true)
  )
  with check (
    exists (select 1 from parents me where me.id = auth.uid() and me.is_admin = true)
  );

-- Admins : peuvent voir tous les profils (toutes familles) et les réactiver,
-- en plus de la policy existante qui limite chaque parent à ses propres enfants.
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
