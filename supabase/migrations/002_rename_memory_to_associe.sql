-- Renomme le mode "memory" en "associe" (le jeu a été remplacé, voir STATUS.md)
alter table attempts drop constraint if exists attempts_mode_check;
alter table attempts add constraint attempts_mode_check check (mode in ('flashcards', 'quiz', 'associe', 'repete'));
update attempts set mode = 'associe' where mode = 'memory';
update word_progress set success_modes = array_replace(success_modes, 'memory', 'associe');
