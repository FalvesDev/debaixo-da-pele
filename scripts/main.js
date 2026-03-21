// ============================================================
// DEBAIXO DA PELE — Módulo Principal
// Call of Cthulhu 7e | Foundry VTT v11/v12
// ============================================================

import "./aurora-system.js";
import "./token-hud.js";
import "./party-frame.js";
import "./status-auto.js";

const MODULE_ID = "debaixo-da-pele";

// ─── SETTINGS ───────────────────────────────────────────────
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Inicializando módulo Debaixo da Pele...`);

  game.settings.register(MODULE_ID, "geradorDias", {
    name: "Gerador — Dias de Combustível",
    hint: "Número de dias restantes de combustível no gerador da instalação.",
    scope: "world",
    config: true,
    type: Number,
    default: 6,
    range: { min: 0, max: 30, step: 1 }
  });

  game.settings.register(MODULE_ID, "diaCampanha", {
    name: "Dia Atual da Campanha",
    hint: "Dia atual do lockdown (começa no Dia 1).",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    range: { min: 1, max: 30, step: 1 }
  });

  game.settings.register(MODULE_ID, "overrideAtivo", {
    name: "Override — Status",
    hint: "Indica se o sistema de Override está ativo no momento.",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "maxSlotsBolsos", {
    name: "Slots máximos — Bolsos/Cinto",
    hint: "Capacidade padrão de slots nos bolsos e cinto.",
    scope: "world",
    config: true,
    type: Number,
    default: 7,
    range: { min: 4, max: 12, step: 1 }
  });

  game.settings.register(MODULE_ID, "partyFrameVisible", {
    name: "Painel de Investigadores — Visível",
    hint: "Exibe o painel de HP/SAN/Aurora dos investigadores na tela.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "tokenHudEnabled", {
    name: "Token HUD — Barras HP/SAN/Aurora",
    hint: "Exibe barras de HP, SAN e Aurora acima de cada token de personagem.",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });
});

// ─── READY ──────────────────────────────────────────────────
Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Módulo Debaixo da Pele pronto.`);

  if (game.user.isGM) {
    const dias = game.settings.get(MODULE_ID, "geradorDias");
    if (dias <= 1) {
      ui.notifications.error(
        `⚡ GERADOR CRÍTICO: ${dias} dia(s) restante(s)! Sistema em risco.`,
        { permanent: true }
      );
    } else if (dias <= 3) {
      ui.notifications.warn(`⚠️ Gerador: ${dias} dia(s) de combustível restante(s).`);
    }
  }
});

// ─── EXPORTS para macros ─────────────────────────────────────
Hooks.once("ready", () => {
  window.DebaixoDaPele = {
    MODULE_ID,
    version: "1.3.0"
  };
});
