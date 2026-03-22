// ============================================================
// AURORA SYSTEM — Painel integrado na ficha CoC7
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

const MODULE_ID = "debaixo-da-pele";

// ─── Definição das fases ──────────────────────────────────────
export const AURORA_FASES = [
  {
    id: 0, min: 0, max: 2,
    label: "Sem Sintomas", icone: "🟢", cor: "#a0ffa0",
    descricao: "Nenhuma alteração detectável. Composto não ativou processos visíveis.",
    efeitos: [],
    penalidades: { mental: 0, fisico: 0, hpBonus: 0, strBonus: 0 },
    sanEntrada: 0
  },
  {
    id: 1, min: 2.01, max: 4,
    label: "Sintomas Leves", icone: "⚠️", cor: "#ffffa0",
    descricao: "Cicatrização acelerada, insônia persistente. Calor interno e sede aumentada.",
    efeitos: [
      "Cura natural: +1 PV extra por descanso completo",
      "Sonhos perturbadores — SAN check ao acordar (custo: 0)"
    ],
    penalidades: { mental: 0, fisico: 0, hpBonus: 0, strBonus: 0 },
    sanEntrada: 0
  },
  {
    id: 2, min: 4.01, max: 6,
    label: "Sintomas Moderados", icone: "🟠", cor: "#ffb347",
    descricao: "Cicatrizes desaparecendo, textura da pele endurecendo. Olhos levemente opacos.",
    efeitos: [
      "−5 SAN (única vez ao entrar nesta fase)",
      "−5% em todas as perícias mentais"
    ],
    penalidades: { mental: -5, fisico: 0, hpBonus: 0, strBonus: 0 },
    sanEntrada: 5
  },
  {
    id: 3, min: 6.01, max: 8,
    label: "Sintomas Graves", icone: "🔴", cor: "#ff6b6b",
    descricao: "Alterações morfológicas visíveis. Musculatura anormal, reflexos acelerados.",
    efeitos: [
      "+2 HP máximo (Active Effect aplicado automaticamente)",
      "−10% em todas as perícias mentais",
      "APP reduzida em 20 pontos — aparência notavelmente alterada"
    ],
    penalidades: { mental: -10, fisico: 0, hpBonus: 2, strBonus: 0 },
    sanEntrada: 0
  },
  {
    id: 4, min: 8.01, max: 99,
    label: "TRANSFORMAÇÃO", icone: "💀", cor: "#cc0000",
    descricao: "Transformação iniciada. Controle voluntário progressivamente perdido.",
    efeitos: [
      "+4 HP máximo (Active Effect)",
      "+10 STR (Active Effect)",
      "−20% em TODAS as perícias",
      "Personagem progressivamente não jogável — intervenção do GM"
    ],
    penalidades: { mental: -20, fisico: -20, hpBonus: 4, strBonus: 10 },
    sanEntrada: 0
  }
];

export function getFaseAurora(nivel) {
  return AURORA_FASES.find(f => nivel >= f.min && nivel <= f.max) ?? AURORA_FASES[0];
}

// ─── Inject panel no renderActorSheet ────────────────────────
Hooks.on("renderActorSheet", (sheet, html, _data) => {
  if (sheet.actor?.type !== "character") return;
  // Jogadores só veem o painel Aurora se o GM já revelou o Composto
  const podeVer = game.user.isGM || game.settings.get(MODULE_ID, "auroraVisivelJogadores");
  if (!podeVer) return;
  _injectAuroraPanel(sheet, html);
});

function _injectAuroraPanel(sheet, html) {
  const actor  = sheet.actor;
  const nivel  = actor.getFlag(MODULE_ID, "aurora") ?? 0;
  const fase   = getFaseAurora(nivel);
  const mascaraTipo = actor.getFlag(MODULE_ID, "mascara_tipo") ?? "nenhuma";
  const collapsed  = actor.getFlag(MODULE_ID, "aurora_panel_collapsed") ?? false;

  const MASCARA_INFO = {
    nenhuma:   { label: "Sem proteção",      cor: "#666",    icone: "❌" },
    cirurgica: { label: "Máscara Cirúrgica", cor: "#88aacc", icone: "😷" },
    n95:       { label: "Respirador N95",    cor: "#aaccaa", icone: "😷" },
    gas_civil: { label: "Gás Civil",         cor: "#44aaff", icone: "🛡️" },
    gas_esp:   { label: "Gás Especializado", cor: "#a0ffa0", icone: "🛡️" }
  };
  const mascInfo = MASCARA_INFO[mascaraTipo] ?? MASCARA_INFO.nenhuma;

  const pct = Math.min(nivel / 10 * 100, 100);

  // Badges de penalidade
  const badges = [];
  if (fase.penalidades.mental  !== 0) badges.push(`<span class="ddp-badge ddp-badge-neg">Mentais ${fase.penalidades.mental}%</span>`);
  if (fase.penalidades.fisico  !== 0) badges.push(`<span class="ddp-badge ddp-badge-neg">Físicas ${fase.penalidades.fisico}%</span>`);
  if (fase.penalidades.hpBonus !== 0) badges.push(`<span class="ddp-badge ddp-badge-pos">HP max +${fase.penalidades.hpBonus}</span>`);
  if (fase.penalidades.strBonus !== 0) badges.push(`<span class="ddp-badge ddp-badge-pos">STR +${fase.penalidades.strBonus}</span>`);

  const efeitosHtml = fase.efeitos.length
    ? fase.efeitos.map(e => `<li>${e}</li>`).join("")
    : `<li style="color:#555; font-style:italic">Nenhum efeito mecânico ativo.</li>`;

  const panelHtml = `
    <div class="ddp-aurora-panel ${collapsed ? "ddp-collapsed" : ""}"
         id="ddp-aurora-${actor.id}" data-actor-id="${actor.id}" data-fase="${fase.id}">

      <!-- ── Cabeçalho clicável ── -->
      <div class="ddp-aurora-header ddp-aurora-toggle" style="--fase-cor: ${fase.cor}">
        <span class="ddp-aurora-icone">${fase.icone}</span>
        <div class="ddp-aurora-info">
          <span class="ddp-aurora-title">Composto Aurora</span>
          <span class="ddp-aurora-fase-label" style="color:${fase.cor}">${fase.label}</span>
        </div>
        <div class="ddp-aurora-level-badge" style="border-color:${fase.cor}; color:${fase.cor}">
          ${nivel}<span style="font-size:0.6em; color:#888">/10</span>
        </div>
        <i class="fas ${collapsed ? "fa-chevron-down" : "fa-chevron-up"} ddp-chevron"></i>
      </div>

      <!-- ── Conteúdo expansível ── -->
      <div class="ddp-aurora-body">

        <!-- Barra de progresso -->
        <div class="ddp-aurora-bar-wrap">
          <div class="ddp-aurora-bar-bg">
            <div class="ddp-aurora-bar-fill" style="width:${pct}%; background:${fase.cor}"></div>
            <!-- Marcadores de fase -->
            <div class="ddp-aurora-bar-marker" style="left:20%"></div>
            <div class="ddp-aurora-bar-marker" style="left:40%"></div>
            <div class="ddp-aurora-bar-marker" style="left:60%"></div>
            <div class="ddp-aurora-bar-marker" style="left:80%"></div>
          </div>
          <div class="ddp-aurora-bar-labels">
            <span>0</span><span>2</span><span>4</span><span>6</span><span>8</span><span>10</span>
          </div>
        </div>

        <!-- Descrição -->
        <p class="ddp-aurora-desc">${fase.descricao}</p>

        <!-- Efeitos e penalidades -->
        <div class="ddp-aurora-efeitos-wrap">
          <span class="ddp-section-label">Efeitos ativos</span>
          <ul class="ddp-aurora-efeitos">${efeitosHtml}</ul>
          ${badges.length ? `<div class="ddp-badges-row">${badges.join("")}</div>` : ""}
        </div>

        <!-- Penalidade de rolagem visível -->
        ${(fase.penalidades.mental !== 0 || fase.penalidades.fisico !== 0) ? `
          <div class="ddp-roll-warn">
            <i class="fas fa-dice-d20"></i>
            Lembre: aplicar
            ${fase.penalidades.mental !== 0 ? `<b>${fase.penalidades.mental}% em perícias mentais</b>` : ""}
            ${fase.penalidades.fisico !== 0 ? `<b>${fase.penalidades.fisico}% em perícias físicas</b>` : ""}
            nas rolagens.
          </div>
        ` : ""}

        <!-- Proteção ativa -->
        <div class="ddp-mascara-row">
          <span class="ddp-section-label">Proteção</span>
          <span class="ddp-mascara-badge" style="border-color:${mascInfo.cor}; color:${mascInfo.cor}">
            ${mascInfo.icone} ${mascInfo.label}
          </span>
        </div>

        <!-- Controles -->
        <div class="ddp-aurora-controls">
          <div class="ddp-aurora-adj-row">
            <button class="ddp-adj-btn" data-delta="-1" title="−1 exposição">−1</button>
            <button class="ddp-adj-btn" data-delta="-0.5" title="−½ exposição">−½</button>
            <input class="ddp-aurora-input" type="number" value="${nivel}" min="0" max="10" step="0.5"/>
            <button class="ddp-adj-btn ddp-adj-add" data-delta="0.5" title="+½ exposição">+½</button>
            <button class="ddp-adj-btn ddp-adj-add" data-delta="1" title="+1 exposição">+1</button>
          </div>
          <div class="ddp-aurora-btns-row">
            <button class="ddp-action-btn ddp-btn-aplicar" title="Aplicar alteração">
              <i class="fas fa-save"></i> Aplicar
            </button>
            <button class="ddp-action-btn ddp-btn-mascara-toggle" title="Trocar máscara">
              <i class="fas fa-shield-alt"></i> Máscara
            </button>
            <button class="ddp-action-btn ddp-btn-san" title="Teste de Sanidade">
              <i class="fas fa-brain"></i> SAN
            </button>
          </div>
        </div>

      </div><!-- /ddp-aurora-body -->
    </div>
  `;

  // Remove painel duplicado e injeta
  html.find(`#ddp-aurora-${actor.id}`).remove();

  // Procura o ponto de inserção na ficha CoC7.
  // Atenção: jQuery.find() nunca retorna falsy (set vazio é truthy),
  // por isso verificamos .length antes de usar ||.
  const alvo = (() => {
    for (const sel of [
      '.tab[data-tab="main"]',
      '.tab[data-tab="skills"]',
      '.sheet-body .tab.active',
      '.sheet-body'
    ]) {
      const el = html.find(sel);
      if (el.length) return el.first();
    }
    return html;
  })();
  alvo.prepend(panelHtml);

  // ─── Eventos ─────────────────────────────────────────────────
  const panel = html.find(`#ddp-aurora-${actor.id}`);

  // Toggle colapsar/expandir
  panel.find(".ddp-aurora-toggle").on("click", async (e) => {
    if ($(e.target).closest("button, input").length) return;
    const isCollapsed = panel.hasClass("ddp-collapsed");
    await actor.setFlag(MODULE_ID, "aurora_panel_collapsed", !isCollapsed);
    panel.toggleClass("ddp-collapsed");
    panel.find(".ddp-chevron").toggleClass("fa-chevron-up fa-chevron-down");
  });

  // Botões +/-
  panel.find(".ddp-adj-btn[data-delta]").on("click", async (e) => {
    const delta   = parseFloat(e.currentTarget.dataset.delta);
    const atual   = actor.getFlag(MODULE_ID, "aurora") ?? 0;
    const nova    = Math.max(0, Math.min(10, parseFloat((atual + delta).toFixed(1))));
    panel.find(".ddp-aurora-input").val(nova);
    await _setAurora(actor, nova, sheet);
  });

  // Input direto + Enter
  panel.find(".ddp-aurora-input").on("keydown", async (e) => {
    if (e.key === "Enter") {
      const nova = Math.max(0, Math.min(10, parseFloat(e.target.value) || 0));
      await _setAurora(actor, nova, sheet);
    }
  });

  // Botão Aplicar
  panel.find(".ddp-btn-aplicar").on("click", async () => {
    const nova = Math.max(0, Math.min(10, parseFloat(panel.find(".ddp-aurora-input").val()) || 0));
    await _setAurora(actor, nova, sheet);
  });

  // Botão Máscara
  panel.find(".ddp-btn-mascara-toggle").on("click", () => {
    _executarMacro(actor, ["13", "mascara", "Máscara"]);
  });

  // Botão SAN
  panel.find(".ddp-btn-san").on("click", () => {
    _executarMacro(actor, ["01", "san", "SAN", "Sanidade"]);
  });
}

// ─── Aplica nova exposição e efeitos ─────────────────────────
async function _setAurora(actor, nova, sheet) {
  const anterior = actor.getFlag(MODULE_ID, "aurora") ?? 0;
  await actor.setFlag(MODULE_ID, "aurora", nova);
  await _aplicarEfeitosAtivos(actor, nova, anterior);
  sheet.render(false);
}

// ─── Gerencia Active Effects por fase ────────────────────────
async function _aplicarEfeitosAtivos(actor, nivel, anterior) {
  // Apenas o GM escreve Active Effects — evita duplicatas quando jogador
  // tem ownership e abre a ficha ao mesmo tempo que o GM.
  if (!game.user.isGM) return;

  const fase         = getFaseAurora(nivel);
  const faseAnterior = getFaseAurora(anterior);

  // Só processa se mudou de fase
  if (fase.id === faseAnterior.id) return;

  // Remove Active Effects de Aurora anteriores
  const efExistentes = actor.effects.filter(e => e.flags?.[MODULE_ID]?.aurora === true);
  await Promise.all(efExistentes.map(e => e.delete()));

  // Fase 0 ou 1: sem Active Effects
  if (fase.id <= 1) {
    _notificarMudancaFase(actor, faseAnterior, fase);
    return;
  }

  const novosEfeitos = [];

  // HP max bonus (fases 3 e 4)
  if (fase.penalidades.hpBonus > 0) {
    novosEfeitos.push({
      name: `Aurora — HP Max +${fase.penalidades.hpBonus} (${fase.label})`,
      icon: "modules/debaixo-da-pele/assets/icons/mascara-gas-especial.svg",
      changes: [{
        key: "system.attribs.hp.max",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: String(fase.penalidades.hpBonus),
        priority: 20
      }],
      flags: { [MODULE_ID]: { aurora: true, tipo: "hp_bonus" } }
    });
  }

  // STR bonus (fase 4)
  if (fase.penalidades.strBonus > 0) {
    novosEfeitos.push({
      name: `Aurora — STR +${fase.penalidades.strBonus} (${fase.label})`,
      icon: "modules/debaixo-da-pele/assets/icons/mascara-gas-especial.svg",
      changes: [{
        key: "system.characteristics.str.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: String(fase.penalidades.strBonus),
        priority: 20
      }],
      flags: { [MODULE_ID]: { aurora: true, tipo: "str_bonus" } }
    });
  }

  // APP penalty (fase 3+): −20 APP
  if (fase.id >= 3) {
    novosEfeitos.push({
      name: `Aurora — APP −20 (aparência alterada)`,
      icon: "modules/debaixo-da-pele/assets/icons/mascara-gas-especial.svg",
      changes: [{
        key: "system.characteristics.app.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "-20",
        priority: 20
      }],
      flags: { [MODULE_ID]: { aurora: true, tipo: "app_penalty" } }
    });
  }

  if (novosEfeitos.length > 0) {
    await actor.createEmbeddedDocuments("ActiveEffect", novosEfeitos);
  }

  // Penalidade de SAN única ao entrar na Fase 2
  if (fase.id === 2 && !actor.getFlag(MODULE_ID, "aurora_fase2_san_ok")) {
    const sanAtual = actor.system?.attribs?.san?.value ?? 0;
    const novaSan  = Math.max(0, sanAtual - fase.sanEntrada);
    await actor.update({ "system.attribs.san.value": novaSan });
    await actor.setFlag(MODULE_ID, "aurora_fase2_san_ok", true);
    await ChatMessage.create({
      content: `
        <div style="border-left:4px solid #ffb347; padding:8px 12px; background:#1a1a2e">
          🟠 <b>Aurora — Fase 2 atingida: ${actor.name}</b><br>
          Mutações epiteliais detectadas. Perda automática de <b>${fase.sanEntrada} SAN</b>.<br>
          <span style="color:#888">SAN: ${sanAtual} → ${novaSan}</span>
        </div>
      `
    });
  }

  _notificarMudancaFase(actor, faseAnterior, fase);
}

function _notificarMudancaFase(actor, anterior, nova) {
  if (nova.id === anterior.id) return;
  // Apenas o GM cria a mensagem — evita duplicatas quando múltiplos clientes
  // têm a ficha aberta e todos chamam _setAurora simultaneamente.
  if (!game.user.isGM) return;
  const subindo = nova.id > anterior.id;

  ChatMessage.create({
    content: `
      <div style="border-left:4px solid ${nova.cor}; padding:8px 12px; background:#1a1a2e">
        ${nova.icone} <b style="color:${nova.cor}">Aurora — ${actor.name}</b><br>
        ${subindo ? "⬆️" : "⬇️"} ${anterior.label} → <b style="color:${nova.cor}">${nova.label}</b><br>
        <span style="color:#aaa; font-size:0.9em">${nova.descricao}</span>
        ${nova.efeitos.length ? `
          <ul style="margin:6px 0 0 16px; color:#888; font-size:0.85em">
            ${nova.efeitos.map(e => `<li>${e}</li>`).join("")}
          </ul>` : ""}
      </div>
    `
  }).catch(err => console.error("DDP | Erro ao criar ChatMessage de fase Aurora:", err));

  // Alerta GM em transformação total
  if (nova.id === 4 && game.user.isGM) {
    ui.notifications.error(`💀 ${actor.name}: TRANSFORMAÇÃO INICIADA (Aurora ${actor.getFlag(MODULE_ID, "aurora")})`, {
      permanent: true
    });
  }
}

// ─── Helper: executa macro pelo nome parcial ─────────────────
function _executarMacro(actor, terminos) {
  const macro = game.macros.find(m =>
    terminos.some(t => m.name.toLowerCase().includes(t.toLowerCase()))
  );
  if (!macro) {
    return ui.notifications.warn(`Macro não encontrada. Termos buscados: ${terminos.join(", ")}`);
  }
  // Selecionar token do ator na cena para contexto
  if (canvas?.ready) {
    const token = canvas.tokens?.placeables?.find(t => t.actor?.id === actor.id);
    if (token) token.control({ releaseOthers: true });
  }
  macro.execute();
}

// ─── Hook: roll interception (exibir aviso de penalidade) ────
// Quando CoC7 abre um dialog de rolagem de perícia, injetamos
// um aviso visual se o ator tiver penalidade de Aurora ativa.
Hooks.on("renderChatMessage", (_msg, html, _data) => {
  // Marca mensagens de Aurora com estilo especial
  if (html.find(".ddp-aurora-panel").length) {
    html.addClass("ddp-aurora-chat");
  }
});

// Aviso ao abrir rolagem de habilidade no CoC7
Hooks.on("renderDialog", (dialog, html, _data) => {
  if (!dialog.title?.toLowerCase().includes("roll") &&
      !dialog.title?.toLowerCase().includes("rola") &&
      !dialog.title?.toLowerCase().includes("skill")) return;

  const token = canvas.tokens?.controlled?.[0];
  if (!token?.actor) return;

  const nivel = token.actor.getFlag(MODULE_ID, "aurora") ?? 0;
  const fase  = getFaseAurora(nivel);
  if (fase.penalidades.mental === 0 && fase.penalidades.fisico === 0) return;

  const aviso = `
    <div class="ddp-roll-aurora-warn" style="
      border-left:3px solid ${fase.cor};
      background:#1a1a1a; padding:6px 10px;
      margin:6px 0; border-radius:4px;
      font-size:0.85em; color:#aaa
    ">
      ${fase.icone} <b style="color:${fase.cor}">Aurora Fase ${fase.id}</b> —
      ${fase.penalidades.mental !== 0 ? `Mentais: <b>${fase.penalidades.mental}%</b>` : ""}
      ${fase.penalidades.fisico !== 0 ? ` | Físicas: <b>${fase.penalidades.fisico}%</b>` : ""}
    </div>
  `;

  html.find("form").prepend(aviso);
});
