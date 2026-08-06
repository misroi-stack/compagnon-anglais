// Valide le contenu (src/content/themes/*.json) : niveaux, phrases, ids de
// verbes, collisions d'id, et — pour les verbes — que chaque verbe apparaît
// bien à l'infinitif (mot entier) dans chacune de ses propres phrases,
// condition nécessaire pour que le jeu "Complète la phrase" fonctionne.
// Usage: node scripts/verify-content.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const THEMES_DIR = join(import.meta.dirname, "..", "src", "content", "themes");
const files = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".json"));

let errors = 0;
function fail(msg) {
  console.error(`✗ ${msg}`);
  errors++;
}

const idToTheme = new Map();

for (const file of files) {
  const theme = JSON.parse(readFileSync(join(THEMES_DIR, file), "utf8"));
  const kind = theme.kind ?? "mots";

  for (const word of theme.words) {
    if (![1, 2, 3].includes(word.level)) {
      fail(`${file}: "${word.id}" a un level invalide (${word.level})`);
    }
    if (!word.phrases || word.phrases.length === 0) {
      fail(`${file}: "${word.id}" n'a aucune phrase`);
    }

    if (kind === "verbes" && !word.id.startsWith("v-")) {
      fail(`${file}: "${word.id}" est un verbe mais son id ne commence pas par "v-"`);
    }

    const existing = idToTheme.get(word.id);
    if (existing && existing !== theme.id) {
      // Collision volontaire acceptée seulement entre thèmes "mots" (mêmes mots
      // partagés pour unifier la progression). Jamais pour les verbes.
      const existingKind = idToTheme.get(`${word.id}::kind`);
      if (kind === "verbes" || existingKind === "verbes") {
        fail(`${file}: collision d'id "${word.id}" avec le thème "${existing}" (impliquant un verbe)`);
      }
    }
    idToTheme.set(word.id, theme.id);
    idToTheme.set(`${word.id}::kind`, kind);

    if (kind === "verbes" && word.phrases) {
      const pattern = new RegExp(`\\b${escapeRegex(word.en)}\\b`, "i");
      for (const phrase of word.phrases) {
        if (!pattern.test(phrase.en)) {
          fail(`${file}: "${word.id}" (${word.en}) n'apparaît pas dans sa phrase "${phrase.en}"`);
        }
      }
    }
  }
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

if (errors > 0) {
  console.error(`\n${errors} erreur(s) trouvée(s).`);
  process.exit(1);
} else {
  console.log(`✓ Contenu valide (${files.length} thèmes vérifiés).`);
}
