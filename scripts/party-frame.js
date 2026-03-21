// ============================================================
// PARTY FRAME — Painel persistente de HP/SAN/Aurora
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

import { getFaseAurora } from "./aurora-system.js";

const MODULE_ID = "debaixo-da-pele";

// ─── Application ────────────────────────────────────────────
class DDPPartyFrame extends Application {
  constructor(options = {}) {
    super(options);
    this._minimized = false;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:       "ddp-party-frame",
      template: "modules/debaixo-da-pele/templates/party-frame.html",
      popOut:   false,
      classes:  ["ddp-party-frame-app"]
    });
  }

  // ─── Dados para o template ─────────────────────────────────
  getData() {
    const personagens = game.actors
      .filter(a => a.type === "character" && a.hasPlayerOwner)
      .map(a => {
        const hp    = a.system?.attribs?.hp  ?? { value: 10, max: 10 };
        const san   = a.system?.attribs?.san ?? { value: 50, max: 99 };
        const aurora = a.getFlag(MODULE_ID, "aurora") ?? 0;
        const fase   = getFaseAurora(aurora);

        const hpMax  = Math.max(1, hp.max);
        const sanMax = Math.max(1, san.max ?? 99);
        const hpPct  = Math.round(Math.max(0, Math.min(100, (hp.value / hpMax)  * 100)));
        const sanPct = Math.round(Math.max(0, Math.min(100, (san.value / sanMax) * 100)));

        // Cores dinâmicas HP
        const hpCor = hpPct > 50 ? "#44bb44" : hpPct > 25 ? "#ffaa00" : "#dd2222";
        // Cores dinâmicas SAN
        const sanCor = sanPct > 50 ? "#4466dd" : sanPct > 25 ? "#6633aa" : "#330055";

        // Classes de alerta no valor
        const hpValClass  = hpPct <= 25 ? "ddp-val-crit" : hpPct <= 50 ? "ddp-val-warn" : "";
        const sanValClass = sanPct <= 25 ? "ddp-val-crit" : sanPct <= 50 ? "ddp-val-warn" : "";

        // Status de efeitos
        const hemorragia  = a.effects.some(e => e.statuses?.has("ddp-hemorragia") || e.name === "Hemorragia");
        const inconsciente = hp.value <= 0;
        const mascaraTipo = a.getFlag(MODULE_ID, "mascara_tipo") ?? "nenhuma";
        const mascaraAtiva = mascaraTipo !== "nenhuma";

        const MASCARA_LABELS = {
          cirurgica: "Máscara Cirúrgica",
          n95:       "Respirador N95",
          gas_civil: "Gás Civil",
          gas_esp:   "Gás Especializado"
        };

        // Nome abreviado (máx 12 chars)
        const nomeAbrev = a.name.length > 12 ? a.name.slice(0, 11) + "…" : a.name;

        // Classe de status (highlight se HP crítico)
        const statusClass = inconsciente ? "ddp-pf-ko"
                          : hpPct <= 25  ? "ddp-pf-crit"
                          :                "";

        return {
          id: a.id,
          nome: a.name,
          nomeAbrev,
          img: a.img,
          hp, san,
          hpPct, sanPct,
          hpCor, sanCor,
          hpValClass, sanValClass,
          aurora,
          faseCor:   fase.cor,
          faseLabel: fase.label,
          mascaraAtiva,
          mascaraLabel: MASCARA_LABELS[mascaraTipo] ?? "Proteção",
          hemorragia,
          inconsciente,
          statusClass
        };
      });

    return { personagens, minimized: this._minimized };
  }

  // ─── Listeners ──────────────────────────────────────────────
  activateListeners(html) {
    super.activateListeners(html);

    // Toggle minimizar
    html.find(".ddp-pf-btn-toggle").on("click", () => {
      this._minimized = !this._minimized;
      this.render(false);
    });

    // Clicar no personagem → foca o token e seleciona
    html.find(".ddp-pf-char").on("click", (e) => {
      const actorId = e.currentTarget.dataset.actorId;
      const token   = canvas.tokens?.placeables?.find(t => t.actor?.id === actorId);
      if (!token) return ui.notifications.info("Token não encontrado na cena atual.");
      token.control({ releaseOthers: true });
      canvas.animatePan({ x: token.x + token.w / 2, y: token.y + token.h / 2, duration: 500 });
    });

    // Double-click → abre ficha
    html.find(".ddp-pf-char").on("dblclick", (e) => {
      if ($(e.target).hasClass("ddp-pf-inv-btn")) return; // não conflitar com botão
      const actorId = e.currentTarget.dataset.actorId;
      game.actors.get(actorId)?.sheet?.render(true);
    });

    // Botão de inventário 🎒
    html.find(".ddp-pf-inv-btn").on("click", (e) => {
      e.stopPropagation();
      const actorId = e.currentTarget.dataset.actorId;
      const actor   = game.actors.get(actorId);
      if (!actor) return;

      // Seleciona o token do personagem no canvas (necessário para a macro)
      const token = canvas.tokens?.placeables?.find(t => t.actor?.id === actorId);
      if (token) token.control({ releaseOthers: true });

      // Busca e executa a macro de inventário
      const macro = game.macros.find(m =>
        m.name.startsWith("04") ||
        m.name.toLowerCase().includes("inventário") ||
        m.name.toLowerCase().includes("inventario")
      );

      if (macro) {
        macro.execute();
      } else {
        // Fallback: abre ficha do personagem na aba de inventário se macro não existir
        actor.sheet?.render(true);
        ui.notifications.warn("Macro de inventário não encontrada. Importe as macros via Painel GM → Ações → Importar Macros.");
      }
    });
  }
}

// ─── Singleton + controle de visibilidade ────────────────────
let _partyFrame = null;

function _getFrame() {
  if (!_partyFrame) _partyFrame = new DDPPartyFrame();
  return _partyFrame;
}

function _shouldShow() {
  return game.settings.get(MODULE_ID, "partyFrameVisible");
}

// ─── Hooks ─────────────────────────────────────────────────
Hooks.once("ready", () => {
  if (_shouldShow()) _getFrame().render(true);
});

// Atualiza ao mudar HP, SAN, Aurora, efeitos, máscaras
Hooks.on("updateActor", (actor, changes) => {
  if (!_partyFrame?.rendered || !actor.hasPlayerOwner) return;

  const relevante =
    foundry.utils.hasProperty(changes, "system.attribs.hp.value")  ||
    foundry.utils.hasProperty(changes, "system.attribs.san.value") ||
    foundry.utils.hasProperty(changes, `flags.${MODULE_ID}.aurora`) ||
    foundry.utils.hasProperty(changes, `flags.${MODULE_ID}.mascara_tipo`);

  if (relevante) _partyFrame.render(false);
});

// Atualiza quando Active Effects mudam (hemorragia, etc.)
Hooks.on("createActiveEffect", (_effect, _options, _userId) => {
  if (_partyFrame?.rendered) _partyFrame.render(false);
});
Hooks.on("deleteActiveEffect", (_effect, _options, _userId) => {
  if (_partyFrame?.rendered) _partyFrame.render(false);
});

// Atualiza quando atores são adicionados/removidos
Hooks.on("createActor", () => { if (_partyFrame?.rendered) _partyFrame.render(false); });
Hooks.on("deleteActor", () => { if (_partyFrame?.rendered) _partyFrame.render(false); });

// Toggle via setting
Hooks.on("updateSetting", (setting) => {
  if (setting.key !== `${MODULE_ID}.partyFrameVisible`) return;
  if (setting.value) {
    _getFrame().render(true);
  } else {
    _partyFrame?.close();
  }
});
