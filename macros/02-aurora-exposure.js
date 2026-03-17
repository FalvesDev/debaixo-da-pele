// ============================================================
// MACRO 2 — Tracker de Exposição ao Composto Aurora
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const actor = canvas.tokens.controlled[0]?.actor;
if (!actor) {
  return ui.notifications.warn("Selecione um token antes de executar a macro.");
}

const expAtual = actor.getFlag(MODULE_ID, "aurora") ?? 0;

// Dados de sintomas por nível
const SINTOMAS = [
  { min: 0,    max: 2,   cor: "#a0ffa0", icone: "🟢", label: "Nenhum sintoma",             efeito: "Sem alterações detectáveis." },
  { min: 2.01, max: 4,   cor: "#ffffa0", icone: "⚠️",  label: "Sintomas leves",             efeito: "Cicatrização acelerada, insônia persistente." },
  { min: 4.01, max: 6,   cor: "#ffb347", icone: "🟠", label: "Sintomas moderados",          efeito: "Cicatrizes desaparecendo, textura da pele alterada. −5 SAN." },
  { min: 6.01, max: 8,   cor: "#ff6b6b", icone: "🔴", label: "Sintomas graves",             efeito: "Alterações morfológicas visíveis. +2 HP max, −10% perícias mentais." },
  { min: 8.01, max: 999, cor: "#cc0000", icone: "💀", label: "TRANSFORMAÇÃO INICIADA",      efeito: "Personagem progressivamente não jogável. Intervenção do GM obrigatória." }
];

function getSintoma(nivel) {
  return SINTOMAS.find(s => nivel >= s.min && nivel <= s.max) ?? SINTOMAS[0];
}

function gerarBarraHtml(nivel) {
  const pct = Math.min(nivel / 10 * 100, 100);
  const sint = getSintoma(nivel);
  return `
    <div style="width:100%; height:14px; background:#1a1a2e; border:1px solid #555; border-radius:7px; overflow:hidden; margin:4px 0">
      <div style="width:${pct}%; height:100%; background:${sint.cor}; border-radius:7px; transition:width 0.4s"></div>
    </div>
    <div style="display:flex; justify-content:space-between; font-size:0.75em; color:#888">
      <span>0</span><span>2</span><span>4</span><span>6</span><span>8</span><span>10</span>
    </div>
  `;
}

const sintomaAtual = getSintoma(expAtual);

new Dialog({
  title: `Composto Aurora — ${actor.name}`,
  content: `
    <div class="ddp-form" style="min-width:320px">
      <div style="text-align:center; margin-bottom:10px">
        <span style="font-size:1.6em">${sintomaAtual.icone}</span>
        <span style="color:${sintomaAtual.cor}; font-weight:bold; font-size:1.1em"> ${sintomaAtual.label}</span>
      </div>

      ${gerarBarraHtml(expAtual)}
      <p style="text-align:center; font-size:0.9em; color:#ccc">
        Exposição atual: <b style="color:${sintomaAtual.cor}">${expAtual}</b> / 10
      </p>
      <p style="font-size:0.8em; color:#999; font-style:italic; text-align:center">
        ${sintomaAtual.efeito}
      </p>

      <hr class="ddp-separator"/>

      <div class="form-group">
        <label>Adicionar / Remover exposição:</label>
        <input type="number" id="delta" value="0" step="0.5" style="width:80px"/>
      </div>
      <p class="hint">Positivo para adicionar, negativo para remover. Use 0.5 para meias unidades.</p>

      <div class="form-group">
        <label>Definir valor absoluto:</label>
        <input type="number" id="absoluto" value="" step="0.5" placeholder="Deixe vazio" style="width:80px"/>
      </div>
    </div>
  `,
  buttons: {
    aplicar: {
      icon: '<i class="fas fa-biohazard"></i>',
      label: "Aplicar",
      callback: async (html) => {
        const delta    = parseFloat(html.find("#delta").val())    || 0;
        const absoluto = html.find("#absoluto").val().trim();

        let nova;
        if (absoluto !== "") {
          nova = Math.max(0, parseFloat(absoluto));
        } else {
          nova = Math.max(0, expAtual + delta);
        }

        await actor.setFlag(MODULE_ID, "aurora", nova);

        const sintomaAntes = getSintoma(expAtual);
        const sintomaDepois = getSintoma(nova);
        const mudouFase = sintomaAntes.label !== sintomaDepois.label;

        ChatMessage.create({
          content: `
            <div style="border-left:4px solid ${sintomaDepois.cor}; padding:8px 12px; background:#1a1a2e">
              <b style="color:${sintomaDepois.cor}">Composto Aurora — ${actor.name}</b><br>
              Exposição: <b>${expAtual}</b> → <b>${nova}</b><br>
              ${sintomaDepois.icone} <i style="color:#aaa">${sintomaDepois.efeito}</i>
              ${mudouFase ? `<br><br><b style="color:#ffb347">⚠️ Nova fase: ${sintomaDepois.label}</b>` : ""}
            </div>
          `
        });

        // Aplicar penalidade de SAN automática no nível 4-6
        if (nova > 4 && nova <= 6 && expAtual <= 4 && game.user.isGM) {
          const sanAtual = actor.system?.attribs?.san?.value ?? 0;
          await actor.update({ "system.attribs.san.value": Math.max(0, sanAtual - 5) });
          ChatMessage.create({
            content: `<b>Aurora — Efeito Automático:</b> ${actor.name} perde 5 SAN (exposição atingiu nível ${nova}).`
          });
        }
      }
    },
    ver: {
      icon: '<i class="fas fa-eye"></i>',
      label: "Só visualizar",
      callback: () => {}
    },
    cancelar: {
      icon: '<i class="fas fa-times"></i>',
      label: "Cancelar"
    }
  },
  default: "aplicar"
}).render(true);
