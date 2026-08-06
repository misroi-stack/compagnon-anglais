# Compagnon Anglais — Vue d'ensemble fonctionnelle

Document de référence sur **ce que l'application fait**, pour évaluation produit. Rédigé le 2026-08-07 à partir de l'état réel du code (pas du plan initial — voir [PLAN.md](PLAN.md) pour le contexte pédagogique de départ, [STATUS.md](STATUS.md) pour le journal de développement détaillé).

## En une phrase

Application web (PWA) pour deux enfants (6 et 9 ans) apprenant l'anglais, avec suivi de progression individualisé, un espace parent avec statistiques, et un système de comptes/invitations pour un usage multi-famille.

## Public et philosophie

- Deux profils enfants réels (plus un profil de test), gérés par un compte parent.
- Aucun système de points ou de récompense visible par l'enfant — feedback qualitatif uniquement ("Bravo !", mascotte encourageante), les statistiques fines sont réservées à l'espace parent.
- Vocabulaire et structures inspirés des listes **Cambridge English Qualifications for Young Learners** (Starters/Movers), pas une liste inventée.
- Cible tablette Android (Chrome) en priorité, pour la reconnaissance vocale native.
- Sessions courtes voulues (5-10 min), mélange de mots nouveaux et de révision plutôt que blocs séparés.

## Comptes et accès

- **Comptes parents** (email + mot de passe, via Supabase Auth — hachage sécurisé côté serveur, pas de réinvention). Toute l'app est derrière une connexion ; une fois connecté sur un appareil, la session persiste indéfiniment (le navigateur retient les identifiants), donc les enfants ne revoient pas l'écran de connexion au quotidien.
- **Inscription protégée par un code d'invitation** — limite qui peut créer un compte. Le code utilisé est conservé avec le compte pour suivi admin. Un code invalide est rejeté avant même la création du compte (pas de compte "orphelin").
- **Profils enfants rattachés à un parent** — chaque famille ne voit que ses propres enfants et leurs données (isolation appliquée au niveau base de données, pas seulement côté interface).
- **Suppression de profil = désactivation** — un profil "supprimé" par un parent est masqué partout mais ses données restent en base, récupérables via le portail admin. Confirmation en deux temps avant de désactiver.

## Parcours enfant

```
Choix du profil (tap sur son avatar/mascotte)
  → Choix de catégorie : 📚 Les mots  /  🏃 Les verbes
      → Choix de thème (grille illustrée, triée : thèmes les moins avancés en premier)
          → Choix de niveau (1 à 3, déblocage progressif)
              → Choix du mode de jeu (4 par catégorie)
                  → Jeu
```

Points notables :
- Terminer un jeu ramène au hub du même thème/niveau (pas à la grille complète) — encourage à enchaîner les 4 modes sur le même contenu avant de changer de sujet.
- La mascotte réagit pendant le jeu (pose attentive à l'écoute, encourageante sur bonne réponse, célébration à la complétion) et peut être changée à tout moment en cliquant dessus.
- Un son de succès (petit arpège synthétisé, pas de fichier audio) joue à la complétion de chaque jeu noté.
- Chargement robuste partout : indicateur avec secondes écoulées, timeout réseau, message d'erreur avec bouton de rechargement si un chargement échoue vraiment (plutôt qu'un écran figé sans explication).

## Contenu

- **24 thèmes de vocabulaire** (~13 mots chacun, ~300 mots au total) : Animaux, Couleurs, Nombres, Famille, Nourriture, Fruits & légumes, École, Corps humain, Météo, Vêtements, Maison, Transports, Sport, Émotions, Jours de la semaine, Saisons, Formes, Nature, Jouets, Musique, Métiers, Ferme, Océan, Espace.
- **4 groupes de verbes** (52 verbes au total) : Actions du quotidien, Bouger, À l'école, Jouer & créer. Verbes à l'infinitif nu (non conjugués) — la conjugaison est une évolution possible mais pas construite.
- **3 niveaux de difficulté par thème/groupe** (pas par âge de l'enfant) — niveau 1 toujours ouvert, niveau suivant débloqué une fois tous les mots du niveau courant pratiqués au moins une fois. Les niveaux déjà débloqués restent accessibles indéfiniment.
- Chaque mot a : un emoji (illustration placeholder — les vraies images ne sont pas encore intégrées visuellement, seul le champ existe), une traduction, et 1-2 mini-phrases d'exemple en contexte (ex: "I eat breakfast every morning.").
- Les mots identiques entre thèmes (ex: "star" en Formes et en Espace) partagent volontairement le même identifiant pour unifier leur progression plutôt que de la dupliquer.

## Les 5 modes de jeu

| Mode | Catégorie | Ce qu'il teste |
|---|---|---|
| **Flashcards** | Mots + Verbes | Découverte libre, non noté. Carte qui se retourne (français → anglais + prononciation + phrase d'exemple). |
| **Quiz** | Mots + Verbes | Reconnaissance : traduction à choix multiple, alterné avec "écoute et choisis le mot". |
| **Associe** | Mots seulement | Rappel actif : relier chaque image à son mot anglais (deux colonnes visibles). Un mode "Memory" à cartes cachées a été essayé puis abandonné — il testait la mémoire spatiale plutôt que le vocabulaire. |
| **Complète la phrase** | Verbes seulement | Rappel en contexte : une phrase à trou dérivée automatiquement de la phrase d'exemple du verbe, 3 choix de réponse. Remplace Associe pour les verbes (les verbes abstraits ne se prêtent pas au jeu image-mot). |
| **Répète-et-vérifie** | Mots + Verbes | Production orale : reconnaissance vocale native. Le bouton micro sert aussi de bouton "réessayer" (un tap suffit après une erreur). Un mot répété 2-3 fois d'affilée par l'enfant compte comme correct (fréquent quand la reconnaissance n'a rien capté au premier essai). Après 3 essais infructueux sur le même mot, validé automatiquement pour ne pas décourager. |

Chaque thème/niveau a 4 modes (Flashcards + 3 modes notés). Un mot est "maîtrisé" une fois réussi dans les 3 modes notés, sur des essais distincts.

## Système de progression

- **Boîtes de répétition espacée (Leitner, 5 niveaux)** par mot et par profil — une bonne réponse fait avancer la boîte, une erreur la remet à 1.
- **Deux indicateurs de progression par thème** : une barre graduelle (avance dès la première bonne réponse, pour un retour immédiat motivant) et un décompte strict "X/Y maîtrisés". Un mot maîtrisé compte toujours pour 100% de la barre même si sa boîte Leitner n'a pas atteint le maximum.
- Grille de thèmes triée du moins avancé au plus avancé, pour orienter naturellement vers ce qui a besoin de pratique.

## Espace parent (`/parent`)

Dashboard par enfant, calculé à partir des données déjà collectées (aucune table dédiée) :
- Durée de pratique estimée (regroupement des essais en sessions) : aujourd'hui / cette semaine / ce mois, plus un graphique des 14 derniers jours.
- Évolution du taux de réussite sur 8 semaines.
- Essais et taux de réussite par mode de jeu.
- **Mots à travailler** (plus fort taux d'erreur) et **points forts** (mots maîtrisés à 100%).
- Progression et taux de réussite par thème, triés du mieux maîtrisé en premier (inverse de la vue enfant, qui met en avant ce qui reste à faire).
- Suppression (désactivation) de profil.

Les Flashcards (mode découverte, non noté) ne contribuent à aucune de ces statistiques.

## Portail admin (`/admin`)

Route séparée, non reliée dans la navigation normale, protégée par un rôle admin (pas seulement par l'obscurité de l'URL — vérifié à la fois côté application et par les règles de sécurité de la base de données) :
- Gestion des codes d'invitation : liste, création, activation/désactivation.
- Vue d'ensemble des comptes parents : email, code utilisé à l'inscription, nombre de profils enfants, date de dernière connexion.
- Réactivation de profils désactivés, toutes familles confondues.

## Plateforme

- Next.js (App Router) + TypeScript + Tailwind + Framer Motion, React.
- Supabase (Postgres + Auth) pour toutes les données, avec accès verrouillé par famille au niveau base de données (row-level security), pas seulement filtré côté client.
- PWA (installable, service worker pour les ressources de l'app).
- Web Speech API pour la synthèse vocale (tous navigateurs) et la reconnaissance vocale (fiable sur Chrome/Android, pas testée en conditions réelles sur tablette — seul le fallback "micro refusé" a été vérifié en environnement de développement).

## Ce qui n'est pas encore fait

- Déploiement en production (Vercel, CI/CD) — l'app tourne en local pour l'instant.
- Test de la reconnaissance vocale sur un vrai appareil Android.
- Écran de gestion de compte parent (changer son mot de passe, etc.).
- Vraies illustrations (actuellement des emojis).
- Sons d'interface (clic, transition) au-delà du son de succès en fin de jeu.
- Conjugaison des verbes (niveau 3 pourrait évoluer vers "quelle forme du verbe ?" plutôt que "quel verbe ?").
- Verbes abstraits (want, know, like, need) et essentiels irréguliers (be, have, go) — exclus des 4 premiers groupes car peu illustrables/peu adaptés à un début.
