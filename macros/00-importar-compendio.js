// ============================================================
// MACRO 00 — Importar Itens E Macros para o Foundry
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================
// Cole em: Foundry → Macros → Create Macro (tipo Script)
// Execute UMA VEZ para popular itens e macros da campanha.
// ============================================================

const MODULE_ID = "debaixo-da-pele";
const BASE_URL  = `modules/${MODULE_ID}`;

const PACK_ITENS_LABEL  = "DDP — Itens e Equipamentos";
const PACK_MACROS_LABEL = "DDP — Macros da Campanha";

// Lista de macros da campanha
const MACROS = [
  { arquivo: "01-san-check.js",          nome: "01 — Teste de Sanidade",          img: "icons/svg/d20-black.svg" },
  { arquivo: "02-aurora-exposure.js",    nome: "02 — Tracker de Exposição Aurora", img: "icons/svg/radiation.svg" },
  { arquivo: "03-override-timer.js",     nome: "03 — Timer do Override",           img: "icons/svg/clockwork.svg" },
  { arquivo: "04-inventory-slots.js",    nome: "04 — Inventário por Slots",        img: "icons/svg/chest.svg" },
  { arquivo: "05-generator-fuel.js",     nome: "05 — Gerador: Combustível",        img: "icons/svg/oil-drum.svg" },
  { arquivo: "06-reveal-document.js",    nome: "06 — Revelar Documentos",          img: "icons/svg/book.svg" },
  { arquivo: "07-kit-pa-basico.js",      nome: "07 — Usar: Kit PA Básico",         img: "icons/svg/heal.svg" },
  { arquivo: "08-kit-pa-avancado.js",    nome: "08 — Usar: Kit PA Avançado",       img: "icons/svg/heal.svg" },
  { arquivo: "09-bandagem-hemostatica.js",nome:"09 — Usar: Bandagem Hemostática",  img: "icons/svg/heal.svg" },
  { arquivo: "10-codeina.js",            nome: "10 — Usar: Codeína",               img: "icons/svg/pill.svg" },
  { arquivo: "11-morfina-item.js",       nome: "11 — Usar: Morfina",               img: "icons/svg/pill.svg" },
  { arquivo: "12-adrenalina.js",         nome: "12 — Usar: Adrenalina",            img: "icons/svg/lightning.svg" },
  { arquivo: "13-mascara-toggle.js",     nome: "13 — Máscara: Equipar/Remover",    img: "icons/svg/shield.svg" }
];

// ─────────────────────────────────────────────────────────────
async function getOuCriarPack(label, type) {
  let pack = game.packs.find(p => p.metadata.label === label);
  if (!pack) {
    pack = await CompendiumCollection.createCompendium({ label, type, package: "world" });
  }
  return pack;
}

async function importarItens(pack, caminho, label) {
  let dados;
  try {
    dados = await fetch(`${BASE_URL}/${caminho}`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  } catch (e) {
    ui.notifications.error(`❌ Falha ao carregar ${label}: ${e.message}`);
    return 0;
  }
  let n = 0;
  for (const d of dados) {
    if (pack.index.find(e => e.name === d.name)) continue;
    try { await pack.documentClass.create(d, { pack: pack.collection }); n++; }
    catch (e) { console.warn(`[DDP] Falha "${d.name}":`, e); }
  }
  return n;
}

async function importarMacros(pack) {
  await pack.getIndex();
  let n = 0;
  for (const m of MACROS) {
    if (pack.index.find(e => e.name === m.nome)) continue;
    let code;
    try {
      code = await fetch(`${BASE_URL}/macros/${m.arquivo}`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      });
    } catch (e) {
      console.warn(`[DDP] Falha ao carregar macro "${m.nome}":`, e);
      continue;
    }
    try {
      await Macro.create(
        { name: m.nome, type: "script", command: code, img: m.img,
          flags: { [MODULE_ID]: { campanhaItem: true } } },
        { pack: pack.collection }
      );
      n++;
    } catch (e) { console.warn(`[DDP] Falha ao criar macro "${m.nome}":`, e); }
  }
  return n;
}

// ─────────────────────────────────────────────────────────────
(async () => {
  if (!game.user.isGM) { ui.notifications.warn("Apenas o GM pode importar."); return; }

  const confirmado = await Dialog.confirm({
    title: "📦 Setup Inicial — Debaixo da Pele",
    content: `
      <p>Este assistente vai importar automaticamente:</p>
      <ul>
        <li>⚔️ <b>Armas</b> (10 itens)</li>
        <li>🎒 <b>Equipamentos</b> (~60 itens)</li>
        <li>📜 <b>Macros da campanha</b> (13 macros)</li>
      </ul>
      <p style="color:#aaa;font-size:0.85em">Itens/macros com o mesmo nome serão ignorados (sem duplicatas).</p>
    `
  });
  if (!confirmado) return;

  ui.notifications.info("⏳ Importando... aguarde.");

  const packItens  = await getOuCriarPack(PACK_ITENS_LABEL,  "Item");
  const packMacros = await getOuCriarPack(PACK_MACROS_LABEL, "Macro");

  await packItens.getIndex();

  const armas   = await importarItens(packItens, "templates/itens/armas.json",       "Armas");
  const equip   = await importarItens(packItens, "templates/itens/equipamentos.json","Equipamentos");
  const macros  = await importarMacros(packMacros);

  const totalItens = armas + equip;

  new Dialog({
    title: "✅ Setup Concluído — Debaixo da Pele",
    content: `
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
        <tr style="border-bottom:1px solid #555">
          <th style="text-align:left;padding:4px">Categoria</th>
          <th style="text-align:right;padding:4px">Importados</th>
        </tr>
        <tr><td style="padding:4px">⚔️ Armas</td>          <td style="text-align:right;padding:4px">${armas}</td></tr>
        <tr><td style="padding:4px">🎒 Equipamentos</td>   <td style="text-align:right;padding:4px">${equip}</td></tr>
        <tr><td style="padding:4px">📜 Macros</td>         <td style="text-align:right;padding:4px">${macros}</td></tr>
        <tr style="border-top:1px solid #555;font-weight:bold">
          <td style="padding:4px">Total</td>
          <td style="text-align:right;padding:4px">${totalItens + macros}</td>
        </tr>
      </table>
      <p style="color:#aaa;font-size:0.85em">
        ${totalItens + macros === 0 ? "Tudo já estava importado (sem duplicatas)." : "Tudo pronto! Abra os compêndios para conferir."}
      </p>
    `,
    buttons: {
      itens:  { label: "📦 Ver Itens",  callback: () => packItens.render(true) },
      macros: { label: "📜 Ver Macros", callback: () => packMacros.render(true) },
      fechar: { label: "Fechar" }
    },
    default: "itens"
  }).render(true);
})();
