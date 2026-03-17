// ============================================================
// MACRO 5 — Gerador: Dias de Combustível
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================

const MODULE_ID = "debaixo-da-pele";

// Garantir que o setting existe (caso o módulo não esteja ativo)
if (!game.settings.settings.has(`${MODULE_ID}.geradorDias`)) {
  game.settings.register(MODULE_ID, "geradorDias", {
    name: "Gerador — Dias de Combustível",
    scope: "world", config: false, type: Number, default: 6
  });
}
if (!game.settings.settings.has(`${MODULE_ID}.diaCampanha`)) {
  game.settings.register(MODULE_ID, "diaCampanha", {
    name: "Dia atual da campanha",
    scope: "world", config: false, type: Number, default: 1
  });
}

const diasAtual  = game.settings.get(MODULE_ID, "geradorDias")  ?? 6;
const diaAtual   = game.settings.get(MODULE_ID, "diaCampanha")  ?? 1;

// Eventos que afetam o consumo
const EVENTOS_CONSUMO = [
  { label: "Dia normal",                    consumo: -1,   desc: "Consumo padrão diário." },
  { label: "Dia + elevador ativo (8h)",      consumo: -2,   desc: "Consumo extra com elevador em operação prolongada." },
  { label: "Dia + laboratórios B2 a 100%",   consumo: -2,   desc: "Equipamentos de laboratório consumindo no máximo." },
  { label: "Dia + elevador + labs B2",       consumo: -3,   desc: "Consumo máximo — tudo operando." },
  { label: "Reabastecimento parcial",        consumo: +2,   desc: "Encontraram galões de combustível." },
  { label: "Reabastecimento completo",       consumo: +6,   desc: "Gerador reabastecido completamente." },
  { label: "Personalizado...",               consumo: null, desc: "" }
];

const eventosOpts = EVENTOS_CONSUMO.map((e, i) =>
  `<option value="${i}">${e.label} (${e.consumo !== null ? (e.consumo > 0 ? "+" : "") + e.consumo + " dias" : "manual"})</option>`
).join("");

function getCorDias(dias) {
  if (dias <= 0) return "#cc0000";
  if (dias <= 1) return "#ff4444";
  if (dias <= 3) return "#ffb347";
  return "#a0ffa0";
}

function getIconeDias(dias) {
  if (dias <= 0) return "⚡";
  if (dias <= 1) return "🔴";
  if (dias <= 3) return "🟠";
  return "🟢";
}

function gerarBarraGerador(dias) {
  const max = 10;
  const pct = Math.min(Math.max(dias / max * 100, 0), 100);
  const cor = getCorDias(dias);
  return `
    <div style="width:100%; height:18px; background:#1a1a1a; border:1px solid #555; border-radius:9px; overflow:hidden; margin:6px 0">
      <div style="width:${pct}%; height:100%; background:${cor}; border-radius:9px; transition:width 0.4s"></div>
    </div>
  `;
}

new Dialog({
  title: "Gerador — Combustível",
  content: `
    <div style="min-width:360px; font-family:'Signika',serif">
      <div style="text-align:center; margin-bottom:8px">
        <span style="font-size:2em">${getIconeDias(diasAtual)}</span>
        <span style="color:${getCorDias(diasAtual)}; font-weight:bold; font-size:1.3em"> ${diasAtual} dia(s)</span>
        <span style="color:#888"> de combustível</span>
      </div>

      ${gerarBarraGerador(diasAtual)}
      <p style="text-align:center; color:#888; font-size:0.85em">Dia da campanha: <b style="color:#ccc">${diaAtual}</b></p>

      ${diasAtual <= 0 ? `
        <div style="border-left:4px solid #cc0000; padding:6px 10px; background:#1a0a0a; margin:8px 0">
          <b style="color:#cc0000">⚡ GERADOR DESLIGADO</b><br>
          Sistemas críticos offline: elevador, câmeras B3/B4, pressurização Lab A.<br>
          <span style="color:#888">Iluminação de emergência ativa (baterias: 12h).</span>
        </div>
      ` : diasAtual <= 1 ? `
        <div style="border-left:4px solid #ff4444; padding:6px 10px; background:#1a1a0a; margin:8px 0">
          <b style="color:#ff4444">⚠️ CRÍTICO</b> — Gerador desligará em até 1 dia.
        </div>
      ` : ""}

      <hr style="border-color:#333; margin:10px 0"/>

      <div class="ddp-form">
        <div class="form-group">
          <label>Evento de consumo:</label>
          <select id="eventoPreset" style="width:220px">${eventosOpts}</select>
        </div>
        <div class="form-group">
          <label>Ajuste manual (±dias):</label>
          <input type="number" id="ajuste" value="" placeholder="Deixe vazio" style="width:80px"/>
        </div>
        <div class="form-group">
          <label>Atualizar dia da campanha:</label>
          <input type="number" id="diaCamp" value="${diaAtual}" min="1" max="60" style="width:80px"/>
        </div>
      </div>

      <details style="margin-top:8px">
        <summary style="color:#888; cursor:pointer; font-size:0.85em">Regras de consumo</summary>
        <ul style="color:#999; font-size:0.8em; margin-top:4px">
          <li>Consumo normal: −1 dia por dia de jogo</li>
          <li>Elevador ativo por 8h+: −1 extra</li>
          <li>Laboratórios B2 a 100%: −1 extra</li>
          <li>Gerador em 0 dias: sistemas críticos offline</li>
          <li>Baterias de emergência: 12h após desligar</li>
        </ul>
      </details>
    </div>
  `,
  buttons: {
    atualizar: {
      icon: '<i class="fas fa-gas-pump"></i>',
      label: "Atualizar",
      callback: async (html) => {
        const presetIdx = parseInt(html.find("#eventoPreset").val());
        const preset = EVENTOS_CONSUMO[presetIdx];
        const ajusteManual = html.find("#ajuste").val().trim();
        const novoDia = parseInt(html.find("#diaCamp").val()) || diaAtual;

        let delta;
        if (ajusteManual !== "") {
          delta = parseInt(ajusteManual) || 0;
        } else if (preset.consumo !== null) {
          delta = preset.consumo;
        } else {
          delta = 0;
        }

        const novosDias = Math.max(0, diasAtual + delta);
        await game.settings.set(MODULE_ID, "geradorDias", novosDias);
        await game.settings.set(MODULE_ID, "diaCampanha", novoDia);

        const cor = getCorDias(novosDias);
        const icone = getIconeDias(novosDias);

        ChatMessage.create({
          content: `
            <div style="border-left:4px solid ${cor}; padding:8px 12px; background:#1a1a2e">
              <b style="color:${cor}">${icone} Gerador — Dia ${novoDia}</b><br>
              Combustível: <b>${diasAtual}</b> → <b style="color:${cor}">${novosDias}</b> dia(s)<br>
              ${preset.consumo !== null ? `<span style="color:#aaa">Evento: ${preset.label}</span><br>` : ""}
              ${novosDias === 0 ? `<b style="color:#cc0000">⚡ GERADOR DESLIGADO — sistemas críticos offline!</b>` :
                novosDias === 1 ? `<span style="color:#ff4444">⚠️ CRÍTICO: último dia de combustível!</span>` :
                novosDias <= 3 ? `<span style="color:#ffb347">⚠️ Combustível baixo — abastecer em breve.</span>` : ""}
            </div>
          `
        });

        // Alerta no UI para o GM
        if (novosDias === 0) {
          ui.notifications.error("⚡ GERADOR DESLIGADO!", { permanent: true });
        } else if (novosDias <= 1) {
          ui.notifications.error(`⚠️ Gerador: ${novosDias} dia(s) restante(s)!`);
        }
      }
    },
    fechar: {
      icon: '<i class="fas fa-times"></i>',
      label: "Fechar"
    }
  },
  default: "atualizar"
}).render(true);
