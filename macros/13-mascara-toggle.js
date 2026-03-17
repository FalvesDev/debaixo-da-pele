// ============================================================
// MACRO 13 — Toggle de Máscaras (Cirúrgica, N95, Gás Civil, Especializada)
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Selecione um token.");
const actor = token.actor;

// Estado atual das máscaras
const mascaraAtiva = actor.getFlag(MODULE_ID, "mascara_tipo") ?? null;

const MASCARAS = [
  {
    id: "nenhuma",
    label: "Sem máscara",
    icon: "❌",
    descricao: "Exposição Aurora sem proteção.",
    reducao: {
      exterior: "normal", B1: "normal", B2: "normal", B3: "normal", B4: "normal"
    }
  },
  {
    id: "cirurgica",
    label: "Máscara Cirúrgica",
    icon: "😷",
    descricao: "B2: +0,5/h → +0,25/h. Sem efeito em B3+. Dura 4h.",
    reducao: {
      exterior: "0", B1: "0", B2: "−50%", B3: "0", B4: "0"
    }
  },
  {
    id: "n95",
    label: "Respirador N95",
    icon: "😷",
    descricao: "B2: +0,5/h → +0,1/h | B3: +1/h → +0,4/h. Dura 8h.",
    reducao: {
      exterior: "0", B1: "0", B2: "−80%", B3: "−60%", B4: "0"
    }
  },
  {
    id: "gas_civil",
    label: "Máscara de Gás Civil",
    icon: "🛡️",
    descricao: "B2: zero Aurora | B3: −75% | B4: −50%. −5% Percepção.",
    reducao: {
      exterior: "0", B1: "0", B2: "ZERO", B3: "−75%", B4: "−50%"
    }
  },
  {
    id: "gas_esp",
    label: "Máscara Especializada",
    icon: "🛡️",
    descricao: "ZERA Aurora em todos os andares. Sem penalidade.",
    reducao: {
      exterior: "0", B1: "0", B2: "ZERO", B3: "ZERO", B4: "ZERO"
    }
  }
];

const linhasHtml = MASCARAS.map(m => `
  <div style="display:flex; align-items:center; gap:8px; padding:6px 4px; border-bottom:1px solid #2a2a3a;
              background:${mascaraAtiva === m.id ? "#1a2a1a" : "transparent"}; cursor:pointer"
       class="mascara-opt" data-id="${m.id}">
    <input type="radio" name="mascara" value="${m.id}" ${mascaraAtiva === m.id ? "checked" : ""}/>
    <div>
      <span style="font-size:1.1em">${m.icon}</span>
      <b style="color:${mascaraAtiva === m.id ? "#a0ffa0" : "#ccc"}"> ${m.label}</b>
      <br><span style="font-size:0.78em; color:#888">${m.descricao}</span>
    </div>
  </div>
`).join("");

new Dialog({
  title: `Proteção Respiratória — ${actor.name}`,
  content: `
    <div style="min-width:360px; max-height:380px; overflow-y:auto">
      <p style="color:#888; font-size:0.85em; margin-bottom:8px">
        Máscara atual: <b style="color:#ccc">${MASCARAS.find(m => m.id === mascaraAtiva)?.label ?? "Nenhuma"}</b>
      </p>
      ${linhasHtml}
      <div style="margin-top:8px; padding:8px; background:#0a0a1a; border-radius:4px">
        <b style="color:#666; font-size:0.8em">PROTEÇÃO POR ANDAR:</b>
        <div id="tabela-reducao" style="font-size:0.8em; color:#888; margin-top:4px">
          Selecione uma máscara para ver detalhes.
        </div>
      </div>
    </div>
  `,
  buttons: {
    equipar: {
      icon: '<i class="fas fa-shield-alt"></i>',
      label: "Equipar / Trocar",
      callback: async (html) => {
        const escolhido = html.find("input[name='mascara']:checked").val() ?? "nenhuma";
        const mascara = MASCARAS.find(m => m.id === escolhido);

        await actor.setFlag(MODULE_ID, "mascara_tipo", escolhido);

        const cor = escolhido === "nenhuma" ? "#888" : escolhido === "gas_esp" ? "#a0ffa0" : "#44aaff";
        ChatMessage.create({
          content: `
            <div style="border-left:4px solid ${cor}; padding:8px 12px; background:#1a1a2e">
              ${mascara.icon} <b>${actor.name}</b> — ${mascara.label}<br>
              <span style="color:#aaa; font-size:0.85em">${mascara.descricao}</span>
            </div>
          `
        });
      }
    },
    cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
  },
  default: "equipar",
  render: (html) => {
    // Mostra tabela de redução ao selecionar
    const atualizarTabela = (id) => {
      const m = MASCARAS.find(x => x.id === id);
      if (!m) return;
      const andares = Object.entries(m.reducao);
      html.find("#tabela-reducao").html(
        andares.map(([andar, red]) =>
          `<span style="margin-right:12px; color:${red === "ZERO" ? "#a0ffa0" : red === "0" ? "#555" : "#44aaff"}">${andar}: ${red}</span>`
        ).join("")
      );
    };

    html.find("input[name='mascara']").on("change", (e) => atualizarTabela(e.target.value));
    atualizarTabela(mascaraAtiva ?? "nenhuma");
  }
}).render(true);
