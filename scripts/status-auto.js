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
    { id: STATUS.HEMORRAGIA,      label: "Hemorragia",             img: `${BASE}status-hemorragia.svg`      },
    { id: STATUS.FERIDO,          label: "Ferido",                 img: `${BASE}status-ferido.svg`          },
    { id: STATUS.FERIMENTO_GRAVE, label: "Ferimento Grave",        img: `${BASE}status-ferimento-grave.svg` },
    { id: STATUS.AURORA_F2,       label: "Aurora — Moderado",      img: `${BASE}status-aurora-f2.svg`       },
    { id: STATUS.AURORA_F3,       label: "Aurora — Grave",         img: `${BASE}status-aurora-f3.svg`       },
    { id: STATUS.AURORA_F4,       label: "Aurora — TRANSFORMAÇÃO", img: `${BASE}status-aurora-f4.svg`       },
    { id: STATUS.INCONSCIENTE,    label: "Inconsciente",           img: `${BASE}status-inconsciente.svg`    }
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
      img:      statusCfg.img,
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
// Limiares espelham AURORA_FASES em aurora-system.js (min de cada fase).
// Aurora usa steps de 0.5, então 4.0 ainda é Fase 1 (max:4 em AURORA_FASES).
async function _avaliarAurora(actor, nivel) {
  await _setStatus(actor, STATUS.AURORA_F2, nivel >= 4.01 && nivel <= 6);
  await _setStatus(actor, STATUS.AURORA_F3, nivel >= 6.01 && nivel <= 8);
  await _setStatus(actor, STATUS.AURORA_F4, nivel >= 8.01);
}

// Cache de HP anterior por actorId.
// Escrever em `changes` no preUpdateActor não funciona em clientes remotos
// porque o delta não é retransmitido com campos arbitrários.
const _hpCache = new Map();

// Limpa cache ao deletar ator para evitar memory leak
Hooks.on("deleteActor", (actor) => { _hpCache.delete(actor.id); });

// ─── Hook: captura HP antes da atualização (só GM consome o cache) ───
Hooks.on("preUpdateActor", (actor, changes) => {
  if (!game.user.isGM) return;
  const novoHP = foundry.utils.getProperty(changes, "system.attribs.hp.value");
  if (novoHP === undefined) return;
  _hpCache.set(actor.id, actor.system?.attribs?.hp?.value);
});

// ─── Hook: processa automações após atualização ───────────────
Hooks.on("updateActor", async (actor, changes) => {
  // Apenas o GM executa escritas de Active Effects para evitar duplicatas
  // (quando GM + jogador dono ambos processassem → 2× createEmbeddedDocuments)
  if (!game.user.isGM) return;

  const novoHP = foundry.utils.getProperty(changes, "system.attribs.hp.value");
  if (novoHP !== undefined) {
    const hpAnterior = _hpCache.get(actor.id);
    _hpCache.delete(actor.id);
    await _avaliarHP(actor, novoHP, hpAnterior);
  }

  const novaAurora = foundry.utils.getProperty(changes, `flags.${MODULE_ID}.aurora`);
  if (novaAurora !== undefined) {
    await _avaliarAurora(actor, novaAurora);
  }
});

// ─── Hemorragia: 1 HP por turno no combate ───────────────────
Hooks.on("updateCombat", async (combat, changes, _options, _userId) => {
  if (!game.user.isGM) return;
  // Processa apenas em avanço real de turno (não retrocesso, não só round sem turno)
  if (changes.turn === undefined) return;

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
