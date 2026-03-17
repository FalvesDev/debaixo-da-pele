// ============================================================
// MACRO 6 — Revelar Documento para Jogadores
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================
// Mostra um dialog com todos os journals da campanha e permite
// revelar seletivamente para os jogadores com 1 clique.
// ============================================================

// Prefixo dos documentos da campanha
const PREFIXO = "DOC-";

// Buscar todos os journals com o prefixo DOC-
const todos = game.journal.contents
  .filter(j => j.name?.startsWith(PREFIXO))
  .sort((a, b) => a.name.localeCompare(b.name));

if (todos.length === 0) {
  return ui.notifications.warn("Nenhum documento DOC-XX encontrado nos Journals.");
}

const listaHtml = todos.map(j => {
  const paginas = j.pages?.contents ?? [];
  const primeiraPagina = paginas[0];
  const preview = primeiraPagina?.text?.content
    ? primeiraPagina.text.content.replace(/<[^>]+>/g, "").slice(0, 80) + "…"
    : "(sem conteúdo)";

  return `
    <div style="display:flex; align-items:center; gap:8px; padding:6px 4px; border-bottom:1px solid #333">
      <input type="checkbox" class="doc-check" value="${j.id}" id="doc-${j.id}"/>
      <div>
        <label for="doc-${j.id}" style="cursor:pointer; color:#ccc; font-weight:bold">${j.name}</label><br>
        <span style="font-size:0.78em; color:#888; font-style:italic">${preview}</span>
      </div>
      <button class="btn-preview" data-id="${j.id}" style="margin-left:auto; padding:2px 8px; font-size:0.8em">👁 Ver</button>
    </div>
  `;
}).join("");

new Dialog({
  title: "Revelar Documentos — Debaixo da Pele",
  content: `
    <div style="min-width:420px; max-height:420px; overflow-y:auto">
      <div style="display:flex; gap:8px; margin-bottom:8px">
        <button id="btn-todos" style="flex:1; padding:4px">Marcar todos</button>
        <button id="btn-nenhum" style="flex:1; padding:4px">Desmarcar todos</button>
      </div>
      ${listaHtml}
    </div>
    <p style="color:#888; font-size:0.8em; margin-top:8px">
      Documentos selecionados serão mostrados como popup para todos os jogadores online.
    </p>
  `,
  buttons: {
    revelar: {
      icon: '<i class="fas fa-eye"></i>',
      label: "Revelar Selecionados",
      callback: async (html) => {
        const selecionados = html.find(".doc-check:checked")
          .map((_, el) => el.value)
          .get();

        if (selecionados.length === 0) {
          return ui.notifications.warn("Nenhum documento selecionado.");
        }

        for (const id of selecionados) {
          const journal = game.journal.get(id);
          if (!journal) continue;

          // Mostra o journal para todos
          await journal.sheet.render(true);
          // Envia para jogadores via socket
          game.socket.emit("showEntry", { entryId: id, force: true });

          ChatMessage.create({
            content: `📄 <b>Documento revelado:</b> ${journal.name}`,
            whisper: []  // visível para todos
          });
        }

        ui.notifications.info(`${selecionados.length} documento(s) revelado(s) para os jogadores.`);
      }
    },
    cancelar: {
      icon: '<i class="fas fa-times"></i>',
      label: "Cancelar"
    }
  },
  default: "revelar",
  render: (html) => {
    // Marcar / desmarcar todos
    html.find("#btn-todos").on("click", () =>
      html.find(".doc-check").prop("checked", true)
    );
    html.find("#btn-nenhum").on("click", () =>
      html.find(".doc-check").prop("checked", false)
    );

    // Preview ao clicar no botão de olho
    html.find(".btn-preview").on("click", (e) => {
      const id = e.currentTarget.dataset.id;
      const journal = game.journal.get(id);
      if (journal) journal.sheet.render(true);
    });
  }
}).render(true);
