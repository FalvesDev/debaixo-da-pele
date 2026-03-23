// ============================================================
// MACRO 00 — Importar Todos os Itens para o Compêndio
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================
// Cole este código em: Foundry → Macros → Create Macro (tipo Script)
// Execute UMA VEZ para popular o compêndio de itens.
// ============================================================

const MODULE_ID  = "debaixo-da-pele";
const PACK_LABEL = "Debaixo da Pele — Itens";  // nome do compêndio (cria se não existir)
const BASE_URL   = `modules/${MODULE_ID}`;

// ── 1. Garante que o compêndio existe ────────────────────────
async function getOuCriarPack() {
  let pack = game.packs.find(p => p.metadata.label === PACK_LABEL);
  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      label:   PACK_LABEL,
      type:    "Item",
      package: "world"
    });
    ui.notifications.info(`📦 Compêndio "${PACK_LABEL}" criado.`);
  }
  return pack;
}

// ── 2. Carrega JSON e importa para o compêndio ───────────────
async function importarArquivo(pack, caminho, label) {
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

  let importados = 0;
  for (const itemData of dados) {
    // Evita duplicatas pelo nome
    const existente = pack.index.find(e => e.name === itemData.name);
    if (existente) continue;

    try {
      await pack.documentClass.create(itemData, { pack: pack.collection });
      importados++;
    } catch (e) {
      console.warn(`[DDP] Falha ao importar "${itemData.name}":`, e);
    }
  }
  return importados;
}

// ── 3. Execução principal ────────────────────────────────────
(async () => {
  // Apenas o GM pode rodar esta macro
  if (!game.user.isGM) {
    ui.notifications.warn("Apenas o GM pode importar itens.");
    return;
  }

  // Confirmação antes de rodar
  const confirmado = await Dialog.confirm({
    title: "Importar Itens — Debaixo da Pele",
    content: `
      <p>Isso vai importar <b>armas</b> e <b>equipamentos</b> para o compêndio <em>"${PACK_LABEL}"</em>.</p>
      <p>Itens com o mesmo nome serão ignorados (sem duplicatas).</p>
      <p>Deseja continuar?</p>
    `
  });
  if (!confirmado) return;

  const pack = await getOuCriarPack();
  await pack.getIndex(); // atualiza o índice

  ui.notifications.info("⏳ Importando itens... aguarde.");

  const armas  = await importarArquivo(pack, "templates/itens/armas.json",       "Armas");
  const equip  = await importarArquivo(pack, "templates/itens/equipamentos.json","Equipamentos");

  const total = armas + equip;

  // Relatório final
  new Dialog({
    title: "✅ Importação Concluída",
    content: `
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #555">
          <th style="text-align:left;padding:4px">Arquivo</th>
          <th style="text-align:right;padding:4px">Importados</th>
        </tr>
        <tr>
          <td style="padding:4px">⚔️ Armas</td>
          <td style="text-align:right;padding:4px">${armas}</td>
        </tr>
        <tr>
          <td style="padding:4px">🎒 Equipamentos</td>
          <td style="text-align:right;padding:4px">${equip}</td>
        </tr>
        <tr style="border-top:1px solid #555;font-weight:bold">
          <td style="padding:4px">Total</td>
          <td style="text-align:right;padding:4px">${total}</td>
        </tr>
      </table>
      <p style="margin-top:8px;color:#aaa;font-size:0.85em">
        Abra o compêndio <em>"${PACK_LABEL}"</em> para ver os itens.
        ${total === 0 ? "<br><b>0 importados</b> = todos já existiam (sem duplicatas)." : ""}
      </p>
    `,
    buttons: {
      abrir: {
        label: "Abrir Compêndio",
        callback: () => pack.render(true)
      },
      fechar: { label: "Fechar" }
    },
    default: "abrir"
  }).render(true);
})();
