// ============================================================
// DEBAIXO DA PELE — Módulo Principal
// Call of Cthulhu 7e | Foundry VTT v11/v12
// ============================================================

import "./aurora-system.js";

const MODULE_ID = "debaixo-da-pele";

// ─── SETTINGS ───────────────────────────────────────────────
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Inicializando módulo Debaixo da Pele...`);

  // Dias de combustível do gerador
  game.settings.register(MODULE_ID, "geradorDias", {
    name: "Gerador — Dias de Combustível",
    hint: "Número de dias restantes de combustível no gerador da instalação.",
    scope: "world",
    config: true,
    type: Number,
    default: 6,
    range: { min: 0, max: 30, step: 1 }
  });

  // Dia atual da campanha
  game.settings.register(MODULE_ID, "diaCampanha", {
    name: "Dia Atual da Campanha",
    hint: "Dia atual do lockdown (começa no Dia 1).",
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    range: { min: 1, max: 30, step: 1 }
  });

  // Override ativo
  game.settings.register(MODULE_ID, "overrideAtivo", {
    name: "Override — Status",
    hint: "Indica se o sistema de Override está ativo no momento.",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  // Limite de slots dos bolsos (padrão do sistema)
  game.settings.register(MODULE_ID, "maxSlotsBolsos", {
    name: "Slots máximos — Bolsos/Cinto",
    hint: "Capacidade padrão de slots nos bolsos e cinto.",
    scope: "world",
    config: true,
    type: Number,
    default: 7,
    range: { min: 4, max: 12, step: 1 }
  });
});

// ─── READY ──────────────────────────────────────────────────
Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Módulo Debaixo da Pele pronto.`);

  // Alerta de gerador crítico ao carregar
  if (game.user.isGM) {
    const dias = game.settings.get(MODULE_ID, "geradorDias");
    if (dias <= 1) {
      ui.notifications.error(
        `⚡ GERADOR CRÍTICO: ${dias} dia(s) restante(s)! Sistema em risco.`,
        { permanent: true }
      );
    } else if (dias <= 3) {
      ui.notifications.warn(
        `⚠️ Gerador: ${dias} dia(s) de combustível restante(s).`
      );
    }
  }
});

// ─── HOOK: Atualização de ator — Verificar Aurora ───────────
Hooks.on("updateActor", (actor, changes, options, userId) => {
  const novaAurora = changes?.flags?.[MODULE_ID]?.aurora;
  if (novaAurora === undefined) return;

  // Efeitos automáticos por nível de Aurora
  _aplicarEfeitosAurora(actor, novaAurora);
});

// ─── FUNÇÃO: Aplicar efeitos de Aurora ──────────────────────
async function _aplicarEfeitosAurora(actor, nivel) {
  let cor = "#ffffff";
  let icone = "";
  let msg = "";

  if (nivel <= 2) {
    cor = "#a0ffa0";
    icone = "🟢";
    msg = "Sem sintomas visíveis.";
  } else if (nivel <= 4) {
    cor = "#ffffa0";
    icone = "⚠️";
    msg = "Cicatrização acelerada, insônia persistente.";
  } else if (nivel <= 6) {
    cor = "#ffb347";
    icone = "🟠";
    msg = "Cicatrizes desaparecendo, textura da pele alterada.";
    // Penalidade de SAN automática
    if (game.user.isGM) {
      const sanAtual = actor.system?.attribs?.san?.value ?? 0;
      if (sanAtual > 0) {
        await actor.update({ "system.attribs.san.value": Math.max(0, sanAtual - 5) });
        ChatMessage.create({
          content: `<b>Aurora — Efeito Automático</b><br>${actor.name} perde 5 de Sanidade pela exposição (nível ${nivel}).`
        });
      }
    }
  } else if (nivel <= 8) {
    cor = "#ff6b6b";
    icone = "🔴";
    msg = "Alterações morfológicas visíveis. +2 HP max, −10% perícias mentais.";
  } else {
    cor = "#800000";
    icone = "💀";
    msg = "TRANSFORMAÇÃO INICIADA — personagem progressivamente não jogável.";
    if (game.user.isGM) {
      ui.notifications.error(`${actor.name}: TRANSFORMAÇÃO INICIADA (Aurora ${nivel})`, {
        permanent: true
      });
    }
  }

  // Mensagem de chat com estilo
  ChatMessage.create({
    content: `
      <div style="border-left: 4px solid ${cor}; padding: 6px 10px; background: #1a1a2e;">
        <b style="color:${cor}">${icone} Composto Aurora — ${actor.name}</b><br>
        <span style="color:#ccc">Nível de exposição: <b>${nivel}</b></span><br>
        <span style="color:#aaa; font-style:italic">${msg}</span>
      </div>
    `
  });
}

// ─── EXPORTS para uso nos macros ────────────────────────────
window.DebaixoDaPele = {
  MODULE_ID,
  aplicarEfeitosAurora: _aplicarEfeitosAurora
};
