-- Nouveau mode de jeu "phrase" (Complète la phrase), pour la catégorie Verbes.
alter table attempts drop constraint if exists attempts_mode_check;
alter table attempts add constraint attempts_mode_check
  check (mode in ('flashcards', 'quiz', 'associe', 'repete', 'phrase'));
