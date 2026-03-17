// ============================================================
// MACRO 11 — Morfina (Seringa) — Uso como Item
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================
// Versão aprimorada da Macro 2 para uso direto via item sheet.
// Rastreia dependência e risco de overdose por dia de campanha.
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Selecione um token.");
const actor = token.actor;

const diaAtual  = game.settings.get?.(MODULE_ID, "diaCampanha") ?? 1;
const usoKey    = `morfina_usos_dia_${diaAtual}`;
const usosHoje  = actor.getFlag(MODULE_ID, usoKey) ?? 0;
const sessoesKey = "morfina_sessoes_consecutivas";
const sessoes   = actor.getFlag(MODULE_ID, sessoesKey) ?? 0;

// Verificar overdose
if (usosHoje >= 2) {
  ChatMessage.create({
    content: `
      <div style="border-left:4px solid #ff0000; padding:8px 12px; background:#1a1a2e">
        <b style="color:#ff0000">⚠️ OVERDOSE IMINENTE</b><br>
        ${actor.name} já recebeu morfina <b>${usosHoje}x</b> hoje.<br>
        Dose adicional: rolagem de <b>CON dificultada</b> ou inconsciente por 1D6 horas.
      </div>
    `
  });
  return;
}

// Verificar efeito já ativo
const efeitoAtivo = actor.effects.find(e =>
  e.flags?.[MODULE_ID]?.tipo === "morfina" ||
  e.name?.toLowerCase().includes("morfina")
);

const avisos = [];
if (efeitoAtivo) {
  avisos.push(`<div style="border-left:4px solid #ffb347; padding:6px 10px; background:#1a1a1a">
    ⚠️ Morfina já ativa em ${actor.name}. Segunda dose pode causar overdose.
  </div>`);
}
if (sessoes >= 2) {
  avisos.push(`<div style="border-left:4px solid #ff6b6b; padding:6px 10px; background:#1a1a1a">
    ⚠️ Uso em ${sessoes} sessões consecutivas. Risco de dependência — roleie <b>CON</b> ou perde 5 SAN ao ficar sem morfina.
  </div>`);
}

new Dialog({
  title: `Morfina — ${actor.name}`,
  content: `
    <div style="min-width:300px">
      ${avisos.join("")}
      <div style="border-left:4px solid #6699cc; padding:6px 10px; background:#1a1a2e; margin:8px 0">
        Aplicações hoje: <b>${usosHoje}</b> | Sessões consecutivas: <b>${sessoes}</b>
      </div>
      <p style="color:#aaa; font-size:0.9em">
        Elimina <b>toda</b> penalidade de dor por <b>6 horas</b>.<br>
        Se inconsciente por dor: age por 1D4 rodadas antes de desmaiar novamente.
      </p>
    </div>
  `,
  buttons: {
    aplicar: {
      icon: '<i class="fas fa-syringe"></i>',
      label: "Aplicar morfina",
      callback: async () => {
        await actor.setFlag(MODULE_ID, usoKey, usosHoje + 1);
        await actor.setFlag(MODULE_ID, sessoesKey, sessoes + 1);

        // Remover efeito anterior se existir
        if (efeitoAtivo) await efeitoAtivo.delete();

        const effectData = {
          name: "Morfina (6h)",
          icon: "modules/debaixo-da-pele/assets/icons/morfina.svg",
          duration: { rounds: 2160, startRound: game.combat?.round ?? 0 },
          changes: [],
          flags: { [MODULE_ID]: { tipo: "morfina" } }
        };
        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        ChatMessage.create({
          content: `
            <div style="border-left:4px solid #6699cc; padding:8px 12px; background:#1a1a2e">
              💉 Morfina aplicada em <b>${actor.name}</b>.<br>
              Dor completamente suprimida por <b>6 horas</b>.
              ${usosHoje + 1 >= 2 ? "<br><span style='color:#ff6b6b'>⚠️ Segunda dose — overdose ao tomar mais uma.</span>" : ""}
              ${sessoes + 1 >= 2 ? "<br><span style='color:#ffb347'>⚠️ Uso recorrente — risco de dependência.</span>" : ""}
            </div>
          `
        });
      }
    },
    cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
  },
  default: "aplicar"
}).render(true);
