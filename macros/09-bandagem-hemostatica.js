// ============================================================
// MACRO 9 — Bandagem Hemostática
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================
// Estanca hemorragia automaticamente. Sem rolagem. Sem cura de PV.
// ============================================================

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Selecione um token.");
const actor = token.actor;

// Busca active effects de hemorragia
const hemorragia = actor.effects.find(e =>
  e.name?.toLowerCase().includes("hemorra") ||
  e.name?.toLowerCase().includes("sangra")  ||
  e.name?.toLowerCase().includes("bleeding")
);

if (hemorragia) {
  await hemorragia.delete();
  ChatMessage.create({
    content: `
      <div style="border-left:4px solid #cc4444; padding:8px 12px; background:#1a1a2e">
        🩹 <b>Bandagem Hemostática aplicada</b><br>
        Hemorragia de <b>${actor.name}</b> estancada com sucesso.<br>
        <span style="color:#888; font-size:0.85em">A bandagem não recupera PV — apenas para o sangramento.</span>
      </div>
    `
  });
} else {
  // Pergunta se quer criar o efeito de hemorragia para teste
  ChatMessage.create({
    content: `
      <div style="border-left:4px solid #888; padding:8px 12px; background:#1a1a2e">
        🩹 <b>Bandagem aplicada em ${actor.name}.</b><br>
        Nenhuma hemorragia ativa detectada — efeito preventivo.<br>
        <span style="color:#888; font-size:0.85em">Se o personagem sofrer ferimento grave, a bandagem entra em efeito.</span>
      </div>
    `
  });
}
