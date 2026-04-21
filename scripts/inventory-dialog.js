// ============================================================
// INVENTÁRIO GRID — Sistema Estilo Resident Evil
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const GRID_COLS       = 5;   // colunas da mochila
const QUICK_COLS      = 3;   // colunas do inventário rápido
const QUICK_ROWS_BASE = 2;   // linhas base do inventário rápido
const QUICK_ROWS_MAX  = 5;   // máximo de linhas no inventário rápido
const CELL_PX         = 70;  // px por célula
const MIN_ROWS        = 2;
const MAX_ROWS        = 8;

// Tipos CoC7 que NÃO são itens físicos
const TIPOS_EXCLUIDOS = new Set(["skill", "occupation", "archetype", "talent", "setup"]);

// Regex de itens equipáveis (wearables)
const WEARABLE_RE = /colete|capacete|hazmat|luvas|máscara|mascara|respirador|óculos|oculos|n95/i;

// ─── Helpers ──────────────────────────────────────────────
function _isWearable(item) {
  if (item.type === "weapon") return true;
  return WEARABLE_RE.test(item.name ?? "");
}

// ─── Tamanho padrão dos itens ─────────────────────────────
function _getItemSize(item) {
  // 1. Flags explícitos no item
  const f = item.flags?.[MODULE_ID];
  if (f?.gridW !== undefined && f?.gridH !== undefined)
    return { w: Math.max(1, +f.gridW), h: Math.max(1, +f.gridH) };

  // 2. Heurística por nome (português e inglês)
  const n = (item.name ?? "").toLowerCase();

  // ── Armas longas (1×3) ──────────────────────────────────
  if (/rifle|carabina|shotgun|espingarda|lança|metralhadora|submetralhadora|smg|sniper|fuzil/.test(n))
    return { w: 1, h: 3 };

  // ── Extintores / barras pesadas (1×3) ───────────────────
  if (/extintor|fire extinguisher/.test(n))
    return { w: 1, h: 3 };

  // ── Armas médias (1×2) ──────────────────────────────────
  if (/pistola|revólver|revolver|faca|machado|bastão|baton|porrete|cacete|martelo|hammer|machete|espada|sabre|lança-chamas|taser|stungun|stun gun|arco|besta|crossbow|estilingue/.test(n))
    return { w: 1, h: 2 };

  // ── Ferramentas / alavancas / tubos (1×2) ──────────────
  if (/alavanca|crowbar|pé de cabra|cano|tubo|pipe|chave inglesa|wrench|chave de fenda|screwdriver|alicate|pliers|tesoura scissors|serrote|saw|foice|lâmpada de sinalização|flare/.test(n))
    return { w: 1, h: 2 };

  // ── Câmera / binóculo / visão noturna (1×2) ─────────────
  if (/câmera|camera|binóculo|binoculars|visão noturna|night vision|telescópio|telescope/.test(n))
    return { w: 1, h: 2 };

  // ── Lanterna / rádio comunicador (1×2) ──────────────────
  if (/lanterna|flashlight|rádio|radio/.test(n))
    return { w: 1, h: 2 };

  // ── Corda / corrente (2×1) ──────────────────────────────
  if (/corda|rope|corrente|chain|cabo|wire|fio/.test(n))
    return { w: 2, h: 1 };

  // ── Kits médicos / maletas (2×2) ────────────────────────
  if (/kit médico|kit de primeiros|maleta médica|maleta|first aid kit|trauma kit|desfibrilador/.test(n))
    return { w: 2, h: 2 };

  // ── Bandagens / curativos grandes (2×1) ─────────────────
  if (/bandagem grande|atadura|curativo grande|bandagem|tourniquet|torniquete/.test(n))
    return { w: 2, h: 1 };

  // ── Roupas / equipamentos pesados (2×2) ─────────────────
  if (/máscara de gás|máscara gás|mascara gas|gas mask/.test(n))   return { w: 2, h: 2 };
  if (/colete|armadura|escudo|traje|hazmat|macacão|capacete|helmet|proteção/.test(n))
    return { w: 2, h: 2 };

  // ── Mochilas / contêineres grandes (2×2) ────────────────
  if (/mochila|mochilão|backpack|bolsão|saco grande|malinha|briefcase|caixa|toolbox/.test(n))
    return { w: 2, h: 2 };

  // ── Bolsas (1×2) ────────────────────────────────────────
  if (/bolsa|bag|sacola|pochete/.test(n))
    return { w: 1, h: 2 };

  // ── Itens 1×1 explícitos ─────────────────────────────────
  if (/munição|municao|ammo|bala|cartucho|clip|magazine|pente|cargador|projétil/.test(n))
    return { w: 1, h: 1 };
  if (/granada|bomba|grenade|explosivo|dinamite|mina|mine/.test(n))
    return { w: 1, h: 1 };
  if (/documento|pasta|diário|diario|mapa|relatório|relatorio|caderno|anotação|anotacao|nota|note|carta|letter|ficha|formulário|formulario|manual|livro|book/.test(n))
    return { w: 1, h: 1 };
  if (/seringa|syringe|ampola|vial|frasco|flask|comprimido|pílula|pilula|pill|remédio|remedio|medicine|medicamento|analgésico|antibiótico|morfina|adrenalina|amostra|sample|composto|serum|soro|aurora|substância|substancia/.test(n))
    return { w: 1, h: 1 };
  if (/comida|food|ração|racao|ration|snack|lanche|barra de cereal|água|water|cantil|canteen|garrafa|bottle|termos|thermos/.test(n))
    return { w: 1, h: 1 };
  if (/chave|key|keycard|cartão|cartao|crachá|cracha|badge|id|isqueiro|lighter|fósforo|fosforo|matches|lanterna pequena|mini lanterna|pilha|bateria|battery|tape|fita adesiva|zip tie|abraçadeira|arame|lock pick/.test(n))
    return { w: 1, h: 1 };
  if (/celular|phone|smartphone|tablet|pen drive|pendrive|usb|disco|drive|chip|cartão de memória|walkie/.test(n))
    return { w: 1, h: 1 };
  if (/algema|handcuff|relógio|watch|óculos|glasses|goggles|luva|glove/.test(n))
    return { w: 1, h: 1 };
  if (/álcool|alcool|alcohol|spray|aerossol|desinfetante|antisséptico/.test(n))
    return { w: 1, h: 1 };
  if (/curativo|band.?aid|esparadrapo|atadura pequena/.test(n))
    return { w: 1, h: 1 };

  // 3. Tipo CoC7
  if (item.type === "weapon") return { w: 1, h: 2 };
  if (item.type === "ammo")   return { w: 1, h: 1 };

  return { w: 1, h: 1 };
}

// ─── Calcula linhas do grid da mochila ───────────────────────
function _calcGridRows(actor) {
  const str      = actor.system?.characteristics?.str?.value ?? 40;
  const baseRows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.ceil(str / 10)));

  const bonus = actor.items.contents
    .filter(i => !TIPOS_EXCLUIDOS.has(i.type))
    .reduce((sum, i) => {
      const f = i.flags?.[MODULE_ID];
      // Flag explícita tem prioridade
      if (f?.bagBonus) return sum + Number(f.bagBonus);
      // Heurística para bolsas/mochilas sem flag
      if (/mochila|mochilão|backpack|bolsão|saco grande|bolsa de campo/i.test(i.name)) return sum + 1;
      return sum;
    }, 0);

  return Math.min(MAX_ROWS, baseRows + bonus);
}

// ─── Calcula linhas do grid rápido (correia/colete) ──────────
function _calcQuickRows(actor) {
  const bonus = actor.items.contents
    .filter(i => !TIPOS_EXCLUIDOS.has(i.type))
    .reduce((sum, i) => {
      const f = i.flags?.[MODULE_ID];
      if (f?.quickBonus) return sum + Number(f.quickBonus);
      if (/correia tática|correia tatica|colete tático|colete tatico|tactical vest|rig tático|rig tatico/i.test(i.name)) return sum + 1;
      return sum;
    }, 0);
  return Math.min(QUICK_ROWS_MAX, QUICK_ROWS_BASE + bonus);
}

// ─── Migração de layout antigo para novo formato ─────────────
function _migrateLayout(raw) {
  if (!raw || typeof raw !== "object") return { quick: {}, bag: {}, equipped: {} };

  // Formato novo: tem a chave "bag" ou "quick"
  if (raw.bag !== undefined || raw.quick !== undefined) {
    return {
      quick:    raw.quick    ?? {},
      bag:      raw.bag      ?? {},
      equipped: raw.equipped ?? {}
    };
  }

  // Formato antigo: flat object de itemId -> { row, col, rotated }
  // Move tudo para bag
  const bag = {};
  for (const [id, pos] of Object.entries(raw)) {
    if (pos && typeof pos === "object" && "row" in pos && "col" in pos) {
      bag[id] = pos;
    }
  }
  return { quick: {}, bag, equipped: {} };
}

// ─── Application ─────────────────────────────────────────
export class DDPInventoryDialog extends Application {
  constructor(actor, options = {}) {
    super(options);
    this.actor      = actor;
    this._layout    = _migrateLayout(actor.flags?.[MODULE_ID]?.inventario);
    this._dragging  = null;
    this._gridRows  = _calcGridRows(actor);
    this._quickRows = _calcQuickRows(actor);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:        "ddp-inventory-dialog",
      title:     "Inventário",
      template:  "modules/debaixo-da-pele/templates/inventory-dialog.html",
      width:     GRID_COLS * CELL_PX + QUICK_COLS * CELL_PX + 290,
      height:    MAX_ROWS * CELL_PX + 220,
      resizable: true,
      classes:   ["ddp-inventory-dialog"]
    });
  }

  // ── Matriz 2D para uma zona específica ────────────────
  _buildMatrix(zone) {
    const zoneLayout = this._layout[zone] ?? {};
    const cols = zone === "quick" ? QUICK_COLS : GRID_COLS;
    const rows = zone === "quick" ? this._quickRows : this._gridRows;
    const m = Array.from({ length: rows }, () => Array(cols).fill(null));

    for (const [itemId, pos] of Object.entries(zoneLayout)) {
      const item = this.actor.items.get(itemId);
      if (!item) continue;
      const sz = _getItemSize(item);
      const w  = pos.rotated ? sz.h : sz.w;
      const h  = pos.rotated ? sz.w : sz.h;
      for (let r = pos.row; r < pos.row + h; r++) {
        for (let c = pos.col; c < pos.col + w; c++) {
          if (r < rows && c < cols) m[r][c] = itemId;
        }
      }
    }
    return m;
  }

  // ── Verifica se item cabe na posição de uma zona ──────
  _canPlace(zone, itemId, row, col, rotated) {
    const item = this.actor.items.get(itemId);
    if (!item) return false;
    const sz   = _getItemSize(item);
    const w    = rotated ? sz.h : sz.w;
    const h    = rotated ? sz.w : sz.h;
    const cols = zone === "quick" ? QUICK_COLS : GRID_COLS;
    const rows = zone === "quick" ? this._quickRows : this._gridRows;
    if (row < 0 || col < 0 || row + h > rows || col + w > cols) return false;
    const m = this._buildMatrix(zone);
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (m[r][c] !== null && m[r][c] !== itemId) return false;
      }
    }
    return true;
  }

  // ── Remove item de todas as zonas ─────────────────────
  _removeFromAllZones(itemId) {
    delete this._layout.quick[itemId];
    delete this._layout.bag[itemId];
    delete this._layout.equipped[itemId];
  }

  // ── Equipa um item ─────────────────────────────────────
  _equipItem(itemId) {
    this._removeFromAllZones(itemId);
    this._layout.equipped[itemId] = true;
  }

  // ── Desequipa um item (volta para não alocados) ────────
  _unequipItem(itemId) {
    delete this._layout.equipped[itemId];
  }

  // ── Dados para o template Handlebars ──────────────────
  getData() {
    this._gridRows  = _calcGridRows(this.actor);
    this._quickRows = _calcQuickRows(this.actor);
    const bagRows   = this._gridRows;
    const quickRows = this._quickRows;

    const str      = this.actor.system?.characteristics?.str?.value ?? 40;
    const strBase  = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.ceil(str / 10)));
    const bagBonus   = bagRows - strBase;
    const quickBonus = quickRows - QUICK_ROWS_BASE;

    const allItems = this.actor.items.contents.filter(i => !TIPOS_EXCLUIDOS.has(i.type));

    // ── Itens equipados ──────────────────────────────────
    const equippedItems = [];
    for (const itemId of Object.keys(this._layout.equipped ?? {})) {
      const item = this.actor.items.get(itemId);
      if (!item) continue;
      const sz = _getItemSize(item);
      equippedItems.push({
        id:        itemId,
        name:      item.name,
        img:       item.img,
        slotLabel: `${sz.w}×${sz.h}`,
        isWearable: _isWearable(item)
      });
    }

    // ── Conjunto de IDs alocados (quick + bag + equipped) ─
    const allocatedIds = new Set([
      ...Object.keys(this._layout.quick ?? {}),
      ...Object.keys(this._layout.bag   ?? {}),
      ...Object.keys(this._layout.equipped ?? {})
    ]);

    // ── Helper para montar itens de uma zona grid ─────────
    const buildZoneItems = (zone) => {
      const zoneLayout = this._layout[zone] ?? {};
      const items = [];
      let used = 0;
      for (const [itemId, pos] of Object.entries(zoneLayout)) {
        const item = this.actor.items.get(itemId);
        if (!item) continue;
        const sz = _getItemSize(item);
        const w  = pos.rotated ? sz.h : sz.w;
        const h  = pos.rotated ? sz.w : sz.h;
        used += w * h;
        items.push({
          id:          itemId,
          name:        item.name,
          img:         item.img,
          rotated:     pos.rotated,
          sizeLabel:   `${sz.w}×${sz.h}`,
          isWearable:  _isWearable(item),
          styleLeft:   pos.col * CELL_PX,
          styleTop:    pos.row * CELL_PX,
          styleWidth:  w * CELL_PX,
          styleHeight: h * CELL_PX,
          zone
        });
      }
      return { items, used };
    };

    const { items: quickItems, used: quickUsed } = buildZoneItems("quick");
    const { items: bagItems,   used: bagUsed   } = buildZoneItems("bag");

    const quickTotalSlots = QUICK_COLS * quickRows;
    const bagTotalSlots   = GRID_COLS * bagRows;
    const totalSlots      = quickTotalSlots + bagTotalSlots;
    const usedSlots       = quickUsed + bagUsed;

    // ── Células da zona rápida ─────────────────────────────
    const quickCells = [];
    for (let r = 0; r < quickRows; r++) {
      for (let c = 0; c < QUICK_COLS; c++) {
        quickCells.push({ row: r, col: c, styleLeft: c * CELL_PX, styleTop: r * CELL_PX });
      }
    }

    // ── Células da mochila ─────────────────────────────────
    const bagCells = [];
    for (let r = 0; r < bagRows; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        bagCells.push({ row: r, col: c, styleLeft: c * CELL_PX, styleTop: r * CELL_PX });
      }
    }

    // ── Itens não alocados ─────────────────────────────────
    const unassigned = allItems
      .filter(i => !allocatedIds.has(i.id))
      .map(i => {
        const sz = _getItemSize(i);
        return {
          id:        i.id,
          name:      i.name,
          img:       i.img,
          sizeLabel: `${sz.w}×${sz.h}`,
          isWearable: _isWearable(i)
        };
      });

    return {
      actorName:   this.actor.name,
      actorImg:    this.actor.img,
      canEdit:     this.actor.isOwner || game.user.isGM,

      // Zona rápida
      quickItems,
      quickCells,
      quickRows,
      quickWidth:  QUICK_COLS * CELL_PX,
      quickHeight: quickRows * CELL_PX,
      quickUsed,
      quickTotal:  quickTotalSlots,
      quickBonus,

      // Mochila
      bagItems,
      bagCells,
      bagWidth:    GRID_COLS * CELL_PX,
      bagHeight:   bagRows * CELL_PX,
      bagRows,
      bagUsed,
      bagTotal:    bagTotalSlots,

      // Equipados
      equippedItems,
      equippedCount: equippedItems.length,

      // Não alocados
      unassigned,

      // Totais
      totalItens:  allItems.length,
      alocados:    quickItems.length + bagItems.length,
      strValue:    str,
      totalSlots,
      usedSlots,
      freeSlots:   totalSlots - usedSlots,
      bagBonus
    };
  }

  // ── Listeners de interação ────────────────────────────
  activateListeners(html) {
    super.activateListeners(html);

    const quickGrid = html.find(".ddp-inv-grid-quick")[0];
    const bagGrid   = html.find(".ddp-inv-grid-bag")[0];

    // ── Drag: item NÃO alocado → qualquer grid ──
    html.find(".ddp-inv-unass-item").on("dragstart", (e) => {
      const itemId = e.currentTarget.dataset.itemId;
      this._dragging = { itemId, fromZone: null, offsetRow: 0, offsetCol: 0 };
      e.originalEvent.dataTransfer.setData("text/plain", itemId);
      e.currentTarget.classList.add("ddp-dragging");
    });
    html.find(".ddp-inv-unass-item").on("dragend", (e) => {
      e.currentTarget.classList.remove("ddp-dragging");
      this._dragging = null;
    });

    // ── Drag: item DO grid ──
    html.find(".ddp-inv-placed-item").on("dragstart", (e) => {
      const itemId  = e.currentTarget.dataset.itemId;
      const fromZone = e.currentTarget.dataset.zone;
      const rect    = e.currentTarget.getBoundingClientRect();
      const offsetCol = Math.floor((e.originalEvent.clientX - rect.left) / CELL_PX);
      const offsetRow = Math.floor((e.originalEvent.clientY - rect.top)  / CELL_PX);
      this._dragging = { itemId, fromZone, offsetRow, offsetCol };
      e.originalEvent.dataTransfer.setData("text/plain", itemId);
      e.currentTarget.classList.add("ddp-dragging");
    });
    html.find(".ddp-inv-placed-item").on("dragend", (e) => {
      e.currentTarget.classList.remove("ddp-dragging");
      this._dragging = null;
    });

    // ── Duplo-clique → girar ──
    html.find(".ddp-inv-placed-item").on("dblclick", (e) => {
      const itemId = e.currentTarget.dataset.itemId;
      const zone   = e.currentTarget.dataset.zone;
      this._rotateItem(zone, itemId);
    });

    // ── Botão direito em item do grid → menu contextual ──
    html.find(".ddp-inv-placed-item").on("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const itemId   = e.currentTarget.dataset.itemId;
      const zone     = e.currentTarget.dataset.zone;
      const item     = this.actor.items.get(itemId);
      const wearable = item && _isWearable(item);
      this._showGridContextMenu(e.originalEvent, itemId, zone, wearable);
    });

    // ── Botão direito em item equipado → menu desequipar ──
    html.find(".ddp-inv-equipped-item").on("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const itemId = e.currentTarget.dataset.itemId;
      this._showEquippedContextMenu(e.originalEvent, itemId);
    });

    // ── Botão X no item equipado ──
    html.find(".ddp-inv-equipped-remove").on("click", (e) => {
      e.stopPropagation();
      const itemId = e.currentTarget.closest(".ddp-inv-equipped-item").dataset.itemId;
      this._unequipItem(itemId);
      this.render(false);
    });

    // ── Setup de cada grid ──
    if (quickGrid) this._setupGridListeners(quickGrid, "quick");
    if (bagGrid)   this._setupGridListeners(bagGrid,   "bag");

    // ── Drop na área não alocados → remove do grid ──
    const unassPanel = html.find(".ddp-inv-unassigned")[0];
    if (unassPanel) {
      unassPanel.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });
      unassPanel.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!this._dragging?.fromZone) return;
        const { itemId, fromZone } = this._dragging;
        delete this._layout[fromZone][itemId];
        this._dragging = null;
        this.render(false);
      });
    }

    // ── Botões ──
    html.find(".ddp-inv-btn-auto").on("click", () => {
      this._autoArrange();
      this.render(false);
    });
    html.find(".ddp-inv-btn-clear").on("click", () => {
      this._layout.quick    = {};
      this._layout.bag      = {};
      this._layout.equipped = {};
      this.render(false);
    });
    html.find(".ddp-inv-btn-save").on("click", async () => {
      await this._saveLayout();
      ui.notifications.info("Inventário salvo!");
    });
  }

  // ── Setup de listeners de drag & drop para um grid ────
  _setupGridListeners(grid, zone) {
    grid.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!this._dragging) return;

      const rect      = grid.getBoundingClientRect();
      const dropCol   = Math.floor((e.clientX - rect.left) / CELL_PX);
      const dropRow   = Math.floor((e.clientY - rect.top)  / CELL_PX);
      const targetCol = dropCol - (this._dragging.offsetCol ?? 0);
      const targetRow = dropRow - (this._dragging.offsetRow ?? 0);
      const { itemId } = this._dragging;

      // Rotação: usa a rotação atual do item na zona de origem (se vier de grid)
      const fromZone  = this._dragging.fromZone;
      const rotated   = fromZone
        ? (this._layout[fromZone]?.[itemId]?.rotated ?? false)
        : false;

      const item = this.actor.items.get(itemId);
      if (!item) return;

      const sz    = _getItemSize(item);
      const w     = rotated ? sz.h : sz.w;
      const h     = rotated ? sz.w : sz.h;
      const valid = this._canPlace(zone, itemId, targetRow, targetCol, rotated);

      grid.querySelectorAll(".ddp-inv-cell").forEach(c =>
        c.classList.remove("ddp-drop-ok", "ddp-drop-bad")
      );
      for (let r = targetRow; r < targetRow + h; r++) {
        for (let c = targetCol; c < targetCol + w; c++) {
          const cell = grid.querySelector(`.ddp-inv-cell[data-row="${r}"][data-col="${c}"]`);
          if (cell) cell.classList.add(valid ? "ddp-drop-ok" : "ddp-drop-bad");
        }
      }
    });

    grid.addEventListener("dragleave", () => {
      grid.querySelectorAll(".ddp-inv-cell").forEach(c =>
        c.classList.remove("ddp-drop-ok", "ddp-drop-bad")
      );
    });

    grid.addEventListener("drop", (e) => {
      e.preventDefault();
      grid.querySelectorAll(".ddp-inv-cell").forEach(c =>
        c.classList.remove("ddp-drop-ok", "ddp-drop-bad")
      );
      if (!this._dragging) return;

      const { itemId, fromZone, offsetRow = 0, offsetCol = 0 } = this._dragging;
      const rect      = grid.getBoundingClientRect();
      const dropCol   = Math.floor((e.clientX - rect.left) / CELL_PX);
      const dropRow   = Math.floor((e.clientY - rect.top)  / CELL_PX);
      const targetCol = dropCol - offsetCol;
      const targetRow = dropRow - offsetRow;
      const rotated   = fromZone
        ? (this._layout[fromZone]?.[itemId]?.rotated ?? false)
        : false;

      if (this._canPlace(zone, itemId, targetRow, targetCol, rotated)) {
        // Remove da zona de origem (pode ser outra zona ou não existir)
        if (fromZone) {
          delete this._layout[fromZone][itemId];
        }
        // Remove dos equipados se estava lá
        delete this._layout.equipped[itemId];
        this._layout[zone][itemId] = { row: targetRow, col: targetCol, rotated };
        this.render(false);
      } else {
        ui.notifications.warn("Não cabe nessa posição.");
      }
      this._dragging = null;
    });
  }

  // ── Menu contextual para itens no grid ────────────────
  _showGridContextMenu(event, itemId, zone, isWearable) {
    // Remove menus anteriores
    document.querySelectorAll(".ddp-context-menu").forEach(m => m.remove());

    const menu = document.createElement("div");
    menu.className = "ddp-context-menu";
    menu.style.cssText = `
      position: fixed;
      left: ${event.clientX}px;
      top:  ${event.clientY}px;
      z-index: 99999;
      background: #111;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 3px 0;
      min-width: 140px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.8);
      font-family: 'Signika', sans-serif;
      font-size: 12px;
    `;

    const addItem = (label, icon, onClick, color) => {
      const li = document.createElement("div");
      li.innerHTML = `<i class="fas ${icon}" style="width:14px;text-align:center;margin-right:6px;color:${color || '#888'};"></i>${label}`;
      li.style.cssText = `padding:6px 12px;cursor:pointer;color:#ccc;white-space:nowrap;`;
      li.addEventListener("mouseenter", () => li.style.background = "#222");
      li.addEventListener("mouseleave", () => li.style.background = "");
      li.addEventListener("click", () => { menu.remove(); onClick(); });
      menu.appendChild(li);
    };

    if (isWearable) {
      addItem("Equipar", "fa-shield-alt", () => {
        this._equipItem(itemId);
        this.render(false);
      }, "#88ff88");
    }

    addItem("Girar", "fa-sync-alt", () => {
      this._rotateItem(zone, itemId);
    }, "#8888ff");

    addItem("Remover do grid", "fa-times", () => {
      delete this._layout[zone][itemId];
      this.render(false);
    }, "#ff8888");

    document.body.appendChild(menu);

    // Fecha ao clicar fora
    const close = (e) => {
      if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); }
    };
    setTimeout(() => document.addEventListener("click", close), 0);
  }

  // ── Menu contextual para itens equipados ──────────────
  _showEquippedContextMenu(event, itemId) {
    document.querySelectorAll(".ddp-context-menu").forEach(m => m.remove());

    const menu = document.createElement("div");
    menu.className = "ddp-context-menu";
    menu.style.cssText = `
      position: fixed;
      left: ${event.clientX}px;
      top:  ${event.clientY}px;
      z-index: 99999;
      background: #111;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 3px 0;
      min-width: 160px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.8);
      font-family: 'Signika', sans-serif;
      font-size: 12px;
    `;

    const li = document.createElement("div");
    li.innerHTML = `<i class="fas fa-shield-alt" style="width:14px;text-align:center;margin-right:6px;color:#ffaa44;"></i>Desequipar`;
    li.style.cssText = `padding:6px 12px;cursor:pointer;color:#ccc;white-space:nowrap;`;
    li.addEventListener("mouseenter", () => li.style.background = "#222");
    li.addEventListener("mouseleave", () => li.style.background = "");
    li.addEventListener("click", () => {
      menu.remove();
      this._unequipItem(itemId);
      this.render(false);
    });
    menu.appendChild(li);

    document.body.appendChild(menu);
    const close = (e) => {
      if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); }
    };
    setTimeout(() => document.addEventListener("click", close), 0);
  }

  // ── Girar item em uma zona ─────────────────────────────
  _rotateItem(zone, itemId) {
    const pos = this._layout[zone]?.[itemId];
    if (!pos) return;
    const newRotated = !pos.rotated;
    if (this._canPlace(zone, itemId, pos.row, pos.col, newRotated)) {
      this._layout[zone][itemId].rotated = newRotated;
      this.render(false);
    } else {
      ui.notifications.warn("Sem espaço para girar o item aqui.");
    }
  }

  // ── Auto-organizar ─────────────────────────────────────
  _autoArrange() {
    this._layout.quick    = {};
    this._layout.bag      = {};
    // Mantém equipados
    const equipped = this._layout.equipped ?? {};

    const items = [...this.actor.items.contents]
      .filter(i => !TIPOS_EXCLUIDOS.has(i.type) && !equipped[i.id])
      .sort((a, b) => {
        const sa = _getItemSize(a), sb = _getItemSize(b);
        return (sb.w * sb.h) - (sa.w * sa.h);
      });

    for (const item of items) {
      const sz = _getItemSize(item);
      // Itens pequenos (1×1 ou 1×2) → tentar quick primeiro
      const tryQuick = (sz.w * sz.h) <= 2;
      let placed = false;

      if (tryQuick) {
        for (const rotated of [false, true]) {
          if (placed) break;
          for (let r = 0; r < this._quickRows && !placed; r++) {
            for (let c = 0; c < QUICK_COLS && !placed; c++) {
              if (this._canPlace("quick", item.id, r, c, rotated)) {
                this._layout.quick[item.id] = { row: r, col: c, rotated };
                placed = true;
              }
            }
          }
        }
      }

      if (!placed) {
        for (const rotated of [false, true]) {
          if (placed) break;
          for (let r = 0; r < this._gridRows && !placed; r++) {
            for (let c = 0; c < GRID_COLS && !placed; c++) {
              if (this._canPlace("bag", item.id, r, c, rotated)) {
                this._layout.bag[item.id] = { row: r, col: c, rotated };
                placed = true;
              }
            }
          }
        }
      }
    }
  }

  // ── Salva nas flags do ator ───────────────────────────
  async _saveLayout() {
    const validIds = new Set(this.actor.items.map(i => i.id));
    for (const zone of ["quick", "bag", "equipped"]) {
      for (const id of Object.keys(this._layout[zone] ?? {})) {
        if (!validIds.has(id)) delete this._layout[zone][id];
      }
    }
    await this.actor.setFlag(MODULE_ID, "inventario", {
      quick:    foundry.utils.deepClone(this._layout.quick),
      bag:      foundry.utils.deepClone(this._layout.bag),
      equipped: foundry.utils.deepClone(this._layout.equipped)
    });
  }

  // ── Abre (previne duplicatas) ─────────────────────────
  static open(actorId) {
    const actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications.warn("Personagem não encontrado.");
      return;
    }
    if (actor.permission < 1) {
      ui.notifications.warn("Sem permissão para ver este inventário.");
      return;
    }
    const existing = Object.values(ui.windows).find(
      w => w instanceof DDPInventoryDialog && w.actor.id === actorId
    );
    if (existing) { existing.bringToTop(); return; }
    new DDPInventoryDialog(actor).render(true);
  }
}

// ─── API pública ─────────────────────────────────────────
Hooks.once("ready", () => {
  window.DebaixoDaPele = {
    ...(window.DebaixoDaPele ?? {}),
    abrirInventario: DDPInventoryDialog.open.bind(DDPInventoryDialog)
  };
});

// ─── Painel compacto na ficha do personagem ───────────────
Hooks.on("renderActorSheet", (sheet, html) => {
  try {
  if (sheet.actor?.type !== "character") return;
  const actor   = sheet.actor;
  const canEdit = actor.isOwner || game.user.isGM;
  if (!canEdit) return;

  const bagRows    = _calcGridRows(actor);
  const str        = actor.system?.characteristics?.str?.value ?? 40;
  const rawLayout  = actor.flags?.[MODULE_ID]?.inventario ?? {};
  const layout     = _migrateLayout(rawLayout);
  const allItems   = actor.items.contents.filter(i => !TIPOS_EXCLUIDOS.has(i.type));

  // Conta slots usados
  let quickUsed = 0;
  let bagUsed   = 0;
  for (const [itemId, pos] of Object.entries(layout.quick ?? {})) {
    const item = actor.items.get(itemId);
    if (!item) continue;
    const sz = _getItemSize(item);
    const w  = pos.rotated ? sz.h : sz.w;
    const h  = pos.rotated ? sz.w : sz.h;
    quickUsed += w * h;
  }
  for (const [itemId, pos] of Object.entries(layout.bag ?? {})) {
    const item = actor.items.get(itemId);
    if (!item) continue;
    const sz = _getItemSize(item);
    const w  = pos.rotated ? sz.h : sz.w;
    const h  = pos.rotated ? sz.w : sz.h;
    bagUsed += w * h;
  }

  const equippedCount = Object.keys(layout.equipped ?? {}).filter(id => actor.items.get(id)).length;
  const quickTotal    = QUICK_COLS * QUICK_ROWS;
  const bagTotal      = GRID_COLS * bagRows;
  const totalSlots    = quickTotal + bagTotal;
  const usedSlots     = quickUsed + bagUsed;
  const freeSlots     = totalSlots - usedSlots;
  const pct           = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;
  const barCor        = pct < 60 ? "#44cc44" : pct < 85 ? "#ffaa00" : "#dd2222";

  const allocatedIds  = new Set([
    ...Object.keys(layout.quick ?? {}),
    ...Object.keys(layout.bag   ?? {}),
    ...Object.keys(layout.equipped ?? {})
  ]);
  const naoAlocados = allItems.filter(i => !allocatedIds.has(i.id)).length;

  const equippedList = Object.keys(layout.equipped ?? {})
    .map(id => actor.items.get(id))
    .filter(Boolean)
    .map(i => i.name)
    .join(", ");

  const panelHtml = `
    <div id="ddp-inv-panel-${actor.id}" class="ddp-inv-sheet-panel">
      <div class="ddp-inv-sheet-header">
        <i class="fas fa-backpack"></i>
        <span class="ddp-inv-sheet-title">INVENTÁRIO</span>
        <span class="ddp-inv-sheet-cap" title="FOR ${str} ÷ 10 (arredondado) = ${bagRows} linhas · ${totalSlots} slots">
          ${usedSlots}/${totalSlots} slots
        </span>
        <button class="ddp-inv-sheet-btn" data-actor-id="${actor.id}" title="Abrir inventário">
          <i class="fas fa-boxes"></i> Abrir
        </button>
      </div>
      <div class="ddp-inv-sheet-bar-bg">
        <div class="ddp-inv-sheet-bar-fill" style="width:${pct}%; background:${barCor};"></div>
      </div>
      <div class="ddp-inv-sheet-stats">
        ${equippedCount > 0 ? `<span title="${equippedList}"><i class="fas fa-shield-alt"></i> Equipados: ${equippedCount}</span>` : ""}
        <span><i class="fas fa-bolt"></i> Rápido: ${quickUsed}/${quickTotal}</span>
        <span><i class="fas fa-backpack"></i> Mochila: ${bagUsed}/${bagTotal}</span>
        ${naoAlocados > 0 ? `<span style="color:#ffaa44;"><i class="fas fa-exclamation-triangle"></i> ${naoAlocados} soltos</span>` : ""}
        <span style="color:#666;">${freeSlots} livres</span>
      </div>
    </div>
  `;

  html.find(`#ddp-inv-panel-${actor.id}`).remove();

  const alvo = (() => {
    for (const sel of [
      '.tab[data-tab="gear"]',
      '.tab[data-tab="gears"]',
      '.tab[data-tab="possessions"]',
      '.tab[data-tab="main"]',
      '.tab[data-tab="skills"]',
      '.sheet-body .tab.active',
      '.sheet-body'
    ]) {
      const el = html.find(sel);
      if (el.length) return el.first();
    }
    return html;
  })();
  alvo.prepend(panelHtml);

  html.find(`.ddp-inv-sheet-btn[data-actor-id="${actor.id}"]`).on("click", (e) => {
    e.preventDefault();
    DDPInventoryDialog.open(actor.id);
  });
  } catch(err) {
    console.error("DDP | Erro no painel de inventário:", err);
  }
});
