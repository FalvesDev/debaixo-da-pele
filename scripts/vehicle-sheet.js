// ============================================================
// FICHA DE VEÍCULO — Kombi / Sistema de Upgrades e Combate
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

const MODULE_ID = "debaixo-da-pele";

// ─── Constantes base da Kombi ────────────────────────────────
const BASE_VELOCIDADE      = 110;
const BASE_ACELERACAO      = 2;
const BASE_MANOBRABILIDADE = 35;
const BASE_HP_MAX          = 25;
const BASE_CARGO_SLOTS     = 8;
const BASE_ASSENTOS        = 8;

const ASSENTO_LABELS = [
  "Motorista",
  "Passageiro Dianteiro",
  "Passageiro Traseiro 1",
  "Passageiro Traseiro 2",
  "Passageiro Traseiro 3",
  "Passageiro Traseiro 4",
  "Passageiro Traseiro 5",
  "Passageiro Traseiro 6"
];

const CATEGORIA_LABELS = {
  motor:     "Motor",
  blindagem: "Blindagem",
  rodas:     "Rodas",
  estrutura: "Estrutura",
  carga:     "Carga",
  tatico:    "Tático",
  upgrade:   "Upgrade"
};

// ─── Estrelas de velocidade ──────────────────────────────────
function _toEstrelasHtml(velocidade) {
  // 0-60: 1★, 61-90: 2★, 91-110: 3★, 111-130: 4★, 131+: 5★
  let count = 1;
  if (velocidade >= 131) count = 5;
  else if (velocidade >= 111) count = 4;
  else if (velocidade >= 91)  count = 3;
  else if (velocidade >= 61)  count = 2;
  const on  = "★".repeat(count);
  const off = "☆".repeat(5 - count);
  return `<span style="color:#cc7722">${on}</span><span style="color:#555">${off}</span>`;
}

// ─── Classe Principal ────────────────────────────────────────
class DDPVehicleSheet extends FormApplication {
  constructor(actor, options = {}) {
    super(actor, options);
    this.actor = actor;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:        "ddp-vehicle-sheet",
      template:  "modules/debaixo-da-pele/templates/vehicle-sheet.html",
      title:     "Ficha de Veículo",
      classes:   ["ddp-vehicle-app"],
      width:     560,
      height:    "auto",
      resizable: true,
      closeOnSubmit: false
    });
  }

  // ─── Abre/renderiza (singleton por actor) ──────────────────
  static open(actorId) {
    const actor = game.actors.get(actorId);
    if (!actor) {
      ui.notifications.error("Veículo não encontrado.");
      return;
    }
    // Verifica se já existe uma instância aberta para este actor
    const existingId = `ddp-vehicle-sheet-${actorId}`;
    const existing = Object.values(ui.windows ?? {}).find(w => w.id === existingId);
    if (existing) {
      existing.render(true);
      existing.bringToTop?.();
      return existing;
    }
    const sheet = new DDPVehicleSheet(actor, { id: existingId });
    sheet.render(true);
    return sheet;
  }

  // ─── Dados para o template ─────────────────────────────────
  getData() {
    const actor   = this.actor;
    const flags   = actor.getFlag(MODULE_ID, "veiculo") ?? {};
    const isGM    = game.user.isGM;

    // ── Lê upgrades do actor ──────────────────────────────────
    const upgradeItems = actor.items.filter(i =>
      i.flags?.[MODULE_ID]?.isUpgrade === true
    );

    // ── Calcula bônus acumulados ──────────────────────────────
    let velBonus  = 0;
    let hpMaxBonus = 0;
    let manoBonus = 0;
    let cargoBonus = 0;
    let ramBonus  = "";
    let runFlat   = false;
    let escotilha = false;

    for (const upg of upgradeItems) {
      const u = upg.flags?.[MODULE_ID]?.upgrade ?? {};
      velBonus   += (u.velocidadeBonus  ?? 0);
      hpMaxBonus += (u.hpMaxBonus       ?? 0);
      manoBonus  += (u.manobrabilidadeBonus ?? 0);
      cargoBonus += (u.cargoBonus       ?? 0);
      if (u.ramBonus)  ramBonus  = u.ramBonus;
      if (u.runFlat)   runFlat   = true;
      if (u.escotilha) escotilha = true;
    }

    // ── Stats base ────────────────────────────────────────────
    let velocidade      = BASE_VELOCIDADE      + velBonus;
    let manobrabilidade = BASE_MANOBRABILIDADE + manoBonus;
    const hpMax         = BASE_HP_MAX          + hpMaxBonus;
    const cargoTotal    = BASE_CARGO_SLOTS     + cargoBonus;

    // ── Estados de dano ───────────────────────────────────────
    const pneuFurado        = flags.pneuFurado        ?? false;
    const motorDanificado   = flags.motorDanificado   ?? false;
    const vidroQuebrado     = flags.vidroQuebrado     ?? false;
    const emChamas          = flags.emChamas          ?? false;
    const combustivelVazando = flags.combustivelVazando ?? false;

    // ── Penalidades por dano ──────────────────────────────────
    if (pneuFurado && !runFlat) {
      velocidade      = Math.floor(velocidade / 2);
      manobrabilidade = Math.max(0, manobrabilidade - 30);
    }
    if (motorDanificado) {
      velocidade = Math.floor(velocidade * 0.5);
    }

    // ── Clamp manobrabilidade ─────────────────────────────────
    manobrabilidade = Math.max(0, Math.min(99, manobrabilidade));

    // ── HP ────────────────────────────────────────────────────
    const hp    = Math.max(0, Math.min(hpMax, actor.system?.attribs?.hp?.value ?? hpMax));
    const hpPct = Math.round((hp / Math.max(1, hpMax)) * 100);
    const hpCor = hpPct > 50 ? "#44bb44" : hpPct > 25 ? "#ffaa00" : "#dd2222";

    // ── Combustível ───────────────────────────────────────────
    const combustivel = Math.max(0, Math.min(100, flags.combustivel ?? 100));

    // ── Estado geral ──────────────────────────────────────────
    let estadoLabel = "Operacional";
    if (emChamas)         estadoLabel = "EM CHAMAS!";
    else if (hp <= 0)     estadoLabel = "Destruído";
    else if (hpPct <= 25) estadoLabel = "Severamente danificado";
    else if (hpPct <= 50) estadoLabel = "Danificado";

    // ── Upgrades para template ────────────────────────────────
    const upgrades = upgradeItems.map(i => ({
      id:           i.id,
      name:         i.name,
      img:          i.img,
      categoriaLabel: CATEGORIA_LABELS[i.flags?.[MODULE_ID]?.upgrade?.categoria ?? "upgrade"] ?? "Upgrade"
    }));

    // ── Cargo (itens não-upgrade) ─────────────────────────────
    const cargoItems = actor.items.filter(i =>
      !i.flags?.[MODULE_ID]?.isUpgrade
    );
    const cargo = cargoItems.map(i => {
      const f    = i.flags?.[MODULE_ID] ?? {};
      const w    = Math.max(1, f.gridW ?? 1);
      const h    = Math.max(1, f.gridH ?? 1);
      return { id: i.id, name: i.name, img: i.img, slots: w * h };
    });

    const cargoUsed = cargo.reduce((acc, c) => acc + c.slots, 0);

    // ── Assentos / passageiros ────────────────────────────────
    const passageiros = flags.passageiros ?? [];
    const assentos = Array.from({ length: BASE_ASSENTOS }, (_, idx) => ({
      idx,
      label: ASSENTO_LABELS[idx] ?? `Assento ${idx + 1}`,
      nome:  passageiros[idx] ?? ""
    }));

    // ── Placa ─────────────────────────────────────────────────
    const placa = flags.placa ?? "";

    return {
      actor,
      name:    actor.name,
      img:     actor.img,
      placa,
      hp, hpMax, hpPct, hpCor,
      combustivel,
      velocidade,
      estrelasHtml: _toEstrelasHtml(velocidade),
      manobrabilidade,
      cargoSlots: cargoTotal,
      pneuFurado,
      motorDanificado,
      vidroQuebrado,
      emChamas,
      combustivelVazando,
      estadoLabel,
      upgrades,
      cargo,
      assentos,
      cargoUsed,
      cargoTotal,
      canEdit: isGM || actor.isOwner,
      isGM,
      escotilha,
      runFlat,
      ramBonusDice: ramBonus
    };
  }

  // ─── Listeners ──────────────────────────────────────────────
  activateListeners(html) {
    super.activateListeners(html);

    const actor = this.actor;

    // Ajuste de HP
    html.find(".ddp-veh-hp-adj").on("click", async (e) => {
      const delta  = parseInt(e.currentTarget.dataset.delta ?? "0");
      const data   = this.getData();
      const newVal = Math.max(0, Math.min(data.hpMax, data.hp + delta));
      await actor.update({ "system.attribs.hp.value": newVal });
      this.render(false);
    });

    // Ajuste de combustível
    html.find(".ddp-veh-fuel-adj").on("click", async (e) => {
      const delta   = parseInt(e.currentTarget.dataset.delta ?? "0");
      const flags   = actor.getFlag(MODULE_ID, "veiculo") ?? {};
      const current = Math.max(0, Math.min(100, flags.combustivel ?? 100));
      const newVal  = Math.max(0, Math.min(100, current + delta));
      const updated = { ...flags, combustivel: newVal };
      await actor.setFlag(MODULE_ID, "veiculo", updated);
      this.render(false);
    });

    // Toggle de estados
    html.find(".ddp-estado-toggle").on("click", async (e) => {
      const estado = e.currentTarget.dataset.estado;
      if (!estado) return;
      const flags   = actor.getFlag(MODULE_ID, "veiculo") ?? {};
      const current = flags[estado] ?? false;
      const updated = { ...flags, [estado]: !current };
      await actor.setFlag(MODULE_ID, "veiculo", updated);
      this.render(false);
    });

    // Edição de assentos
    html.find(".ddp-assento-input").on("change", async (e) => {
      const idx  = parseInt(e.currentTarget.dataset.idx ?? "0");
      const nome = e.currentTarget.value ?? "";
      const flags = actor.getFlag(MODULE_ID, "veiculo") ?? {};
      const passageiros = [...(flags.passageiros ?? [])];
      passageiros[idx] = nome;
      const updated = { ...flags, passageiros };
      await actor.setFlag(MODULE_ID, "veiculo", updated);
    });

    // Remover cargo
    html.find(".ddp-cargo-remove").on("click", async (e) => {
      const itemId = e.currentTarget.dataset.itemId;
      const item   = actor.items.get(itemId);
      if (!item) return;
      const confirm = await Dialog.confirm({
        title:   "Remover item?",
        content: `<p>Remover <b>${item.name}</b> da carga do veículo?</p>`
      });
      if (confirm) {
        await item.delete();
        this.render(false);
      }
    });

    // Remover upgrade
    html.find(".ddp-upgrade-remove").on("click", async (e) => {
      const itemId = e.currentTarget.dataset.itemId;
      const item   = actor.items.get(itemId);
      if (!item) return;
      const confirm = await Dialog.confirm({
        title:   "Remover upgrade?",
        content: `<p>Remover <b>${item.name}</b> do veículo?</p>`
      });
      if (confirm) {
        await item.delete();
        this.render(false);
      }
    });

    // Botões de combate
    html.find(".ddp-veh-btn-ram").on("click",  () => this._doRam());
    html.find(".ddp-veh-btn-flee").on("click", () => this._doFlee());
    html.find(".ddp-veh-btn-shoot").on("click", () => this._doShoot());
    html.find(".ddp-veh-btn-fuel").on("click", () => this._doFuel());

    // Edição de placa
    html.find(".ddp-placa-input").on("change", async (e) => {
      const placa  = e.currentTarget.value ?? "";
      const flags  = actor.getFlag(MODULE_ID, "veiculo") ?? {};
      const updated = { ...flags, placa };
      await actor.setFlag(MODULE_ID, "veiculo", updated);
    });

    // Drop de itens
    html[0].addEventListener("drop", (event) => this._onDrop(event));
  }

  // ─── Drop handler ────────────────────────────────────────────
  async _onDrop(event) {
    event.preventDefault();
    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch {
      return;
    }
    if (data.type !== "Item") return;

    let sourceItem;
    try {
      if (data.uuid) {
        sourceItem = await fromUuid(data.uuid);
      }
    } catch {
      // fromUuid falhou — tenta fallback
    }
    if (!sourceItem && data.id) {
      sourceItem = game.items.get(data.id);
    }
    if (!sourceItem) {
      ui.notifications.warn("Item não encontrado.");
      return;
    }

    // Cria o item no actor
    const itemData = sourceItem.toObject();
    await Item.create(itemData, { parent: this.actor });
    this.render(false);
  }

  // ─── Abalroar ────────────────────────────────────────────────
  async _doRam() {
    const data      = this.getData();
    const actor     = this.actor;
    const vel       = data.velocidade;
    const dadosAlvo = Math.ceil(vel / 30);
    const dadosProp = Math.max(1, Math.floor(dadosAlvo / 2));
    const danoAlvoStr = `${dadosAlvo}D6${data.ramBonusDice}`;
    const danoPropStr = `${dadosProp}D6`;

    new Dialog({
      title: "💥 Abalroar",
      content: `
        <div style="padding:12px; font-family:'Signika',serif; color:#ddd;">
          <p style="color:#aaa; margin-bottom:8px;">
            Velocidade atual: <b style="color:#cc7722">${vel} km/h</b>
          </p>
          <p>Dano ao alvo: <b style="color:#ff6b6b">${danoAlvoStr}</b></p>
          <p>Dano ao veículo: <b style="color:#ffaa00">${danoPropStr}</b></p>
          <hr style="border-color:#333; margin:10px 0;">
          <p style="color:#aaa; font-size:0.88em; font-style:italic;">
            Uma manobra de pilotagem (Dirigir ${data.manobrabilidade}%) pode ser necessária para manter controle.
          </p>
        </div>
      `,
      buttons: {
        rolar: {
          icon:  '<i class="fas fa-dice-d6"></i>',
          label: "Rolar Dano",
          callback: async () => {
            // Dano ao alvo
            const rollAlvo = new Roll(danoAlvoStr.replace("+", " + "));
            await rollAlvo.evaluate();
            await rollAlvo.toMessage({
              flavor: `💥 Dano de Abalroamento ao alvo (${vel} km/h)`
            });

            // Dano próprio
            const rollProp = new Roll(danoPropStr);
            await rollProp.evaluate();
            await rollProp.toMessage({
              flavor: `💥 Dano de Abalroamento ao veículo (${data.name})`
            });

            // Aplica dano ao veículo
            const currentHp = actor.system?.attribs?.hp?.value ?? data.hpMax;
            const newHp = Math.max(0, currentHp - rollProp.total);
            await actor.update({ "system.attribs.hp.value": newHp });
            this.render(false);
          }
        },
        cancelar: {
          icon:  '<i class="fas fa-times"></i>',
          label: "Cancelar"
        }
      },
      default: "rolar"
    }).render(true);
  }

  // ─── Fugir ───────────────────────────────────────────────────
  async _doFlee() {
    const data = this.getData();
    const roll = new Roll("1D100");
    await roll.evaluate();

    new Dialog({
      title: "🏃 Fuga de Veículo",
      content: `
        <div style="padding:12px; font-family:'Signika',serif; color:#ddd;">
          <p>Velocidade máxima: <b style="color:#cc7722">${data.velocidade} km/h</b></p>
          <p>Manobrabilidade (Dirigir): <b style="color:#cc7722">${data.manobrabilidade}%</b></p>
          <hr style="border-color:#333; margin:8px 0;">
          <p style="color:#aaa; font-size:0.9em;">
            Role <b>Dirigir (${data.manobrabilidade}%)</b> para cada turno de fuga.<br>
            Sucesso: mantém a distância ou aumenta.<br>
            Falha: perseguidor se aproxima.
          </p>
          <p style="color:#ffaa00; margin-top:8px; font-size:0.88em; font-style:italic;">
            Se o perseguidor for mais rápido, role com Penalidade.<br>
            Se for mais lento, role com Bônus.
          </p>
        </div>
      `,
      buttons: {
        rolarDirigir: {
          icon:  '<i class="fas fa-car"></i>',
          label: "Rolar Dirigir",
          callback: async () => {
            const r = new Roll("1D100");
            await r.evaluate();
            const sucesso   = r.total <= data.manobrabilidade;
            const extremo   = r.total <= Math.floor(data.manobrabilidade / 5);
            const resultado = extremo ? "EXTREMO" : sucesso ? "SUCESSO" : "FALHA";
            const cor       = extremo ? "#44ff44" : sucesso ? "#88cc44" : "#ff4444";
            await r.toMessage({
              flavor: `🏃 Dirigir — Fuga de Veículo (precisava ≤${data.manobrabilidade}) — <b style="color:${cor}">${resultado}</b>`
            });
          }
        },
        fechar: { icon: '<i class="fas fa-times"></i>', label: "Fechar" }
      },
      default: "rolarDirigir"
    }).render(true);
  }

  // ─── Atirar do veículo ───────────────────────────────────────
  async _doShoot() {
    const data = this.getData();

    new Dialog({
      title: "🔫 Atirar do Veículo",
      content: `
        <div style="padding:12px; font-family:'Signika',serif; color:#ddd;">
          <p style="color:#aaa; margin-bottom:8px;">Penalidades para atirar em movimento:</p>
          <ul style="color:#ccc; padding-left:1.2em; margin-bottom:10px;">
            <li>Parado: <b style="color:#44bb44">Sem penalidade</b></li>
            ${data.escotilha ? `<li>Pela escotilha (em movimento): <b style="color:#ffaa00">-10%</b></li>` : ""}
            <li>Pela janela (em movimento): <b style="color:#ff6b6b">-20%</b></li>
          </ul>
          <hr style="border-color:#333; margin:8px 0;">
          <p style="color:#888; font-size:0.88em; font-style:italic;">
            Velocidade atual: ${data.velocidade} km/h<br>
            O atirador precisa estar em posição adequada (assento, janela ou escotilha).
          </p>
        </div>
      `,
      buttons: {
        parado: {
          icon:  '<i class="fas fa-crosshairs"></i>',
          label: "Parado (sem penalidade)",
          callback: () => {
            ChatMessage.create({
              content: `<p><b>🔫 Tiro do veículo</b> — <span style="color:#44bb44">PARADO</span>: Sem penalidade de distância.</p>`
            });
          }
        },
        ...(data.escotilha ? {
          escotilha: {
            icon:  '<i class="fas fa-hatch"></i>',
            label: "Escotilha (-10%)",
            callback: () => {
              ChatMessage.create({
                content: `<p><b>🔫 Tiro pela escotilha</b> — <span style="color:#ffaa00">Em movimento: -10% na perícia</span></p>`
              });
            }
          }
        } : {}),
        janela: {
          icon:  '<i class="fas fa-window"></i>',
          label: "Janela em movimento (-20%)",
          callback: () => {
            ChatMessage.create({
              content: `<p><b>🔫 Tiro pela janela</b> — <span style="color:#ff6b6b">Em movimento: -20% na perícia de ataque</span></p>`
            });
          }
        },
        cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
      },
      default: "janela"
    }).render(true);
  }

  // ─── Abastecer ───────────────────────────────────────────────
  async _doFuel() {
    const actor  = this.actor;
    const flags  = actor.getFlag(MODULE_ID, "veiculo") ?? {};
    const atual  = Math.max(0, Math.min(100, flags.combustivel ?? 100));

    // Cria input de slider para o Dialog
    const content = `
      <div style="padding:12px; font-family:'Signika',serif; color:#ddd;">
        <p style="margin-bottom:10px;">Nível de combustível atual: <b style="color:#cc7722">${atual}%</b></p>
        <div style="display:flex; align-items:center; gap:10px;">
          <label style="color:#aaa; min-width:80px;">Novo nível:</label>
          <input type="range" id="ddp-fuel-slider" min="0" max="100" value="${atual}"
                 style="flex:1; accent-color:#cc7722;" />
          <span id="ddp-fuel-val" style="min-width:40px; color:#cc7722; font-weight:bold;">${atual}%</span>
        </div>
      </div>
    `;

    const d = new Dialog({
      title: "⛽ Abastecer Veículo",
      content,
      buttons: {
        confirmar: {
          icon:  '<i class="fas fa-gas-pump"></i>',
          label: "Confirmar",
          callback: async (html) => {
            const slider  = html.find("#ddp-fuel-slider")[0];
            const newFuel = parseInt(slider?.value ?? atual);
            const updated = { ...flags, combustivel: newFuel };
            await actor.setFlag(MODULE_ID, "veiculo", updated);
            this.render(false);
          }
        },
        cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
      },
      default: "confirmar",
      render: (html) => {
        const slider = html.find("#ddp-fuel-slider")[0];
        const valEl  = html.find("#ddp-fuel-val")[0];
        if (slider && valEl) {
          slider.addEventListener("input", () => {
            valEl.textContent = slider.value + "%";
          });
        }
      }
    });
    d.render(true);
  }

  // ─── Não salva ao submit (FormApplication requer isso) ───────
  async _updateObject(_event, _formData) {
    // Atualizações são feitas diretamente via listeners
  }
}

export { DDPVehicleSheet };
