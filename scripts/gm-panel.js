// ============================================================
// GM PANEL — Painel de Controle do Mestre
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

import { getFaseAurora } from "./aurora-system.js";

const MODULE_ID = "debaixo-da-pele";

// ─── Application ────────────────────────────────────────────
class DDPGMPanel extends Application {
  constructor(options = {}) {
    super(options);
    this._tabAtiva = "sessao";
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:        "ddp-gm-panel",
      title:     "⚗️ Painel do Mestre — Debaixo da Pele",
      template:  "modules/debaixo-da-pele/templates/gm-panel.html",
      classes:   ["ddp-gm-panel"],
      popOut:    true,
      width:     400,
      height:    "auto",
      resizable: false
    });
  }

  // ─── Dados ────────────────────────────────────────────────
  getData() {
    const atores = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);

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
        mascaraAtiva: mascaraTipo !== "nenhuma",
        mascaraLabel: MASCARA_LABELS[mascaraTipo] ?? "Proteção"
      };
    });

    // Resumo
    const totalHemorragias  = investigadores.filter(p => p.hemorragia).length;
    const totalInconscientes = investigadores.filter(p => p.inconsciente).length;
    const auroraMedia = investigadores.length
      ? (investigadores.reduce((s, p) => s + p.aurora, 0) / investigadores.length).toFixed(1)
      : "—";

    const geradorDias  = game.settings.get(MODULE_ID, "geradorDias");
    const diaCampanha  = game.settings.get(MODULE_ID, "diaCampanha");
    const overrideAtivo = game.settings.get(MODULE_ID, "overrideAtivo");
    const hpSanVisivel  = game.settings.get(MODULE_ID, "hpSanVisivelJogadores");
    const auroraRevelado = game.settings.get(MODULE_ID, "auroraRevelado");
    const auroraVisivel  = game.settings.get(MODULE_ID, "auroraVisivelJogadores");

    // Journals e items para seleção
    const journals = game.journal?.contents?.map(j => ({ id: j.id, name: j.name })) ?? [];
    const items    = game.items?.contents?.filter(i => i.hasPlayerOwner || game.user.isGM)
                                          .map(i => ({ id: i.id, name: i.name })) ?? [];

    return {
      investigadores,
      totalPJs: investigadores.length,
      totalHemorragias, temHemorragia: totalHemorragias > 0,
      totalInconscientes, temInconsciente: totalInconscientes > 0,
      auroraMedia,
      geradorDias, diaCampanha, overrideAtivo,
      geradorClass: geradorDias <= 1 ? "ddp-crit" : geradorDias <= 3 ? "ddp-warn" : "",
      hpSanVisivel, auroraRevelado, auroraVisivel,
      journals, items
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

    // ── Exposição em massa ──
    html.find(".ddp-gm-mass-btn").on("click", async (e) => {
      const delta = parseFloat(e.currentTarget.dataset.delta);
      const atores = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);
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

    // ── Hemorragia ──
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
      const label = e.currentTarget.dataset.label ?? "";
      const macro = game.macros.find(m =>
        m.name.startsWith(e.currentTarget.dataset.macro) ||
        m.name.toLowerCase().includes(label.toLowerCase())
      );
      macro ? macro.execute() : ui.notifications.warn(`Macro "${label}" não encontrada.`);
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
      const macro = game.macros.find(m => m.name.includes("SAN") || m.name.startsWith("01"));
      if (!macro) return ui.notifications.warn("Macro de SAN não encontrada.");
      const atores = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);
      for (const ator of atores) {
        const token = canvas.tokens?.placeables.find(t => t.actor?.id === ator.id);
        if (token) { token.control({ releaseOthers: false }); }
      }
      macro.execute();
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
    `${MODULE_ID}.hpSanVisivelJogadores`, `${MODULE_ID}.auroraVisivelJogadores`
  ];
  if (keys.includes(setting.key) && _gmPanel?.rendered) _gmPanel.render(false);
});

// Re-render ao mudar HP/SAN/Aurora de atores
Hooks.on("updateActor", (actor) => {
  if (actor.hasPlayerOwner && _gmPanel?.rendered) _gmPanel.render(false);
});
