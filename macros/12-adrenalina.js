// ============================================================
// MACRO 12 — Adrenalina (Seringa)
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Selecione um token.");
const actor = token.actor;

const pvAtual = actor.system?.attribs?.hp?.value ?? 0;
const pvMax   = actor.system?.attribs?.hp?.max   ?? 1;
const inconsciente = pvAtual <= 0 ||
  actor.effects.some(e =>
    e.name?.toLowerCase().includes("inconsc") ||
    e.name?.toLowerCase().includes("unconscious")
  );

new Dialog({
  title: `Adrenalina — ${actor.name}`,
  content: `
    <div style="min-width:300px">
      <div style="border-left:4px solid ${inconsciente ? "#ffb347" : "#44aaff"}; padding:6px 10px; background:#1a1a2e; margin-bottom:8px">
        <b>Status:</b> ${inconsciente ? "🔴 Inconsciente / PV crítico" : "🟢 Consciente"}<br>
        <b>PV:</b> ${pvAtual} / ${pvMax}
      </div>

      ${inconsciente ? `
        <p style="color:#ffb347">
          <b>Efeito (inconsciente):</b> age por <b>1D4 rodadas</b> completas antes de desmaiar novamente.
        </p>
      ` : `
        <p style="color:#aaa; font-size:0.9em">
          <b>Efeito (consciente):</b><br>
          +10% em todas as ações físicas por <b>2 rodadas</b><br>
          Depois: −10% em todas as ações por <b>1 hora</b> (crash adrenalínico)
        </p>
        <p style="color:#888; font-size:0.8em">
          ⚠️ Não pode ser auto-aplicado se inconsciente.<br>
          Não recupera PV.
        </p>
      `}
    </div>
  `,
  buttons: {
    injetar: {
      icon: '<i class="fas fa-syringe"></i>',
      label: "Injetar adrenalina",
      callback: async () => {
        if (inconsciente) {
          const rodadas = await new Roll("1d4").evaluate();
          ChatMessage.create({
            content: `
              <div style="border-left:4px solid #ffb347; padding:8px 12px; background:#1a1a2e">
                ⚡ <b>Adrenalina injetada em ${actor.name}!</b><br>
                Pode agir por <b>${rodadas.total} rodada(s)</b> antes de desmaiar novamente.<br>
                <span style="color:#888">Efeito de dor/dano não foi curado.</span>
              </div>
            `
          });
        } else {
          // Efeito de bônus (2 rodadas)
          await actor.createEmbeddedDocuments("ActiveEffect", [{
            name: "Adrenalina — Bônus (2 rodadas)",
            icon: "modules/debaixo-da-pele/assets/icons/adrenalina.svg",
            duration: { rounds: 2, startRound: game.combat?.round ?? 0 },
            changes: [],
            flags: { [MODULE_ID]: { tipo: "adrenalina_bonus" } }
          }]);

          // Agendar efeito de crash (sem automação de remoção — manual)
          ChatMessage.create({
            content: `
              <div style="border-left:4px solid #44aaff; padding:8px 12px; background:#1a1a2e">
                ⚡ <b>Adrenalina injetada em ${actor.name}!</b><br>
                +10% físicas por <b>2 rodadas</b>.<br>
                <span style="color:#ff6b6b">Depois: −10% em todas as ações por 1 hora (crash).</span><br>
                <span style="color:#888; font-size:0.85em">⚠️ Aplique o efeito de crash manualmente após 2 rodadas.</span>
              </div>
            `
          });
        }
      }
    },
    cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
  },
  default: "injetar"
}).render(true);
