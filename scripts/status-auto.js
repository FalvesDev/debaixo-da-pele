// ============================================================
// STATUS AUTO — Efeitos de Status Automáticos
// Hemorragia · Ferido · Aurora · Inconsciente
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

const MODULE_ID = "debaixo-da-pele";

// IDs dos status customizados
const STATUS = {
  HEMORRAGIA:   "ddp-hemorragia",
  FERIDO:       "ddp-ferido",
  FERIMENTO_GRAVE: "ddp-ferimento-grave",
  AURORA_F2:    "ddp-aurora-f2",
  AURORA_F3:    "ddp-aurora-f3",
  AURORA_F4:    "ddp-aurora-f4",
  INCONSCIENTE: "ddp-inconsciente"
};

// ─── Registro dos status customizados no Foundry ─────────────
Hooks.once("init", () => {
  const BASE = "modules/debaixo-da-pele/assets/icons/";

  const novosStatus = [
    { id: STATUS.HEMORRAGIA,      label: "Hemorragia",         icon: `${BASE}status-hemorragia.svg`    },
    { id: STATUS.FERIDO,          label: "Ferido",             icon: `${BASE}status-ferido.svg`        },
    { id: STATUS.FERIMENTO_GRAVE, label: "Ferimento Grave",    icon: `${BASE}status-ferimento-grave.svg` },
    { id: STATUS.AURORA_F2,       label: "Aurora — Moderado",  icon: `${BASE}status-aurora-f2.svg`    },
    { id: STATUS.AURORA_F3,       label: "Aurora — Grave",     icon: `${BASE}status-aurora-f3.svg`    },
    { id: STATUS.AURORA_F4,       label: "Aurora — TRANSFORMAÇÃO", icon: `${BASE}status-aurora-f4.svg` },
    { id: STATUS.INCONSCIENTE,    label: "Inconsciente",       icon: `${BASE}status-inconsciente.svg` }
  ];

  novosStatus.forEach(s => {
    if (!CONFIG.statusEffects.find(e => e.id === s.id)) {
      CONFIG.statusEffects.push(s);
    }
  });
});

// ─── Helper: toggle status no token ──────────────────────────
async function _setStatus(actor, statusId, ativo) {
  const existing = actor.effects.find(e => e.statuses?.has(statusId));
  if (ativo && !existing) {
    const statusCfg = CONFIG.statusEffects.find(s => s.id === statusId);
    if (!statusCfg) return;
    await actor.createEmbeddedDocuments("ActiveEffect", [{
      name:     statusCfg.label,
      icon:     statusCfg.icon,
      statuses: [statusId],
      flags:    { [MODULE_ID]: { statusAuto: true, statusId } }
    }]);
  } else if (!ativo && existing) {
    await existing.delete();
  }
}

// ─── Helper: verifica se status está ativo ───────────────────
function _hasStatus(actor, statusId) {
  return actor.effects.some(e => e.statuses?.has(statusId));
}

// ─── Avaliação de HP → status automático ─────────────────────
async function _avaliarHP(actor, novoHP, hpAnterior) {
  const hpMax = actor.system?.attribs?.hp?.max ?? 10;
  const pct   = novoHP / Math.max(1, hpMax);

  // Inconsciente
  await _setStatus(actor, STATUS.INCONSCIENTE, novoHP <= 0);

  // Ferido (HP ≤ 50%)
  await _setStatus(actor, STATUS.FERIDO, pct <= 0.5 && novoHP > 0);

  // Ferimento Grave: queda súbita de HP > 50% do máximo em 1 atualização
  if (hpAnterior !== undefined) {
    const queda = hpAnterior - novoHP;
    if (queda >= Math.ceil(hpMax / 2) && novoHP > 0) {
      if (!_hasStatus(actor, STATUS.FERIMENTO_GRAVE)) {
        await _setStatus(actor, STATUS.FERIMENTO_GRAVE, true);
        await ChatMessage.create({
          content: `
            <div style="border-left:4px solid #dd2222; padding:8px 12px; background:#1a0a0a">
              🩹 <b style="color:#ff4444">FERIMENTO GRAVE — ${actor.name}</b><br>
              Queda de <b>${queda} HP</b> em uma ação (${hpAnterior} → ${novoHP}).<br>
              <span style="color:#aaa">Requer teste de CON ou fica inconsciente.</span>
            </div>
          `
        });
      }
    }
  }
}

// ─── Avaliação de Aurora → ícones no token ───────────────────
async function _avaliarAurora(actor, nivel) {
  await _setStatus(actor, STATUS.AURORA_F2, nivel >= 4.01 && nivel <= 6);
  await _setStatus(actor, STATUS.AURORA_F3, nivel >= 6.01 && nivel <= 8);
  await _setStatus(actor, STATUS.AURORA_F4, nivel >= 8.01);
}

// ─── Hook: mudança de HP ──────────────────────────────────────
Hooks.on("preUpdateActor", (actor, changes, _options, _userId) => {
  const novoHP = foundry.utils.getProperty(changes, "system.attribs.hp.value");
  if (novoHP === undefined) return;
  // Armazena HP anterior para detectar Ferimento Grave
  changes._ddpHpAnterior = actor.system?.attribs?.hp?.value;
});

Hooks.on("updateActor", async (actor, changes, _options, userId) => {
  // Só o GM (ou o dono do token) processa
  if (!game.user.isGM && actor.ownership[game.user.id] < 3) return;

  // HP mudou
  const novoHP = foundry.utils.getProperty(changes, "system.attribs.hp.value");
  if (novoHP !== undefined) {
    await _avaliarHP(actor, novoHP, changes._ddpHpAnterior);
  }

  // Aurora mudou
  const novaAurora = foundry.utils.getProperty(changes, `flags.${MODULE_ID}.aurora`);
  if (novaAurora !== undefined) {
    await _avaliarAurora(actor, novaAurora);
  }
});

// ─── Hemorragia: 1 HP por rodada no combate ──────────────────
Hooks.on("updateCombat", async (combat, changes, _options, userId) => {
  if (!game.user.isGM) return;
  // Só processa na virada de turno/rodada
  if (changes.turn === undefined && changes.round === undefined) return;

  for (const combatant of combat.combatants) {
    const actor = combatant.actor;
    if (!actor || !_hasStatus(actor, STATUS.HEMORRAGIA)) continue;

    const hpAtual = actor.system?.attribs?.hp?.value ?? 0;
    if (hpAtual <= 0) continue;

    const novoHP = hpAtual - 1;
    await actor.update({ "system.attribs.hp.value": novoHP });
    await ChatMessage.create({
      content: `
        <div style="border-left:3px solid #cc0000; padding:6px 10px; background:#1a0a0a">
          🩸 <b>Hemorragia:</b> ${actor.name} perde <b>1 HP</b>
          <span style="color:#888">(${hpAtual} → ${novoHP})</span>
          ${novoHP <= 0 ? "<br><b style='color:#ff4444'>Personagem inconsciente!</b>" : ""}
        </div>
      `
    });
  }
});

// ─── API pública para macros ──────────────────────────────────
Hooks.once("ready", () => {
  window.DebaixoDaPele = {
    ...(window.DebaixoDaPele ?? {}),
    STATUS,
    setStatus:  _setStatus,
    hasStatus:  _hasStatus,
    avaliarHP:  _avaliarHP
  };
});
