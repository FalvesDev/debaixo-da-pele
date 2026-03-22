// ============================================================
// TOKEN HUD — Barras HP / SAN / Aurora sobre os tokens
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

const MODULE_ID  = "debaixo-da-pele";
const HUD_KEY    = "_ddpHud";
const BAR_HEIGHT = 5;
const BAR_GAP    = 2;
const STEP       = BAR_HEIGHT + BAR_GAP;

// ─── Dados do ator para o HUD ──────────────────────────────
function _getData(token) {
  const actor = token.actor;
  if (!actor || actor.type !== "character") return null;

  const hp    = actor.system?.attribs?.hp  ?? { value: 10, max: 10 };
  const san   = actor.system?.attribs?.san ?? { value: 50, max: 99 };
  const aurora = actor.getFlag(MODULE_ID, "aurora") ?? 0;

  const hpPct  = Math.max(0, Math.min(1, hp.value  / Math.max(1, hp.max)));
  const sanPct = Math.max(0, Math.min(1, san.value / Math.max(1, san.max ?? 99)));
  const aurPct = Math.max(0, Math.min(1, aurora / 10));

  // HP: verde → laranja → vermelho
  const hpColor = hpPct > 0.5 ? 0x44bb44 : hpPct > 0.25 ? 0xffaa00 : 0xdd2222;

  // SAN: azul → roxo → quase preto
  const sanColor = sanPct > 0.5 ? 0x4466dd : sanPct > 0.25 ? 0x6633aa : 0x220044;

  // Aurora: verde → amarelo → laranja → vermelho → carmesim
  const aurColor = aurora <= 2  ? 0x44bb44
                 : aurora <= 4  ? 0xaaaa00
                 : aurora <= 6  ? 0xff8800
                 : aurora <= 8  ? 0xff3300
                 :                0x990000;

  return { hp, san, aurora, hpPct, sanPct, aurPct, hpColor, sanColor, aurColor };
}

// ─── Desenha uma barra PIXI ────────────────────────────────
function _drawBar(x, y, width, pct, fillColor) {
  const g = new PIXI.Graphics();
  const w = Math.max(4, width);

  // Fundo semitransparente
  g.beginFill(0x000000, 0.55);
  g.drawRoundedRect(x, y, w, BAR_HEIGHT, 2);
  g.endFill();

  // Borda sutil
  g.lineStyle(0.5, 0x000000, 0.4);
  g.drawRoundedRect(x, y, w, BAR_HEIGHT, 2);
  g.lineStyle(0);

  // Fill colorido
  const fillWidth = Math.max(0, (w - 2) * pct);
  if (fillWidth > 0) {
    g.beginFill(fillColor, 0.92);
    g.drawRoundedRect(x + 1, y + 1, fillWidth, BAR_HEIGHT - 2, 1);
    g.endFill();
  }

  return g;
}

// ─── Desenha label de valor ────────────────────────────────
function _drawLabel(text, x, y) {
  const t = new PIXI.Text(String(text), {
    fontFamily: "Arial",
    fontSize:   8,
    fill:       0xeeeeee,
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowDistance: 1,
    dropShadowBlur: 2
  });
  t.position.set(x, y);
  t.resolution = 2;
  return t;
}

// ─── Desenha o HUD completo no token ──────────────────────
function _drawHUD(token) {
  if (!game.settings.get(MODULE_ID, "tokenHudEnabled")) return;

  // Remove HUD anterior
  if (token[HUD_KEY]) {
    try { token.removeChild(token[HUD_KEY]); } catch (_) {}
    token[HUD_KEY].destroy({ children: true });
    delete token[HUD_KEY];
  }

  const data = _getData(token);
  if (!data) return;

  // Visibilidade condicional para jogadores
  const isGM           = game.user.isGM;
  const hpSanVisivel   = isGM || game.settings.get(MODULE_ID, "hpSanVisivelJogadores");
  const auroraVisivel  = isGM || game.settings.get(MODULE_ID, "auroraVisivelJogadores");
  if (!hpSanVisivel && !auroraVisivel) return; // Nada para mostrar

  const container = new PIXI.Container();
  container.name  = HUD_KEY;

  const W = token.w || canvas.grid?.size || 100;

  const lblStyle = {
    fontFamily: "Arial", fontSize: 7,
    fill: 0x999999,
    dropShadow: true, dropShadowColor: 0x000000,
    dropShadowDistance: 1, dropShadowBlur: 1
  };

  let barSlot = 1;

  // ── HP bar ──
  if (hpSanVisivel) {
    const hpY = -(STEP * barSlot++);
    container.addChild(_drawBar(0, hpY, W, data.hpPct, data.hpColor));
    container.addChild(_drawLabel(`${data.hp.value}`, W - 14, hpY - 1));
    const lblHP = new PIXI.Text("HP", lblStyle);
    lblHP.position.set(1, hpY - 1); lblHP.resolution = 2;
    container.addChild(lblHP);
  }

  // ── SAN bar ──
  if (hpSanVisivel) {
    const sanY = -(STEP * barSlot++);
    container.addChild(_drawBar(0, sanY, W, data.sanPct, data.sanColor));
    container.addChild(_drawLabel(`${data.san.value}`, W - 18, sanY - 1));
    const lblSAN = new PIXI.Text("SAN", lblStyle);
    lblSAN.position.set(1, sanY - 1); lblSAN.resolution = 2;
    container.addChild(lblSAN);
  }

  // ── Aurora mini-bar (só se revelado) ──
  if (auroraVisivel) {
    const aurY = -(STEP * barSlot++);
    container.addChild(_drawBar(0, aurY, W, data.aurPct, data.aurColor));
    if (data.aurora > 0) container.addChild(_drawLabel(`A${data.aurora}`, W - 20, aurY - 1));
    const lblAUR = new PIXI.Text("☣", { ...lblStyle, fontSize: 7, fill: data.aurColor });
    lblAUR.position.set(1, aurY - 1); lblAUR.resolution = 2;
    container.addChild(lblAUR);
  }

  // ── Ícone de máscara (acima de todas as barras) ──
  const mascaraTipo = token.actor?.getFlag(MODULE_ID, "mascara_tipo") ?? "nenhuma";
  if (mascaraTipo !== "nenhuma") {
    const shield = new PIXI.Text("🛡", { fontFamily: "Arial", fontSize: 10, fill: 0xffffff });
    shield.position.set(W - 12, -(STEP * barSlot));
    shield.resolution = 2;
    container.addChild(shield);
  }

  token.addChild(container);
  token[HUD_KEY] = container;
}

// ─── Hooks ─────────────────────────────────────────────────
Hooks.on("drawToken", (token) => _drawHUD(token));

Hooks.on("refreshToken", (token, flags) => {
  // Só redesenha se algo relevante mudou para não desperdiçar frames
  if (flags?.refreshBars || flags?.refreshResource || flags?.redrawEffects) {
    _drawHUD(token);
  }
});

Hooks.on("destroyToken", (token) => {
  if (token[HUD_KEY]) {
    token[HUD_KEY].destroy({ children: true });
    delete token[HUD_KEY];
  }
});

// Redesenha ao mudar Aurora (não capturado pelo refreshToken)
Hooks.on("updateActor", (actor, changes) => {
  if (!canvas?.ready) return;
  const auroraChanged  = foundry.utils.hasProperty(changes, `flags.${MODULE_ID}.aurora`);
  const mascaraChanged = foundry.utils.hasProperty(changes, `flags.${MODULE_ID}.mascara_tipo`);
  if (!auroraChanged && !mascaraChanged) return;

  canvas.tokens?.placeables
    .filter(t => t.actor?.id === actor.id)
    .forEach(t => _drawHUD(t));
});

// Redesenha todos os tokens quando a setting de HUD muda
Hooks.on("updateSetting", (setting) => {
  const relevante = [
    `${MODULE_ID}.tokenHudEnabled`,
    `${MODULE_ID}.hpSanVisivelJogadores`,
    `${MODULE_ID}.auroraVisivelJogadores`,
    `${MODULE_ID}.auroraRevelado`
  ];
  if (!relevante.includes(setting.key)) return;
  if (!canvas?.ready) return;
  canvas.tokens?.placeables.forEach(t => _drawHUD(t));
});
