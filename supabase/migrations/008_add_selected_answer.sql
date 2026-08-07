-- Distracteurs plus intelligents en Quiz (IDEAS.md priorité 4, point 6) : garder
-- trace de la mauvaise réponse choisie pour pouvoir la re-proposer plus tard
-- comme distracteur ciblé sur les mots réellement confondus. Nullable — seul
-- Quiz écrit cette colonne pour l'instant, les autres modes restent inchangés.
alter table attempts add column if not exists selected_answer text;
