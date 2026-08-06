# Plan d'implémentation — Catégorie « Verbes »

Plan rédigé le 2026-08-06. **À lire en entier avant de coder.** Voir aussi [PLAN.md](PLAN.md) (pédagogie) et [STATUS.md](STATUS.md) (état réel du code).

## Décisions verrouillées (ne pas re-débattre)

| Décision | Choix |
|---|---|
| Entrée dans les verbes | **Écran de catégorie séparé**, avant la grille de thèmes |
| Jeux par catégorie | **Différents par catégorie** (structure prévue pour ça) |
| Associe | **Conservé pour les mots** — l'enfant l'aime, on n'y touche pas |
| Jeux des verbes | flashcards, quiz, **phrase** (nouveau), repete — Associe remplacé |
| Conjugaison | **Non** pour la v1 (verbes à l'infinitif, comme PLAN.md l'a toujours prévu) |
| Nombre de groupes | **4** pour commencer |

## ⚠️ Priorité absolue : les mots doivent redevenir jouables vite

L'enfant de Simon veut jouer. **La Phase 1 doit être livrée et commitée avant de toucher aux verbes.**
La Phase 2 (verbes) peut prendre le temps nécessaire.

À la fin de la Phase 1 : la carte « Verbes » s'affiche **désactivée avec 🔒 « Bientôt »** (même langage visuel que les niveaux verrouillés). Ne PAS afficher une catégorie vide qui aurait l'air cassée.

---

# Phase 1 — Écran de catégorie + les mots rejouables

## 1.1 Types (`src/types/content.ts`)

```ts
export type ThemeKind = "mots" | "verbes";

/** Formes conjuguées — non utilisées en v1, prévues pour un futur niveau 3. */
export interface VerbForms {
  thirdPerson: string;  // "eats"
  past: string;         // "ate"
}

export interface Word {
  // ...champs existants inchangés
  forms?: VerbForms;
}

export interface Theme {
  // ...champs existants inchangés
  /** Absent = "mots" (tous les thèmes existants). */
  kind?: ThemeKind;
}
```

**`kind` est optionnel volontairement** : ça évite de modifier les 24 fichiers JSON existants en Phase 1. Seuls les 4 nouveaux fichiers de verbes le déclareront. Ne pas le rendre obligatoire.

## 1.2 Helpers de contenu (`src/content/index.ts`)

```ts
export function themeKind(theme: Theme): ThemeKind {
  return theme.kind ?? "mots";
}

export function themesByKind(kind: ThemeKind): Theme[] {
  return themes.filter((theme) => themeKind(theme) === kind);
}
```

## 1.3 Modes par catégorie (`src/lib/modes.ts`)

Deux notions distinctes — ne pas les confondre :

```ts
// Catalogue de TOUS les modes : sert aux libellés/emoji partout
// (notamment le dashboard parent qui fait MODES.map(m => [m.id, m])).
export const MODES: ModeInfo[] = [
  { id: "flashcards", label: "Flashcards", emoji: "🃏", description: "Découvre les mots" },
  { id: "quiz",       label: "Quiz",       emoji: "❓", description: "Teste-toi" },
  { id: "associe",    label: "Associe",    emoji: "🔗", description: "Relie l'image au mot" },
  { id: "phrase",     label: "Phrase",     emoji: "📝", description: "Complète la phrase" },
  { id: "repete",     label: "Répète",     emoji: "🎤", description: "Prononce le mot" },
];

// Quels modes chaque catégorie utilise réellement, dans l'ordre d'affichage.
export const MODES_BY_KIND: Record<ThemeKind, GameMode[]> = {
  mots:   ["flashcards", "quiz", "associe", "repete"],
  verbes: ["flashcards", "quiz", "phrase", "repete"],
};

export function modesForKind(kind: ThemeKind): ModeInfo[] { /* map + filter */ }
```

Ajouter `"phrase"` au type `GameMode` dans `src/types/progress.ts`.

**Réversible facilement** : si l'enfant réclame Associe aussi pour les verbes, c'est une seule ligne à changer dans `MODES_BY_KIND.verbes`.

## 1.4 Routing — via query param, PAS un nouveau segment

| URL | Écran |
|---|---|
| `/play/[profileId]` | **Écran de catégorie** (nouveau comportement du fichier existant) |
| `/play/[profileId]?cat=mots` | Grille de thèmes, mots uniquement |
| `/play/[profileId]?cat=verbes` | Grille de thèmes, verbes uniquement |
| `/play/[profileId]/[themeId]` | Inchangé (sélecteur de niveau) |
| `/play/[profileId]/[themeId]/[level]` | Inchangé (hub) — mais liste de modes selon la catégorie |
| `/play/[profileId]/[themeId]/[level]/[mode]` | Inchangé — + dispatch du mode `phrase` |

### Pourquoi un query param et pas `/play/[profileId]/[category]/[themeId]/...`

Un segment `[category]` au même niveau que `[themeId]` déclenche l'erreur Next.js **« You cannot use different slug names for the same dynamic path »**. Ce projet s'est déjà fait piéger par exactement ça lors de l'ajout de `[level]` — il avait fallu arrêter le serveur et supprimer `.next` à la main (voir STATUS.md). Le query param évite complètement ce risque et ne touche **qu'un seul fichier de route existant** au lieu de quatre.

L'écran de catégorie et la grille cohabitent dans `src/app/play/[profileId]/page.tsx`, sélectionnés par `useSearchParams().get("cat")`.

### Liens retour : préserver la catégorie

Les pages profondes ne connaissent pas la catégorie via l'URL, mais elles l'ont via le thème :
`themeKind(getTheme(themeId))`. À corriger dans :

- `[themeId]/page.tsx` → « Changer de thème » doit pointer vers `/play/${profileId}?cat=${kind}`
- `[themeId]/[level]/page.tsx` → idem si un lien remonte à la grille

Sans ça l'enfant retombe sur l'écran de catégorie et doit refaire un tap.

## 1.5 Écran de catégorie

Dans `src/app/play/[profileId]/page.tsx`, quand `cat` est absent :

- Garde l'en-tête existant (mascotte cliquable + « Salut {prénom} ! ») — ne pas le perdre
- Deux grandes cartes tapables :
  - **📚 Les mots** → `?cat=mots`
  - **🏃 Les verbes** → désactivée, badge 🔒 « Bientôt » en Phase 1
- Garde « Changer de profil » en bas

Quand `cat` est présent : la grille actuelle, mais alimentée par `themesByKind(cat)` au lieu de `themes`, plus un lien « ← Catégories » vers `/play/${profileId}`.

## 1.6 Stats par mode — rendre `GRADED_MODES` conscient de la catégorie

`src/lib/theme-mode-stats.ts` a aujourd'hui :

```ts
const GRADED_MODES: GameMode[] = ["quiz", "associe", "repete"];  // ← codé en dur
```

Pour les verbes ce doit être `["quiz", "phrase", "repete"]`. **La fonction reçoit déjà `theme`** → dériver en interne avec `themeKind(theme)`, sans changer la signature. Les modes notés = `MODES_BY_KIND[kind]` moins `flashcards`.

## 1.7 Ce qui ne demande AUCUN changement (vérifié)

Ne perdez pas de temps dessus :

- **`src/lib/leitner.ts`** — la maîtrise compte `successModes.length >= 3`, sans nommer les modes. mots (quiz/associe/repete) et verbes (quiz/phrase/repete) donnent 3 modes notés chacun → logique identique.
- **`src/lib/level-progress.ts`** — utilise `successModes.length > 0`, agnostique du mode.
- **Tables `word_progress` et `attempts`** — aucune migration en Phase 1 (`attempts.mode` bouge en Phase 2 seulement).
- **Dashboard parent** — les verbes apparaîtront automatiquement dans les stats, la progression par thème et les « mots à travailler », puisqu'ils vivent dans le même tableau `themes`.

## 1.8 Vérification Phase 1 (avant de commiter)

1. `npx tsc --noEmit` passe
2. Écran de catégorie s'affiche ; « Verbes » est bien désactivée
3. Mots → thème → niveau → **les 4 jeux jouables** (Flashcards, Quiz, **Associe**, Répète)
4. Une partie d'Associe complétée écrit bien en base (`attempts` + `word_progress`)
5. « Changer de thème » revient sur la grille des mots, pas sur l'écran de catégorie
6. Dashboard parent charge toujours sans erreur

→ **Commit + push. L'enfant peut jouer.**

---

# Phase 2 — Les verbes

## 2.1 Migration DB (`supabase/migrations/007_add_phrase_mode.sql`)

Nom exact de la contrainte vérifié en base : `attempts_mode_check`.

```sql
-- Nouveau mode de jeu "phrase" (Complète la phrase), pour la catégorie Verbes.
alter table attempts drop constraint if exists attempts_mode_check;
alter table attempts add constraint attempts_mode_check
  check (mode in ('flashcards', 'quiz', 'associe', 'repete', 'phrase'));
```

Reporter aussi le changement dans `supabase/schema.sql` (pour les futures installs prod).

**Sans cette migration, chaque partie de « Phrase » échouera à l'insertion** — et le pattern d'erreur du projet fait que ça peut passer inaperçu à l'écran. À appliquer avant de tester le nouveau jeu.

## 2.2 Contenu — 4 groupes, 13 verbes chacun

Fichiers `src/content/themes/verbes-*.json`, avec `"kind": "verbes"`, à ajouter dans `src/content/index.ts`.

Découpage 5/4/4 par niveau, comme les thèmes existants.

| Fichier | Nom | Icône | Niveau 1 | Niveau 2 | Niveau 3 |
|---|---|---|---|---|---|
| `verbes-quotidien` | Actions du quotidien | 🍽️ | eat, drink, sleep, wash, open | close, cook, help, wait | rest, carry, clean, wear |
| `verbes-bouger` | Bouger | 🏃 | run, walk, jump, swim, sit | stand, climb, fly, dance | throw, catch, ride, push |
| `verbes-ecole` | À l'école | ✏️ | read, write, listen, speak, count | draw, learn, ask, answer | spell, repeat, show, think |
| `verbes-jouer` | Jouer & créer | 🎨 | play, sing, paint, build, watch | laugh, smile, win, make | cut, choose, hide, find |

### Règles de contenu — impératives

1. **Préfixer tous les ids de verbes : `v-eat`, `v-play`, `v-watch`.**
   La convention du projet veut que le même mot anglais partage volontairement son `id` entre thèmes pour unifier la progression Leitner. Mais `watch` (regarder) vs `watch` (montre), `play` (jouer) vs `play` (pièce), `drink` (boire) vs `drink` (boisson) sont des **sens différents** — sans préfixe leur progression fusionnerait par erreur.

2. **Verbes à l'infinitif nu** (`eat`, pas `to eat`, pas `eats`). Le champ `en` sert directement de réponse dans les jeux et de cible pour la reconnaissance vocale.

3. **Chaque verbe a exactement 2 phrases d'exemple**, et le verbe doit y apparaître **textuellement à l'infinitif**. C'est ce qui permet au jeu « Phrase » de détecter le trou automatiquement, sans champ supplémentaire à saisir.
   - ✅ `eat` → « I eat an apple. » / « We eat at home. »
   - ❌ « She eats an apple. » (forme conjuguée → détection du trou impossible)

4. **La phrase doit avoir un ancrage sémantique fort** : un seul verbe du même niveau doit pouvoir y tenir.
   - ✅ « I ___ an apple. » → seul `eat` fonctionne
   - ❌ « I ___ every day. » → eat, sleep, run fonctionnent tous

5. **Emoji** : les 4 groupes ont été choisis pour être illustrables. Les verbes abstraits (`want`, `know`, `need`, `like`) sont volontairement **exclus de la v1** — ils rendent Flashcards vide de sens visuel. À traiter plus tard.

### Script de validation (`scripts/verify-content.mjs`)

Le projet a déjà l'habitude de valider le contenu par script. Vérifier :

- chaque mot a un `level` valide (1/2/3) et au moins une phrase
- tous les ids de verbes commencent par `v-`
- aucun id en doublon **entre les 4 groupes de verbes**
- aucune collision entre un id de verbe et un id de mot
- **pour chaque verbe : son `en` apparaît en correspondance de mot entier dans chacune de ses phrases** (c'est le check qui garantit que le jeu Phrase fonctionnera)

## 2.3 Nouveau jeu — `src/components/games/Phrase.tsx`

Calquer la structure de `Quiz.tsx` (c'est le plus proche), en reprenant :
- `GameHeader` avec progression `${index + 1} / ${words.length}`
- prop `mascotId`, pose « encourageant » sur bonne réponse
- écran de fin avec mascotte « celebration » + `playSuccessSound()`
- enregistrement via `recordAttempt({ ..., mode: "phrase" })`

**Mécanique :**

1. Prendre une phrase du verbe courant
2. Dériver le trou : remplacer l'occurrence du `word.en` (correspondance de mot entier, insensible à la casse) par `___`
3. Afficher la phrase à trous + la traduction française en indice
4. 3 boutons de réponse : le bon verbe + 2 distracteurs tirés des **autres verbes du même thème et du même niveau**
5. Feedback correctif (comme Quiz) : montrer la bonne réponse, `speak()` la phrase complète en anglais
6. Bouton « Suivant → » / « Terminé 🎉 »

**Garde-fou obligatoire** : si le verbe n'est pas trouvé dans la phrase, ne pas planter — sauter le mot (et le script de validation doit rendre ce cas impossible en amont).

## 2.4 Câblage

- `[themeId]/[level]/[mode]/page.tsx` : ajouter `"phrase"` à `VALID_MODES` et dispatcher vers `<Phrase />`
- Activer la carte « Verbes » sur l'écran de catégorie (retirer 🔒 « Bientôt »)

## 2.5 Vérification Phase 2

1. `npx tsc --noEmit` passe
2. Script de validation du contenu passe sur les 4 groupes
3. Migration 007 appliquée en dev
4. Verbes → un groupe → niveau 1 → les 4 jeux jouables
5. Une partie de « Phrase » complétée → vérifier **en base** qu'une ligne `attempts` avec `mode = 'phrase'` existe (c'est le test qui prouve que la migration est bonne)
6. Déblocage du niveau 2 fonctionne après avoir touché tous les verbes du niveau 1
7. Dashboard parent : le mode « Phrase » apparaît avec son libellé (pas l'id brut) dans « Par type de jeu »
8. Les mots n'ont pas régressé — refaire une partie d'Associe

---

## Rappels de workflow pour ce projet

- **Le serveur de dev appartient à Simon.** Ne pas supposer qu'un `npm run dev` tourne. Si un `preview_stop` est appelé après vérification, sa page se bloque. Voir STATUS.md.
- **Framer Motion** : ne rien animer via un `animate` piloté par state ni via `AnimatePresence`/`exit` dans ce projet — ça ne s'applique pas de façon fiable. CSS pur (`style` + `transition-*`).
- Migrations DB : appliquées via `DATABASE_URL="<pooler>" node scripts/run-sql.mjs <fichier>`. Simon ne veut pas exécuter de SQL lui-même.
- Mettre STATUS.md à jour à la fin de chaque phase.
