// ============================================================
// E CORP — Criador de Operador (Wizard)
// Botão fixo na aba de Atores, estilo Investigator Wizard.
// Mostra as 4 classes + escolhas de loadout (armas) por classe.
// ============================================================
const MODULE_ID = "debaixo-da-pele";

const CLASSES = [
  { id: "RECON", emoji: "🎯", cor: "#8fb9a8", papel: "RECON / SNIPER",
    tag: "Eliminação a Longa Distância",
    resumo: "Sniper e olheiro. Enxerga o problema antes de todos. Inútil em corredor." },
  { id: "ASSAULT", emoji: "🔫", cor: "#c9a227", papel: "ASSAULT",
    tag: "Versátil · Linha de Frente",
    resumo: "O operador padrão e líder. Combate geral e suporte. Segundo melhor em tudo." },
  { id: "BREACHER", emoji: "🛡️", cor: "#b05a4a", papel: "BREACHER / JUGGERNAUT",
    tag: "Domínio de Curta Distância",
    resumo: "O tanque. Abre caminho e protege os aliados. Lento — vulnerável ao que é rápido." },
  { id: "SPECIALIST", emoji: "🔬", cor: "#7d8fc4", papel: "SPECIALIST / TECH",
    tag: "Análise de Anomalias · Suporte",
    resumo: "A cientista. Análise, medicina e recuperação de artefatos. Frágil: precisa de escolta." }
];

export async function abrirCriadorOperador() {
  // Carrega os operadores para saber as escolhas de loadout de cada classe
  let escolhasPorClasse = {};
  try {
    const ops = await window.DebaixoDaPele?.carregarOperadores?.();
    for (const op of ops ?? []) {
      const ec = op.flags?.[MODULE_ID]?.ecorp;
      if (ec?.classe) escolhasPorClasse[ec.classe] = ec.escolhas ?? [];
    }
  } catch (e) {
    console.warn(`${MODULE_ID} | Não consegui carregar escolhas de loadout:`, e);
  }

  const jogadores = game.users.filter(u => u.active && !u.isGM);
  const opcoesJogador = (game.user.isGM && jogadores.length)
    ? `<div style="margin-top:12px">
         <label style="color:#ccc; font-size:0.85em; display:block; margin-bottom:4px">Atribuir a:</label>
         <select id="ecorp-owner" style="width:100%; padding:4px; background:#111; color:#ddd; border:1px solid #444">
           <option value="${game.user.id}">— Eu (GM) —</option>
           ${jogadores.map(u => `<option value="${u.id}">${u.name}</option>`).join("")}
         </select>
       </div>`
    : "";

  const cards = CLASSES.map(m => `
    <label class="ecorp-card" style="
        display:block; border:1px solid #2a2a2a; border-left:4px solid ${m.cor};
        border-radius:5px; padding:10px 12px; margin-bottom:8px; cursor:pointer; background:#161616">
      <div style="display:flex; align-items:center; gap:10px">
        <input type="radio" name="ecorp-classe" value="${m.id}" style="margin:0">
        <span style="font-size:1.4em">${m.emoji}</span>
        <div style="flex:1">
          <div style="font-weight:bold; color:${m.cor}; letter-spacing:0.05em">${m.papel}</div>
          <div style="color:#888; font-size:0.78em">${m.tag}</div>
        </div>
      </div>
      <div style="color:#aaa; font-size:0.8em; margin-top:6px; line-height:1.4">${m.resumo}</div>
    </label>`).join("");

  new Dialog({
    title: "⬡ E CORP — Extermination Division · Criar Operador",
    content: `
      <div style="min-width:480px; max-height:580px; overflow-y:auto; padding-right:4px; font-family:'Signika',sans-serif">
        <p style="color:#999; font-size:0.85em; margin:4px 0 12px">
          Escolha uma classe e o loadout. A ficha vem <b>pronta para jogar</b> — atributos, perícias, armas e equipamento.
        </p>
        ${cards}
        <div id="ecorp-loadout" style="margin-top:4px"></div>
        <div style="margin-top:12px">
          <label style="color:#ccc; font-size:0.85em; display:block; margin-bottom:4px">
            Nome do personagem <span style="color:#777">(opcional)</span>:
          </label>
          <input type="text" id="ecorp-nome" placeholder="deixe em branco para usar o nome padrão"
                 style="width:100%; padding:4px; background:#111; color:#ddd; border:1px solid #444">
        </div>
        ${opcoesJogador}
      </div>`,
    buttons: {
      criar: {
        icon: '<i class="fas fa-user-plus"></i>',
        label: "Criar Operador",
        callback: async (html) => {
          const classe = html.find('input[name="ecorp-classe"]:checked').val();
          if (!classe) return ui.notifications.warn("Selecione uma classe.");

          // Coleta as escolhas de loadout
          const escolhas = {};
          html.find("select.ecorp-grupo").each((_, el) => {
            escolhas[Number(el.dataset.grupo)] = Number(el.value);
          });

          const nome = html.find("#ecorp-nome").val()?.trim() || null;
          const ownerSel = html.find("#ecorp-owner").val() ?? game.user.id;
          const api = window.DebaixoDaPele;

          if (game.user.isGM) {
            if (!api?.criarOperador) return ui.notifications.error("Módulo não carregado.");
            await api.criarOperador(classe, nome, ownerSel, escolhas);
          } else {
            api?.emitSocket?.({ action: "criarOperador", classe, nome, ownerId: game.user.id, escolhas });
            ui.notifications.info(`⏳ Solicitação enviada. Seu operador ${classe} aparecerá em instantes.`);
          }
        }
      },
      cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
    },
    default: "criar",
    render: (html) => {
      const loadoutDiv = html.find("#ecorp-loadout");

      const montarLoadout = (classe) => {
        const grupos = escolhasPorClasse[classe] ?? [];
        if (!grupos.length) { loadoutDiv.html(""); return; }
        const blocos = grupos.map((g, gi) => `
          <div style="margin-top:8px">
            <label style="color:#c9a227; font-size:0.82em; font-weight:bold; display:block; margin-bottom:3px">
              ⚙ ${g.label}
            </label>
            <select class="ecorp-grupo" data-grupo="${gi}"
                    style="width:100%; padding:4px; background:#111; color:#ddd; border:1px solid #444">
              ${g.opcoes.map((o, idx) => `<option value="${idx}">${o.nome}</option>`).join("")}
            </select>
          </div>`).join("");
        loadoutDiv.html(`
          <div style="border:1px solid #333; border-radius:5px; padding:8px 10px; background:#141414; margin-top:6px">
            <div style="color:#888; font-size:0.78em; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:2px">Loadout</div>
            ${blocos}
          </div>`);
      };

      html.on("change", 'input[name="ecorp-classe"]', (ev) => {
        html.find(".ecorp-card").css("border-color", "#2a2a2a");
        html.find('input[name="ecorp-classe"]:checked').closest(".ecorp-card").css("border-color", "#aaa");
        montarLoadout(ev.currentTarget.value);
      });
    }
  }, { width: 520 }).render(true);
}

// ─── Botão fixo na aba de Atores (mesmo lugar do Investigator Wizard) ───
Hooks.on("renderActorDirectory", (app, htmlOrEl) => {
  const root = htmlOrEl?.[0] ?? htmlOrEl;
  if (!root?.querySelector || root.querySelector(".ecorp-create-btn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ecorp-create-btn";
  btn.style.cssText = "width:100%; margin-top:4px; padding:6px; font-weight:bold";
  btn.innerHTML = '<i class="fas fa-user-plus"></i> Criar Operador E CORP';
  btn.addEventListener("click", () => abrirCriadorOperador());

  const footer = root.querySelector("footer.directory-footer")
              ?? root.querySelector(".directory-footer");
  if (footer) footer.append(btn);
  else {
    const header = root.querySelector(".directory-header");
    if (header?.after) header.after(btn); else root.prepend?.(btn);
  }
});

Hooks.once("ready", () => {
  window.DebaixoDaPele = { ...(window.DebaixoDaPele ?? {}), abrirCriadorOperador };
});
