// Rebuild do pack LevelDB de itens a partir dos JSONs de template
import { ClassicLevel } from "classic-level";
import { readFileSync, rmSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const __dir  = dirname(fileURLToPath(import.meta.url));
const PACK_PATH = resolve(__dir, "packs/items");

// Gera um ID de 16 chars como Foundry usa
function makeId() {
  return randomBytes(9).toString("base64url").slice(0, 16);
}

// Carrega e merge os JSONs de itens
const sources = [
  "templates/itens/armas.json",
  "templates/itens/equipamentos.json",
  "templates/itens/upgrades.json"
];

const allItems = [];
for (const src of sources) {
  const path = resolve(__dir, src);
  const data = JSON.parse(readFileSync(path, "utf8"));
  allItems.push(...data);
}

console.log(`📦 Total de itens: ${allItems.length}`);

// Limpa e recria o diretório do pack
if (existsSync(PACK_PATH)) {
  rmSync(PACK_PATH, { recursive: true, force: true });
}
mkdirSync(PACK_PATH, { recursive: true });

// Abre o LevelDB e grava os itens
const db = new ClassicLevel(PACK_PATH, { keyEncoding: "utf8", valueEncoding: "utf8" });
await db.open();

for (const item of allItems) {
  const id  = item._id ?? makeId();
  const doc = { ...item, _id: id };
  const key = `!items!${id}`;
  await db.put(key, JSON.stringify(doc));
  console.log(`  ✓ ${item.name}`);
}

await db.close();
console.log(`\n✅ Pack reconstruído em packs/items (${allItems.length} itens)`);
