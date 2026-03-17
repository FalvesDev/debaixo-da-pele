// ============================================================
// MACRO 3 — Timer do Override (Sistema de Emergência)
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================
// AVISO: setTimeout usa tempo real do servidor.
// Recarregar o Foundry cancela os timers. Use com cuidado.
// ============================================================

const MODULE_ID = "debaixo-da-pele";

// Verificar se já há um override ativo
const jaAtivo = game.settings.get(MODULE_ID, "overrideAtivo") ?? false;
if (jaAtivo) {
  const continuar = await Dialog.confirm({
    title: "Override já ativo",
    content: "Um Override já está em andamento. Deseja reiniciar o timer?",
    yes: () => true,
    no: () => false
  });
  if (!continuar) return;
}

// ─── Configuração dos alertas ────────────────────────────────
// Todos os tempos são em milissegundos a partir do início do Override
const ALERTAS = [
  {
    tempo: 0,
    msg: `
      <div style="border-left:4px solid #ffcc00; padding:8px 12px; background:#1a1a2e">
        <b style="color:#ffcc00; font-size:1.1em">⚠️ OVERRIDE ATIVADO</b><br>
        Sistema de emergência inicializado.<br>
        Processando autenticação de segurança...<br>
        <span style="color:#aaa">A saída de emergência abrirá em <b>8 minutos</b>.</span>
      </div>
    `
  },
  {
    tempo: 8 * 60 * 1000,
    msg: `
      <div style="border-left:4px solid #00cc66; padding:8px 12px; background:#1a1a2e">
        <b style="color:#00cc66; font-size:1.1em">🔓 SAÍDA DE EMERGÊNCIA ABERTA</b><br>
        Corredor B1 → Escada de Emergência → Saída.<br>
        <b style="color:#ffcc00">30 MINUTOS para sair antes que a porta feche.</b><br>
        <span style="color:#aaa">Sistemas críticos permanecem ativos.</span>
      </div>
    `,
    som: "SFX — Override Ativado"
  },
  {
    tempo: 23 * 60 * 1000,
    msg: `
      <div style="border-left:4px solid #ffcc00; padding:8px 12px; background:#1a1a2e">
        <b style="color:#ffcc00">⏰ Override: 15 minutos restantes.</b><br>
        <span style="color:#aaa">Saída de emergência ainda aberta.</span>
      </div>
    `
  },
  {
    tempo: 33 * 60 * 1000,
    msg: `
      <div style="border-left:4px solid #ff6b6b; padding:8px 12px; background:#1a1a2e">
        <b style="color:#ff6b6b">⏰ Override: 5 minutos restantes.</b><br>
        <span style="color:#aaa">Prepare-se para fechar a saída.</span>
      </div>
    `
  },
  {
    tempo: 37 * 60 * 1000,
    msg: `
      <div style="border-left:4px solid #ff0000; padding:8px 12px; background:#1a1a2e">
        <b style="color:#ff0000; animation:pulsar 1s infinite">⏰ Override: 1 MINUTO RESTANTE!</b><br>
        <span style="color:#ffa0a0">Saindo agora ou perdendo a chance de escapar!</span>
      </div>
    `
  },
  {
    tempo: 38 * 60 * 1000,
    msg: `
      <div style="border-left:4px solid #cc0000; padding:8px 12px; background:#0a0a0a">
        <b style="color:#cc0000; font-size:1.1em">🔒 PORTA FECHADA</b><br>
        Override encerrado. Saída de emergência trancada.<br>
        <span style="color:#888">Para reinicializar: código <b>880417</b> (Seção 14.7)</span>
      </div>
    `,
    som: "SFX — Porta Fechando",
    encerrar: true
  }
];

// ─── Ativar Override ─────────────────────────────────────────
await game.settings.set(MODULE_ID, "overrideAtivo", true);

// Reproduzir sirene de lockdown
const sirenePlst = game.playlists?.getName("SFX — Lockdown Sirene");
if (sirenePlst) sirenePlst.playAll();

// Agendar todos os alertas
const timers = ALERTAS.map(({ tempo, msg, som, encerrar }) => {
  return setTimeout(async () => {
    ChatMessage.create({ content: msg });

    if (som) {
      const playlist = game.playlists?.getName(som);
      if (playlist) playlist.playAll();
    }

    if (encerrar) {
      await game.settings.set(MODULE_ID, "overrideAtivo", false);
      ui.notifications.warn("Override encerrado. Porta de emergência trancada.");
    }
  }, tempo);
});

// Guardar IDs dos timers na sessão (para cancelamento)
window._ddpOverrideTimers = timers;
window._ddpOverrideInicio = Date.now();

// Mensagem inicial
ChatMessage.create({ content: ALERTAS[0].msg });
ui.notifications.info("Override ativado. Timer em execução.");

// ─── Botão de cancelamento (GM only) ─────────────────────────
if (game.user.isGM) {
  setTimeout(() => {
    new Dialog({
      title: "Cancelar Override?",
      content: `
        <p>O timer de Override está rodando.</p>
        <p>Deseja adicionar um botão de cancelamento de emergência na barra de macros?</p>
        <p style="color:#888; font-size:0.85em">
          Para cancelar manualmente, execute no console:<br>
          <code>(window._ddpOverrideTimers || []).forEach(clearTimeout)</code>
        </p>
      `,
      buttons: {
        ok: { label: "Entendido" }
      }
    }).render(true);
  }, 500);
}
