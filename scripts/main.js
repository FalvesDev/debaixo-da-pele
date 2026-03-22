// ============================================================
// DEBAIXO DA PELE — Módulo Principal
// Call of Cthulhu 7e | Foundry VTT v11/v12
// ============================================================

import "./aurora-system.js";
import "./token-hud.js";
import "./party-frame.js";
import "./status-auto.js";
import "./gm-panel.js";
import "./campaign-panel.js";

const MODULE_ID = "debaixo-da-pele";

// ─── SETTINGS ───────────────────────────────────────────────
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Inicializando módulo Debaixo da Pele...`);

  // Sessão
  game.settings.register(MODULE_ID, "geradorDias", {
    name: "Gerador — Dias de Combustível",
    hint: "Número de dias restantes de combustível.",
    scope: "world", config: true, type: Number, default: 6,
    range: { min: 0, max: 30, step: 1 }
  });
  game.settings.register(MODULE_ID, "diaCampanha", {
    name: "Dia Atual da Campanha",
    scope: "world", config: true, type: Number, default: 1,
    range: { min: 1, max: 30, step: 1 }
  });
  game.settings.register(MODULE_ID, "overrideAtivo", {
    name: "Override — Status",
    scope: "world", config: false, type: Boolean, default: false
  });
  game.settings.register(MODULE_ID, "maxSlotsBolsos", {
    name: "Slots máximos — Bolsos/Cinto",
    scope: "world", config: true, type: Number, default: 7,
    range: { min: 4, max: 12, step: 1 }
  });

  // Visibilidade para jogadores (controladas exclusivamente pelo GM)
  game.settings.register(MODULE_ID, "hpSanVisivelJogadores", {
    name: "HP/SAN visível para jogadores",
    scope: "world", config: false, type: Boolean, default: true
  });
  game.settings.register(MODULE_ID, "auroraRevelado", {
    name: "Composto Aurora revelado",
    scope: "world", config: false, type: Boolean, default: false
  });
  game.settings.register(MODULE_ID, "auroraVisivelJogadores", {
    name: "Aurora visível para jogadores",
    scope: "world", config: false, type: Boolean, default: false
  });

  // Controle de setup
  game.settings.register(MODULE_ID, "macrosImportadas", {
    name: "Macros DDP importadas",
    scope: "world", config: false, type: Boolean, default: false
  });

  // Aventura / progresso
  game.settings.register(MODULE_ID, "aventuraAto", {
    name: "Ato atual da aventura",
    scope: "world", config: false, type: Number, default: 1
  });
  game.settings.register(MODULE_ID, "aventuraAndar", {
    name: "Andar atual",
    scope: "world", config: false, type: String, default: "B1"
  });
  game.settings.register(MODULE_ID, "puzzlesConcluidos", {
    name: "Puzzles concluídos (JSON)",
    scope: "world", config: false, type: String, default: "[]"
  });
  game.settings.register(MODULE_ID, "npcStatus", {
    name: "Status dos NPCs (JSON)",
    scope: "world", config: false, type: String, default: "{}"
  });

  // Preferências de cliente
  game.settings.register(MODULE_ID, "partyFrameVisible", {
    name: "Painel de Investigadores — Visível",
    scope: "client", config: true, type: Boolean, default: true
  });
  game.settings.register(MODULE_ID, "tokenHudEnabled", {
    name: "Token HUD — Barras HP/SAN/Aurora",
    scope: "client", config: true, type: Boolean, default: true
  });
});

// ─── SOCKET — Revelações em tempo real ──────────────────────
Hooks.once("setup", () => {
  game.socket?.on(`module.${MODULE_ID}`, _handleSocket);
});

async function _handleSocket(data) {
  switch (data.action) {
    case "revelarComposto": {
      // Força refresh visual em todos os clientes
      setTimeout(() => {
        canvas.tokens?.placeables.forEach(t => t.refresh?.());
      }, 400);
      // Popup dramático em todas as telas
      new Dialog({
        title: "🔬 Descoberta Perturbadora",
        content: `
          <div style="padding:14px; font-family:'Signika',serif">
            <p style="color:#ffb347; font-size:1.1em; font-weight:bold; margin-bottom:8px">
              ${data.titulo ?? "Algo não está certo..."}
            </p>
            <p style="color:#aaa; font-style:italic">${data.texto ?? ""}</p>
          </div>`,
        buttons: { ok: { label: "Entendido.", icon: '<i class="fas fa-skull"></i>' } }
      }).render(true);
      break;
    }
    case "mostrarDocumento": {
      const col = data.docType === "JournalEntry" ? game.journal
                : data.docType === "Item"         ? game.items
                : null;
      if (col) col.get(data.docId)?.sheet?.render(true);
      else if (data.docType === "image") {
        new ImagePopout(data.src, { title: data.titulo ?? "" }).render(true);
      }
      break;
    }
    case "mostrarMensagem": {
      ChatMessage.create({ content: data.conteudo, whisper: [] });
      break;
    }
  }
}

// ─── READY ──────────────────────────────────────────────────
Hooks.once("ready", () => {
  console.log(`${MODULE_ID} | Debaixo da Pele v1.5.0 pronto.`);

  if (game.user.isGM) {
    const dias = game.settings.get(MODULE_ID, "geradorDias");
    if (dias <= 1) {
      ui.notifications.error(`⚡ GERADOR CRÍTICO: ${dias} dia(s) restante(s)!`, { permanent: true });
    } else if (dias <= 3) {
      ui.notifications.warn(`⚠️ Gerador: ${dias} dia(s) restante(s).`);
    }
  }

  window.DebaixoDaPele = {
    MODULE_ID,
    version: "1.5.0",
    emitSocket: (data) => game.socket?.emit(`module.${MODULE_ID}`, data)
  };

  // ── Prompt de importação de macros (primeira vez) ──
  if (game.user.isGM) {
    const jaImportadas = game.settings.get(MODULE_ID, "macrosImportadas");
    const pack = game.packs.get(`${MODULE_ID}.macros`);
    if (!jaImportadas && pack) {
      setTimeout(() => {
        new Dialog({
          title: "📦 Debaixo da Pele — Configuração Inicial",
          content: `
            <div style="padding:12px; font-family:'Signika',serif">
              <p style="margin-bottom:8px">As <b>13 macros da campanha</b> (SAN, Aurora, Override, Inventário, Itens utilizáveis...) estão disponíveis no compêndio do módulo.</p>
              <p style="color:#aaa; font-style:italic; font-size:0.9em">Deseja importá-las para sua world agora?</p>
            </div>
          `,
          buttons: {
            sim: {
              icon: '<i class="fas fa-download"></i>',
              label: "Sim, importar macros",
              callback: async () => {
                const docs = await pack.getDocuments();
                let criadas = 0;
                for (const doc of docs) {
                  if (!game.macros.find(m => m.name === doc.name)) {
                    await Macro.create({ name: doc.name, type: doc.type, command: doc.command, img: doc.img });
                    criadas++;
                  }
                }
                await game.settings.set(MODULE_ID, "macrosImportadas", true);
                ui.notifications.info(`✅ ${criadas} macro(s) DDP importada(s) com sucesso!`);
              }
            },
            depois: {
              icon: '<i class="fas fa-clock"></i>',
              label: "Depois",
              callback: () => {}
            }
          },
          default: "sim"
        }).render(true);
      }, 1500);
    }
  }
});
