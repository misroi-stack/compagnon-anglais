# État d'avancement — Compagnon Anglais

Dernière mise à jour : 2026-08-06

- **Catégorie Verbes** — voir [PLAN-VERBES.md](PLAN-VERBES.md) pour le détail complet (terminé, phases 1 et 2). Écran de catégorie sur `/play/[profileId]` (📚 Mots / 🏃 Verbes), grille de thèmes derrière `?cat=mots|verbes` (query param plutôt qu'un segment `[category]`, pour éviter la collision Next.js avec `[themeId]`). 4 groupes de verbes (52 mots) : Actions du quotidien, Bouger, À l'école, Jouer & créer — ids préfixés `v-` pour ne pas fusionner leur progression avec un nom homonyme (watch/play/drink). Nouveau jeu **Phrase** (`src/components/games/Phrase.tsx`, mode `phrase`) remplace Associe pour les verbes : dérive le trou automatiquement en cherchant le verbe (mot entier) dans une de ses phrases d'exemple — vérifié par `scripts/verify-content.mjs`, à relancer après tout ajout de contenu verbe. Migration `007_add_phrase_mode.sql` (appliquée en dev). `leitner.ts`, `level-progress.ts` et le dashboard parent n'ont demandé aucune modification.

- Son de succès (petit arpège synthétisé via Web Audio API, `src/lib/sound.ts`) joué à la complétion de Quiz, Associe et Répète — pas de fichier audio à gérer.
- Répète-et-vérifie : le bouton micro sert aussi de bouton "réessayer" (un seul tap après une réponse incorrecte relance l'écoute), et un mot répété 2-3 fois d'affilée par l'enfant (ex: "dog dog", fréquent quand la reconnaissance n'a rien capté au premier essai) compte comme correct (`matchesSpokenWord` dans `src/lib/speech-recognition.ts`).
- Flashcards : bouton 🔊 dédié pour écouter la phrase d'exemple, séparé du bouton d'écoute du mot seul.
- On peut changer de mascotte en cliquant dessus sur la page d'accueil du profil (`/play/[profileId]`) — ouvre le même `MascotPicker` que la création de profil, persisté via `updateProfileMascot` dans Supabase.
- **Espace parent** (`/parent` → choix du profil, `/parent/[profileId]` → dashboard) : durée de pratique estimée par sessions (tuiles jour/semaine/mois + graphique 14 jours), évolution du taux de réussite sur 8 semaines, essais/réussite par mode, mots à travailler / points forts, progression et réussite par thème. Tout calculé côté client à partir de la table `attempts` existante (`src/lib/parent-stats.ts`), pas de nouvelle table. Flashcards (mode découverte) n'enregistre pas d'essai, donc n'apparaît pas dans ces stats. Accessible via un lien en bas de l'écran de choix de profil.
  - "Zone dangereuse" en bas du dashboard : supprimer un profil le **désactive** (`profiles.active`, migration `004_add_profile_active.sql`, appliquée en dev) au lieu de le supprimer réellement — masqué partout (`getProfiles`/`getProfile` filtrent sur `active=true`), données conservées pour une réactivation future via un portail admin (pas encore construit). Confirmation en deux temps avant de désactiver.
- Chargement plus robuste partout : indicateur avec spinner + secondes écoulées (`src/components/LoadingIndicator.tsx`), timeout de 12s sur tous les appels Supabase (`src/lib/supabase.ts`), état d'erreur avec bouton pour recharger si un chargement échoue vraiment. Service worker corrigé pour ne mettre en cache que les ressources de l'app (plus les appels Supabase par erreur).
- ⚠️ **Piège de workflow important** : ce projet tourne en local sur la machine de Simon — `npm run dev` doit tourner dans **son propre terminal**, en continu. Mes sessions de prévisualisation (outil de dev) démarrent/arrêtent leur propre serveur de façon éphémère ; ne pas supposer qu'un serveur externe tourne juste parce que l'app "marchait" un instant plus tôt.
- **Comptes parents avec authentification** (Supabase Auth — mots de passe hachés côté serveur) : toute l'app est maintenant derrière une connexion (`src/components/AuthGate.tsx` dans le layout racine). Inscription protégée par un code d'invitation (table `invite_codes`, seedée avec `BONJOUR` actif — code vérifié via la fonction RPC `is_invite_code_active` avant même de créer le compte, + un trigger DB en filet de sécurité). Les profils enfants sont rattachés à un parent (`profiles.parent_id`), accès verrouillé par famille via RLS (`auth.uid()`) sur profiles/word_progress/attempts. Migration `005_parent_accounts.sql`.
  - Compte de Simon : `misroi@gmail.com`, mot de passe temporaire `123456` (à changer plus tard, pas encore d'écran de gestion de compte). Simon, Simon 2 et Lily y sont rattachés — aucune perte de progression.
  - ⚠️ Le projet Supabase dev a la confirmation par email activée (réglage dashboard, pas modifiable depuis le code) — j'ai confirmé le compte de Simon manuellement en base pour ce premier compte. À vérifier/désactiver dans Authentication → Providers → Email si de nouveaux comptes doivent pouvoir se connecter sans cliquer un lien de confirmation.
  - ⚠️ Le projet Supabase dev a aussi une limite de taux sur l'envoi d'emails de confirmation (`over_email_send_rate_limit`, plan gratuit) — gêne les inscriptions répétées en test rapproché. Pas un bug de l'app.
- **Portail admin** (`/admin`, migration `006_admin_role.sql`) : route non reliée dans la navigation normale, protégée par un rôle (`parents.is_admin`, pas juste l'URL — vérifié côté app ET par RLS/RPC). Simon (`misroi@gmail.com`) est admin.
  - Codes d'invitation : liste, création, activer/désactiver (`invite_codes`, policy `admins manage invite_codes` — les parents normaux n'y ont toujours aucun accès direct).
  - Comptes parents : email, code utilisé, nombre de profils, dernière connexion — via la fonction RPC `admin_list_parents()` (`auth.users` n'est pas exposé par l'API REST, la fonction vérifie elle-même que l'appelant est admin).
  - Profils désactivés (toutes familles) : réactivation en un clic (`reactivateProfile`).

## Fait

- [PLAN.md](PLAN.md) finalisé (pédagogie, modes de jeu, contenu, voix, son, visuel, stats/parent, workflow technique, coûts)
- Node.js installé sur la machine
- Scaffold Next.js 16 + TypeScript + Tailwind + Framer Motion, en place dans ce dossier
- PWA de base : `src/app/manifest.ts` + `public/sw.js` (service worker minimal, cache basique)
- Modèle de données : `src/types/` (content, profile, progress) + `src/content/themes/` — **les 24 thèmes du plan sont tous créés** (animaux, couleurs, nombres, famille, nourriture, fruits & légumes, école, corps, météo, vêtements, maison, transports, sport, émotions, jours, saisons, formes, nature, jouets, musique, métiers, ferme, océan, espace), chaque mot a un `emoji` placeholder (visuel par mot en attendant les vraies illustrations). Les mots partagés entre thèmes (ex: "star" en Formes et en Espace, "sun" en Météo et en Espace, "horse" en Animaux et en Ferme) utilisent volontairement le même `id` pour que leur progression Leitner reste unifiée plutôt que dupliquée. **Tous les mots des 24 thèmes ont une mini-phrase d'exemple.**
- **L'âge du profil est retiré, remplacé par 3 niveaux de vocabulaire par thème** (`src/types/content.ts` → `Word.level: 1|2|3`, plus de `AgeGroup`/`ageGroups`). Chaque thème est passé de ~4-7 mots à **~12-13 mots répartis sur 3 niveaux** (300 mots au total sur les 24 thèmes), avec du vrai nouveau vocabulaire à chaque niveau, pas juste une réorganisation des mots existants. Colonne `age` supprimée de la table Supabase `profiles` (migration `003_remove_age.sql`, appliquée en dev). Le profil ne demande plus que nom + mascotte.
- **Déblocage progressif des niveaux** (`src/lib/level-progress.ts` → `getLevelStats`) : niveau 1 toujours ouvert ; niveau N+1 se débloque une fois que tous les mots du niveau N ont été réussis au moins une fois dans un mode noté (`successModes.length > 0` — pas besoin de maîtrise complète, juste d'avoir touché chaque mot). Les niveaux déjà débloqués restent accessibles pour toujours (on peut y revenir). Testé en base : seeder `word_progress` pour les 5 mots du niveau 1 d'Animaux débloque bien le niveau 2, niveau 1 reste cliquable ensuite.
- **Flashcards inversées** : la face avant montre le mot en **français**, un clic/tap la retourne pour révéler l'anglais + écoute + phrase — c'est l'anglais qu'on veut faire deviner/découvrir, pas l'inverse. Une icône 🔄 visible en coin de carte indique clairement qu'elle se retourne (avant, rien ne l'indiquait visuellement à part un texte).
- Répétition espacée (boîtes Leitner) implémentée : `src/lib/leitner.ts`
- **Écran de sélection de profil fonctionnel** (`src/app/page.tsx`) : création de profil (nom, mascotte), sélection — testé dans le navigateur, ça marche
- **Vraies images de mascottes intégrées** (`public/images/mascots/`, 16 fichiers PNG fournis par l'utilisateur : 4 mascottes × 4 poses — neutre/attentif/encourageant/celebration, fond transparent vérifié). Remplacent les emojis placeholder partout : sélecteur de mascotte, carte de profil, en-tête de la grille de thèmes. En plus, la mascotte **réagit pendant le jeu** (`src/lib/mascots.ts` → `getMascotImage(id, pose)`) : pose "attentif" pendant l'écoute en Répète, "encourageant" sur une bonne réponse (Quiz, Répète), "celebration" à la complétion d'Associe et quand les 4 modes d'un niveau sont finis.
- **Comptes Supabase créés** : `compagnon-anglais-dev` et `compagnon-anglais-prod`
- **Supabase dev branché** : schéma appliqué (`supabase/schema.sql` : tables `profiles`, `word_progress`, `attempts`, RLS activé avec accès public — pas d'auth utilisateur prévue), client dans `src/lib/supabase.ts`, `.env.local` configuré (non commité)
- Profils maintenant lus/écrits directement dans Supabase (`src/lib/profiles.ts`) — testé de bout en bout (créé un profil, rechargé la page, toujours là)
- `scripts/run-sql.mjs` : utilitaire pour exécuter du SQL contre une base via `DATABASE_URL` (utilisé pour appliquer le schéma ; connexion via le **pooler** Supabase, la connexion directe ne passe pas sur ce réseau — IPv6 uniquement)
- **Routing complet à 4 niveaux** : sélection profil → `/play/[profileId]` (grille des 24 thèmes) → `/play/[profileId]/[themeId]` (**sélecteur de niveau**, nouveau) → `/play/[profileId]/[themeId]/[level]` (hub du niveau, choix du mode) → `/play/[profileId]/[themeId]/[level]/[mode]` (l'écran de jeu)
- **Hub par niveau** (`/play/[profileId]/[themeId]/[level]/page.tsx`) : les 4 modes s'affichent avec un compteur "X/Y réussis" (Quiz/Associe/Répète, basé sur `successModes` du mot) et une coche ✓ une fois complet, pour les mots de CE niveau uniquement. Terminer un jeu ramène à ce hub (même thème + même niveau), pas à la grille complète. "Changer de niveau" remonte au sélecteur de niveau.
- **Grille de thèmes avec indicateur de progrès** (`src/lib/theme-suggestion.ts` → `getThemeStats`) : chaque carte affiche une barre de progression **graduelle** sur l'ensemble des mots du thème tous niveaux confondus (basée sur la boîte Leitner de chaque mot, avance dès la première bonne réponse), plus un décompte "X/Y maîtrisés" pour l'objectif strict (3 modes réussis). Triés du moins avancé au plus avancé (badge ✨ sur le premier). Affiche les 24 d'un coup (le repli à 8 a été retiré une fois le sélecteur de niveau séparé sur sa propre page — plus la place suffisait).
  - ⚠️ Correction suite à un retour terrain : la barre utilisait d'abord uniquement le taux de maîtrise stricte (3 modes réussis), donc restait à 0% après plusieurs bonnes réponses dans un seul mode — aucune progression visible, très démotivant. Toujours vérifier qu'un indicateur donne un retour *immédiat*, pas seulement au jalon final.
- **Les 4 modes de jeu sont construits et testés** :
  - Flashcards (découverte) — carte qui se retourne (clic) pour révéler mot/traduction/phrase/écoute
  - Quiz (reconnaissance) — questions traduction/écoute alternées, feedback correctif
  - Associe (rappel) — deux colonnes visibles (emojis / mots), toucher une image puis un mot pour les relier ; remplace l'idée initiale "Memory" (cartes cachées) après retour terrain : ça testait la mémoire de position plus que l'anglais
  - Répète-et-vérifie (production) — reconnaissance vocale native, gère proprement le cas où le micro n'est pas dispo/autorisé
  - Les 3 derniers modes enregistrent chaque tentative dans Supabase et mettent à jour la progression Leitner (vérifié en base : boîte qui monte/descend, `success_modes` qui s'accumule)
  - ⚠️ **Reconnaissance vocale non testable dans cet environnement de dev** (pas de vrai micro dans le navigateur de prévisualisation) — le fallback "micro refusé" a été vérifié, mais un vrai test avec la voix nécessite la tablette Android
- Tout est commité et poussé sur `main` (https://github.com/misroi-stack/compagnon-anglais)

## Décisions clés à retenir

- Tablette cible : **Android** (Chrome) → reconnaissance vocale native fiable, pas de souci iPad/Safari
- Mascottes = emojis placeholder pour l'instant (🦊🦉🐉🐼) ; les vraies images seront fournies par l'utilisateur (voir PLAN.md section "Contenu visuel")
- Pas de système de récompense/points — feedback qualitatif seulement
- Tout gratuit pour la V1 (voir PLAN.md section "Coûts"), sauf la conversation IA vocale (V2, optionnelle, payante)
- Mots de passe/secrets gérés via le gestionnaire de mots de passe Chrome ; jamais commités (`.env.local` et `.env*` sont dans `.gitignore`)
- Connexion Postgres directe (`db.<ref>.supabase.co`) ne fonctionne pas sur ce réseau (IPv6 requis) → toujours utiliser le **connection pooler** (`Settings → Database → Connect → Transaction pooler`)
- ⚠️ **Framer Motion `animate={{...}}` ne se met pas à jour de façon fiable dans cette combo Next.js 16 / React 19 / framer-motion 12** quand la valeur change après le montage (testé et confirmé cassé sur `AnimatePresence` exit ET sur un `rotateY` piloté par state). Le state React se met à jour correctement, mais le style ne suit pas. **Solution qui marche** : transitions CSS pures (classe Tailwind `transition-transform`/`transition-all` + `style={{transform: ...}}` conditionnel sur le state), utilisée dans Flashcards et Associe. Framer Motion reste fiable pour les animations au montage (`initial`→`animate` une fois) et les gestes (`whileTap`/`whileHover`) — évite `animate` piloté par state ailleurs dans le code.
  - Même bug rencontré avec `AnimatePresence`/`exit` : le modal de changement de mascotte restait bloqué à l'écran (`opacity: 0` mais toujours dans le DOM, jamais démonté) après sélection — l'animation de sortie ne se termine jamais de façon fiable. Corrigé en abandonnant `AnimatePresence`/`exit` pour un rendu conditionnel simple (`{condition && <motion.div initial animate .../>}`, sans `exit`). Éviter `AnimatePresence` pour les modals dans ce projet.
- Le mode "Memory" (cartes cachées, retrouver les paires) a été essayé puis abandonné après un test utilisateur réel : ça mesurait la mémoire spatiale, pas la connaissance du vocabulaire anglais. Remplacé par "Associe" (tout visible, on relie image et mot). Bien retenir cette leçon pour les futures idées de mini-jeux (V2) : vérifier qu'un mécanisme teste vraiment l'anglais, pas juste une compétence annexe.

## Prochaines étapes (dans l'ordre)

1. **Action utilisateur requise** : créer un compte Vercel — voir PLAN.md
2. Appliquer `supabase/schema.sql` sur le projet **prod** au moment du déploiement (même méthode que dev, avec le mot de passe/pooler de prod)
3. Mettre en place le pipeline CI/CD GitHub Actions (branche `production`)
4. Premier déploiement de test sur la tablette Android — **notamment pour valider la reconnaissance vocale en conditions réelles**
5. Reste à faire pour un vrai V1 complet : sons d'interface (clic/transition)

## Pour relancer le développement local

```bash
cd C:\Users\pears\Claude\compagnon-anglais
npm run dev
```

Node.js est installé dans `C:\Program Files\nodejs` — s'il n'est pas reconnu dans un nouveau terminal, ajouter ce dossier au PATH ou relancer le terminal.
