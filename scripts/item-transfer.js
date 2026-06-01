// ============================================================
// TRANSFERÊNCIA DE ITENS — Sistema de troca entre investigadores
// Debaixo da Pele | Foundry VTT v12
// ============================================================

const MODULE_ID = "debaixo-da-pele";

// ─── Helpers internos ────────────────────────────────────────

function _migrateLayout(raw) {
  if (!raw || typeof raw !== "object") return { quick: {}, bag: {}, equipped: {} };
  if (raw.bag !== undefined || raw.quick !== undefined)
    return { quick: raw.quick ?? {}, bag: raw.bag ?? {}, equipped: raw.equipped ?? {} };
  const bag = {};
  for (const [id, pos] of Object.entries(raw)) {
    if (pos && typeof pos === "object" && "row" in pos) bag[id] = pos;
  }
  return { quick: {}, bag, equipped: {} };
}

async function _removeFromLayout(actor, itemId) {
  const raw    = actor.flags?.[MODULE_ID]?.inventario ?? {};
  const layout = _migrateLayout(raw);
  for (const zone of ["quick", "bag", "equipped"]) {
    delete layout[zone][itemId];
  }
  await actor.setFlag(MODULE_ID, "inventario", layout);
}

function _refreshInventoryWindow(actorId) {
  for (const w of Object.values(ui.windows ?? {})) {
    if (w?.actor?.id === actorId) w.render(false);
  }
}

// ─── Executa a transferência (precisa de permissão sobre ambos) ──
export async function executeTransfer(sourceActorId, itemId, targetActorId) {
  const source = game.actors.get(sourceActorId);
  const target = game.actors.get(targetActorId);
  if (!source || !target) return;

  const item = source.items.get(itemId);
  if (!item) return;

  const itemData = item.toObject();
  delete itemData._id;
  // Preserva a munição customizada nas flags de destino
  // (flag "ammo" já vai junto com itemData.flags)

  // Remove do layout do remetente
  await _removeFromLayout(source, itemId);
  // Deleta o item do ator remetente
  await item.delete();
  // Cria no ator destino
  await Item.create(itemData, { parent: target });

  ui.notifications.info(`📦 ${itemData.name} transferido para ${target.name}!`);
  _refreshInventoryWindow(sourceActorId);
  _refreshInventoryWindow(targetActorId);
}

// ─── Inicia o processo de transferência ─────────────────────
// Chamado pelo inventário quando o jogador escolhe "Enviar para..."
export async function requestTransfer(sourceActorId, itemId, targetActorId) {
  const source = game.actors.get(sourceActorId);
  const item   = source?.items.get(itemId);
  if (!source || !item) return;

  // Tenta acessar o ator destino — pode ser undefined para não-GM
  const target = game.actors.get(targetActorId);

  // GM executa direto (tem acesso total)
  if (game.user.isGM) {
    if (!target) { ui.notifications.error("Ator destino não encontrado."); return; }
    await executeTransfer(sourceActorId, itemId, targetActorId);
    return;
  }

  // Jogador que também é dono do destino: executa direto
  if (target?.isOwner) {
    await executeTransfer(sourceActorId, itemId, targetActorId);
    return;
  }

  // Não-GM sem acesso ao ator destino: envia socket com targetOwners vazio.
  // O GM faz o relay e resolve quem é o dono via handleTransferSocket.
  const targetOwners = target
    ? Object.entries(target.ownership ?? {})
        .filter(([uid, lvl]) => uid !== "default" && lvl >= 3)
        .map(([uid]) => uid)
    : [];

  // Busca nome do destino no roster (sem precisar do actor object)
  const roster      = game.settings.get(MODULE_ID, "partyRoster") ?? { actors: [] };
  const rosterEntry = (roster.actors ?? []).find(r => r.id === targetActorId);
  const targetName  = target?.name ?? rosterEntry?.name ?? "investigador";

  game.socket.emit(`module.${MODULE_ID}`, {
    action:       "itemTransferRequest",
    fromUserId:   game.user.id,
    fromActorId:  sourceActorId,
    toActorId:    targetActorId,
    targetOwners,
    itemId,
    itemData:     item.toObject()
  });

  ui.notifications.info(`📨 Pedido de transferência de "${item.name}" enviado para ${targetName}…`);
}

// ─── Mostra picker de destino ─────────────────────────────────
export function showTransferPicker(sourceActorId, itemId) {
  const source   = game.actors.get(sourceActorId);
  if (!source) return;

  // Lê o roster — world setting acessível a todos os players
  const roster     = game.settings.get(MODULE_ID, "partyRoster") ?? { actors: [] };
  const rosterList = (roster.actors ?? []).filter(r => r.id !== sourceActorId);

  // GM vê também personagens fora do roster (que ainda estão em game.actors)
  let targets = rosterList;
  if (game.user.isGM) {
    const rosterIds = new Set(rosterList.map(r => r.id));
    const extra = game.actors
      .filter(a => a.type === "character" && a.id !== sourceActorId && !rosterIds.has(a.id))
      .map(a => ({ id: a.id, name: a.name, img: a.img }));
    targets = [...rosterList, ...extra];
  }

  if (targets.length === 0) {
    ui.notifications.warn("Nenhum outro investigador disponível.");
    return;
  }

  const item = source.items.get(itemId);
  if (!item) return;

  // Monta cards dos atores
  const cardsHtml = targets.map(a => `
    <div class="ddp-transfer-card" data-actor-id="${a.id}" title="Enviar para ${a.name}">
      <img src="${a.img}" />
      <span>${a.name.split(" ")[0]}</span>
    </div>
  `).join("");

  new Dialog({
    title: `📦 Enviar: ${item.name}`,
    content: `
      <div style="padding:8px 4px;">
        <p style="color:#aaa;font-size:0.85em;margin-bottom:10px;">
          Escolha quem vai receber <b>${item.name}</b>:
        </p>
        <div class="ddp-transfer-grid">
          ${cardsHtml}
        </div>
      </div>
    `,
    buttons: { fechar: { label: "Cancelar", icon: '<i class="fas fa-times"></i>' } },
    default: "fechar",
    render: (html) => {
      html.find(".ddp-transfer-card").on("click", async (e) => {
        const targetId = e.currentTarget.dataset.actorId;
        // Fecha o dialog
        html.closest(".dialog").find(".close").trigger("click");
        await requestTransfer(sourceActorId, itemId, targetId);
      });
    }
  }).render(true);
}

// ─── Handler de socket ────────────────────────────────────────
// Registrado em main.js dentro de _handleSocket
export async function handleTransferSocket(data) {

  // ── Pedido recebido: mostra dialog de aceitar/recusar ──
  if (data.action === "itemTransferRequest") {
    const targetOwners = data.targetOwners ?? [];

    // GM relay: jogador não conseguiu resolver os donos → GM faz o relay
    if (game.user.isGM && targetOwners.length === 0) {
      const target = game.actors.get(data.toActorId);
      if (!target) return;
      const owners = Object.entries(target.ownership ?? {})
        .filter(([uid, lvl]) => uid !== "default" && lvl >= 3)
        .map(([uid]) => uid);
      if (owners.length === 0) {
        // Nenhum dono de jogador: GM executa diretamente
        await executeTransfer(data.fromActorId, data.itemId, data.toActorId);
        game.socket.emit(`module.${MODULE_ID}`, {
          action: "itemTransferDone", fromUserId: data.fromUserId, toActorId: data.toActorId
        });
      } else {
        // Re-emite com os donos corretos para que o jogador certo veja o dialog
        game.socket.emit(`module.${MODULE_ID}`, { ...data, targetOwners: owners });
      }
      return;
    }

    // Só processa quem é dono do ator destino ou o GM
    const isOwner = targetOwners.includes(game.user.id);
    if (!isOwner && !game.user.isGM) return;
    // GM não mostra dialog (quem mostra é o jogador dono do destino)
    if (game.user.isGM && !isOwner) return;

    const source = game.actors.get(data.fromActorId);
    const target = game.actors.get(data.toActorId);
    if (!source || !target) return;

    const confirmed = await Dialog.confirm({
      title: "📦 Item Recebido",
      content: `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 4px;">
          <img src="${data.itemData.img ?? 'icons/svg/chest.svg'}"
               style="width:48px;height:48px;border:2px solid #444;border-radius:6px;object-fit:cover;"/>
          <div>
            <b style="color:#eee;font-size:1em;">${data.itemData.name}</b><br>
            <span style="color:#888;font-size:0.85em;">
              <i class="fas fa-user"></i> ${source.name} quer te dar este item.
            </span>
          </div>
        </div>
      `,
      yes: { label: "✅ Aceitar",  icon: "<i class='fas fa-check'></i>" },
      no:  { label: "❌ Recusar",  icon: "<i class='fas fa-times'></i>" },
      defaultYes: true
    });

    // Envia resposta via socket
    game.socket.emit(`module.${MODULE_ID}`, {
      action:      confirmed ? "itemTransferAccept" : "itemTransferDecline",
      fromActorId: data.fromActorId,
      toActorId:   data.toActorId,
      itemId:      data.itemId,
      fromUserId:  data.fromUserId
    });
  }

  // ── Aceite: GM (ou dono da fonte) executa a transferência ──
  if (data.action === "itemTransferAccept") {
    if (!game.user.isGM) return; // Só o GM executa
    await executeTransfer(data.fromActorId, data.itemId, data.toActorId);
    // Notifica o remetente via socket
    game.socket.emit(`module.${MODULE_ID}`, {
      action:      "itemTransferDone",
      fromUserId:  data.fromUserId,
      toActorId:   data.toActorId
    });
  }

  // ── Recusa: notifica o remetente ──
  if (data.action === "itemTransferDecline") {
    if (!game.user.isGM) return;
    const target = game.actors.get(data.toActorId);
    game.socket.emit(`module.${MODULE_ID}`, {
      action:     "itemTransferDeclined",
      fromUserId: data.fromUserId,
      targetName: target?.name ?? "?"
    });
  }

  // ── Confirmação de conclusão para o remetente ──
  if (data.action === "itemTransferDone") {
    if (game.user.id !== data.fromUserId) return;
    const target = game.actors.get(data.toActorId);
    ui.notifications.info(`✅ Transferência aceita por ${target?.name ?? "?"}!`);
  }

  // ── Notificação de recusa para o remetente ──
  if (data.action === "itemTransferDeclined") {
    if (game.user.id !== data.fromUserId) return;
    ui.notifications.warn(`❌ ${data.targetName} recusou o item.`);
  }
}
