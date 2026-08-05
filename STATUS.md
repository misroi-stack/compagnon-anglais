# État d'avancement — Compagnon Anglais

Dernière mise à jour : 2026-08-05

## Fait

- [PLAN.md](PLAN.md) finalisé (pédagogie, modes de jeu, contenu, voix, son, visuel, stats/parent, workflow technique, coûts)
- Node.js installé sur la machine
- Scaffold Next.js 16 + TypeScript + Tailwind + Framer Motion, en place dans ce dossier
- PWA de base : `src/app/manifest.ts` + `public/sw.js` (service worker minimal, cache basique)
- Modèle de données : `src/types/` (content, profile, progress) + `src/content/themes/` — **les 24 thèmes du plan sont tous créés** (animaux, couleurs, nombres, famille, nourriture, fruits & légumes, école, corps, météo, vêtements, maison, transports, sport, émotions, jours, saisons, formes, nature, jouets, musique, métiers, ferme, océan, espace), chaque mot a un `emoji` placeholder (visuel par mot en attendant les vraies illustrations). Les mots partagés entre thèmes (ex: "star" en Formes et en Espace, "sun" en Météo et en Espace) utilisent volontairement le même `id` pour que leur progression Leitner reste unifiée plutôt que dupliquée.
- Répétition espacée (boîtes Leitner) implémentée : `src/lib/leitner.ts`
- **Écran de sélection de profil fonctionnel** (`src/app/page.tsx`) : création de profil (nom, âge 6/9, mascotte parmi 4 emojis placeholder), sélection — testé dans le navigateur, ça marche
- **Comptes Supabase créés** : `compagnon-anglais-dev` et `compagnon-anglais-prod`
- **Supabase dev branché** : schéma appliqué (`supabase/schema.sql` : tables `profiles`, `word_progress`, `attempts`, RLS activé avec accès public — pas d'auth utilisateur prévue), client dans `src/lib/supabase.ts`, `.env.local` configuré (non commité)
- Profils maintenant lus/écrits directement dans Supabase (`src/lib/profiles.ts`) — testé de bout en bout (créé un profil, rechargé la page, toujours là)
- `scripts/run-sql.mjs` : utilitaire pour exécuter du SQL contre une base via `DATABASE_URL` (utilisé pour appliquer le schéma ; connexion via le **pooler** Supabase, la connexion directe ne passe pas sur ce réseau — IPv6 uniquement)
- **Routing complet** : sélection profil → `/play/[profileId]` (grille des 24 thèmes + choix du mode) → `/play/[profileId]/[themeId]/[mode]` (l'écran de jeu)
- **Grille de thèmes avec indicateur de progrès** (`src/lib/theme-suggestion.ts` → `getThemeStats`) : chaque carte affiche une barre de progression **graduelle** (basée sur la boîte Leitner de chaque mot, avance dès la première bonne réponse plutôt que d'attendre la pleine maîtrise), plus un décompte "X/Y maîtrisés" pour l'objectif strict (3 modes réussis). Les thèmes sont triés du moins avancé au plus avancé (badge ✨ sur le premier) pour encourager à combler les lacunes. Repliée à 8 thèmes par défaut avec un bouton pour tout afficher (24). Thèmes sans mot pour l'âge du profil (ex: "Jours" = 9 ans seulement) automatiquement masqués.
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
- Le mode "Memory" (cartes cachées, retrouver les paires) a été essayé puis abandonné après un test utilisateur réel : ça mesurait la mémoire spatiale, pas la connaissance du vocabulaire anglais. Remplacé par "Associe" (tout visible, on relie image et mot). Bien retenir cette leçon pour les futures idées de mini-jeux (V2) : vérifier qu'un mécanisme teste vraiment l'anglais, pas juste une compétence annexe.

## Prochaines étapes (dans l'ordre)

1. **Action utilisateur requise** : créer un compte Vercel — voir PLAN.md
2. Appliquer `supabase/schema.sql` sur le projet **prod** au moment du déploiement (même méthode que dev, avec le mot de passe/pooler de prod)
3. Mettre en place le pipeline CI/CD GitHub Actions (branche `production`)
4. Premier déploiement de test sur la tablette Android — **notamment pour valider la reconnaissance vocale en conditions réelles**
5. Reste à faire pour un vrai V1 complet : mode parent (dashboard stats), différenciation plus fine par âge (mini-phrases à trous en Quiz pour les 9 ans, priorisation des modes selon l'âge — voir PLAN.md), sons d'interface (clic/transition), mascotte animée (en attente des images)

## Pour relancer le développement local

```bash
cd C:\Users\pears\Claude\compagnon-anglais
npm run dev
```

Node.js est installé dans `C:\Program Files\nodejs` — s'il n'est pas reconnu dans un nouveau terminal, ajouter ce dossier au PATH ou relancer le terminal.
