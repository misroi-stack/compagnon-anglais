# Plan — Compagnon Anglais

App pour aider deux enfants (6 ans et 9 ans) à apprendre l'anglais, construite sur des principes pédagogiques établis plutôt que sur une simple liste de features.

## Fondations pédagogiques

- **Répétition espacée (système à boîtes, type Leitner)** : chaque mot vit dans une "boîte" (1 à 5). Réussite → il monte d'une boîte et l'intervalle avant la prochaine révision s'allonge (ex: boîte 1 = revoir le lendemain, boîte 5 = revoir dans 3 semaines). Échec → il redescend en boîte 1. C'est ce qui garantit une mémorisation durable plutôt qu'un apprentissage superficiel.
- **Parcours en 4 étapes par mot** (pas des modes indépendants) :
  1. **Découverte** (Flashcards) — recognition passive, mot + image + traduction + audio
  2. **Reconnaissance** (Quiz) — recognition active, choix parmi plusieurs options
  3. **Rappel** (Memory) — recall actif sans indice de traduction visible
  4. **Production** (Répète-et-vérifie) — l'enfant produit le mot à l'oral
  - Un mot n'est marqué **"maîtrisé"** qu'après réussite dans au moins 3 des 4 étapes, à des sessions différentes (pas un coup de chance ponctuel)
- **Contenu ancré sur un référentiel reconnu** : vocabulaire et structures inspirés des listes **Cambridge English Qualifications for Young Learners** (Starters ≈ 6-8 ans, Movers ≈ 8-10 ans) plutôt qu'une liste de mots inventée — garantit un contenu réellement adapté à l'âge et utile.
- **Mini-phrases, pas que des mots isolés** : chaque thème inclut quelques patrons de phrase répétés ("I like ___", "It is a ___", "She has a ___") pour connecter vocabulaire, pronoms et verbes simples en contexte, sans grammaire explicite.
- **Feedback correctif** : en cas d'erreur, on montre/réentend la bonne réponse avant de continuer — jamais juste "faux, réessaie".
- **Sessions courtes et mixtes** (5-10 min) : mélange de mots nouveaux et de mots à réviser dans une même session (pas bloc séparé), objectif affiché en début de session.
- **Pas de compétition ni de notation visible pour l'enfant** : le score/les stats fines sont capturés en arrière-plan (pour le mode parent), mais l'enfant ne voit que des encouragements qualitatifs, sans système de points/badges.

## Utilisateurs

- Écran de sélection de profil au démarrage (2 profils : nom, âge, mascotte)
- Contenu, niveau de langue et complexité des phrases adaptés à l'âge du profil actif :
  - **6 ans** : mots isolés, recognition surtout (étapes 1-2 prioritaires), phrases très courtes en soutien
  - **9 ans** : mots + mini-phrases, production encouragée plus tôt (étapes 3-4 introduites plus vite)

## Modes de jeu (les 4 étapes du parcours, jouables librement mais suivies individuellement)

1. **Flashcards** — mot + image + traduction + écoute
2. **Quiz** — QCM (image→mot, mot→traduction, écoute→choix), inclut quelques mini-phrases à trous pour le profil 9 ans
3. **Memory** — associer image et mot anglais, sans traduction affichée
4. **Répète-et-vérifie** — l'enfant prononce le mot/la mini-phrase, reconnaissance vocale valide (V1 : API native navigateur)

Chaque mode aura, à terme, **plusieurs variantes de mécanique** (voir "Qualité de jeu" ci-dessous) pour éviter la monotonie — la V1 livre une variante solide par mode, les variantes additionnelles viennent en V2.

## Qualité de jeu & immersion (game feel)

Un exercice bien dessiné reste un exercice — ce qui fait un vrai jeu, c'est la réactivité et la variété. Sans tomber dans la compétition/récompense (déjà exclue), on vise :

- **Animations "juicy"** : transitions fluides, rebonds, un court effet visuel satisfaisant et éphémère à la réussite (feedback expressif immédiat, pas un score qui s'accumule)
- **Mascotte vivante** : animée avec plusieurs états (attentive, encourageante, qui célèbre), pas une image statique — nécessite plusieurs poses/assets par mascotte, pas juste un portrait unique
- **Interactions tactiles réelles** adaptées à la tablette : glisser-déposer, retourner une carte par un geste, plutôt que uniquement des boutons à taper
- **Variantes de mécanique par mode** (V2) : ex. pour le quiz — QCM classique, "fais éclater la bonne bulle", glisser l'image vers le bon mot — tirées aléatoirement pour renouveler l'expérience
- **Scope V1** : une variante par mode, mais avec de vraies animations et une mascotte animée dès le départ (pas de placeholder statique). La richesse des variantes multiples arrive en V2, une fois le cœur pédagogique validé.
- **Technique** : librairie d'animation (ex: Framer Motion) pour obtenir ce niveau de fluidité facilement en React/Next.js

## Contenu pédagogique

- 24 thèmes illustrés (Animaux, Couleurs, Nombres, Famille, Nourriture, Fruits & légumes, École, Corps humain, Météo, Vêtements, Maison/pièces, Transports, Sport, Émotions, Jours de la semaine, Saisons, Formes, Nature, Jouets, Musique/instruments, Métiers, Ferme, Océan, Espace)
- Vocabulaire + verbes de base non conjugués (be, have, go, eat, play, like, see, want...), inspirés des listes Cambridge Starters/Movers
- Pronoms intégrés dans les mini-phrases de chaque thème, jamais en thème isolé
- Suggestion automatique du thème de session = celui avec le plus de mots dus pour révision (boîte Leitner) ou de mots jamais essayés
- Contenu stocké en JSON, versionné dans le repo, facile à enrichir

## Voix

- **V1** : synthèse vocale native du navigateur (écoute) + reconnaissance vocale native (répète-et-vérifie) — gratuit, aucune clé API. Tablette cible = **Android** (Chrome) : support natif fiable, pas de blocage technique attendu (le support est plus incertain sur iPad/Safari, non applicable ici)
- **V2** (plus tard) : conversation guidée avec IA vocale — plus naturelle, mais payante à l'usage, nécessite une clé API

## Son & Immersion

- **Effets sonores courts** à chaque interaction : clic, carte qui se retourne (memory), transition d'écran, petit son positif à la bonne réponse, son doux/neutre (jamais punitif) à une mauvaise réponse
- Pas de musique de fond continue en V1
- Icône son/muet **visible sur chaque écran**, accessible directement par l'enfant ou le parent
- Sourcing : bibliothèque de sons libres de droits, cohérente avec le style coloré/doux de l'app
- Vigilance technique : aucun effet sonore ne doit jouer pendant que le micro écoute (mode répète-et-vérifie), pour ne pas perturber la reconnaissance vocale

## Mascotte

- 4 choix (renard, hibou, dragon, panda), sélectionnable et modifiable par profil
- Évolue visuellement avec la progression (accessoires débloqués) — reste de l'ordre du visuel/plaisir, pas un système de points compétitif
- Images fournies par toi (générées séparément) — prévoir plusieurs poses par mascotte (neutre, attentive, encourageante, qui célèbre) pour permettre l'animation, pas une seule image fixe — voir "Contenu visuel" ci-dessous pour l'emplacement

## Contenu visuel & stratégie graphique

- **Contenu et présentation séparés** : chaque mot référence un identifiant d'image ; un "pack visuel" fait le lien vers les assets réels. Permet d'ajouter plus tard d'autres styles (par âge ou préférence d'enfant) sans toucher au contenu pédagogique (JSON).
- **V1 : un seul pack, très coloré et invitant**, cohérent sur toute l'app (vocabulaire + UI)
- **Images de vocabulaire (150-300)** : bibliothèque libre de droits, style flat/rond coloré adapté aux enfants — rapide et gratuit
- **Mascottes (4)** : générées par toi, à déposer dans le projet une fois le code démarré (ex: `public/images/mascots/renard.png`, etc. — format PNG/SVG fond transparent, on précisera les dimensions exactes au moment de coder l'écran de sélection)
- **Roadmap** : V2/V3 pourra proposer d'autres packs visuels sélectionnables (ex: univers "espace" vs univers "doux") sans changement du contenu pédagogique

## Suivi & Mode Parent

- Chaque tentative est capturée : enfant, mot, thème, étape du parcours, correct/incorrect, temps de réponse, date/heure
- Agrégé automatiquement : mots faciles/difficiles, progression par thème dans le temps, mots maîtrisés vs en cours, historique de sessions
- **Mode parent** accessible depuis l'écran titre, protégé par un code simple : dashboard par enfant avec graphique de progression et liste des mots à retravailler
- **Stockage : Supabase** (Postgres gratuit) — données jamais perdues, accessibles depuis plusieurs appareils

## Accès & déploiement

- **PWA** : icône sur l'écran d'accueil de la tablette, expérience plein écran
- Design pensé tactile dès le départ (gros boutons, zones larges)
- Hébergement web, probablement **Vercel** (gratuit, s'intègre bien avec Next.js + GitHub)

### Workflow dev vs prod

- **Développement** : `npm run dev` en local sur le PC — tout est testable sur `localhost`, y compris le micro et la PWA (contexte sécurisé même sans HTTPS en local). Aucun déploiement déclenché par ce travail courant.
- **Test sur tablette avant publication** : possible de prévisualiser l'app sur la tablette via le réseau WiFi local pendant que le serveur local tourne sur le PC, sans encore publier.
- **CI (GitHub Actions)** : à chaque push sur `main`, vérification automatique (build, types TypeScript, linter) — visible dans l'onglet Actions de GitHub, attrape les erreurs tôt sans rien publier
- **CD (déploiement) via branche `production`** : le déploiement n'est jamais automatique sur `main`. Quand une version est stable, une Pull Request `main` → `production` permet de relire le diff avant de merger ; le merge déclenche alors le déploiement automatique vers Vercel. Reste une action 100% délibérée, mais facilitée depuis l'interface GitHub (pas de commande CLI nécessaire).
- **Deux environnements Supabase séparés** : un projet "dev" pour les tests (données factices, jetables), un projet "prod" utilisé uniquement par la version déployée — évite de mélanger données de test et vraies stats des enfants. Chaque environnement a ses propres clés API, stockées dans des fichiers `.env` non versionnés dans git.

## Stack technique

- **Next.js + TypeScript + Tailwind CSS**
- **Framer Motion** pour les animations "juicy" (voir "Qualité de jeu")
- **next-pwa** (ou équivalent) pour l'installation sur écran d'accueil et le mode plein écran sur tablette
- **Supabase** pour les données de progression/stats
- **Web Speech API** (synthèse + reconnaissance) pour la voix en V1
- Contenu pédagogique en JSON versionné dans le repo

## Coûts

Tout le projet est gratuit tel que planifié pour la V1 :

- **Gratuit sans nuance** : GitHub, Next.js/React/Tailwind/Framer Motion (open source), Vercel (plan Hobby), synthèse et reconnaissance vocale (natives, tablette Android/Chrome), bibliothèques d'images/sons libres de droits
- **Gratuit avec une nuance** : Supabase — le projet gratuit se met en pause après ~7 jours d'inactivité (se relance en un clic depuis le dashboard, aucune donnée perdue)
- **Payant, seulement en V2 et optionnel** : conversation IA vocale (coût à l'usage d'une API) — décision à reprendre le moment venu, pas engagée maintenant

## Comptes & prérequis à créer (par toi)

Je ne peux pas créer de comptes à ta place — voici tout ce qu'il faudra ouvrir (gratuit dans tous les cas), au moment où on en aura besoin :

- [x] **GitHub** — fait, repo `compagnon-anglais` connecté
- [ ] **Supabase** — 2 projets (dev + prod), pour le stockage des stats
- [ ] **Vercel** — pour l'hébergement, connecté au repo GitHub pour le déploiement via la branche `production`
- [ ] **Clé API voix avancée** (V2 uniquement, plus tard) — à déterminer selon le service choisi pour la conversation IA

## Roadmap

- **V1 (MVP)** : 2 profils, parcours en 4 étapes avec répétition espacée (Leitner), 3-4 thèmes de contenu pour valider l'approche, voix V1 (native), une variante animée et sonore par mode, mascotte animée (plusieurs poses), mode parent basique, PWA, déployé sur Vercel
- **V2** : les 24 thèmes complets, variantes de mécanique multiples par mode, conversation IA vocale, mode parent enrichi (comparaison entre profils, export de données)
