// ============================================================
// MACRO 1 — Teste de Sanidade com Prompt
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================
// Como usar: selecione um token e execute a macro.
// ============================================================

const actor = canvas.tokens.controlled[0]?.actor;
if (!actor) {
  return ui.notifications.warn("Selecione um token antes de executar a macro.");
}

const sanAtual = actor.system?.attribs?.san?.value ?? 0;
const sanMax   = actor.system?.attribs?.san?.max ?? sanAtual;

// Eventos pré-definidos comuns na campanha
const eventosPreDefinidos = [
  { label: "— Escolher —",                        custo: "" },
  { label: "Ver um Refinado pela 1ª vez",          custo: "1D6" },
  { label: "Ver um Refinado Pesado",               custo: "1D8" },
  { label: "Ver o Espécime Canino",                custo: "1D4" },
  { label: "Descobrir a natureza do Projeto Aurora", custo: "1D6" },
  { label: "Presenciar uma transformação",         custo: "1D10" },
  { label: "Encontrar um cadáver deformado",       custo: "1D4" },
  { label: "Ser atacado por um Refinado",          custo: "1D3" },
  { label: "Ver alguém morrer horrível",           custo: "1D6" },
  { label: "Personalizado...",                     custo: "" }
];

const opcoesHtml = eventosPreDefinidos
  .map((e, i) => `<option value="${i}">${e.label}</option>`)
  .join("");

new Dialog({
  title: `Teste de Sanidade — ${actor.name} (SAN: ${sanAtual}/${sanMax})`,
  content: `
    <div class="ddp-form">
      <div class="form-group">
        <label>Evento predefinido:</label>
        <select id="eventoPreset" style="width:200px">
          ${opcoesHtml}
        </select>
      </div>
      <hr class="ddp-separator"/>
      <div class="form-group">
        <label>Evento (descrição):</label>
        <input type="text" id="eventoCustom" placeholder="ex: Ver um Refinado..."/>
      </div>
      <div class="form-group">
        <label>Custo em caso de <b>falha</b>:</label>
        <input type="text" id="custoFalha" placeholder="ex: 1D6"/>
      </div>
      <div class="form-group">
        <label>Custo em caso de <b>sucesso</b>:</label>
        <input type="text" id="custoSucesso" placeholder="ex: 1 (ou vazio)"/>
      </div>
      <p class="hint">SAN atual: <b>${sanAtual}</b> / ${sanMax}</p>
    </div>
  `,
  buttons: {
    roll: {
      icon: '<i class="fas fa-dice-d20"></i>',
      label: "Rolar SAN",
      callback: async (html) => {
        const presetIdx  = parseInt(html.find("#eventoPreset").val());
        const preset     = eventosPreDefinidos[presetIdx];
        const eventoFinal = html.find("#eventoCustom").val().trim() || preset.label;
        const custoFalha  = html.find("#custoFalha").val().trim()   || preset.custo || "1";
        const custoSucesso = html.find("#custoSucesso").val().trim();

        const roll = await new Roll("1d100").evaluate();
        const sucesso = roll.total <= sanAtual;

        // Mensagem principal
        const corResultado = sucesso ? "#a0ffa0" : "#ff6b6b";
        const labelResultado = sucesso ? "✅ SUCESSO" : "❌ FALHA";

        await roll.toMessage({
          flavor: `
            <div style="border-left:4px solid ${corResultado}; padding:6px 10px; background:#1a1a2e">
              <b>Teste de Sanidade</b> — ${eventoFinal}<br>
              SAN: <b>${sanAtual}</b> | Rolou: <b>${roll.total}</b><br>
              <span style="color:${corResultado}; font-size:1.1em">${labelResultado}</span>
            </div>
          `
        });

        // Aplicar perda de SAN
        if (!sucesso && custoFalha) {
          const perdaRoll = await new Roll(custoFalha).evaluate();
          const novaSan = Math.max(0, sanAtual - perdaRoll.total);
          await actor.update({ "system.attribs.san.value": novaSan });

          ChatMessage.create({
            content: `
              <div style="border-left:4px solid #ff6b6b; padding:6px 10px; background:#1a1a2e">
                <b>${actor.name}</b> perde <b>${perdaRoll.total}</b> de Sanidade.<br>
                SAN: ${sanAtual} → <b>${novaSan}</b>
                ${novaSan === 0 ? "<br><span style='color:#ff0000; font-weight:bold'>⚠️ INSANIDADE COMPLETA!</span>" : ""}
                ${novaSan <= sanMax * 0.2 ? "<br><span style='color:#ffb347'>⚠️ SAN crítica — risco de insanidade temporária.</span>" : ""}
              </div>
            `
          });
        } else if (sucesso && custoSucesso) {
          const perdaRoll = await new Roll(custoSucesso).evaluate();
          if (perdaRoll.total > 0) {
            const novaSan = Math.max(0, sanAtual - perdaRoll.total);
            await actor.update({ "system.attribs.san.value": novaSan });
            ChatMessage.create({
              content: `${actor.name} perde ${perdaRoll.total} SAN mesmo no sucesso. (${sanAtual} → ${novaSan})`
            });
          }
        }
      }
    },
    cancel: {
      icon: '<i class="fas fa-times"></i>',
      label: "Cancelar"
    }
  },
  default: "roll",
  render: (html) => {
    // Auto-preencher custo ao selecionar preset
    html.find("#eventoPreset").on("change", (e) => {
      const idx = parseInt(e.target.value);
      const preset = eventosPreDefinidos[idx];
      if (preset.custo) {
        html.find("#custoFalha").val(preset.custo);
      }
      if (preset.label !== "— Escolher —" && preset.label !== "Personalizado...") {
        html.find("#eventoCustom").val(preset.label);
      }
    });
  }
}).render(true);
