-- Retire le concept de difficulté par âge, remplacé par des niveaux (1-3) par thème.
alter table profiles drop column if exists age;
