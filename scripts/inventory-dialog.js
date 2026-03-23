// ============================================================
// INVENTÁRIO GRID — Sistema Estilo Resident Evil
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const GRID_COLS  = 6;
const CELL_PX    = 60;  // px por célula
const MIN_ROWS   = 3;
const MAX_ROWS   = 12;

// Tipos CoC7 que NÃO são itens físicos
const TIPOS_EXCLUIDOS = new Set(["skill", "occupation", "archetype", "talent", "setup"]);

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
  // Munição
  if (/munição|municao|ammo|bala|cartucho|clip|magazine|pente|cargador|projétil/.test(n))
    return { w: 1, h: 1 };
  // Explosivos pequenos
  if (/granada|bomba|grenade|explosivo|dinamite|mina|mine/.test(n))
    return { w: 1, h: 1 };
  // Documentos / papéis
  if (/documento|pasta|diário|diario|mapa|relatório|relatorio|caderno|anotação|anotacao|nota|note|carta|letter|ficha|formulário|formulario|manual|livro|book/.test(n))
    return { w: 1, h: 1 };
  // Medicamentos / seringas / amostras
  if (/seringa|syringe|ampola|vial|frasco|flask|comprimido|pílula|pilula|pill|remédio|remedio|medicine|medicamento|analgésico|antibiótico|morfina|adrenalina|amostra|sample|composto|serum|soro|aurora|substância|substancia/.test(n))
    return { w: 1, h: 1 };
  // Alimentos / água
  if (/comida|food|ração|racao|ration|snack|lanche|barra de cereal|água|water|cantil|canteen|garrafa|bottle|termos|thermos/.test(n))
    return { w: 1, h: 1 };
  // Itens pequenos de utilidade
  if (/chave|key|keycard|cartão|cartao|crachá|cracha|badge|id|isqueiro|lighter|fósforo|fosforo|matches|lanterna pequena|mini lanterna|pilha|bateria|battery|tape|fita adesiva|zip tie|abraçadeira|arame|lock pick/.test(n))
    return { w: 1, h: 1 };
  // Eletrônicos pequenos
  if (/celular|phone|smartphone|tablet|pen drive|pendrive|usb|disco|drive|chip|cartão de memória|walkie/.test(n))
    return { w: 1, h: 1 };
  // Equipamentos de segurança pequenos
  if (/algema|handcuff|relógio|watch|óculos|glasses|goggles|luva|glove/.test(n))
    return { w: 1, h: 1 };
  // Álcool / spray / aerossol
  if (/álcool|alcool|alcohol|spray|aerossol|desinfetante|antisséptico/.test(n))
    return { w: 1, h: 1 };
  // Curativos pequenos
  if (/curativo|band.?aid|esparadrapo|atadura pequena/.test(n))
    return { w: 1, h: 1 };

  // 3. Tipo CoC7
  if (item.type === "weapon") return { w: 1, h: 2 };
  if (item.type === "ammo")   return { w: 1, h: 1 };

  return { w: 1, h: 1 };
}

// ─── Calcula linhas do grid (STR/4 + bônus de mochilas) ───
function _calcGridRows(actor) {
  const str     = actor.system?.characteristics?.str?.value ?? 40;
  const baseRows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.floor(str / 4)));

  // Cada mochila/bolsão equipada adiciona 2 linhas extras
  const bagCount = actor.items.contents
    .filter(i => !TIPOS_EXCLUIDOS.has(i.type) && /mochila|mochilão|backpack|bolsão|saco grande/i.test(i.name))
    .length;
  const bagBonus = bagCount * 2;

  return Math.min(MAX_ROWS, baseRows + bagBonus);
}

// ─── Application ─────────────────────────────────────────
export class DDPInventoryDialog extends Application {
  constructor(actor, options = {}) {
    super(options);
    this.actor     = actor;
    this._layout   = foundry.utils.deepClone(actor.flags?.[MODULE_ID]?.inventario ?? {});
    this._dragging = null;
    this._gridRows = _calcGridRows(actor);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:        "ddp-inventory-dialog",
      title:     "📦 Inventário",
      template:  "modules/debaixo-da-pele/templates/inventory-dialog.html",
      width:     GRID_COLS * CELL_PX + 256,
      height:    MAX_ROWS * CELL_PX + 160,
      resizable: true,
      classes:   ["ddp-inventory-dialog"]
    });
  }

  // ── Matriz 2D a partir do layout ──────────────────────
  _buildMatrix() {
    const rows = this._gridRows;
    const m = Array.from({ length: rows }, () => Array(GRID_COLS).fill(null));
    for (const [itemId, pos] of Object.entries(this._layout)) {
      const item = this.actor.items.get(itemId);
      if (!item) continue;
      const sz = _getItemSize(item);
      const w  = pos.rotated ? sz.h : sz.w;
      const h  = pos.rotated ? sz.w : sz.h;
      for (let r = pos.row; r < pos.row + h; r++) {
        for (let c = pos.col; c < pos.col + w; c++) {
          if (r < rows && c < GRID_COLS) m[r][c] = itemId;
        }
      }
    }
    return m;
  }

  // ── Verifica se item cabe na posição ──────────────────
  _canPlace(itemId, row, col, rotated) {
    const item = this.actor.items.get(itemId);
    if (!item) return false;
    const sz   = _getItemSize(item);
    const w    = rotated ? sz.h : sz.w;
    const h    = rotated ? sz.w : sz.h;
    const rows = this._gridRows;
    if (row < 0 || col < 0 || row + h > rows || col + w > GRID_COLS) return false;
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
    // Recalcula grid ao abrir (mochilas podem ter mudado)
    this._gridRows = _calcGridRows(this.actor);
    const rows = this._gridRows;

    const str       = this.actor.system?.characteristics?.str?.value ?? 40;
    const strBase   = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.floor(str / 4)));
    const bagBonus  = rows - strBase;
    const totalSlots = rows * GRID_COLS;

    const allItems = this.actor.items.contents.filter(i => !TIPOS_EXCLUIDOS.has(i.type));

    // Itens posicionados
    const placedItems = [];
    let usedSlots = 0;
    for (const [itemId, pos] of Object.entries(this._layout)) {
      const item = this.actor.items.get(itemId);
      if (!item) continue;
      const sz = _getItemSize(item);
      const w  = pos.rotated ? sz.h : sz.w;
      const h  = pos.rotated ? sz.w : sz.h;
      usedSlots += w * h;
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

    // Itens não alocados
    const unassigned = allItems.filter(i => !this._layout[i.id]).map(i => {
      const sz = _getItemSize(i);
      return { id: i.id, name: i.name, img: i.img, sizeLabel: `${sz.w}×${sz.h}` };
    });

    // Células do grid
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        cells.push({ row: r, col: c, styleLeft: c * CELL_PX, styleTop: r * CELL_PX });
      }
    }

    return {
      actorName:   this.actor.name,
      actorImg:    this.actor.img,
      gridWidth:   GRID_COLS * CELL_PX,
      gridHeight:  rows * CELL_PX,
      cells,
      placedItems,
      unassigned,
      totalItens:  allItems.length,
      alocados:    placedItems.length,
      canEdit:     this.actor.isOwner || game.user.isGM,
      // Capacidade
      strValue:    str,
      gridRows:    rows,
      gridCols:    GRID_COLS,
      totalSlots,
      usedSlots,
      freeSlots:   totalSlots - usedSlots,
      bagBonus
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

    // ── Drag: item DO grid ──
    html.find(".ddp-inv-placed-item").on("dragstart", (e) => {
      const itemId = e.currentTarget.dataset.itemId;
      const rect   = e.currentTarget.getBoundingClientRect();
      const offsetCol = Math.floor((e.originalEvent.clientX - rect.left) / CELL_PX);
      const offsetRow = Math.floor((e.originalEvent.clientY - rect.top)  / CELL_PX);
      this._dragging = { itemId, fromGrid: true, offsetRow, offsetCol };
      e.originalEvent.dataTransfer.setData("text/plain", itemId);
      e.currentTarget.classList.add("ddp-dragging");
    });
    html.find(".ddp-inv-placed-item").on("dragend", (e) => {
      e.currentTarget.classList.remove("ddp-dragging");
      this._dragging = null;
    });

    // ── Duplo-clique → girar ──
    html.find(".ddp-inv-placed-item").on("dblclick", (e) => {
      this._rotateItem(e.currentTarget.dataset.itemId);
    });

    // ── Botão direito → remover ──
    html.find(".ddp-inv-placed-item").on("contextmenu", (e) => {
      e.preventDefault();
      delete this._layout[e.currentTarget.dataset.itemId];
      this.render(false);
    });

    if (!grid) return;

    // ── DragOver: highlight ──
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

      const sz    = _getItemSize(item);
      const w     = rotated ? sz.h : sz.w;
      const h     = rotated ? sz.w : sz.h;
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

    // ── Drop na área não alocados → remove do grid ──
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

    // ── Botões ──
    html.find(".ddp-inv-btn-auto").on("click", () => {
      this._autoArrange();
      this.render(false);
    });
    html.find(".ddp-inv-btn-clear").on("click", () => {
      this._layout = {};
      this.render(false);
    });
    html.find(".ddp-inv-btn-save").on("click", async () => {
      await this._saveLayout();
      ui.notifications.info("✅ Inventário salvo!");
    });
  }

  // ── Girar item ────────────────────────────────────────
  _rotateItem(itemId) {
    if (!this._layout[itemId]) return;
    const pos        = this._layout[itemId];
    const newRotated = !pos.rotated;
    if (this._canPlace(itemId, pos.row, pos.col, newRotated)) {
      this._layout[itemId].rotated = newRotated;
      this.render(false);
    } else {
      ui.notifications.warn("Sem espaço para girar o item aqui.");
    }
  }

  // ── Auto-organizar ────────────────────────────────────
  _autoArrange() {
    this._layout = {};
    const items = [...this.actor.items.contents]
      .filter(i => !TIPOS_EXCLUIDOS.has(i.type))
      .sort((a, b) => {
        const sa = _getItemSize(a), sb = _getItemSize(b);
        return (sb.w * sb.h) - (sa.w * sa.h);
      });
    for (const item of items) {
      let placed = false;
      for (const rotated of [false, true]) {
        if (placed) break;
        for (let r = 0; r < this._gridRows && !placed; r++) {
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

  // ── Salva nas flags do ator ───────────────────────────
  async _saveLayout() {
    const validIds = new Set(this.actor.items.map(i => i.id));
    for (const id of Object.keys(this._layout)) {
      if (!validIds.has(id)) delete this._layout[id];
    }
    await this.actor.setFlag(MODULE_ID, "inventario", foundry.utils.deepClone(this._layout));
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
  if (sheet.actor?.type !== "character") return;
  const actor = sheet.actor;
  const canEdit = actor.isOwner || game.user.isGM;
  if (!canEdit) return;

  // Calcula dados resumidos
  const rows     = _calcGridRows(actor);
  const total    = rows * GRID_COLS;
  const layout   = actor.flags?.[MODULE_ID]?.inventario ?? {};
  const allItems = actor.items.contents.filter(i => !TIPOS_EXCLUIDOS.has(i.type));
  let usedSlots  = 0;
  for (const [itemId, pos] of Object.entries(layout)) {
    const item = actor.items.get(itemId);
    if (!item) continue;
    const sz = _getItemSize(item);
    const w  = pos.rotated ? sz.h : sz.w;
    const h  = pos.rotated ? sz.w : sz.h;
    usedSlots += w * h;
  }
  const freeSlots   = total - usedSlots;
  const pct         = total > 0 ? Math.round((usedSlots / total) * 100) : 0;
  const barCor      = pct < 60 ? "#44cc44" : pct < 85 ? "#ffaa00" : "#dd2222";
  const alocados    = Object.keys(layout).filter(id => actor.items.get(id)).length;
  const naoAlocados = allItems.length - alocados;
  const str         = actor.system?.characteristics?.str?.value ?? 40;

  const panelHtml = `
    <div id="ddp-inv-panel-${actor.id}" class="ddp-inv-sheet-panel">
      <div class="ddp-inv-sheet-header">
        <i class="fas fa-backpack"></i>
        <span class="ddp-inv-sheet-title">INVENTÁRIO</span>
        <span class="ddp-inv-sheet-cap" title="FOR ${str} ÷ 4 = ${rows} linhas · ${total} slots">
          ${usedSlots}/${total} slots
        </span>
        <button class="ddp-inv-sheet-btn" data-actor-id="${actor.id}" title="Abrir inventário">
          <i class="fas fa-boxes"></i> Abrir
        </button>
      </div>
      <div class="ddp-inv-sheet-bar-bg">
        <div class="ddp-inv-sheet-bar-fill" style="width:${pct}%; background:${barCor};"></div>
      </div>
      <div class="ddp-inv-sheet-stats">
        <span><i class="fas fa-cubes"></i> ${alocados} alocados</span>
        ${naoAlocados > 0 ? `<span style="color:#ffaa44;"><i class="fas fa-exclamation-triangle"></i> ${naoAlocados} soltos</span>` : ""}
        <span style="color:#666;">${freeSlots} livres</span>
      </div>
    </div>
  `;

  html.find(`#ddp-inv-panel-${actor.id}`).remove();

  // Injeta abaixo do painel Aurora (ou no topo da aba principal)
  const alvo = (() => {
    for (const sel of [
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
  alvo.append(panelHtml);

  // Botão abre o inventário
  html.find(`.ddp-inv-sheet-btn[data-actor-id="${actor.id}"]`).on("click", (e) => {
    e.preventDefault();
    DDPInventoryDialog.open(actor.id);
  });
});
