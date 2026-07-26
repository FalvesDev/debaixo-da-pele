// ============================================================
// DEBAIXO DA PELE — Módulo Principal
// Call of Cthulhu 7e | Foundry VTT v11/v12
// ============================================================

import "./aurora-system.js";
import "./token-hud.js";
import "./inventory-dialog.js";
import "./party-frame.js";
import "./status-auto.js";
import "./gm-panel.js";
import "./campaign-panel.js";
import "./player-hud.js";
import "./roll-request.js";
import { handleTransferSocket } from "./item-transfer.js";
import { DDPVehicleSheet } from "./vehicle-sheet.js";

const MODULE_ID = "debaixo-da-pele";
const VERSION   = "1.8.0";

// ─── SETTINGS ───────────────────────────────────────────────
Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Inicializando módulo Debaixo da Pele...`);

  // Pré-carrega templates da ficha de veículo
  loadTemplates(["modules/debaixo-da-pele/templates/vehicle-sheet.html"]);

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
  // Versão do setup automático — quando sobe, o ready re-sincroniza o que faltar
  game.settings.register(MODULE_ID, "setupVersion", {
    name: "Versão do setup automático",
    scope: "world", config: false, type: Number, default: 0
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

  // Player HUD (por jogador)
  game.settings.register(MODULE_ID, "playerHudVisible", {
    name: "Player HUD — Barra HP/SAN visível",
    scope: "client", config: true, type: Boolean, default: true
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
  // Roster visível no painel — gerenciado pelo GM, lido por todos
  game.settings.register(MODULE_ID, "partyRoster", {
    scope: "world", config: false, type: Object, default: { actors: [] }
  });
});

// ─── SOCKET — Revelações em tempo real ──────────────────────
// Registrado no ready: game.socket garantido disponível em v11/v12
// (setup usa optional-chain silencioso; ready é o momento seguro)

async function _handleSocket(data) {
  // Delega transferências de itens para o módulo especializado
  if (data.action?.startsWith("itemTransfer")) {
    await handleTransferSocket(data);
    return;
  }

  switch (data.action) {
    case "revelarComposto": {
      // Refresh visual para todos os clientes
      setTimeout(() => {
        if (canvas?.ready) canvas.tokens?.placeables.forEach(t => t.refresh?.());
      }, 400);
      // Popup apenas para jogadores — o GM já vê confirmação local no painel
      if (game.user.isGM) break;
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
      // GM emite o socket — não precisa receber de volta
      if (game.user.isGM) break;
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
      // Apenas o GM cria a mensagem no servidor (evita N duplicatas)
      if (!game.user.isGM) break;
      await ChatMessage.create({ content: data.conteudo, whisper: [] });
      break;
    }
    case "solicitarRoll": {
      // Dispara hook — roll-request.js filtra por targetUserId
      Hooks.callAll("ddp:rollRequest", data);
      break;
    }
    case "criarOperador": {
      // Só o GM cria de fato (jogadores não têm permissão de criar atores).
      if (!game.user.isGM) break;
      await criarOperadorECorp(data.classe, data.nome, data.ownerId);
      break;
    }
  }
}

// ─── Criador de Operador E CORP (compartilhado GM/socket) ───
async function criarOperadorECorp(classe, nomeCustom, ownerId) {
  const pack = game.packs.get(`${MODULE_ID}.ecorp-actors`);
  if (!pack) { ui.notifications.error("Compendium de operadores E CORP não encontrado."); return null; }

  await pack.getIndex();
  const docs = await pack.getDocuments();
  const doc = docs.find(d => (d.flags?.[MODULE_ID]?.ecorp?.classe) === classe);
  if (!doc) { ui.notifications.error(`Operador da classe ${classe} não encontrado.`); return null; }

  const dados = doc.toObject();
  delete dados._id;
  if (nomeCustom) dados.name = nomeCustom;
  const owner = ownerId ?? game.user.id;
  dados.ownership = { default: 0, [owner]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };

  try {
    const ator = await Actor.create(dados);
    const nomeJogador = game.users.get(owner)?.name ?? "—";
    ui.notifications.info(`✅ ${ator.name} criado para ${nomeJogador}.`);
    // Abre a ficha para quem pediu (o GM abre local; o dono abre via refresh próprio)
    if (owner === game.user.id) ator.sheet.render(true);
    return ator;
  } catch (e) {
    console.error(`${MODULE_ID} | Falha ao criar operador:`, e);
    ui.notifications.error(`Falha ao criar operador: ${e.message}`);
    return null;
  }
}

// ─── READY ──────────────────────────────────────────────────
Hooks.once("ready", () => {
  game.socket.on(`module.${MODULE_ID}`, _handleSocket);
  console.log(`${MODULE_ID} | Debaixo da Pele v${VERSION} pronto.`);

  if (game.user.isGM) {
    const dias = game.settings.get(MODULE_ID, "geradorDias");
    if (dias <= 1) {
      ui.notifications.error(`⚡ GERADOR CRÍTICO: ${dias} dia(s) restante(s)!`, { permanent: true });
    } else if (dias <= 3) {
      ui.notifications.warn(`⚠️ Gerador: ${dias} dia(s) restante(s).`);
    }
  }

  // Merge com o que status-auto.js e inventory-dialog.js já registraram
  window.DebaixoDaPele = {
    ...(window.DebaixoDaPele ?? {}),
    MODULE_ID,
    version:    VERSION,
    emitSocket:  (data) => game.socket?.emit(`module.${MODULE_ID}`, data),
    abrirVeiculo: (actorId) => DDPVehicleSheet.open(actorId),
    criarOperador: criarOperadorECorp
  };

  // ── Setup automático (GM, uma vez) ──
  // Importa todas as macros da campanha, dá acesso de execução aos jogadores
  // e garante o macro "Criar Operador E CORP" na hotbar. Sem perguntar.
  if (game.user.isGM) setupAutomatico();
});

// Sobe este número sempre que o conteúdo do setup mudar (novas macros etc.).
// Worlds antigas com setupVersion menor re-sincronizam sozinhas no ready.
const SETUP_VERSION = 2;

async function setupAutomatico() {
  const pack = game.packs.get(`${MODULE_ID}.macros`);
  if (!pack) return;

  const versaoAtual = game.settings.get(MODULE_ID, "setupVersion");
  if (versaoAtual >= SETUP_VERSION) return;  // já sincronizado nesta versão

  try {
    const docs = await pack.getDocuments();
    const OBS = CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER;
    let criadas = 0, atualizadas = 0, criarOperadorMacro = null;

    for (const doc of docs) {
      let macro = game.macros.find(m => m.name === doc.name);
      if (!macro) {
        // Cria a macro que falta
        macro = await Macro.create({
          name: doc.name, type: doc.type, command: doc.command, img: doc.img,
          ownership: { default: OBS }  // jogadores podem ver/executar
        });
        criadas++;
      } else {
        // Já existe: garante conteúdo atualizado + acesso de execução aos jogadores
        const patch = {};
        if (macro.command !== doc.command) patch.command = doc.command;
        if ((macro.ownership?.default ?? 0) < OBS) patch["ownership.default"] = OBS;
        if (Object.keys(patch).length) { await macro.update(patch); atualizadas++; }
      }
      if (doc.name.startsWith("14 —")) criarOperadorMacro = macro;
    }

    // Fixa o criador de operador no primeiro slot livre da hotbar (se não estiver)
    if (criarOperadorMacro) {
      const ocupado = new Set(game.user.getHotbarMacros().map(h => h.macro?.id).filter(Boolean));
      if (!ocupado.has(criarOperadorMacro.id)) {
        let slot = 1;
        while (slot <= 50 && game.user.hotbar[slot]) slot++;
        if (slot <= 50) await game.user.assignHotbarMacro(criarOperadorMacro, slot);
      }
    }

    await game.settings.set(MODULE_ID, "macrosImportadas", true);
    await game.settings.set(MODULE_ID, "setupVersion", SETUP_VERSION);

    if (criadas > 0 || atualizadas > 0) {
      ui.notifications.info(`✅ Debaixo da Pele: ${criadas} macro(s) instalada(s), ${atualizadas} atualizada(s). Criador de operadores na barra de macros.`);
    }
  } catch (err) {
    console.error(`${MODULE_ID} | Erro no setup automático:`, err);
  }
}
