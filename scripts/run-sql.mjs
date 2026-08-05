// Exécute un fichier .sql contre la base pointée par la variable d'env DATABASE_URL.
// Usage: DATABASE_URL="postgresql://..." node scripts/run-sql.mjs supabase/schema.sql
import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync(process.argv[2], "utf8");
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query(sql);
  console.log("Schema applied successfully.");
} finally {
  await client.end();
}
