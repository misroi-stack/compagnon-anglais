# Pistes d'amélioration — pédagogie & plaisir de jeu

Revue faite le 2026-08-07 à partir du code réel et de [FEATURES.md](FEATURES.md). Rien n'est implémenté ici — c'est une liste de travail à prioriser et cocher.

Ordonné par **rapport impact / effort**, pas par ordre d'idée.

---

## 🔴 Le constat principal : la répétition espacée ne pilote rien

`src/lib/leitner.ts` implémente les boîtes 1-5, `nextReviewAt` et `isDueForReview()`. Mais en suivant le chemin réel du code :

- `isDueForReview()` est utilisé **uniquement** dans `src/lib/theme-suggestion.ts`, pour trier la grille de thèmes
- Le jeu appelle `wordsForLevel(theme, level)` → **tous** les mots du niveau, **toujours**, dans l'ordre du JSON

Conséquences concrètes :
- Un mot échoué 6 fois et un mot réussi du premier coup réapparaissent à la même fréquence
- Un mot n'est revu que si l'enfant retourne **délibérément** dans le bon thème et le bon niveau
- Un mot « maîtrisé » en une après-midi ne revient plus jamais — précisément au moment où l'oubli commence

[PLAN.md](PLAN.md) promettait : *« Sessions courtes et mixtes : mélange de mots nouveaux et de mots à réviser dans une même session (pas bloc séparé), objectif affiché en début de session. »* C'est la seule promesse pédagogique du plan d'origine qui n'a pas été tenue, et c'est la plus importante.

---

## Priorité 1 — La boucle de jeu (une seule refonte cohérente)

Ces trois points se greffent l'un sur l'autre et devraient être pensés ensemble.

- [x] **1. Mode « Session du jour »** — nouvelle entrée sur l'écran de catégorie, à côté de Mots/Verbes. Compose ~10 min à partir de **toute** la base (toutes catégories, tous thèmes) : les mots dus pour révision selon `isDueForReview()` + quelques nouveaux. Toute l'infrastructure existe déjà (boîtes, dates, historique par mot) — il ne manque que le sélecteur de mots. *Livré le 2026-08-07, voir [PLAN-SESSION.md](PLAN-SESSION.md).*

- [x] **2. Alterner les modes dans une session (interleaving)** — aujourd'hui c'est de la pratique en bloc : 5 Quiz d'affilée → retour au hub → 5 Associe → retour au hub. L'interleaving est l'un des résultats les plus solides en sciences de l'apprentissage : plus dur sur le moment, bien meilleure rétention. Bonus : plus varié donc plus amusant, et ça supprime les allers-retours de navigation pour des sessions de 90 secondes. *Livré le 2026-08-07 avec le point 1 — même refonte.*

- [x] **10. Donner une forme à la session** — écran d'ouverture (« Aujourd'hui : 4 nouveaux mots + 6 à revoir ») et de clôture (« Tu as revu 10 mots, *whale* progresse ! »). Sans début ni fin, une session ne procure aucun sentiment d'accomplissement. L'objectif affiché en début de session était déjà au plan. *Livré le 2026-08-07 — carte héros + écran de résumé.*

---

## Priorité 2 — Plaisir immédiat (surtout pour le plus jeune)

- [x] **8. Mode « Fais l'action » pour les verbes de mouvement** — le groupe *Bouger* existe déjà (`verbes-bouger.json` : run, jump, swim, dance, climb…). L'app dit « Jump! », l'enfant saute, la mascotte valide. C'est du **Total Physical Response**, méthode reconnue et particulièrement efficace chez les jeunes enfants. Contenu déjà en place, il ne manque que l'écran. Probablement le mode le plus amusant possible à 6 ans. *Livré le 2026-08-07 — auto-validé, sans tentative enregistrée (comme Flashcards).*

- [x] **7. Exploiter le mot « Compagnon » du titre** — la mascotte a 4 poses mais reste décorative : elle réagit, elle ne *participe* pas. Trois pistes cumulables :
  - l'enfant la **nomme** à la création du profil (appropriation) — *non fait, reporté.*
  - c'est **elle** qui pose la question plutôt que l'UI : « J'ai faim ! Lequel je mange ? » — le jeu de rôle porte beaucoup mieux à cet âge qu'une consigne abstraite. *Livré le 2026-08-07 — bulle de dialogue additive dans Quiz/Phrase/Répète/Associe, `src/components/games/MascotBubble.tsx`.*
  - elle **se souvient** : « Ça, tu l'avais raté la dernière fois. Tu l'as eu ! » — le retour qualitatif le plus puissant possible, et zéro extrinsèque (compatible avec la règle « pas de points »). *Livré le 2026-08-07 — dérivé de `WordProgress` existant (boîte Leitner), aucune migration.*

- [ ] **9. Mode à deux, pour les deux enfants** — l'app les traite comme deux utilisateurs isolés alors qu'ils vivent sous le même toit. Un mode « à tour de rôle » sur la même tablette, **coopératif et non compétitif** (objectif commun, on s'aide), découle directement de la situation réelle et respecte le principe de non-compétition.

- [ ] **11. Cérémonie de fin de thème** — finir le niveau 3 d'un thème ne produit rien de spécial. 13 mots complets méritent mieux qu'un badge ✓ : un petit écran dédié avec la mascotte et la liste de ce qui a été appris.

---

## Priorité 3 — Accessibilité pour un lecteur débutant (6 ans)

- [ ] **Tout texte audible d'un tap** — point probablement sous-estimé : la face avant des Flashcards affiche le mot **écrit en français**, les options du Quiz sont du **texte**. À 6 ans la lecture du français est encore en cours d'acquisition : l'app exige donc de savoir lire le français pour apprendre l'anglais. Aujourd'hui `speak()` (`src/lib/speech.ts`) n'est appelé que sur l'anglais. Rendre chaque option de Quiz et chaque face de carte tapable-pour-entendre (voix FR incluse) rendrait l'app autonome pour un pré-lecteur, sans rien changer pour l'aîné.

---

## Priorité 4 — Profondeur pédagogique

- [x] **3. Réessai correctif immédiat** — en Quiz/Associe/Phrase, une erreur affiche « C'était X » puis on passe ; le mot n'est jamais reproduit dans la foulée. Reproduire *tout de suite* après avoir vu la réponse est bien plus efficace que la simple exposition. `RepeatCheck` le fait déjà (bouton réessayer) — les trois autres devraient aussi. *Livré le 2026-08-07 pour Quiz et Phrase (bouton "🔁 Réessaie", une seule relance puis on passe, que la 2ᵉ tentative soit bonne ou non — chaque tentative reste un vrai `Attempt` enregistré). Associe n'a rien demandé : une paire fausse s'annule déjà toute seule après 600ms et se re-propose immédiatement, c'était déjà cette mécanique par construction.*

- [ ] **4. Monter au niveau de la phrase** — ~700 phrases d'exemple en base, utilisées seulement en affichage (Flashcards) et en texte à trou (Phrase). Rien ne teste la **compréhension orale d'une phrase** ni la **lecture à voix haute d'une phrase**. Marche suivante évidente pour un 9 ans, contenu déjà là.

- [ ] **5. Une modalité écrite** — rien ne fait produire l'orthographe. L'anglais écrit est un vrai obstacle pour un francophone (*through, enough, colour*). Lettres mélangées à remettre en ordre pour le petit, saisie libre pour l'aîné : comblerait le seul trou dans les quatre modalités (écouter / parler / lire / **écrire**).

- [ ] **6. Distracteurs plus intelligents** — le dashboard parent *sait* quels mots l'enfant confond ; le Quiz l'ignore et tire ses distracteurs au hasard dans le même thème/niveau. Proposer *tree* comme distracteur de *three* **quand l'enfant a déjà confondu les deux** transforme un QCM générique en travail ciblé.
  - ✅ Corrigé le 2026-08-07 (en construisant la Session du jour) : `src/lib/quiz.ts` avait `const pool = allWords.length > 4 ? allWords : allWords;` — les deux branches identiques, une intention perdue. Remplacé par un vrai `distractorPool` optionnel. Le ciblage "mots confondus" ci-dessus reste à faire.

---

## Priorité 5 — Honnêteté des données (pour que le dashboard parent reste fiable)

- [ ] **12. Distinguer les validations automatiques** — dans `RepeatCheck.tsx`, après `MAX_ATTEMPTS_BEFORE_AUTO_SUCCESS` (3) échecs, le mot est enregistré `correct: true`, indistinguable d'une vraie réussite. C'était le bon choix côté enfant (ne pas décourager) mais un mot que l'enfant **n'arrive pas à prononcer** peut donc apparaître en « point fort » chez le parent. Garder le retour positif côté enfant, ajouter un flag (`auto_validated`) et le distinguer côté parent — c'est exactement l'information dont un parent a besoin.

- [ ] **13. « Maîtrisé » n'exige aucune durabilité** — 3 modes réussis = maîtrisé, même si les trois ont eu lieu dans la même demi-heure. Or la maîtrise c'est ce qui *survit au délai*. Exiger 3 modes **et** avoir survécu à au moins une révision espacée réconcilierait aussi les deux systèmes parallèles actuels (boîte Leitner vs flag `mastered`) — dont la déconnexion est exactement ce qui a causé le bug de barre de progression corrigé le 2026-08-06.

- [ ] **Retraite des mots vraiment acquis** — aucun mécanisme ne fait *disparaître* un mot solidement maîtrisé de la rotation. Le faire réapparaître rarement libérerait du temps de session pour les mots faibles.

---

## Priorité 6 — Contenu

- [ ] **14. Trois manques à fort rendement** :
  - **Adjectifs** (big/small, hot/cold, happy/sad) — omniprésents dans le langage réel, complètement absents
  - **Pluriels** (cat/cats, box/boxes) — vraie difficulté, jamais abordée
  - **Phrases de conversation** (« What's your name? », « How are you? », « I'm 6 years old ») — c'est ce qui donne le sentiment de *parler* anglais plutôt que de nommer des objets

- [ ] **Verbes exclus de la v1, à reprendre** — abstraits (want, know, like, need) et essentiels irréguliers (be, have, go). Volontairement écartés des 4 premiers groupes (peu illustrables), mais parmi les plus fréquents de la langue. Voir [PLAN-VERBES.md](PLAN-VERBES.md).

- [ ] **Conjugaison** — les verbes sont à l'infinitif nu. L'évolution prévue : au niveau 3, le jeu Phrase demande *quelle forme* du verbe (« Yesterday I ___ » → ate) plutôt que *quel* verbe. Le `-s` de la 3ᵉ personne et les irréguliers au passé sont les deux vraies difficultés pour un francophone.

---

## Priorité 7 — Technique

- [ ] **15. Zéro capacité hors-ligne** — `public/sw.js` ne cache (à raison) que le même origine, donc sans réseau les appels Supabase échouent et l'app affiche une erreur. Sur une tablette — en voiture, en vacances, chez les grands-parents — c'est précisément le moment où elle serait la plus utile. Le vrai correctif : file d'attente locale des tentatives + synchronisation au retour du réseau.

---

## Si on n'en fait qu'une

**La priorité 1** (Session du jour + interleaving + forme de session). C'est la seule promesse non tenue du plan d'origine, elle transforme l'app d'un catalogue d'exercices en un système qui **s'adapte réellement à l'enfant**, et ~90% du travail est déjà en base. Les trois points n'en forment en réalité qu'un seul : une refonte cohérente de la boucle de jeu.

Ensuite, pour le plaisir immédiat du plus jeune : **8** (Fais l'action) et **7** (le compagnon qui parle et se souvient).
