// Ajuste pontual do pack de macros: remove duplicatas e garante o macro 14.
// Uso: node rebuild-macros-pack.mjs
import { ClassicLevel } from "classic-level";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";

const __dir = dirname(fileURLToPath(import.meta.url));
const makeId = () => randomBytes(9).toString("base64url").slice(0, 16);
const PACK = resolve(__dir, "packs/macros");

const db = new ClassicLevel(PACK, { keyEncoding: "utf8", valueEncoding: "utf8" });
await db.open();

const command = readFileSync(resolve(__dir, "macros/14-criar-operador.js"), "utf8");

// 1. Lê tudo, remove duplicatas por nome e o macro 14 antigo (será regravado)
const vistos = new Set();
const remover = [];
for await (const [k, v] of db.iterator()) {
  const doc = JSON.parse(v);
  if (doc.name?.startsWith("14 —")) { remover.push(k); continue; }
  if (vistos.has(doc.name)) { remover.push(k); continue; }
  vistos.add(doc.name);
}
for (const k of remover) { await db.del(k); console.log(`  ✗ removida entrada obsoleta: ${k}`); }

// 2. (Re)grava o macro 14 com o conteúdo atual do arquivo
const _id = makeId();
const doc = {
  _id,
  name: "14 — Criar Operador E CORP",
  type: "script",
  author: "",
  img: "icons/svg/mystery-man.svg",
  scope: "global",
  command,
  folder: null,
  sort: 1400000,
  ownership: { default: 0 },
  flags: { "debaixo-da-pele": { campanhaItem: true } },
  _stats: { systemId: "CoC7", coreVersion: "12.331" }
};
await db.put(`!macros!${_id}`, JSON.stringify(doc));
console.log(`  ✓ gravado: ${doc.name}`);

await db.close();
console.log("✅ Pack de macros ajustado.");
