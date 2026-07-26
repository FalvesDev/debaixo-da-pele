// Rebuild dos packs LevelDB da mini-campanha PROTOCOLO ÂMBAR (E CORP)
// Uso: node gerar-ecorp.mjs && node rebuild-ecorp-packs.mjs
import { ClassicLevel } from "classic-level";
import { readFileSync, rmSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const __dir = dirname(fileURLToPath(import.meta.url));
const makeId = () => randomBytes(9).toString("base64url").slice(0, 16);

const PACKS = [
  { src: "templates/atores/ecorp-operadores.json",  path: "packs/ecorp-actors",  prefix: "!actors!"  },
  { src: "templates/itens/ecorp-equipamento.json",  path: "packs/ecorp-items",   prefix: "!items!"   },
  { src: "templates/jornais/ecorp-dossies.json",    path: "packs/ecorp-journals", prefix: "!journal!" }
];

for (const { src, path, prefix } of PACKS) {
  const docs = JSON.parse(readFileSync(resolve(__dir, src), "utf8"));
  const packPath = resolve(__dir, path);

  if (existsSync(packPath)) rmSync(packPath, { recursive: true, force: true });
  mkdirSync(packPath, { recursive: true });

  const db = new ClassicLevel(packPath, { keyEncoding: "utf8", valueEncoding: "utf8" });
  await db.open();

  for (const raw of docs) {
    const _id = raw._id ?? makeId();
    const doc = { ...raw, _id };

    // Documentos embutidos ficam INLINE no documento pai — mesmo formato dos
    // packs originais deste módulo (o CoC7 lê os items/pages pelo array).
    // Cada embutido só precisa de _id próprio.
    if (Array.isArray(doc.items)) {
      doc.items = doc.items.map((i, sort) => ({ ...i, _id: i._id ?? makeId(), sort: sort * 100000 }));
    }
    if (Array.isArray(doc.pages)) {
      doc.pages = doc.pages.map((p, sort) => ({ ...p, _id: p._id ?? makeId(), sort: sort * 100000 }));
    }

    await db.put(`${prefix}${_id}`, JSON.stringify(doc));
    console.log(`  ✓ ${doc.name} (${(doc.items || doc.pages || []).length} embutidos)`);
  }

  await db.close();
  console.log(`📦 ${path} — ${docs.length} documento(s)\n`);
}

console.log("✅ Packs E CORP reconstruídos.");
