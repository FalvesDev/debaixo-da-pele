// ============================================================
// MACRO 4 — Sistema de Inventário por Slots
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================
// Exibe grade visual de slots, detecta sobrecarga e aplica
// penalidades automaticamente.
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const actor = canvas.tokens.controlled[0]?.actor;
if (!actor) {
  return ui.notifications.warn("Selecione um token antes de executar a macro.");
}

// ─── Carregar estado atual ───────────────────────────────────
const slotsBolsos  = actor.getFlag(MODULE_ID, "slots_bolsos")  ?? 0;
const slotsMochila = actor.getFlag(MODULE_ID, "slots_mochila") ?? 0;
const maxMochila   = actor.getFlag(MODULE_ID, "max_mochila")   ?? 16;
const maxBolsos    = game.settings.get(MODULE_ID, "maxSlotsBolsos") ?? 7;
const mochilaNome  = actor.getFlag(MODULE_ID, "mochila_nome")  ?? "Mochila 30L";
const vestindoEPI  = actor.getFlag(MODULE_ID, "vestindo_epi")  ?? false;

// ─── Helpers visuais ─────────────────────────────────────────
function gerarGrade(usados, maximo, label, cor) {
  const slots = [];
  for (let i = 1; i <= maximo; i++) {
    const cheio = i <= usados;
    const classe = cheio ? (usados > maximo ? "sobrecarga" : "usado") : "";
    const corLocal = cheio && usados > maximo && i > maximo ? "#4a2d2d" : (cheio ? "#2d4a2d" : "#1a1a2e");
    const borda = cheio && usados > maximo && i > maximo ? "#7c4a4a" : (cheio ? "#4a7c4a" : "#444");
    slots.push(`<div style="width:28px;height:28px;border:1px solid ${borda};border-radius:3px;background:${corLocal};display:inline-flex;align-items:center;justify-content:center;font-size:9px;color:#888;margin:1px">${cheio ? "■" : ""}</div>`);
  }
  // Slots de sobrecarga (acima do máximo)
  if (usados > maximo) {
    for (let i = maximo + 1; i <= usados; i++) {
      slots.push(`<div style="width:28px;height:28px;border:1px solid #7c4a4a;border-radius:3px;background:#4a2d2d;display:inline-flex;align-items:center;justify-content:center;font-size:9px;color:#ff6b6b;margin:1px">!</div>`);
    }
  }

  const statusCor = usados > maximo ? "#ff6b6b" : usados >= maximo * 0.8 ? "#ffb347" : "#a0ffa0";
  return `
    <div style="margin:8px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <b style="color:#ccc">${label}</b>
        <span style="color:${statusCor};font-weight:bold">${usados} / ${maximo}${usados > maximo ? " ⚠️ SOBRECARGA" : ""}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:1px">${slots.join("")}</div>
    </div>
  `;
}

// Opções de mochila
const mochilas = [
  { nome: "Sem mochila",      slots: 0  },
  { nome: "Bolsa de campo",   slots: 8  },
  { nome: "Mochila 20L",      slots: 12 },
  { nome: "Mochila 30L",      slots: 16 },
  { nome: "Mochila tática",   slots: 20 },
  { nome: "Carregador campo", slots: 24 }
];

const mochilaOpts = mochilas.map(m =>
  `<option value="${m.slots}" ${maxMochila === m.slots ? "selected" : ""}>${m.nome} (${m.slots} slots)</option>`
).join("");

const sobrecargaBolsos  = slotsBolsos  > maxBolsos  ? slotsBolsos  - maxBolsos  : 0;
const sobrecargaMochila = slotsMochila > maxMochila ? slotsMochila - maxMochila : 0;
const penalidadeTotal   = (sobrecargaBolsos + sobrecargaMochila) * 5;

new Dialog({
  title: `Inventário — ${actor.name}`,
  content: `
    <div style="min-width:380px; font-family: 'Signika', serif">

      <!-- Grade de Bolsos -->
      ${gerarGrade(slotsBolsos, maxBolsos, "Bolsos / Cinto", "#4a7c4a")}

      <!-- Grade de Mochila -->
      ${maxMochila > 0
        ? gerarGrade(slotsMochila, maxMochila, mochilaNome, "#4a4a7c")
        : `<div style="color:#888; font-style:italic; margin:8px 0">Sem mochila equipada.</div>`
      }

      <hr style="border-color:#333; margin:10px 0"/>

      <!-- Controles -->
      <div class="ddp-form">
        <div class="form-group">
          <label>Slots em Bolsos/Cinto:</label>
          <input type="number" id="bolsos" value="${slotsBolsos}" min="0" max="30" style="width:70px"/>
        </div>
        <div class="form-group">
          <label>Slots na Mochila:</label>
          <input type="number" id="mochila" value="${slotsMochila}" min="0" max="40" style="width:70px"/>
        </div>
        <div class="form-group">
          <label>Tipo de mochila:</label>
          <select id="maxMochila" style="width:180px">${mochilaOpts}</select>
        </div>
        <div class="form-group">
          <label>Vestindo EPI (máscara/proteção):</label>
          <input type="checkbox" id="epi" ${vestindoEPI ? "checked" : ""}/>
        </div>
      </div>

      ${penalidadeTotal > 0 ? `
        <div style="border-left:4px solid #ff6b6b; padding:6px 10px; background:#2d1a1a; margin-top:8px">
          ⚠️ <b style="color:#ff6b6b">SOBRECARGA ATIVA</b><br>
          Penalidade atual: <b>−${penalidadeTotal}%</b> em todas as perícias físicas.
        </div>
      ` : ""}

      <hr style="border-color:#333; margin:10px 0"/>

      <!-- Referência de tamanhos -->
      <details>
        <summary style="color:#888; cursor:pointer; font-size:0.85em">Referência de tamanhos de itens</summary>
        <table style="width:100%; font-size:0.8em; color:#aaa; margin-top:6px">
          <tr><th style="text-align:left">Tamanho</th><th style="text-align:center">Slots</th><th>Exemplos</th></tr>
          <tr><td>Micro</td><td style="text-align:center">0.5</td><td>Morfina, bala avulsa</td></tr>
          <tr><td>Pequeno</td><td style="text-align:center">1</td><td>Canivete, isqueiro, pilhas</td></tr>
          <tr><td>Médio</td><td style="text-align:center">2</td><td>Lanterna, walkie-talkie, kit PA básico</td></tr>
          <tr><td>Grande</td><td style="text-align:center">3</td><td>Revólver, kit PA avançado, corda 10m</td></tr>
          <tr><td>Muito Grande</td><td style="text-align:center">4–6</td><td>Espingarda, corda 15m</td></tr>
        </table>
      </details>
    </div>
  `,
  buttons: {
    salvar: {
      icon: '<i class="fas fa-save"></i>',
      label: "Salvar",
      callback: async (html) => {
        const b  = parseInt(html.find("#bolsos").val())   || 0;
        const m  = parseInt(html.find("#mochila").val())  || 0;
        const mm = parseInt(html.find("#maxMochila").val()) || 0;
        const epi = html.find("#epi").is(":checked");
        const nomeMochila = mochilas.find(x => x.slots === mm)?.nome ?? "Mochila";

        await actor.setFlag(MODULE_ID, "slots_bolsos",  b);
        await actor.setFlag(MODULE_ID, "slots_mochila", m);
        await actor.setFlag(MODULE_ID, "max_mochila",   mm);
        await actor.setFlag(MODULE_ID, "mochila_nome",  nomeMochila);
        await actor.setFlag(MODULE_ID, "vestindo_epi",  epi);

        const sobB = Math.max(0, b - maxBolsos);
        const sobM = Math.max(0, m - mm);
        const penTotal = (sobB + sobM) * 5;

        const statusBolsos  = b > maxBolsos  ? `⚠️ ${b}/${maxBolsos} SOBRECARGA` : `✅ ${b}/${maxBolsos}`;
        const statusMochila = mm > 0 ? (m > mm ? `⚠️ ${m}/${mm} SOBRECARGA` : `✅ ${m}/${mm}`) : "Sem mochila";

        ChatMessage.create({
          content: `
            <div style="border-left:4px solid #4a7c9c; padding:8px 12px; background:#1a1a2e">
              <b>Inventário — ${actor.name}</b><br>
              Bolsos/Cinto: <b>${statusBolsos}</b><br>
              ${mm > 0 ? `${nomeMochila}: <b>${statusMochila}</b><br>` : ""}
              ${epi ? "🛡️ EPI equipado<br>" : ""}
              ${penTotal > 0
                ? `<span style="color:#ff6b6b">⚠️ Penalidade de sobrecarga: −${penTotal}% físicas</span>`
                : `<span style="color:#a0ffa0">✅ Sem sobrecarga</span>`
              }
            </div>
          `
        });
      }
    },
    fechar: {
      icon: '<i class="fas fa-times"></i>',
      label: "Fechar"
    }
  },
  default: "salvar"
}).render(true);
