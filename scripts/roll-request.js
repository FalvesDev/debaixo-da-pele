// ============================================================
// SISTEMA DE SOLICITAÇÃO DE ROLL
// GM solicita testes de habilidade para jogadores específicos
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

const MODULE_ID = "debaixo-da-pele";

// ─── Executa a rolagem para o jogador ─────────────────────
async function _executarRoll(skillName, difficulty, modDados) {
  const actor = game.user.character;
  if (!actor) {
    ui.notifications.warn("Nenhum personagem associado a este usuário.");
    return;
  }

  // Multiplicadores de dificuldade CoC7
  const diffMult = { regular: 1, hard: 0.5, extreme: 0.2 }[difficulty] ?? 1;
  const diffLabel = { regular: "Regular", hard: "Difícil", extreme: "Extremo" }[difficulty] ?? difficulty;

  // Tenta encontrar skill pelo nome no ator
  const skillItem = actor.items.find(i =>
    i.type === "skill" && i.name.toLowerCase() === skillName.toLowerCase()
  );

  if (skillItem) {
    // Usa a rolagem nativa do CoC7 se disponível
    try {
      if (typeof skillItem.roll === "function") {
        await skillItem.roll({ difficulty, modifier: modDados });
        return;
      }
    } catch (err) {
      console.warn("DDP | Falha ao usar skill.roll() nativo:", err);
    }

    // Fallback manual
    const baseValue = skillItem.system?.value ?? 50;
    const alvo = Math.floor(baseValue * diffMult);
    const roll = new Roll("1d100");
    await roll.evaluate({ async: true });
    const r = roll.total;
    const critico = r === 1;
    const fumble  = r >= 96;
    const sucesso = !fumble && r <= alvo;

    const cor = critico ? "#ffdd00" : sucesso ? "#66cc66" : fumble ? "#ff2222" : "#cc4444";
    const label = critico ? "🎯 Crítico!" : sucesso ? "✅ Sucesso" : fumble ? "💀 Fumble!" : "❌ Falha";

    await ChatMessage.create({
      content: `
        <div style="font-family:'Signika',serif; padding:6px;">
          <h3 style="color:#cc8844; margin:0 0 4px;">
            ${actor.name} — ${skillName}
          </h3>
          <p style="margin:2px 0; color:#aaa; font-size:0.85em;">
            Dificuldade: ${diffLabel} · Alvo: <b>${alvo}%</b>
          </p>
          <p style="font-size:1.3em; font-weight:bold; color:${cor}; margin:6px 0 2px;">
            🎲 ${r} — ${label}
          </p>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor }),
      rolls: [roll]
    });
    return;
  }

  // Tenta atributos base (FOR, DES, CON, etc.)
  const charMap = {
    "for": "str", "força": "str", "str": "str",
    "des": "dex", "destreza": "dex", "dex": "dex",
    "con": "con", "constituição": "con",
    "int": "int", "inteligência": "int",
    "tam": "siz", "tamanho": "siz", "siz": "siz",
    "apar": "app", "aparência": "app", "app": "app",
    "pod": "pow", "poder": "pow", "pow": "pow",
    "edu": "edu", "educação": "edu",
    "sort": "lck", "sorte": "lck", "lck": "lck"
  };

  const charKey = charMap[skillName.toLowerCase()];
  if (charKey) {
    const charData = actor.system?.characteristics?.[charKey];
    if (charData) {
      const baseValue = charData.value ?? 50;
      const alvo = Math.floor(baseValue * diffMult);
      const roll = new Roll("1d100");
      await roll.evaluate({ async: true });
      const r = roll.total;
      const sucesso = r <= alvo;
      const cor = sucesso ? "#66cc66" : "#cc4444";
      const label = sucesso ? "✅ Sucesso" : "❌ Falha";

      await ChatMessage.create({
        content: `
          <div style="font-family:'Signika',serif; padding:6px;">
            <h3 style="color:#cc8844; margin:0 0 4px;">${actor.name} — ${skillName.toUpperCase()}</h3>
            <p style="margin:2px 0; color:#aaa; font-size:0.85em;">Dificuldade: ${diffLabel} · Alvo: <b>${alvo}</b></p>
            <p style="font-size:1.3em; font-weight:bold; color:${cor}; margin:6px 0 2px;">🎲 ${r} — ${label}</p>
          </div>
        `,
        speaker: ChatMessage.getSpeaker({ actor }),
        rolls: [roll]
      });
      return;
    }
  }

  // Fallback: d100 genérico
  ui.notifications.warn(`Habilidade "${skillName}" não encontrada. Rolando 1d100.`);
  const roll = new Roll("1d100");
  await roll.evaluate({ async: true });
  await ChatMessage.create({
    content: `<b>${actor.name}</b> rola <i>${skillName}</i>: <b>${roll.total}</b>`,
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: [roll]
  });
}

// ─── Dialog exibido para o JOGADOR ao receber solicitação ──
function _mostrarSolicitacao(data) {
  const { skillName, difficulty = "regular", gmName, nota = "" } = data;
  const diffLabel = { regular: "Regular", hard: "Difícil (½)", extreme: "Extremo (⅕)" }[difficulty] ?? difficulty;
  const diffCor   = { regular: "#aaa", hard: "#ffaa44", extreme: "#ff4444" }[difficulty] ?? "#aaa";

  new Dialog({
    title: "🎲 Solicitação de Teste",
    content: `
      <div style="
        padding:16px;
        font-family:'Signika',serif;
        background: linear-gradient(135deg,#0e0e18,#141420);
        border-radius:6px;
        border: 1px solid #3a1a1a;
      ">
        <p style="color:#cc8844; font-size:0.8em; text-transform:uppercase; letter-spacing:1px; margin:0 0 6px;">
          <i class="fas fa-user-secret"></i> ${gmName ?? "O Narrador"} solicita:
        </p>
        <p style="font-size:1.4em; font-weight:bold; color:#fff; margin:0 0 10px;">
          🎲 ${skillName}
        </p>
        <p style="color:${diffCor}; margin:0 0 4px; font-size:0.9em;">
          Dificuldade: <b>${diffLabel}</b>
        </p>
        ${nota ? `<p style="color:#999; font-style:italic; margin:8px 0 0; border-top:1px solid #2a2a2a; padding-top:8px;">"${nota}"</p>` : ""}
      </div>
    `,
    buttons: {
      rolar: {
        icon: '<i class="fas fa-dice-d20"></i>',
        label: "Rolar",
        callback: () => _executarRoll(skillName, difficulty, data.modDados ?? 0)
      },
      recusar: {
        icon: '<i class="fas fa-times"></i>',
        label: "Recusar",
        callback: () => {
          ChatMessage.create({
            content: `<i>${game.user.character?.name ?? game.user.name} recusou o teste de ${skillName}.</i>`,
            whisper: game.users.contents.filter(u => u.isGM).map(u => u.id)
          });
        }
      }
    },
    default: "rolar"
  }, {
    width: 360,
    classes: ["ddp-dialog", "ddp-roll-request-dialog"]
  }).render(true);
}

// ─── Dialog do GM para solicitar o roll ──────────────────
async function abrirSolicitacaoGM() {
  // Jogadores ativos com personagem
  const jogadores = game.users.contents
    .filter(u => !u.isGM && u.active && u.character)
    .map(u => ({ id: u.id, name: u.name, charName: u.character.name }));

  if (jogadores.length === 0) {
    ui.notifications.warn("Nenhum jogador ativo com personagem associado.");
    return;
  }

  // Coleta skills de todos os personagens ativos
  const skillsSet = new Set();
  for (const j of jogadores) {
    game.users.get(j.id)?.character?.items
      .filter(i => i.type === "skill")
      .forEach(s => skillsSet.add(s.name));
  }
  const skillsBase = [
    "Escuta", "Furtividade", "Medicina", "Psicologia", "Primeiros Socorros",
    "Persuasão", "Intimidação", "Detectar", "Esquivar", "Lutar",
    "Armas de Fogo", "Escalar", "Nadar", "Dirigir", "Direito",
    "Ciências Naturais", "Arqueologia", "Ocultismo", "FOR", "DES", "CON", "SAN", "SORT"
  ];
  const todasSkills = [...new Set([...skillsBase, ...skillsSet])].sort();

  const opJogadores = jogadores
    .map(j => `<option value="${j.id}">${j.name} (${j.charName})</option>`)
    .join("");
  const datalistOptions = todasSkills
    .map(s => `<option value="${s}">`)
    .join("");

  new Dialog({
    title: "🎲 Solicitar Teste — Jogadores",
    content: `
      <div class="ddp-form" style="padding:14px; font-family:'Signika',serif; color:#ddd;">
        <div class="form-group" style="display:flex; align-items:center; gap:8px; margin:6px 0;">
          <label style="width:110px; color:#bbb;">Jogador</label>
          <select id="ddp-rr-target" style="flex:1; background:#111; color:#ddd; border:1px solid #444; padding:4px; border-radius:3px;">
            <option value="all">— Todos os jogadores —</option>
            ${opJogadores}
          </select>
        </div>
        <div class="form-group" style="display:flex; align-items:center; gap:8px; margin:6px 0;">
          <label style="width:110px; color:#bbb;">Habilidade</label>
          <input id="ddp-rr-skill" list="ddp-rr-skills"
            style="flex:1; background:#111; color:#fff; border:1px solid #444; padding:4px; border-radius:3px;"
            placeholder="ex: Escuta, FOR, Medicina..." autocomplete="off" />
          <datalist id="ddp-rr-skills">${datalistOptions}</datalist>
        </div>
        <div class="form-group" style="display:flex; align-items:center; gap:8px; margin:6px 0;">
          <label style="width:110px; color:#bbb;">Dificuldade</label>
          <select id="ddp-rr-diff" style="flex:1; background:#111; color:#ddd; border:1px solid #444; padding:4px; border-radius:3px;">
            <option value="regular">Regular</option>
            <option value="hard">Difícil (½ do valor)</option>
            <option value="extreme">Extremo (⅕ do valor)</option>
          </select>
        </div>
        <div class="form-group" style="display:flex; align-items:center; gap:8px; margin:6px 0;">
          <label style="width:110px; color:#bbb;">Nota (opcional)</label>
          <input id="ddp-rr-nota" type="text"
            style="flex:1; background:#111; color:#ddd; border:1px solid #444; padding:4px; border-radius:3px;"
            placeholder="Contexto para o jogador..." />
        </div>
      </div>
    `,
    buttons: {
      enviar: {
        icon: '<i class="fas fa-paper-plane"></i>',
        label: "Solicitar",
        callback: (html) => {
          const targetId  = html.find("#ddp-rr-target").val();
          const skillName = html.find("#ddp-rr-skill").val().trim();
          const difficulty = html.find("#ddp-rr-diff").val();
          const nota       = html.find("#ddp-rr-nota").val().trim();

          if (!skillName) {
            ui.notifications.warn("Informe a habilidade ou atributo.");
            return;
          }

          const targets = targetId === "all"
            ? jogadores.map(j => j.id)
            : [targetId];

          for (const uid of targets) {
            game.socket.emit(`module.${MODULE_ID}`, {
              action:       "solicitarRoll",
              targetUserId: uid,
              skillName,
              difficulty,
              nota,
              gmName: game.user.name
            });
          }

          ui.notifications.info(
            `🎲 Teste de "${skillName}" solicitado para ${targets.length} jogador(es).`
          );
        }
      },
      cancelar: { label: "Cancelar" }
    },
    default: "enviar"
  }, {
    width: 430,
    classes: ["ddp-dialog"]
  }).render(true);
}

// ─── Handler para o evento recebido via socket ───────────
function _onRollRequest(data) {
  if (game.user.isGM) return;
  if (data.targetUserId !== game.user.id) return;
  _mostrarSolicitacao(data);
}

// ─── Hooks ────────────────────────────────────────────────
Hooks.once("ready", () => {
  window.DebaixoDaPele = {
    ...(window.DebaixoDaPele ?? {}),
    solicitarRoll: abrirSolicitacaoGM
  };
  Hooks.on("ddp:rollRequest", _onRollRequest);
});

// Botão na barra de controles de cena (apenas GM)
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;
  const tokenControls = controls.find(c => c.name === "token");
  if (!tokenControls) return;

  tokenControls.tools.push({
    name:    "ddp-roll-request",
    title:   "Solicitar Teste — Jogadores",
    icon:    "fas fa-dice-d20",
    visible: true,
    onClick: () => abrirSolicitacaoGM(),
    button:  true
  });
});
