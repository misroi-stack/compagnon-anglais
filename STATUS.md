# État d'avancement — Compagnon Anglais

Dernière mise à jour : 2026-08-04

## Fait

- [PLAN.md](PLAN.md) finalisé (pédagogie, modes de jeu, contenu, voix, son, visuel, stats/parent, workflow technique, coûts)
- Node.js installé sur la machine
- Scaffold Next.js 16 + TypeScript + Tailwind + Framer Motion, en place dans ce dossier
- PWA de base : `src/app/manifest.ts` + `public/sw.js` (service worker minimal, cache basique)
- Modèle de données : `src/types/` (content, profile, progress) + `src/content/themes/` (3 thèmes d'exemple : animaux, couleurs, nombres)
- Répétition espacée (boîtes Leitner) implémentée : `src/lib/leitner.ts`
- **Écran de sélection de profil fonctionnel** (`src/app/page.tsx`) : création de profil (nom, âge 6/9, mascotte parmi 4 emojis placeholder), sélection — testé dans le navigateur, ça marche
- Profils stockés en `localStorage` pour l'instant (`src/lib/profiles.ts`) — **temporaire**, à remplacer par Supabase
- Tout est commité et poussé sur `main` (https://github.com/misroi-stack/compagnon-anglais)

## Décisions clés à retenir

- Tablette cible : **Android** (Chrome) → reconnaissance vocale native fiable, pas de souci iPad/Safari
- Mascottes = emojis placeholder pour l'instant (🦊🦉🐉🐼) ; les vraies images seront fournies par l'utilisateur (voir PLAN.md section "Contenu visuel")
- Pas de système de récompense/points — feedback qualitatif seulement
- Tout gratuit pour la V1 (voir PLAN.md section "Coûts"), sauf la conversation IA vocale (V2, optionnelle, payante)

## Prochaines étapes (dans l'ordre)

1. Construire les 4 écrans de jeu : Flashcards, Quiz, Memory, Répète-et-vérifie
2. **Action utilisateur requise** : créer 2 comptes Supabase (dev + prod) — voir PLAN.md
3. **Action utilisateur requise** : créer un compte Vercel — voir PLAN.md
4. Brancher Supabase (remplacer le localStorage temporaire)
5. Mettre en place le pipeline CI/CD GitHub Actions (branche `production`)
6. Premier déploiement de test sur la tablette Android

## Pour relancer le développement local

```bash
cd C:\Users\pears\Claude\compagnon-anglais
npm run dev
```

Node.js est installé dans `C:\Program Files\nodejs` — s'il n'est pas reconnu dans un nouveau terminal, ajouter ce dossier au PATH ou relancer le terminal.
