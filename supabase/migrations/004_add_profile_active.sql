-- Permet de "supprimer" un profil depuis l'espace parent sans perdre ses données :
-- on le désactive (masqué partout dans l'app) plutôt que de le supprimer, pour
-- pouvoir le réactiver plus tard depuis un futur portail admin.
alter table profiles add column if not exists active boolean not null default true;
