// ============================================================
// INVENTÁRIO GRID — Sistema Estilo Resident Evil
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const GRID_COLS = 6;
const GRID_ROWS = 8;
const CELL_PX   = 52; // px por célula

// ─── Tamanho padrão dos itens ─────────────────────────────
function _getItemSize(item) {
  // 1. Flags explícitos no item (definidos via macro ou importação)
  const f = item.flags?.[MODULE_ID];
  if (f?.gridW !== undefined && f?.gridH !== undefined) return { w: Math.max(1, +f.gridW), h: Math.max(1, +f.gridH) };

  // 2. Heurística por nome (português e inglês)
  const n = (item.name ?? "").toLowerCase();
  if (/rifle|carabina|shotgun|espingarda|lança/.test(n))          return { w: 1, h: 3 };
  if (/pistola|revólver|revolver|faca|machado|bastão|baton/.test(n)) return { w: 1, h: 2 };
  if (/kit médico|kit de primeiros|maleta médica/.test(n))        return { w: 2, h: 2 };
  if (/bandagem grande|atadura|curativo grande/.test(n))          return { w: 2, h: 1 };
  if (/documento|pasta|diário|diario|mapa|relatório|relatorio|caderno/.test(n)) return { w: 1, h: 2 };
  if (/lanterna|rádio|radio|binóculo/.test(n))                    return { w: 1, h: 2 };
  if (/máscara de gás|máscara gás|mascara gas/.test(n))           return { w: 2, h: 2 };
  if (/colete|armadura|escudo/.test(n))                           return { w: 2, h: 2 };

  // 3. Tipo CoC7
  if (item.type === "weapon") return { w: 1, h: 2 };

  return { w: 1, h: 1 };
}

// ─── Application ─────────────────────────────────────────
export class DDPInventoryDialog extends Application {
  constructor(actor, options = {}) {
    super(options);
    this.actor    = actor;
    // Layout: { [itemId]: { row, col, rotated } }
    this._layout  = foundry.utils.deepClone(actor.flags?.[MODULE_ID]?.inventario ?? {});
    this._dragging = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:        "ddp-inventory-dialog",
      title:     "📦 Inventário",
      template:  "modules/debaixo-da-pele/templates/inventory-dialog.html",
      width:     GRID_COLS * CELL_PX + 256,
      height:    GRID_ROWS * CELL_PX + 130,
      resizable: false,
      classes:   ["ddp-inventory-dialog"]
    });
  }

  // ── Reconstrói a matriz 2D a partir do layout ─────────
  _buildMatrix() {
    const m = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
    for (const [itemId, pos] of Object.entries(this._layout)) {
      const item = this.actor.items.get(itemId);
      if (!item) continue;
      const sz = _getItemSize(item);
      const w  = pos.rotated ? sz.h : sz.w;
      const h  = pos.rotated ? sz.w : sz.h;
      for (let r = pos.row; r < pos.row + h; r++) {
        for (let c = pos.col; c < pos.col + w; c++) {
          if (r < GRID_ROWS && c < GRID_COLS) m[r][c] = itemId;
        }
      }
    }
    return m;
  }

  // ── Verifica se item cabe na posição ──────────────────
  _canPlace(itemId, row, col, rotated) {
    const item = this.actor.items.get(itemId);
    if (!item) return false;
    const sz = _getItemSize(item);
    const w  = rotated ? sz.h : sz.w;
    const h  = rotated ? sz.w : sz.h;
    if (row < 0 || col < 0 || row + h > GRID_ROWS || col + w > GRID_COLS) return false;
    const m = this._buildMatrix();
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (m[r][c] !== null && m[r][c] !== itemId) return false;
      }
    }
    return true;
  }

  // ── Dados para o template Handlebars ──────────────────
  getData() {
    // Filtra apenas itens físicos — exclui perícias, ocupações e talentos do CoC7
    const TIPOS_EXCLUIDOS = new Set(["skill", "occupation", "archetype", "talent", "setup"]);
    const allItems = this.actor.items.contents.filter(i => !TIPOS_EXCLUIDOS.has(i.type));

    // Itens posicionados no grid com coordenadas absolutas
    const placedItems = [];
    for (const [itemId, pos] of Object.entries(this._layout)) {
      const item = this.actor.items.get(itemId);
      if (!item) continue;
      const sz = _getItemSize(item);
      const w  = pos.rotated ? sz.h : sz.w;
      const h  = pos.rotated ? sz.w : sz.h;
      placedItems.push({
        id:          itemId,
        name:        item.name,
        img:         item.img,
        rotated:     pos.rotated,
        sizeLabel:   `${sz.w}×${sz.h}`,
        styleLeft:   pos.col * CELL_PX,
        styleTop:    pos.row * CELL_PX,
        styleWidth:  w * CELL_PX,
        styleHeight: h * CELL_PX
      });
    }

    // Itens não alocados no grid
    const unassigned = allItems.filter(i => !this._layout[i.id]).map(i => {
      const sz = _getItemSize(i);
      return { id: i.id, name: i.name, img: i.img, sizeLabel: `${sz.w}×${sz.h}` };
    });

    // Células de fundo para drag-over
    const cells = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        cells.push({ row: r, col: c, styleLeft: c * CELL_PX, styleTop: r * CELL_PX });
      }
    }

    return {
      actorName:  this.actor.name,
      actorImg:   this.actor.img,
      gridWidth:  GRID_COLS * CELL_PX,
      gridHeight: GRID_ROWS * CELL_PX,
      cells,
      placedItems,
      unassigned,
      totalItens: allItems.length,
      alocados:   placedItems.length,
      canEdit:    this.actor.isOwner || game.user.isGM
    };
  }

  // ── Listeners de interação ────────────────────────────
  activateListeners(html) {
    super.activateListeners(html);

    const grid = html.find(".ddp-inv-grid")[0];

    // ── Drag: item NÃO alocado → grid ──
    html.find(".ddp-inv-unass-item").on("dragstart", (e) => {
      const itemId = e.currentTarget.dataset.itemId;
      this._dragging = { itemId, fromGrid: false, offsetRow: 0, offsetCol: 0 };
      e.originalEvent.dataTransfer.setData("text/plain", itemId);
      e.currentTarget.classList.add("ddp-dragging");
    });
    html.find(".ddp-inv-unass-item").on("dragend", (e) => {
      e.currentTarget.classList.remove("ddp-dragging");
      this._dragging = null;
    });

    // ── Drag: item DO grid → outro lugar ──
    html.find(".ddp-inv-placed-item").on("dragstart", (e) => {
      const itemId = e.currentTarget.dataset.itemId;
      const rect   = e.currentTarget.getBoundingClientRect();
      const offsetCol = Math.floor((e.originalEvent.clientX - rect.left)  / CELL_PX);
      const offsetRow = Math.floor((e.originalEvent.clientY - rect.top)   / CELL_PX);
      this._dragging = { itemId, fromGrid: true, offsetRow, offsetCol };
      e.originalEvent.dataTransfer.setData("text/plain", itemId);
      e.currentTarget.classList.add("ddp-dragging");
    });
    html.find(".ddp-inv-placed-item").on("dragend", (e) => {
      e.currentTarget.classList.remove("ddp-dragging");
      this._dragging = null;
    });

    // ── Duplo-clique → girar item ──
    html.find(".ddp-inv-placed-item").on("dblclick", (e) => {
      this._rotateItem(e.currentTarget.dataset.itemId);
    });

    // ── Botão direito → remover do grid ──
    html.find(".ddp-inv-placed-item").on("contextmenu", (e) => {
      e.preventDefault();
      delete this._layout[e.currentTarget.dataset.itemId];
      this.render(false);
    });

    if (!grid) return;

    // ── DragOver no grid: highlight células alvo ──
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
      const rotated   = this._layout[itemId]?.rotated ?? false;
      const item      = this.actor.items.get(itemId);
      if (!item) return;

      const sz = _getItemSize(item);
      const w  = rotated ? sz.h : sz.w;
      const h  = rotated ? sz.w : sz.h;
      const valid = this._canPlace(itemId, targetRow, targetCol, rotated);

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

    // ── Drop no grid ──
    grid.addEventListener("drop", (e) => {
      e.preventDefault();
      grid.querySelectorAll(".ddp-inv-cell").forEach(c =>
        c.classList.remove("ddp-drop-ok", "ddp-drop-bad")
      );
      if (!this._dragging) return;

      const { itemId, offsetRow = 0, offsetCol = 0 } = this._dragging;
      const rect      = grid.getBoundingClientRect();
      const dropCol   = Math.floor((e.clientX - rect.left) / CELL_PX);
      const dropRow   = Math.floor((e.clientY - rect.top)  / CELL_PX);
      const targetCol = dropCol - offsetCol;
      const targetRow = dropRow - offsetRow;
      const rotated   = this._layout[itemId]?.rotated ?? false;

      if (this._canPlace(itemId, targetRow, targetCol, rotated)) {
        this._layout[itemId] = { row: targetRow, col: targetCol, rotated };
        this.render(false);
      } else {
        ui.notifications.warn("Não cabe nessa posição.");
      }
      this._dragging = null;
    });

    // ── Drop na área "não alocados" → remove do grid ──
    const unassPanel = html.find(".ddp-inv-unassigned")[0];
    if (unassPanel) {
      unassPanel.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });
      unassPanel.addEventListener("drop", (e) => {
        e.preventDefault();
        if (!this._dragging?.fromGrid) return;
        delete this._layout[this._dragging.itemId];
        this._dragging = null;
        this.render(false);
      });
    }

    // ── Botão: Auto-organizar ──
    html.find(".ddp-inv-btn-auto").on("click", () => {
      this._autoArrange();
      this.render(false);
    });

    // ── Botão: Limpar grid ──
    html.find(".ddp-inv-btn-clear").on("click", () => {
      this._layout = {};
      this.render(false);
    });

    // ── Botão: Salvar ──
    html.find(".ddp-inv-btn-save").on("click", async () => {
      await this._saveLayout();
      ui.notifications.info("✅ Inventário salvo!");
    });
  }

  // ── Girar item (troca w↔h) ────────────────────────────
  _rotateItem(itemId) {
    if (!this._layout[itemId]) return;
    const pos       = this._layout[itemId];
    const newRotated = !pos.rotated;
    if (this._canPlace(itemId, pos.row, pos.col, newRotated)) {
      this._layout[itemId].rotated = newRotated;
      this.render(false);
    } else {
      ui.notifications.warn("Sem espaço para girar o item aqui.");
    }
  }

  // ── Auto-organizar: posiciona todos os itens greedy ───
  _autoArrange() {
    this._layout = {};
    const items = [...this.actor.items.contents].sort((a, b) => {
      // Ordena do maior para o menor para melhor ocupação
      const sa = _getItemSize(a), sb = _getItemSize(b);
      return (sb.w * sb.h) - (sa.w * sa.h);
    });
    for (const item of items) {
      let placed = false;
      for (let rotated of [false, true]) {
        if (placed) break;
        for (let r = 0; r < GRID_ROWS && !placed; r++) {
          for (let c = 0; c < GRID_COLS && !placed; c++) {
            if (this._canPlace(item.id, r, c, rotated)) {
              this._layout[item.id] = { row: r, col: c, rotated };
              placed = true;
            }
          }
        }
      }
    }
  }

  // ── Persiste o layout nas flags do ator ──────────────
  async _saveLayout() {
    const validIds = new Set(this.actor.items.map(i => i.id));
    for (const id of Object.keys(this._layout)) {
      if (!validIds.has(id)) delete this._layout[id];
    }
    await this.actor.setFlag(MODULE_ID, "inventario", foundry.utils.deepClone(this._layout));
  }

  // ── Abre o diálogo (previne duplicatas por ator) ─────
  static open(actorId) {
    const actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications.warn("Personagem não encontrado.");
      return;
    }
    // Verifica permissão mínima de observador
    if (actor.permission < 1) {
      ui.notifications.warn("Sem permissão para ver este inventário.");
      return;
    }
    // Reabre se já existir
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
