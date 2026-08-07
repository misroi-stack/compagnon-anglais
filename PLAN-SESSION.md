# Plan d'implémentation — Session du jour

Plan rédigé le 2026-08-07 (Opus, avant passage à Sonnet pour l'implémentation, même méthode que [PLAN-VERBES.md](PLAN-VERBES.md)). **À lire en entier avant de coder.** Voir aussi [IDEAS.md](IDEAS.md) (priorité 1 : points 1, 2, 10) et [FEATURES.md](FEATURES.md) (état actuel).

## Constat de départ

`src/lib/leitner.ts` a déjà tout ce qu'il faut (boîtes 1-5, `nextReviewAt`, `isDueForReview()`), mais rien dans l'app ne l'utilise pour choisir quels mots montrer. Le jeu prend toujours `wordsForLevel(theme, level)` — tous les mots du niveau, dans l'ordre du JSON. Ce plan ajoute le premier vrai consommateur de `isDueForReview()`.

⚠️ **Ce plan est strictement additif.** Le parcours actuel par thème (`/play/[profileId]?cat=mots` → choisir un thème → niveau → mode, ex: Couleurs → Associe) reste **100% inchangé** — même routes, même code, mêmes composants. C'est le chemin préféré de la fille de l'utilisateur, confirmé explicitement avec lui : ne touchez à *aucun* fichier de ce parcours existant pour l'implémenter, à l'exception du seul changement rétrocompatible décrit en §5 (prop optionnelle sur Quiz/Phrase/RepeatCheck, sans effet si absente). La Session du jour est un chemin **en plus**, pas un remplacement.

## Décisions verrouillées (confirmées avec l'utilisateur — ne pas re-débattre)

| Décision | Choix |
|---|---|
| Emplacement | **En héros** au-dessus des cartes Mots/Verbes sur l'écran de catégorie (`/play/[profileId]`), pas une 3ᵉ carte au même niveau — c'est le chemin par défaut, le choix libre reste en dessous |
| Contenu de la session | **Mélange mots + verbes** (interleaving entre catégories, pas juste entre modes) |
| Dette de révision | **Jamais affichée**. Session plafonnée, les plus urgents d'abord, le retard reste invisible pour l'enfant |
| Bouton désactivé | **Jamais**. Si rien n'est dû, proposer une session de nouveaux mots à la place |
| Associe | **Reste un bloc** (mini-jeu de ~5 paires), ne se découpe pas mot par mot dans l'alternance |
| DB / migrations | **Aucune**. `recordAttempt` existant suffit — même tables, même fonction, appelée pour chaque mot comme aujourd'hui |

## Vue d'ensemble de l'écran de catégorie (après ce travail)

```
🦊  Salut Simon 2 !

┌───────────────────────────┐
│   ⭐ Ma session du jour    │
│   4 nouveaux · 6 à revoir │
│        [ C'est parti ! ]  │
└───────────────────────────┘

    ── ou choisis toi-même ──

  📚 Les mots      🏃 Les verbes

     Changer de profil
```

La carte s'affiche toujours (jamais désactivée) — voir §3 pour ce qu'elle affiche quand rien n'est dû.

## Routing

`/play/[profileId]/session` — segment **statique**, cohabite sans problème avec `/play/[profileId]/[themeId]` (Next.js priorise un match statique exact sur un segment dynamique frère ; contrairement au problème rencontré avec `[category]` vs `[themeId]` sur PLAN-VERBES.md, ici il n'y a qu'un seul nom de segment dynamique en jeu, donc pas de collision — pas besoin de query param cette fois).

## 1. Nouveau module `src/lib/session.ts` (logique pure, testable indépendamment de React)

### 1.1 Trouver les mots éligibles

Un mot est éligible s'il est dans un niveau **débloqué** de son thème — réutiliser `getLevelStats(theme, progressMap)` (déjà en place, ne pas dupliquer sa logique de déblocage) pour trouver le niveau max débloqué par thème, puis `wordsUpToLevel(theme, maxUnlockedLevel)`. Faire ça sur **tous** les thèmes (`themes` de `src/content/index.ts`, mots + verbes confondus — ne pas filtrer par `themeKind`, c'est tout l'intérêt du mélange).

```ts
interface EligibleWord {
  word: Word;
  theme: Theme;
  progress: WordProgress | undefined;
}

function getEligibleWords(themes: Theme[], progressByWordId: Map<string, WordProgress>): EligibleWord[]
```

### 1.2 Séparer nouveaux vs dus

⚠️ Piège : `isDueForReview()` retourne `true` aussi bien pour un mot **jamais tenté** (`!progress.nextReviewAt`) que pour un mot **dû après révision**. Il faut les distinguer explicitement pour la session (ce sont deux catégories pédagogiques différentes, affichées séparément à l'enfant) :

```ts
function splitNewVsDue(words: EligibleWord[]): { newWords: EligibleWord[]; dueWords: EligibleWord[] } {
  // newWords = progress === undefined
  // dueWords = progress !== undefined && isDueForReview(progress)
}
```

### 1.3 Composer la session

Constantes proposées (ajustables, mettre en haut du fichier, pas éparpillées) :

```ts
const TARGET_DUE = 6;
const TARGET_NEW = 4;
const ASSOCIATE_BATCH_SIZE = 5;
```

Algorithme :
1. Prendre jusqu'à `TARGET_DUE` mots dus (les plus en retard d'abord — trier par `nextReviewAt` croissant), jusqu'à `TARGET_NEW` nouveaux (voir §1.4 pour l'ordre de sélection des nouveaux).
2. Si l'un des deux quotas n'est pas atteint (peu de mots dus, ou enfant qui a tout essayé au moins une fois), combler avec l'autre catégorie pour atteindre ~10 mots au total. Si vraiment rien n'est disponible nulle part (cas limite : tout est fait et rien n'est dû), voir §3.
3. Regrouper les mots de catégorie **"mots"** (pas "verbes") par thème d'origine. Pour un groupe d'au moins 2 mots du même thème, en faire un **bloc Associe** de `min(ASSOCIATE_BATCH_SIZE, taille du groupe)` mots (limite à un seul bloc Associe par session pour ne pas déséquilibrer — voir aussi §5, contrainte importante).
4. Les mots restants (pas assez nombreux pour former un bloc Associe, ou verbes) deviennent des **items simples** : un mode parmi `quiz` / `phrase` (verbes) / `repete` est assigné à chacun — préférer un mode **absent de `progress.successModes`** pour ce mot si possible (fait progresser vers la maîtrise plus vite), sinon rotation simple. `phrase` seulement pour les verbes, `quiz`/`repete` pour les deux catégories.
5. Mélanger l'ordre final (le bloc Associe peut être n'importe où dans la séquence, pas forcément en premier/dernier) pour un vrai interleaving thème/mode.

```ts
export type SessionStep =
  | { kind: "single"; word: Word; theme: Theme; mode: "quiz" | "phrase" | "repete" }
  | { kind: "associe"; theme: Theme; words: Word[] };

export interface SessionPlan {
  steps: SessionStep[];
  newCount: number;
  dueCount: number;
}

export function buildSessionPlan(
  themes: Theme[],
  progressByWordId: Map<string, WordProgress>
): SessionPlan
```

### 1.4 Ordre de sélection des nouveaux mots

Ne pas piocher au hasard dans les 28 thèmes — utiliser le même tri que `getThemeStats` (thèmes les moins avancés en premier) et prendre les nouveaux mots des thèmes les mieux classés d'abord. Ça garde un minimum de cohérence ("qu'est-ce que j'apprends aujourd'hui") plutôt qu'une session qui pioche 1 mot dans 8 thèmes différents.

## 2. Composant `SessionRunner`

Nouveau composant (`src/components/games/SessionRunner.tsx` ou directement dans la page — à décider selon la taille, probablement un composant séparé vu la complexité).

État : `steps: SessionStep[]`, `currentStepIndex`, `results: { word: Word; correct: boolean }[]` (accumulé au fil de la session, pour l'écran de fin — voir §4).

Pour chaque step :
- `kind: "single"` → rend `<Quiz>`, `<Phrase>`, ou `<RepeatCheck>` selon `mode`, avec `words={[step.word]}` et **le nouveau mode "item unique"** décrit en §5.
- `kind: "associe"` → rend `<Associe>` avec `words={step.words}` (un sous-ensemble, pas tous les mots du niveau) — **aucun changement requis à Associe.tsx**, il fonctionne déjà avec n'importe quel sous-ensemble de mots d'un même thème, et son écran de fin actuel (mascotte + son) convient tel quel pour un mini-bloc de ~5 paires.

À la complétion d'un step → `currentStepIndex++`, ajouter aux `results`. Après le dernier step → écran de fin de session (§4).

## 3. Écran d'accueil (avant le premier step)

Avant d'entrer dans le premier jeu, un écran très court : mascotte + "Aujourd'hui : {newCount} nouveaux · {dueCount} à revoir" + bouton "C'est parti !" — sert d'objectif affiché en début de session (repris de la carte héros, mais confirmé avant de se lancer). Peut être fusionné avec la carte héros elle-même si `newCount`/`dueCount` sont déjà visibles là — dans ce cas ce bloc n'a pas besoin d'être un écran séparé, juste vérifier que le clic sur "C'est parti !" lance directement le premier step.

**Cas où rien n'est dû ni nouveau** (l'enfant a tout fait et rien n'est encore dû à la révision — rare mais possible) : la carte héros doit rester cliquable. Proposer alors une petite session de révision libre : reprendre `TARGET_NEW` mots au hasard parmi les mots déjà maîtrisés les moins récemment pratiqués (`lastReviewedAt` le plus ancien), plutôt qu'un bouton désactivé ou un message d'échec.

## 4. Écran de fin de session

Après le dernier step : mascotte "celebration" + son de succès (`playSuccessSound()`, déjà utilisé partout) + résumé calculé à partir de `results` :
- Nombre de mots pratiqués, taux de réussite de la session
- Mettre en avant 1-2 mots qui **progressent** — comparer `progress.mastered` avant/après pour un mot du plan, ou simplement citer un mot qui vient de passer en `mastered: true` pendant cette session ("*whale* progresse !"). Pas besoin de logique compliquée : `SessionRunner` peut comparer l'état `mastered` de `progressMap` avant et après chaque `recordAttempt` et garder la liste des mots qui viennent de basculer.
- Bouton "Terminé" → retour à l'écran de catégorie (`/play/[profileId]`).

## 5. Changement minimal sur Quiz / Phrase / RepeatCheck (le vrai coût de ce plan)

Ces trois composants gèrent aujourd'hui une **liste** de mots (leur propre `index`, leur propre écran "Terminé" avec mascotte + son). Pour les utiliser comme **item unique** dans une session sans ce grand écran de fin à chaque mot (10 fois par session, ce serait fatiguant), ajouter une prop optionnelle à chacun :

```ts
interface QuizProps {
  // ...props existantes inchangées
  onItemComplete?: () => void; // si fourni, remplace le déclenchement de l'écran "finished" habituel
}
```

Dans chacun des trois composants, à l'endroit où `next()` fait `setFinished(true)` sur le dernier mot :

```ts
function next() {
  if (isLast) {
    if (onItemComplete) {
      onItemComplete();
      return;
    }
    setFinished(true);
    return;
  }
  setIndex((i) => i + 1);
}
```

C'est le seul changement dans ces trois fichiers — **rétrocompatible** (prop optionnelle, comportement actuel intact si absente, donc aucun risque de régression sur le jeu normal Mots/Verbes). Pas de refonte, pas d'extraction de sous-composant : `SessionRunner` passe toujours `words={[step.word]}`, le composant affiche sa question normalement, l'enfant répond, le feedback inline s'affiche normalement (ça, on le garde — c'est le retour immédiat qui compte), et au lieu du grand écran de fin, `onItemComplete()` bascule directement au step suivant dans `SessionRunner`.

**Associe.tsx n'a besoin d'aucune modification** (voir §2 — son écran de fin actuel convient tel quel pour un bloc de session).

## 6. En-tête pendant la session

`GameHeader` prend aujourd'hui `themeName`/`themeIcon` d'un seul thème — pas adapté à une session qui mélange les thèmes. Deux options, à trancher à l'implémentation :
- (a) Un en-tête générique pour la session : icône ⭐, titre "Session du jour", `progress` = `${currentStepIndex + 1} / ${steps.length}` (compter un bloc Associe comme **un seul step**, pas 5, pour rester cohérent avec l'annonce "10 mots aujourd'hui" plutôt que de gonfler le compteur)
- (b) Réutiliser `GameHeader` en lui passant `themeName="Session du jour"` / `themeIcon="⭐"` à chaque step (le plus simple, aucun nouveau composant)

Recommandation : (b), le plus simple, sauf si ça semble visuellement pauvre une fois testé.

## 7. Attribution correcte par thème (piège à éviter)

`recordAttempt` prend déjà `themeId` par appel (pas par composant) — donc pour un `kind: "single"`, passer `theme={step.theme}` (le vrai thème d'origine du mot, pas un thème "session" synthétique) au composant de jeu, pour que les stats du dashboard parent (`getThemeStats`, `themeAttemptBreakdown`) restent correctes.

C'est aussi **pourquoi le bloc Associe doit rester mono-thème** (§1.3, point 3) : `Associe.tsx` utilise un seul `theme: Theme` prop pour tous les `recordAttempt` du bloc. Mélanger des mots de plusieurs thèmes dans un même bloc casserait l'attribution. Ne pas essayer de le généraliser pour ce plan — la contrainte "mono-thème par bloc Associe" est volontaire et suffisante.

## 8. Écran de catégorie (`src/app/play/[profileId]/page.tsx`)

Dans la branche `!cat` (écran de catégorie, déjà là depuis PLAN-VERBES.md) :
- Calculer `buildSessionPlan(themes, progressMap)` au chargement (déjà besoin de charger `progressMap` de toute façon — actuellement l'écran de catégorie ne le fait pas encore pour cette page tant que `cat` est absent, à vérifier/ajouter).
- Afficher la carte héros avec `newCount`/`dueCount`.
- Au clic → `router.push(`/play/${profileId}/session`)`.

## 9. Vérification avant de commiter

1. `npx tsc --noEmit` passe
2. Profil sans aucune progression → carte héros affiche des nouveaux mots (pas de crash sur mots/verbes vides)
3. Profil avec un mélange de mots dus / nouveaux / jamais touchés → la session mélange bien mots et verbes, et bien plusieurs thèmes
4. Un step `quiz`/`phrase`/`repete` complété → passe directement au step suivant, **pas** de grand écran "Bien joué" entre chaque mot ; le jeu normal (hors session) affiche toujours son écran de fin comme avant (non-régression, tester une partie de Quiz normale après ce changement)
5. Un bloc Associe dans la session → bien ~5 paires du même thème, écran de fin normal d'Associe s'affiche, puis avance au step suivant
6. Après le dernier step → écran de résumé de session s'affiche, mentionne au moins un mot
7. Vérifier en base que chaque `attempts` créé pendant la session a le bon `theme_id` (celui du mot, pas un thème générique) — requête directe comme dans les vérifications précédentes du projet
8. Dashboard parent après une session → stats par thème toujours correctes (pas de thème "session" fantôme qui apparaît)
9. Cas "rien à réviser" (profil déjà tout fait récemment) → carte héros reste cliquable, propose une session de révision plutôt qu'un bouton désactivé

## Déviations par rapport à ce plan (constatées à l'implémentation)

- **Associe a bien eu besoin d'une modification**, contrairement à ce que disait §2 : son bouton "Terminé" de fin de bloc utilisait le même `onExit` que le bouton "← Retour" du header. En session ce sont deux actions différentes (abandonner vs. avancer au step suivant). Ajout d'un `onItemComplete?` optionnel, identique au pattern des 3 autres jeux — `onExit` reste réservé au "← Retour".
- **`onItemComplete` reçoit `(correct: boolean)`**, pas juste `()`, sur Quiz/Phrase/RepeatCheck — nécessaire pour calculer un vrai taux de réussite dans le résumé de session (une simple comparaison `mastered` avant/après ne suffit pas, un mot peut être répondu correctement sans franchir le seuil de maîtrise).
- **Bug trouvé en testant, corrigé dans `session.ts`** : `buildQuestion`/`buildPhraseQuestion` piochaient leurs distracteurs dans `words` — le même tableau utilisé pour l'itération. En session, `words` ne contient qu'un seul mot (usage "item unique"), donc 0 distracteur, 1 seule option affichée. Ajout d'un `distractorPool?` optionnel sur Quiz/Phrase (fallback sur `words` si absent — aucune régression pour l'usage normal). Au passage, `quiz.ts` avait aussi le bug mort signalé dans IDEAS.md (`allWords.length > 4 ? allWords : allWords`), corrigé du même geste.
- **§6 (en-tête) tranché différemment des deux options proposées** : ni "Session du jour" partout (b) ni un GameHeader dédié dupliquant la logique des 4 composants (a). Chaque jeu garde son propre `GameHeader` avec le **vrai thème** (nécessaire de toute façon pour §7), et `SessionRunner` ajoute une fine barre "⭐ Session du jour · N / total" au-dessus. Zéro changement supplémentaire aux 4 composants de jeu, progression de session toujours visible.
- **Bug trouvé en testant, corrigé dans `session.ts`** : `pickNewWords` triait tout le pool par rang de thème (`getThemeStats`) sans distinguer mots/verbes. Comme les 24 thèmes de mots précèdent les 4 groupes de verbes dans `themes` (`src/content/index.ts`) et qu'un tri JS est stable, tout thème à égalité de progression (fréquent : plein de thèmes à 0%) favorisait systématiquement les mots. Résultat observé en test réel : une session entière sans un seul verbe malgré 47 verbes non touchés disponibles — violait directement l'exigence confirmée de mélange. Corrigé en alternant explicitement mots/verbes lors de la sélection des nouveaux mots (le tri par rang reste utilisé *à l'intérieur* de chaque catégorie).

## Rappels de workflow pour ce projet

- Ne pas supposer qu'un `npm run dev` externe tourne — voir STATUS.md, section piège de workflow.
- Framer Motion : jamais d'`animate` piloté par state ni `AnimatePresence`/`exit` — CSS pur (`style` + `transition-*`). Concerne surtout l'écran de résumé de session s'il a des éléments animés (compteurs, etc.).
- Mettre à jour STATUS.md à la fin de ce travail, comme pour PLAN-VERBES.md.
- Cocher les points 1, 2 et 10 dans IDEAS.md une fois livré.
