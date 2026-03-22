// ============================================================
// PLAYER HUD — Barra de Status estilo Resident Evil
// Exibida na parte inferior para os jogadores
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

const MODULE_ID = "debaixo-da-pele";

// ─── Application ─────────────────────────────────────────────
class DDPPlayerHUD extends Application {
  constructor(options = {}) {
    super(options);
    this._collapsed = false;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:       "ddp-player-hud",
      template: "modules/debaixo-da-pele/templates/player-hud.html",
      popOut:   false,
      classes:  ["ddp-player-hud-app"]
    });
  }

  getData() {
    const actor = game.user.character;
    if (!actor) return { hasActor: false, collapsed: this._collapsed };

    const hp    = actor.system?.attribs?.hp  ?? { value: 10, max: 10 };
    const san   = actor.system?.attribs?.san ?? { value: 50, max: 99 };
    const aurora = actor.getFlag(MODULE_ID, "aurora") ?? 0;

    const hpMax  = Math.max(1, hp.max  ?? 10);
    const sanMax = Math.max(1, san.max ?? 99);
    const hpPct  = Math.round(Math.max(0, Math.min(100, (hp.value  / hpMax)  * 100)));
    const sanPct = Math.round(Math.max(0, Math.min(100, (san.value / sanMax) * 100)));
    const aurPct = Math.round(Math.max(0, Math.min(100, (aurora / 10) * 100)));

    const hpCor  = hpPct > 50 ? "#44cc44" : hpPct > 25 ? "#ffaa00" : "#dd2222";
    const sanCor = sanPct > 50 ? "#4466dd" : sanPct > 25 ? "#6633aa" : "#440088";
    const aurCor = aurora <= 2 ? "#44bb44"
                 : aurora <= 4 ? "#aaaa00"
                 : aurora <= 6 ? "#ff8800"
                 : aurora <= 8 ? "#ff3300"
                 :               "#990000";

    const auroraVisivel = game.settings.get(MODULE_ID, "auroraVisivelJogadores");
    const hemorragia    = actor.effects.some(e => e.statuses?.has("ddp-hemorragia") || e.name === "Hemorragia");

    return {
      hasActor:   true,
      collapsed:  this._collapsed,
      actorName:  actor.name.length > 14 ? actor.name.slice(0, 13) + "…" : actor.name,
      actorImg:   actor.img,
      hp, san,
      hpPct, sanPct, aurPct,
      hpCor, sanCor, aurCor,
      hpCrit:       hpPct <= 25,
      sanCrit:      sanPct <= 25,
      inconsciente: hp.value <= 0,
      hemorragia,
      aurora,
      auroraVisivel
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ddp-phud-toggle").on("click", () => {
      this._collapsed = !this._collapsed;
      this.render(false);
    });
  }
}

// ─── Singleton ────────────────────────────────────────────────
let _playerHUD    = null;
let _settingLock  = false; // Evita race condition em cliques duplos rápidos

function _getPlayerHUD() {
  if (!_playerHUD) _playerHUD = new DDPPlayerHUD();
  return _playerHUD;
}

// ─── Hooks ───────────────────────────────────────────────────
Hooks.once("ready", () => {
  // Apenas jogadores (não GM) com personagem associado veem a HUD
  if (!game.user.isGM && game.user.character &&
      game.settings.get(MODULE_ID, "playerHudVisible")) {
    _getPlayerHUD().render(true);
  }
});

// Atualiza ao mudar HP, SAN ou Aurora do próprio personagem
Hooks.on("updateActor", (actor) => {
  if (_playerHUD?.rendered && actor.id === game.user.character?.id) {
    _playerHUD.render(false);
  }
});

// Atualiza ao mudar Active Effects — apenas do próprio personagem
Hooks.on("createActiveEffect", (effect) => {
  if (_playerHUD?.rendered && effect.parent?.id === game.user.character?.id)
    _playerHUD.render(false);
});
Hooks.on("deleteActiveEffect", (effect) => {
  if (_playerHUD?.rendered && effect.parent?.id === game.user.character?.id)
    _playerHUD.render(false);
});

// Atualiza se o GM associar/trocar o personagem do usuário durante a sessão
Hooks.on("updateUser", (user) => {
  if (user.id !== game.user.id || game.user.isGM) return;
  if (game.user.character && game.settings.get(MODULE_ID, "playerHudVisible")) {
    _getPlayerHUD().render(true);
  } else {
    _playerHUD?.render(false);
  }
});

// Reage às settings
Hooks.on("updateSetting", (setting) => {
  const key = setting.key;
  if (key === `${MODULE_ID}.playerHudVisible`) {
    if (game.settings.get(MODULE_ID, "playerHudVisible") && !game.user.isGM && game.user.character) {
      _getPlayerHUD().render(true);
    } else {
      _playerHUD?.close();
    }
    return;
  }
  if (key === `${MODULE_ID}.auroraVisivelJogadores` && _playerHUD?.rendered) {
    _playerHUD.render(false);
  }
});

// ─── Botão na barra de controles de cena ─────────────────────
Hooks.on("getSceneControlButtons", (controls) => {
  const tokenControls = controls.find(c => c.name === "token");
  if (!tokenControls) return;

  // Botão para jogadores: toggle da HUD pessoal
  if (!game.user.isGM) {
    tokenControls.tools.push({
      name:    "ddp-player-hud",
      title:   "Minha HUD — HP/SAN",
      icon:    "fas fa-heartbeat",
      visible: true,
      onClick: async () => {
        if (_settingLock) return;
        _settingLock = true;
        try {
          const atual = game.settings.get(MODULE_ID, "playerHudVisible");
          await game.settings.set(MODULE_ID, "playerHudVisible", !atual);
        } finally {
          _settingLock = false;
        }
      },
      button: true
    });
  }

  // Botão para GM: toggle rápido de Aurora visível para jogadores
  if (game.user.isGM) {
    let _auroraLock = false;
    tokenControls.tools.push({
      name:    "ddp-aurora-toggle",
      title:   "Aurora — Toggle visível para jogadores",
      icon:    "fas fa-biohazard",
      visible: true,
      onClick: async () => {
        if (_auroraLock) return;
        _auroraLock = true;
        try {
          const atual = game.settings.get(MODULE_ID, "auroraVisivelJogadores");
          await game.settings.set(MODULE_ID, "auroraVisivelJogadores", !atual);
          ui.notifications.info(
            atual ? "☣ Aurora ocultada dos jogadores." : "☣ Aurora revelada para os jogadores!"
          );
        } finally {
          _auroraLock = false;
        }
      },
      button: true
    });
  }
});
