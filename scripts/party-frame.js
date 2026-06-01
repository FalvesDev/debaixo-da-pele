// ============================================================
// PARTY FRAME — Painel persistente de HP/SAN/Aurora
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

import { getFaseAurora } from "./aurora-system.js";
import { DDPInventoryDialog } from "./inventory-dialog.js";

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
    const isGM = game.user.isGM;
    const hpSanVisivel  = isGM || game.settings.get(MODULE_ID, "hpSanVisivelJogadores");
    const auroraVisivel = isGM || (
      game.settings.get(MODULE_ID, "auroraRevelado") &&
      game.settings.get(MODULE_ID, "auroraVisivelJogadores")
    );

    const roster    = game.settings.get(MODULE_ID, "partyRoster") ?? { actors: [] };
    const rosterIds = new Set((roster.actors ?? []).map(r => r.id));

    const personagens = game.actors
      .filter(a => a.type === "character" && (
        a.getFlag(MODULE_ID, "tipo") === "pj" || a.hasPlayerOwner
      ))
      // Não-GM só vê quem o GM colocou no roster
      .filter(a => isGM || rosterIds.has(a.id))
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
          statusClass,
          inRoster: rosterIds.has(a.id)
        };
      });

    return { personagens, minimized: this._minimized, hpSanVisivel, auroraVisivel, isGM };
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
      if (!canvas?.ready) return;
      const actorId = e.currentTarget.dataset.actorId;
      const token   = canvas.tokens?.placeables?.find(t => t.actor?.id === actorId);
      if (!token) return ui.notifications.info("Token não encontrado na cena atual.");
      token.control({ releaseOthers: true });
      // Usa document.width/height (em cells) × grid.size para pan correto em qualquer zoom
      const cx = token.x + (token.document.width  * (canvas.grid?.size ?? 100)) / 2;
      const cy = token.y + (token.document.height * (canvas.grid?.size ?? 100)) / 2;
      canvas.animatePan({ x: cx, y: cy, duration: 500 });
    });

    // Double-click → abre ficha
    html.find(".ddp-pf-char").on("dblclick", (e) => {
      if ($(e.target).hasClass("ddp-pf-inv-btn")) return; // não conflitar com botão
      const actorId = e.currentTarget.dataset.actorId;
      game.actors.get(actorId)?.sheet?.render(true);
    });

    // Botão de inventário 🎒 → abre grid estilo Resident Evil
    html.find(".ddp-pf-inv-btn").on("click", (e) => {
      e.stopPropagation();
      const actorId = e.currentTarget.dataset.actorId;
      DDPInventoryDialog.open(actorId);
    });

    // Toggle visibilidade no roster (GM only)
    html.find(".ddp-pf-roster-toggle").on("click", async (e) => {
      e.stopPropagation();
      if (!game.user.isGM) return;
      const actorId = e.currentTarget.dataset.actorId;
      const actor   = game.actors.get(actorId);
      if (!actor) return;

      const roster  = game.settings.get(MODULE_ID, "partyRoster") ?? { actors: [] };
      const actors  = [...(roster.actors ?? [])];
      const idx     = actors.findIndex(r => r.id === actorId);

      if (idx >= 0) {
        actors.splice(idx, 1);
      } else {
        actors.push({ id: actorId, name: actor.name, img: actor.img });
      }

      await game.settings.set(MODULE_ID, "partyRoster", { actors });
      this.render(false);
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

// ─── Auto-popula roster com personagens de jogador na 1ª carga ─
async function _initRoster() {
  if (!game.user.isGM) return;
  const existing = game.settings.get(MODULE_ID, "partyRoster");
  if (existing?.actors?.length > 0) return;

  const playerChars = game.actors
    .filter(a => a.type === "character" && a.hasPlayerOwner)
    .map(a => ({ id: a.id, name: a.name, img: a.img }));

  if (playerChars.length > 0) {
    await game.settings.set(MODULE_ID, "partyRoster", { actors: playerChars });
  }
}

// ─── Hooks ─────────────────────────────────────────────────
Hooks.once("ready", () => {
  _initRoster();
  if (_shouldShow()) _getFrame().render(true);
});

// Atualiza ao mudar HP, SAN, Aurora, efeitos, máscaras
Hooks.on("updateActor", (actor, changes) => {
  if (!_partyFrame?.rendered || actor.type !== "character") return;

  const relevante =
    foundry.utils.hasProperty(changes, "system.attribs.hp.value")  ||
    foundry.utils.hasProperty(changes, "system.attribs.san.value") ||
    foundry.utils.hasProperty(changes, `flags.${MODULE_ID}.aurora`) ||
    foundry.utils.hasProperty(changes, `flags.${MODULE_ID}.mascara_tipo`);

  if (relevante) _partyFrame.render(false);
});

// Atualiza quando Active Effects mudam — filtra apenas personagens do party frame
const _isPjActor = (effect) => effect.parent?.type === "character";
Hooks.on("createActiveEffect", (effect) => {
  if (_partyFrame?.rendered && _isPjActor(effect)) _partyFrame.render(false);
});
Hooks.on("deleteActiveEffect", (effect) => {
  if (_partyFrame?.rendered && _isPjActor(effect)) _partyFrame.render(false);
});

// Atualiza quando atores são adicionados/removidos
Hooks.on("createActor", () => { if (_partyFrame?.rendered) _partyFrame.render(false); });
Hooks.on("deleteActor", () => { if (_partyFrame?.rendered) _partyFrame.render(false); });

// Toggle via setting
Hooks.on("updateSetting", (setting) => {
  const key = setting.key;

  if (key === `${MODULE_ID}.partyFrameVisible`) {
    // Em Foundry v12 setting.value é string serializada — usar get() para o bool real
    if (game.settings.get(MODULE_ID, "partyFrameVisible")) {
      _getFrame().render(true);
    } else {
      _partyFrame?.close();
    }
    return;
  }

  // Re-renderiza quando GM muda visibilidade de HP/SAN/Aurora para jogadores
  const refreshKeys = [
    `${MODULE_ID}.hpSanVisivelJogadores`,
    `${MODULE_ID}.auroraRevelado`,
    `${MODULE_ID}.auroraVisivelJogadores`,
    `${MODULE_ID}.partyRoster`
  ];
  if (refreshKeys.includes(key) && _partyFrame?.rendered) _partyFrame.render(false);
});
