// ============================================================
// MACRO 8 — Kit de Primeiros Socorros Avançado
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Selecione um token.");
const actor = token.actor;

const pvAtual = actor.system?.attribs?.hp?.value ?? 0;
const pvMax   = actor.system?.attribs?.hp?.max   ?? pvAtual;

// Ler skills do ator
const lerSkill = (chaves, labelTermos) => {
  const skills = actor.system?.skills ?? {};
  for (const k of chaves) {
    if (skills[k]?.value) return skills[k].value;
  }
  const found = Object.values(skills).find(s =>
    labelTermos.some(t => s?.label?.toLowerCase().includes(t))
  );
  return found?.value ?? null;
};

const skillMed = lerSkill(["medicine", "medicina"], ["medic", "medic"]);
const skillPA  = lerSkill(["firstaid", "first_aid"], ["first", "socorr"]);

new Dialog({
  title: `Kit PA Avançado — ${actor.name}`,
  content: `
    <div class="ddp-form" style="min-width:320px">
      <div style="border-left:4px solid #cc2222; padding:6px 10px; background:#1a1a2e; margin-bottom:10px">
        <b>PV atual:</b> ${pvAtual} / ${pvMax}
      </div>

      <div class="form-group">
        <label>Perícia usada:</label>
        <select id="pericia" style="width:200px">
          <option value="medicine">Medicina (1D6 / 2D4 extremo)</option>
          <option value="firstaid">Primeiros Socorros (1D4+1)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Valor da perícia (%):</label>
        <input type="number" id="valor" value="${skillMed ?? skillPA ?? 40}" min="1" max="99" style="width:80px"/>
        <span id="hint-skill" style="color:#888; font-size:0.8em"> ${skillMed ? "(Medicina lida da ficha)" : skillPA ? "(Primeiros Socorros lidos)" : "⚠️ Ajuste manualmente"}</span>
      </div>

      <div class="form-group">
        <label>Estancar hemorragia grave?</label>
        <input type="checkbox" id="hemostatico"/>
        <span style="color:#888; font-size:0.8em"> (automático, sem rolagem)</span>
      </div>

      <p class="hint">Medicina: sucesso → 1D6 | extremo → 2D4 PV<br>
      Primeiros Socorros: sucesso → 1D4+1 PV<br>
      Pode ser aplicado em outro personagem.</p>
    </div>
  `,
  buttons: {
    usar: {
      icon: '<i class="fas fa-briefcase-medical"></i>',
      label: "Usar kit",
      callback: async (html) => {
        const pericia = html.find("#pericia").val();
        const valor   = parseInt(html.find("#valor").val()) || 40;
        const hemo    = html.find("#hemostatico").is(":checked");
        const extremo = Math.floor(valor / 5);

        // Estancar hemorragia
        if (hemo) {
          const hemorragia = actor.effects.find(e =>
            e.name?.toLowerCase().includes("hemorra") ||
            e.name?.toLowerCase().includes("sangra")
          );
          if (hemorragia) {
            await hemorragia.delete();
            ChatMessage.create({ content: `🩹 Hemorragia de <b>${actor.name}</b> estancada com o kit avançado.` });
          } else {
            ChatMessage.create({ content: `🩹 Bandagem aplicada em <b>${actor.name}</b> (sem hemorragia ativa — preventivo).` });
          }
        }

        const roll = await new Roll("1d100").evaluate();
        const labelPericia = pericia === "medicine" ? "Medicina" : "Primeiros Socorros";
        await roll.toMessage({
          flavor: `<b>${labelPericia}</b> — ${actor.name} (necessário ≤ ${valor})`
        });

        if (roll.total <= valor) {
          let formula;
          if (pericia === "medicine") {
            formula = roll.total <= extremo ? "2d4" : "1d6";
          } else {
            formula = "1d4+1";
          }

          const cura = await new Roll(formula).evaluate();
          const novoPV = Math.min(pvMax, pvAtual + cura.total);
          await actor.update({ "system.attribs.hp.value": novoPV });

          const isExtremo = pericia === "medicine" && roll.total <= extremo;
          ChatMessage.create({
            content: `
              <div style="border-left:4px solid #a0ffa0; padding:6px 10px; background:#1a1a2e">
                ✅ ${isExtremo ? "<b>Sucesso Extremo!</b>" : "Sucesso."} ${actor.name} recupera <b>${cura.total} PV</b>.<br>
                PV: ${pvAtual} → <b style="color:#a0ffa0">${novoPV}</b>
                ${isExtremo ? `<br><span style="color:#aaa; font-size:0.85em">Rolagem: ${formula}</span>` : ""}
              </div>
            `
          });
        } else {
          ChatMessage.create({
            content: `
              <div style="border-left:4px solid #ff6b6b; padding:6px 10px; background:#1a1a2e">
                ❌ Falha. 1 uso consumido sem efeito de cura.
              </div>
            `
          });
        }
      }
    },
    cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
  },
  default: "usar",
  render: (html) => {
    // Atualiza o hint de skill ao trocar a seleção
    html.find("#pericia").on("change", (e) => {
      const v = e.target.value;
      if (v === "medicine" && skillMed) {
        html.find("#valor").val(skillMed);
        html.find("#hint-skill").text("(Medicina lida da ficha)");
      } else if (v === "firstaid" && skillPA) {
        html.find("#valor").val(skillPA);
        html.find("#hint-skill").text("(Primeiros Socorros lidos)");
      }
    });
  }
}).render(true);
