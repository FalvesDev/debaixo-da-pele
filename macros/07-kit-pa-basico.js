// ============================================================
// MACRO 7 — Kit de Primeiros Socorros Básico
// Debaixo da Pele | Call of Cthulhu 7e
// ============================================================

const MODULE_ID = "debaixo-da-pele";

const token = canvas.tokens.controlled[0];
if (!token) return ui.notifications.warn("Selecione um token.");
const actor = token.actor;

const pvAtual = actor.system?.attribs?.hp?.value ?? 0;
const pvMax   = actor.system?.attribs?.hp?.max   ?? pvAtual;

// Tenta ler o valor de Primeiros Socorros do ator (CoC7)
// O sistema CoC7 guarda skills em actor.system.skills com chave variável
const skillPA = (() => {
  const skills = actor.system?.skills ?? {};
  const chaves = ["firstaid", "first_aid", "primeiros_socorros", "primsoc"];
  for (const k of chaves) {
    if (skills[k]?.value) return skills[k].value;
  }
  // Busca por label parcial
  const encontrado = Object.values(skills).find(s =>
    s?.label?.toLowerCase().includes("first") ||
    s?.label?.toLowerCase().includes("socorr")
  );
  return encontrado?.value ?? null;
})();

// Verificar se foi usado nessa cena (evita múltiplos usos no mesmo ferimento)
const cenaId = canvas.scene?.id ?? "global";
const usoKey = `kit_basico_cena_${cenaId}`;
const jaUsouNaCena = actor.getFlag(MODULE_ID, usoKey) ?? false;

new Dialog({
  title: `Kit PA Básico — ${actor.name}`,
  content: `
    <div class="ddp-form" style="min-width:300px">
      <div style="border-left:4px solid #cc2222; padding:6px 10px; background:#1a1a2e; margin-bottom:10px">
        <b>PV atual:</b> ${pvAtual} / ${pvMax}
        ${pvAtual >= pvMax ? "<br><span style='color:#a0ffa0'>✅ Vida cheia — uso preventivo apenas.</span>" : ""}
      </div>

      <div class="form-group">
        <label>Primeiros Socorros (%):</label>
        <input type="number" id="skillValor" value="${skillPA ?? 30}" min="1" max="99" style="width:80px"/>
        ${skillPA ? `<span style="color:#888; font-size:0.8em"> (lido da ficha)</span>` : `<span style="color:#ffb347; font-size:0.8em"> ⚠️ Ajuste manualmente</span>`}
      </div>

      ${jaUsouNaCena ? `
        <div style="border-left:4px solid #ffb347; padding:6px 10px; background:#1a1a1a; margin-top:8px">
          ⚠️ Kit já usado nesta cena neste personagem.<br>
          <span style="color:#888; font-size:0.85em">Regra: 1 uso por ferimento por cena. Continue apenas se for novo ferimento.</span>
        </div>
      ` : ""}

      <p class="hint" style="margin-top:8px">
        Sucesso → 1D3 PV | Sucesso extremo (≤${Math.floor((skillPA ?? 30) / 5)}%) → 1D6 PV
      </p>
    </div>
  `,
  buttons: {
    usar: {
      icon: '<i class="fas fa-kit-medical"></i>',
      label: "Usar kit",
      callback: async (html) => {
        const skill = parseInt(html.find("#skillValor").val()) || 30;
        const extremo = Math.floor(skill / 5);

        const roll = await new Roll("1d100").evaluate();
        await roll.toMessage({
          flavor: `<b>Primeiros Socorros</b> — ${actor.name} (necessário ≤ ${skill})`
        });

        if (roll.total <= extremo) {
          const cura = await new Roll("1d6").evaluate();
          const novoPV = Math.min(pvMax, pvAtual + cura.total);
          await actor.update({ "system.attribs.hp.value": novoPV });
          await actor.setFlag(MODULE_ID, usoKey, true);
          ChatMessage.create({
            content: `
              <div style="border-left:4px solid #a0ffa0; padding:6px 10px; background:#1a1a2e">
                ✅ <b>Sucesso Extremo!</b> ${actor.name} recupera <b>${cura.total} PV</b>.<br>
                PV: ${pvAtual} → <b style="color:#a0ffa0">${novoPV}</b>
              </div>
            `
          });
        } else if (roll.total <= skill) {
          const cura = await new Roll("1d3").evaluate();
          const novoPV = Math.min(pvMax, pvAtual + cura.total);
          await actor.update({ "system.attribs.hp.value": novoPV });
          await actor.setFlag(MODULE_ID, usoKey, true);
          ChatMessage.create({
            content: `
              <div style="border-left:4px solid #a0ffa0; padding:6px 10px; background:#1a1a2e">
                ✅ Sucesso. ${actor.name} recupera <b>${cura.total} PV</b>.<br>
                PV: ${pvAtual} → <b style="color:#a0ffa0">${novoPV}</b>
              </div>
            `
          });
        } else {
          ChatMessage.create({
            content: `
              <div style="border-left:4px solid #ff6b6b; padding:6px 10px; background:#1a1a2e">
                ❌ Falha. Curativo mal aplicado — 1 uso consumido sem efeito.
              </div>
            `
          });
        }
      }
    },
    cancelar: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" }
  },
  default: "usar"
}).render(true);
