// ============================================================
// MACRO 14 — Criar Operador E CORP (PROTOCOLO ÂMBAR)
// Debaixo da Pele | Call of Cthulhu 7e + Pulp Cthulhu
// ============================================================
// "Criador de personagem" por classe: o jogador escolhe RECON,
// ASSAULT, BREACHER ou SPECIALIST e recebe uma cópia da ficha
// pronta (perícias + armas + equipamento) já com posse atribuída.
// ============================================================

const MODULE_ID  = "debaixo-da-pele";
const PACK_LABEL = "ÂMBAR — Operadores E CORP";

// Metadados das classes (visual do dialog). O ator real vem do compendium.
const CLASSES = {
  RECON: {
    emoji: "🎯", cor: "#4a9d7f",
    papel: "Reconhecimento e Tiro de Precisão",
    resumo: "Sniper de longo alcance, furtividade e observação. Enxerga o problema antes de todos — inútil em corredor.",
    destaques: "Rifle · Furtividade · Perceber · Drones"
  },
  ASSAULT: {
    emoji: "🛡️", cor: "#b5893a",
    papel: "Assalto e Liderança de Equipe",
    resumo: "O operador padrão e coração do grupo. Combate geral, suporte e comando. Segundo melhor em tudo, insubstituível na coesão.",
    destaques: "Rifle · Pistola · Briga · Psicologia"
  },
  BREACHER: {
    emoji: "🔨", cor: "#a44a4a",
    papel: "Arrombamento e Contenção Física",
    resumo: "O tanque. Abre caminho, absorve o contato inicial e protege os aliados. Lento e previsível — vulnerável ao que é rápido.",
    destaques: "Espingarda · Briga · Intimidação · Demolições"
  },
  SPECIALIST: {
    emoji: "🔬", cor: "#7a5ba6",
    papel: "Contenção de Anomalias",
    resumo: "A cientista. Análise, medicina e recuperação de artefatos — o motivo de a missão existir. Frágil: precisa de escolta.",
    destaques: "Biologia · Primeiros Socorros · Computadores · Química"
  }
};

// ─────────────────────────────────────────────────────────────
// 1. Localizar o compendium de operadores
// ─────────────────────────────────────────────────────────────
const pack = game.packs.find(p => p.metadata.label === PACK_LABEL)
          ?? game.packs.find(p => p.metadata.name === "ecorp-actors");

if (!pack) {
  return ui.notifications.error(
    `Compendium "${PACK_LABEL}" não encontrado. Verifique se o módulo Debaixo da Pele está ativo.`
  );
}

await pack.getIndex();
const operadores = pack.index.contents;

if (!operadores.length) {
  return ui.notifications.error("O compendium de operadores está vazio.");
}

// Casa cada entrada do compendium com sua classe (pela flag ecorp.classe).
// Como o índice pode não trazer flags, carregamos os documentos.
const docs = await Promise.all(operadores.map(e => pack.getDocument(e._id)));
const porClasse = {};
for (const doc of docs) {
  const classe = doc.getFlag(MODULE_ID, "ecorp")?.classe
              ?? doc.flags?.[MODULE_ID]?.ecorp?.classe;
  if (classe) porClasse[classe] = doc;
}

// ─────────────────────────────────────────────────────────────
// 2. Montar o dialog de seleção
// ─────────────────────────────────────────────────────────────
const cards = Object.entries(CLASSES).map(([classe, m]) => {
  const doc = porClasse[classe];
  const nomeReal = doc ? doc.name : "(não encontrado no compendium)";
  const desativado = doc ? "" : "opacity:0.4; pointer-events:none";
  return `
    <label class="ecorp-card" data-classe="${classe}" style="
        display:block; border:2px solid #333; border-left:5px solid ${m.cor};
        border-radius:6px; padding:10px 12px; margin-bottom:8px; cursor:pointer;
        background:#1b1b1b; ${desativado}">
      <div style="display:flex; align-items:center; gap:10px">
        <input type="radio" name="ecorp-classe" value="${classe}" style="margin:0">
        <span style="font-size:1.5em">${m.emoji}</span>
        <div style="flex:1">
          <div style="font-weight:bold; color:${m.cor}; font-size:1.05em">${classe}
            <span style="color:#888; font-weight:normal; font-size:0.85em">— ${m.papel}</span>
          </div>
          <div style="color:#ccc; font-size:0.82em; margin-top:2px">${nomeReal}</div>
        </div>
      </div>
      <div style="color:#aaa; font-size:0.8em; margin-top:6px; line-height:1.35">${m.resumo}</div>
      <div style="color:#777; font-size:0.75em; margin-top:4px">
        <b style="color:#999">Perícias-chave:</b> ${m.destaques}
      </div>
    </label>`;
}).join("");

// Se o GM roda, pode escolher para qual jogador criar a ficha.
const jogadores = game.users.filter(u => u.active && !u.isGM);
const opcoesJogador = game.user.isGM && jogadores.length
  ? `<div style="margin-top:10px">
       <label style="color:#ccc; font-size:0.85em; display:block; margin-bottom:4px">
         Atribuir posse a:
       </label>
       <select id="ecorp-owner" style="width:100%">
         <option value="${game.user.id}">— Eu (GM) —</option>
         ${jogadores.map(u => `<option value="${u.id}">${u.name}</option>`).join("")}
       </select>
     </div>`
  : "";

new Dialog({
  title: "⬡ PROTOCOLO ÂMBAR — Criar Operador E CORP",
  content: `
    <div style="min-width:460px; max-height:520px; overflow-y:auto; padding-right:4px">
      <p style="color:#999; font-size:0.85em; margin-bottom:10px">
        Escolha uma classe. A ficha vem <b>pronta para jogar</b>: atributos,
        perícias, armas e equipamento já configurados.
      </p>
      ${cards}
      <div style="margin-top:10px">
        <label style="color:#ccc; font-size:0.85em; display:block; margin-bottom:4px">
          Nome do personagem <span style="color:#777">(opcional — em branco usa o nome de origem)</span>:
        </label>
        <input type="text" id="ecorp-nome" placeholder="Ex.: Vesper — Ingrid Halvorsen" style="width:100%">
      </div>
      ${opcoesJogador}
    </div>
  `,
  buttons: {
    criar: {
      icon: '<i class="fas fa-user-plus"></i>',
      label: "Criar Operador",
      callback: async (html) => {
        const classe = html.find('input[name="ecorp-classe"]:checked').val();
        if (!classe) return ui.notifications.warn("Selecione uma classe.");

        const doc = porClasse[classe];
        if (!doc) return ui.notifications.error("Operador desta classe não encontrado no compendium.");

        const nomeCustom = html.find("#ecorp-nome").val()?.trim() || null;
        const ownerId = html.find("#ecorp-owner").val() ?? game.user.id;

        // O GM cria direto. Jogadores (sem permissão de criar atores) pedem
        // ao GM via socket — o handler em main.js cria e atribui a posse.
        if (game.user.isGM) {
          const api = window.DebaixoDaPele;
          if (api?.criarOperador) {
            await api.criarOperador(classe, nomeCustom, ownerId);
          } else {
            // Fallback: cria localmente se a API do módulo não estiver disponível
            const dados = doc.toObject();
            delete dados._id;
            if (nomeCustom) dados.name = nomeCustom;
            dados.ownership = { default: 0, [ownerId]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
            const ator = await Actor.create(dados);
            ator.sheet.render(true);
          }
        } else {
          window.DebaixoDaPele?.emitSocket?.({
            action: "criarOperador", classe, nome: nomeCustom, ownerId: game.user.id
          });
          ui.notifications.info(`⏳ Solicitação enviada ao GM. Seu operador ${classe} aparecerá em instantes.`);
        }
      }
    },
    cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
  },
  default: "criar",
  render: (html) => {
    // Realce visual do card selecionado.
    html.on("change", 'input[name="ecorp-classe"]', () => {
      html.find(".ecorp-card").css("border-color", "#333");
      html.find('input[name="ecorp-classe"]:checked')
          .closest(".ecorp-card").css("border-color", "#888");
    });
  }
}, { width: 500 }).render(true);
