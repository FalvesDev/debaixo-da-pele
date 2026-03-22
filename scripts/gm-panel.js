// ============================================================
// GM PANEL — Painel de Controle do Mestre
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

import { getFaseAurora } from "./aurora-system.js";

const MODULE_ID = "debaixo-da-pele";

// ─── Helpers de macro ────────────────────────────────────────
/**
 * Encontra uma macro pelo número DDP (ex: "01") ou por termos do label.
 * Tenta múltiplas convenções de nome para máxima compatibilidade.
 */
function _encontrarMacro(num, label = "") {
  const termos = [
    `${num} —`,          // "01 — Teste de Sanidade"
    `${num} -`,          // "01 - SAN"
    `0${parseInt(num)}`, // "01" → "01" (já coberto) ou sem zero
  ];
  const labelLc = label.toLowerCase();

  return game.macros.find(m => {
    const nome = m.name;
    const nomeLc = nome.toLowerCase();
    return (
      termos.some(t => nome.startsWith(t)) ||
      (labelLc && nomeLc.includes(labelLc)) ||
      nomeLc.includes(`ddp-macro-${num}`)
    );
  }) ?? null;
}

/**
 * Importa todas as macros do compêndio DDP para a world (se não existirem já).
 */
async function _importarMacrosCompendium() {
  const pack = game.packs.get(`${MODULE_ID}.macros`);
  if (!pack) {
    ui.notifications.error("Compêndio de macros DDP não encontrado. Verifique a instalação do módulo.");
    return;
  }

  const docs = await pack.getDocuments();
  let criadas = 0;
  let ja_existem = 0;

  for (const doc of docs) {
    const jaExiste = game.macros.find(m => m.name === doc.name);
    if (jaExiste) { ja_existem++; continue; }
    await Macro.create({ name: doc.name, type: doc.type, command: doc.command, img: doc.img });
    criadas++;
  }

  const msg = criadas > 0
    ? `✅ ${criadas} macro(s) importada(s) para a world.${ja_existem > 0 ? ` (${ja_existem} já existiam)` : ""}`
    : `ℹ️ Todas as ${ja_existem} macros já estavam importadas.`;

  ui.notifications.info(msg);
  ChatMessage.create({ content: `<b>DDP — Macros importadas:</b> ${msg}`, whisper: [game.user.id] });
}

// ─── Application ────────────────────────────────────────────
class DDPGMPanel extends Application {
  constructor(options = {}) {
    super(options);
    this._tabAtiva = "sessao"; // sessao | investigadores | aventura | controle
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:        "ddp-gm-panel",
      title:     "⚗️ Painel do Mestre — Debaixo da Pele",
      template:  "modules/debaixo-da-pele/templates/gm-panel.html",
      classes:   ["ddp-gm-panel"],
      popOut:    true,
      width:     480,
      height:    600,
      resizable: true
    });
  }

  // ─── Dados ────────────────────────────────────────────────
  getData() {
    const atores = game.actors.filter(a => a.type === "character");

    const investigadores = atores.map(a => {
      const hp     = a.system?.attribs?.hp  ?? { value: 10, max: 10 };
      const san    = a.system?.attribs?.san ?? { value: 50, max: 99 };
      const aurora = a.getFlag(MODULE_ID, "aurora") ?? 0;
      const fase   = getFaseAurora(aurora);

      const hpPct = hp.value / Math.max(1, hp.max);
      const hpClass  = hpPct <= 0.25 ? "ddp-badge-crit" : hpPct <= 0.5 ? "ddp-badge-warn" : "";
      const sanPct = san.value / Math.max(1, san.max ?? 99);
      const sanClass = sanPct <= 0.25 ? "ddp-badge-crit" : sanPct <= 0.5 ? "ddp-badge-warn" : "";

      const hemorragia  = a.effects.some(e => e.statuses?.has("ddp-hemorragia") || e.name === "Hemorragia");
      const inconsciente = hp.value <= 0;
      const mascaraTipo = a.getFlag(MODULE_ID, "mascara_tipo") ?? "nenhuma";
      const MASCARA_LABELS = {
        cirurgica: "Cirúrgica", n95: "N95", gas_civil: "Gás Civil", gas_esp: "Gás Esp."
      };

      return {
        id: a.id, nome: a.name, hp, san, aurora,
        faseCor: fase.cor, faseLabel: fase.label,
        hpClass, sanClass,
        hemorragia, inconsciente,
        mascaraTipo,
        mascaraAtiva: mascaraTipo !== "nenhuma",
        mascaraLabel: MASCARA_LABELS[mascaraTipo] ?? "Proteção",
        mascaraNenhuma:  mascaraTipo === "nenhuma",
        mascaraCirurgica: mascaraTipo === "cirurgica",
        mascaraN95:      mascaraTipo === "n95",
        mascaraGasCivil: mascaraTipo === "gas_civil",
        mascaraGasEsp:   mascaraTipo === "gas_esp"
      };
    });

    // Resumo
    const totalHemorragias  = investigadores.filter(p => p.hemorragia).length;
    const totalInconscientes = investigadores.filter(p => p.inconsciente).length;
    const auroraMedia = investigadores.length
      ? (investigadores.reduce((s, p) => s + p.aurora, 0) / investigadores.length).toFixed(1)
      : "—";

    const geradorDias   = game.settings.get(MODULE_ID, "geradorDias");
    const diaCampanha   = game.settings.get(MODULE_ID, "diaCampanha");
    const overrideAtivo = game.settings.get(MODULE_ID, "overrideAtivo");
    const hpSanVisivel  = game.settings.get(MODULE_ID, "hpSanVisivelJogadores");
    const auroraRevelado = game.settings.get(MODULE_ID, "auroraRevelado");
    const auroraVisivel  = game.settings.get(MODULE_ID, "auroraVisivelJogadores");

    // Journals e items para seleção
    const journals = game.journal?.contents?.map(j => ({ id: j.id, name: j.name })) ?? [];
    const items    = game.items?.contents?.filter(i => i.hasPlayerOwner || game.user.isGM)
                                          .map(i => ({ id: i.id, name: i.name })) ?? [];

    // Aventura / progresso
    const aventuraAto   = game.settings.get(MODULE_ID, "aventuraAto");
    const aventuraAndar = game.settings.get(MODULE_ID, "aventuraAndar");
    const puzzles       = JSON.parse(game.settings.get(MODULE_ID, "puzzlesConcluidos") || "[]");
    const npcRaw        = JSON.parse(game.settings.get(MODULE_ID, "npcStatus") || "{}");

    return {
      investigadores,
      totalPJs: investigadores.length,
      totalHemorragias, temHemorragia: totalHemorragias > 0,
      totalInconscientes, temInconsciente: totalInconscientes > 0,
      auroraMedia,
      geradorDias, diaCampanha, overrideAtivo,
      geradorClass: geradorDias <= 1 ? "ddp-crit" : geradorDias <= 3 ? "ddp-warn" : "",
      hpSanVisivel, auroraRevelado, auroraVisivel,
      journals, items,
      // Aventura
      aventuraAto,
      ato1: aventuraAto === 1, ato2: aventuraAto === 2,
      ato3: aventuraAto === 3, ato4: aventuraAto === 4,
      aventuraAndar,
      andarB1: aventuraAndar === "B1", andarB2: aventuraAndar === "B2",
      andarB3: aventuraAndar === "B3", andarB4: aventuraAndar === "B4",
      andarB5: aventuraAndar === "B5",
      puzzle1: puzzles.includes(1), puzzle2: puzzles.includes(2),
      puzzle3: puzzles.includes(3), puzzle4: puzzles.includes(4),
      puzzle5: puzzles.includes(5), puzzle6: puzzles.includes(6),
      puzzle7: puzzles.includes(7),
      puzzlesConcluidos: puzzles.length,
      npcMarcos:    npcRaw.marcos    ?? "vivo",
      npcVoss:      npcRaw.voss      ?? "aliada",
      npcValentina: npcRaw.valentina ?? "viva",
      npcDiretor:   npcRaw.diretor   ?? "desconhecido",
      npcMarcosVivo:   (npcRaw.marcos ?? "vivo") === "vivo",
      npcMarcosFerido: (npcRaw.marcos ?? "vivo") === "ferido",
      npcMarcosMorto:  (npcRaw.marcos ?? "vivo") === "morto",
      npcVossAliada:      (npcRaw.voss ?? "aliada") === "aliada",
      npcVossAntagonista: (npcRaw.voss ?? "aliada") === "antagonista",
      npcVossMorta:       (npcRaw.voss ?? "aliada") === "morta",
      npcValentinaViva:         (npcRaw.valentina ?? "viva") === "viva",
      npcValentinaComprometida: (npcRaw.valentina ?? "viva") === "comprometida",
      npcValentinaMorta:        (npcRaw.valentina ?? "viva") === "morta",
      npcDiretorDesconhecido: (npcRaw.diretor ?? "desconhecido") === "desconhecido",
      npcDiretorConfrontado:  (npcRaw.diretor ?? "desconhecido") === "confrontado",
      npcDiretorDerrotado:    (npcRaw.diretor ?? "desconhecido") === "derrotado"
    };
  }

  // ─── Listeners ────────────────────────────────────────────
  activateListeners(html) {
    super.activateListeners(html);

    // ── Tabs ──
    html.find(".ddp-gm-nav-item").on("click", (e) => {
      const tab = e.currentTarget.dataset.tab;
      this._tabAtiva = tab;
      html.find(".ddp-gm-nav-item").removeClass("active");
      html.find(".ddp-gm-tab").removeClass("active");
      $(e.currentTarget).addClass("active");
      html.find(`#ddp-tab-${tab}`).addClass("active");
    });
    // Restaura aba ativa após re-render
    html.find(`[data-tab="${this._tabAtiva}"]`).trigger("click");

    // ── Ajuste de settings numéricos (Dia / Gerador) ──
    html.find(".ddp-gm-adj[data-setting]").on("click", async (e) => {
      const key   = e.currentTarget.dataset.setting;
      const delta = parseInt(e.currentTarget.dataset.delta);
      const atual = game.settings.get(MODULE_ID, key);
      const novo  = Math.max(0, atual + delta);
      await game.settings.set(MODULE_ID, key, novo);
      this.render(false);
    });

    // ── Toggle booleans (Override, HP/SAN visível, Aurora visível) ──
    html.find(".ddp-gm-toggle[data-setting]").on("click", async (e) => {
      const key   = e.currentTarget.dataset.setting;
      const atual = game.settings.get(MODULE_ID, key);
      await game.settings.set(MODULE_ID, key, !atual);
      this.render(false);
    });

    // ── Aurora por personagem ──
    html.find(".ddp-gm-aurora-adj").on("click", async (e) => {
      const actorId = e.currentTarget.dataset.actor;
      const delta   = parseFloat(e.currentTarget.dataset.delta);
      const ator    = game.actors.get(actorId);
      if (!ator) return;
      const atual = ator.getFlag(MODULE_ID, "aurora") ?? 0;
      const nova  = Math.max(0, Math.min(10, parseFloat((atual + delta).toFixed(1))));
      await ator.setFlag(MODULE_ID, "aurora", nova);
      this.render(false);
    });

    // ── HP direto por personagem ──
    html.find(".ddp-gm-hp-adj").on("click", async (e) => {
      const actorId = e.currentTarget.dataset.actor;
      const delta = parseInt(e.currentTarget.dataset.delta);
      const ator = game.actors.get(actorId);
      if (!ator) return;
      const hp = ator.system?.attribs?.hp ?? { value: 10, max: 10 };
      const novo = Math.max(0, Math.min(hp.max, hp.value + delta));
      await ator.update({ "system.attribs.hp.value": novo });
      this.render(false);
    });

    // ── SAN direto por personagem ──
    html.find(".ddp-gm-san-adj").on("click", async (e) => {
      const actorId = e.currentTarget.dataset.actor;
      const delta = parseInt(e.currentTarget.dataset.delta);
      const ator = game.actors.get(actorId);
      if (!ator) return;
      const san = ator.system?.attribs?.san ?? { value: 50, max: 99 };
      const novo = Math.max(0, Math.min(san.max ?? 99, san.value + delta));
      await ator.update({ "system.attribs.san.value": novo });
      this.render(false);
    });

    // ── Toggle hemorragia por personagem ──
    html.find(".ddp-gm-hemo-toggle").on("click", async (e) => {
      const actorId = e.currentTarget.dataset.actor;
      const ator = game.actors.get(actorId);
      if (!ator) return;
      const temHemo = ator.effects.some(ef => ef.statuses?.has("ddp-hemorragia") || ef.name === "Hemorragia");
      if (temHemo) {
        const ef = ator.effects.find(ef => ef.statuses?.has("ddp-hemorragia") || ef.name === "Hemorragia");
        await ef?.delete();
      } else {
        const cfg = CONFIG.statusEffects.find(s => s.id === "ddp-hemorragia");
        await ator.createEmbeddedDocuments("ActiveEffect", [{
          name: "Hemorragia",
          img: cfg?.img ?? "modules/debaixo-da-pele/assets/icons/status-hemorragia.svg",
          statuses: ["ddp-hemorragia"],
          flags: { "debaixo-da-pele": { statusAuto: true, statusId: "ddp-hemorragia" } }
        }]);
      }
      this.render(false);
    });

    // ── Máscara por personagem ──
    html.find(".ddp-gm-mascara-select").on("change", async (e) => {
      const actorId = e.currentTarget.dataset.actor;
      const ator = game.actors.get(actorId);
      if (!ator) return;
      await ator.setFlag(MODULE_ID, "mascara_tipo", e.currentTarget.value);
      this.render(false);
    });

    // ── Exposição em massa ──
    html.find(".ddp-gm-mass-btn").on("click", async (e) => {
      const delta = parseFloat(e.currentTarget.dataset.delta);
      const atores = game.actors.filter(a => a.type === "character");
      for (const ator of atores) {
        const atual = ator.getFlag(MODULE_ID, "aurora") ?? 0;
        const nova  = Math.max(0, Math.min(10, parseFloat((atual + delta).toFixed(1))));
        await ator.setFlag(MODULE_ID, "aurora", nova);
      }
      this.render(false);
      ui.notifications.info(`Aurora ajustado em ${delta > 0 ? "+" : ""}${delta} para todos os investigadores.`);
    });

    // ── Revelar Aurora ──
    html.find("#btn-revelar-aurora").on("click", async () => {
      const titulo = html.find("#reveal-titulo").val()?.trim() || "O Composto Aurora";
      const texto  = html.find("#reveal-texto").val()?.trim()  || "";

      // Ativa settings
      await game.settings.set(MODULE_ID, "auroraRevelado", true);
      await game.settings.set(MODULE_ID, "auroraVisivelJogadores", true);

      // Emite socket para todos os clientes
      game.socket.emit(`module.${MODULE_ID}`, {
        action: "revelarComposto", titulo, texto
      });

      // GM também vê o popup localmente
      new Dialog({
        title: "🔬 Revelação enviada",
        content: `<p style="padding:10px">Popup enviado a todos os jogadores. Aurora agora visível.</p>`,
        buttons: { ok: { label: "OK" } }
      }).render(true);

      // Mensagem no chat
      await ChatMessage.create({
        content: `
          <div style="border-left:4px solid #ffb347; padding:8px 12px; background:#1a1408">
            🔬 <b style="color:#ffb347">${titulo}</b><br>
            <span style="color:#aaa; font-style:italic">${texto}</span>
          </div>`
      });

      this.render(false);
    });

    // ── Ocultar Aurora ──
    html.find("#btn-ocultar-aurora").on("click", async () => {
      await game.settings.set(MODULE_ID, "auroraRevelado", false);
      await game.settings.set(MODULE_ID, "auroraVisivelJogadores", false);
      this.render(false);
    });

    // ── Mostrar documento ──
    html.find("#btn-mostrar-doc").on("click", async () => {
      const val = html.find("#doc-select").val();
      if (!val) return ui.notifications.warn("Selecione um documento primeiro.");
      const [docType, docId] = val.split(":");
      game.socket.emit(`module.${MODULE_ID}`, { action: "mostrarDocumento", docType, docId });
      ui.notifications.info("Documento enviado às telas dos jogadores.");
    });

    // ── Hemorragia (select clássico) ──
    html.find("#btn-hemo-add").on("click", async () => {
      const actorId = html.find("#hemo-select").val();
      const ator    = game.actors.get(actorId);
      if (!ator) return;
      await window.DebaixoDaPele?.setStatus?.(ator, "ddp-hemorragia", true);
      ui.notifications.info(`Hemorragia aplicada em ${ator.name}.`);
      this.render(false);
    });
    html.find("#btn-hemo-rem").on("click", async () => {
      const actorId = html.find("#hemo-select").val();
      const ator    = game.actors.get(actorId);
      if (!ator) return;
      await window.DebaixoDaPele?.setStatus?.(ator, "ddp-hemorragia", false);
      ui.notifications.info(`Hemorragia removida de ${ator.name}.`);
      this.render(false);
    });

    // ── Botões de macro ──
    html.find(".ddp-gm-action-btn[data-macro]").on("click", (e) => {
      const num   = e.currentTarget.dataset.macro; // "01", "03", etc.
      const label = e.currentTarget.dataset.label ?? "";
      const macro = _encontrarMacro(num, label);
      if (macro) {
        macro.execute();
      } else {
        ui.notifications.warn(
          `Macro "${label}" não encontrada. Importe as macros via aba Controle → Importar Macros do Compêndio.`
        );
      }
    });

    // ── Mensagem narrativa ──
    html.find("#btn-enviar-msg").on("click", async () => {
      const texto = html.find("#msg-narrativa").val()?.trim();
      if (!texto) return;
      await ChatMessage.create({
        content: `
          <div style="border-left:3px solid #555; padding:8px 12px;
                      background:#0e0e1e; font-style:italic; color:#ccc">
            ${texto}
          </div>`
      });
      html.find("#msg-narrativa").val("");
    });

    // ── Teste SAN todos ──
    html.find("#btn-san-todos").on("click", async () => {
      const macro = _encontrarMacro("01", "SAN");
      if (!macro) return ui.notifications.warn("Macro de SAN não encontrada. Importe as macros do Compêndio.");
      const atores = game.actors.filter(a => a.type === "character");
      for (const ator of atores) {
        const token = canvas.tokens?.placeables.find(t => t.actor?.id === ator.id);
        if (token) { token.control({ releaseOthers: false }); }
      }
      macro.execute();
    });

    // ── Ato da aventura ──
    html.find(".ddp-gm-ato-btn").on("click", async (e) => {
      const ato = parseInt(e.currentTarget.dataset.ato);
      await game.settings.set(MODULE_ID, "aventuraAto", ato);
      this.render(false);
    });

    // ── Andar ──
    html.find(".ddp-gm-andar-btn").on("click", async (e) => {
      const andar = e.currentTarget.dataset.andar;
      await game.settings.set(MODULE_ID, "aventuraAndar", andar);
      this.render(false);
    });

    // ── Puzzle toggle ──
    html.find(".ddp-gm-puzzle-check").on("change", async (e) => {
      const num = parseInt(e.currentTarget.dataset.puzzle);
      const raw = game.settings.get(MODULE_ID, "puzzlesConcluidos");
      const lista = JSON.parse(raw || "[]");
      const idx = lista.indexOf(num);
      if (e.currentTarget.checked && idx === -1) lista.push(num);
      else if (!e.currentTarget.checked && idx !== -1) lista.splice(idx, 1);
      await game.settings.set(MODULE_ID, "puzzlesConcluidos", JSON.stringify(lista));
    });

    // ── NPC status ──
    html.find(".ddp-gm-npc-btn").on("click", async (e) => {
      const npcKey = e.currentTarget.dataset.npc;
      const status = e.currentTarget.dataset.status;
      const raw = game.settings.get(MODULE_ID, "npcStatus");
      const obj = JSON.parse(raw || "{}");
      obj[npcKey] = status;
      await game.settings.set(MODULE_ID, "npcStatus", JSON.stringify(obj));
      this.render(false);
    });

    // ── Importar macros do compêndio ──
    html.find("#btn-import-macros").on("click", async () => {
      await _importarMacrosCompendium();
      this.render(false);
    });
  }
}

// ─── Singleton ───────────────────────────────────────────────
let _gmPanel = null;

function _abrirPainel() {
  if (!game.user.isGM) return;
  if (!_gmPanel) _gmPanel = new DDPGMPanel();
  _gmPanel.render(true);
}

// ─── Botão na barra de cena ──────────────────────────────────
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;
  const tokenControls = controls.find(c => c.name === "token");
  if (!tokenControls) return;
  tokenControls.tools.push({
    name:    "ddp-gm-panel",
    title:   "Painel GM — Debaixo da Pele",
    icon:    "fas fa-skull",
    visible: game.user.isGM,
    onClick: () => _abrirPainel(),
    button:  true
  });
});

// ─── Re-render ao mudar settings relevantes ──────────────────
Hooks.on("updateSetting", (setting) => {
  const keys = [
    `${MODULE_ID}.geradorDias`, `${MODULE_ID}.diaCampanha`,
    `${MODULE_ID}.overrideAtivo`, `${MODULE_ID}.auroraRevelado`,
    `${MODULE_ID}.hpSanVisivelJogadores`, `${MODULE_ID}.auroraVisivelJogadores`,
    `${MODULE_ID}.aventuraAto`, `${MODULE_ID}.aventuraAndar`,
    `${MODULE_ID}.puzzlesConcluidos`, `${MODULE_ID}.npcStatus`
  ];
  if (keys.includes(setting.key) && _gmPanel?.rendered) _gmPanel.render(false);
});

// Re-render ao mudar HP/SAN/Aurora de atores
Hooks.on("updateActor", (actor) => {
  if (actor.hasPlayerOwner && _gmPanel?.rendered) _gmPanel.render(false);
});
