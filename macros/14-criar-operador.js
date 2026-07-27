// ============================================================
// MACRO 14 — Criar Operador E CORP (PROTOCOLO ÂMBAR)
// Debaixo da Pele | Call of Cthulhu 7e + Pulp Cthulhu
// ============================================================
// "Wizard" de criação: o jogador escolhe a classe e recebe a ficha
// pronta (perícias + armas + equipamento). Não depende do compendium
// abrir — os dados vêm do JSON do módulo via window.DebaixoDaPele.
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const CLASSES = [
  { id: "RECON", emoji: "🎯", cor: "#8fb9a8", papel: "RECON / SNIPER",
    tag: "Eliminação a Longa Distância",
    equip: "Rifle de precisão · Visão térmica/noturna · Drone · Camuflagem · Pistola silenciada",
    resumo: "Sniper e olheiro. Enxerga o problema antes de todos. Inútil em corredor." },
  { id: "ASSAULT", emoji: "🔫", cor: "#c9a227", papel: "ASSAULT",
    tag: "Versátil · Linha de Frente",
    equip: "Rifle de assalto · Lança-granadas · Granadas flash/fumaça · Drone tático · Pistola",
    resumo: "O operador padrão e líder. Combate geral e suporte. Segundo melhor em tudo." },
  { id: "BREACHER", emoji: "🛡️", cor: "#b05a4a", papel: "BREACHER / JUGGERNAUT",
    tag: "Domínio de Curta Distância",
    equip: "Shotgun automática · Marreta de arrombamento · Escudo balístico · Stun/flashbang · Armadura pesada",
    resumo: "O tanque. Abre caminho e protege os aliados. Lento — vulnerável ao que é rápido." },
  { id: "SPECIALIST", emoji: "🔬", cor: "#7d8fc4", papel: "SPECIALIST / TECH",
    tag: "Análise de Anomalias · Suporte",
    equip: "SMG compacta · Scanner de anomalias · Ferramentas de contenção · Kit de trauma · Case de recuperação",
    resumo: "A cientista. Análise, medicina e recuperação de artefatos. Frágil: precisa de escolta." }
];

// GM pode escolher para qual jogador criar
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
    <div style="color:#6f6f6f; font-size:0.74em; margin-top:5px"><b style="color:#888">Equipamento:</b> ${m.equip}</div>
  </label>`).join("");

new Dialog({
  title: "⬡ E CORP — Extermination Division · Criar Operador",
  content: `
    <div style="min-width:480px; max-height:560px; overflow-y:auto; padding-right:4px; font-family:'Signika',sans-serif">
      <p style="color:#999; font-size:0.85em; margin:4px 0 12px">
        Escolha uma classe. A ficha vem <b>pronta para jogar</b> — atributos, perícias, armas e equipamento configurados.
      </p>
      ${cards}
      <div style="margin-top:10px">
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

        const nome = html.find("#ecorp-nome").val()?.trim() || null;
        const ownerSel = html.find("#ecorp-owner").val() ?? game.user.id;
        const api = window.DebaixoDaPele;

        if (game.user.isGM) {
          if (!api?.criarOperador) return ui.notifications.error("Módulo Debaixo da Pele não carregado.");
          await api.criarOperador(classe, nome, ownerSel);
        } else {
          // Jogador não cria ator direto: pede ao GM por socket.
          api?.emitSocket?.({ action: "criarOperador", classe, nome, ownerId: game.user.id });
          ui.notifications.info(`⏳ Solicitação enviada. Seu operador ${classe} aparecerá em instantes.`);
        }
      }
    },
    cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
  },
  default: "criar",
  render: (html) => {
    html.on("change", 'input[name="ecorp-classe"]', () => {
      html.find(".ecorp-card").css("border-color", "#2a2a2a");
      html.find('input[name="ecorp-classe"]:checked').closest(".ecorp-card")
          .css("border-color", "#aaa");
    });
  }
}, { width: 520 }).render(true);
