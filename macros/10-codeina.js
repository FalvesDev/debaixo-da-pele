// ============================================================
// MACRO 10 — Analgésico Forte (Codeína)
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================
// Remove penalidade de dor por 4 horas (1440 rounds de 10s).
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Selecione um token.");
const actor = token.actor;

const pvAtual = actor.system?.attribs?.hp?.value ?? 0;
const pvMax   = actor.system?.attribs?.hp?.max   ?? 1;
const diaAtual = game.settings.get?.(MODULE_ID, "diaCampanha") ?? 1;

// Rastrear usos no dia atual
const usoKey = `codeina_dia_${diaAtual}`;
const usosHoje = actor.getFlag(MODULE_ID, usoKey) ?? 0;

// Verificar se já tem efeito ativo
const efeitoAtivo = actor.effects.find(e =>
  e.name?.toLowerCase().includes("analgésico") ||
  e.name?.toLowerCase().includes("codeina") ||
  e.flags?.[MODULE_ID]?.tipo === "analgesico"
);

if (efeitoAtivo) {
  return ui.notifications.warn(`${actor.name} já está sob efeito de analgésico. Aguarde o fim do efeito antes de tomar outro.`);
}

if (usosHoje >= 3) {
  return new Dialog({
    title: "⚠️ Overdose de Codeína",
    content: `
      <div style="border-left:4px solid #ff4444; padding:8px 12px; background:#1a1a2e">
        <b style="color:#ff4444">LIMITE DIÁRIO ATINGIDO</b><br>
        ${actor.name} já tomou ${usosHoje} comprimidos hoje.<br>
        Dose adicional exige rolagem de <b>CON</b> ou causa náusea (−20% todas as perícias por 2h).
      </div>
    `,
    buttons: { ok: { label: "Entendido" } }
  }).render(true);
}

const aviso = usosHoje === 2
  ? `<div style="border-left:4px solid #ffb347; padding:6px 10px; background:#1a1a1a; margin-bottom:8px">
      ⚠️ Terceiro comprimido hoje. Risco de náusea.
    </div>`
  : usosHoje === 1
  ? `<div style="border-left:4px solid #ffffa0; padding:6px 10px; background:#1a1a1a; margin-bottom:8px">
      Segundo comprimido do dia — sem efeito adicional sobre o primeiro.
    </div>`
  : "";

new Dialog({
  title: `Codeína — ${actor.name}`,
  content: `
    <div style="min-width:300px">
      ${aviso}
      <div style="border-left:4px solid #888; padding:6px 10px; background:#1a1a2e; margin-bottom:8px">
        <b>PV:</b> ${pvAtual}/${pvMax} | Comprimidos tomados hoje: <b>${usosHoje}</b>
      </div>
      <p style="color:#aaa; font-size:0.9em">
        Remove penalidade de dor (PV ≤ metade) por <b>4 horas</b>.<br>
        Não recupera PV.
      </p>
    </div>
  `,
  buttons: {
    tomar: {
      icon: '<i class="fas fa-pills"></i>',
      label: "Tomar comprimido",
      callback: async () => {
        await actor.setFlag(MODULE_ID, usoKey, usosHoje + 1);

        const effectData = {
          name: "Analgésico — Codeína (4h)",
          icon: "modules/debaixo-da-pele/assets/icons/codeina.svg",
          duration: { rounds: 1440, startRound: game.combat?.round ?? 0 },
          changes: [],
          flags: { [MODULE_ID]: { tipo: "analgesico" } }
        };
        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
          content: `
            <div style="border-left:4px solid #ffffa0; padding:8px 12px; background:#1a1a2e">
              💊 <b>${actor.name}</b> tomou codeína.<br>
              Penalidade de dor suprimida por <b>4 horas</b>.
              ${usosHoje + 1 >= 2 ? "<br><span style='color:#ffb347'>⚠️ Uso repetido — fique atento a efeitos colaterais.</span>" : ""}
            </div>
          `
        });
      }
    },
    cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
  },
  default: "tomar"
}).render(true);
