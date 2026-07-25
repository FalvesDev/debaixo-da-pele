// ============================================================
// Gerador de conteúdo — Mini-campanha "PROTOCOLO ÂMBAR" (E CORP)
// Call of Cthulhu 7e + Pulp Cthulhu | Ambientação: 2010
// ------------------------------------------------------------
// Emite:
//   templates/atores/ecorp-operadores.json
//   templates/itens/ecorp-equipamento.json
//   templates/jornais/ecorp-dossies.json
// ============================================================
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const MOD = "modules/debaixo-da-pele";
const ico = (n) => `${MOD}/assets/icons/${n}`;

// ─────────────────────────────────────────────────────────────
// CATÁLOGO DE PERÍCIAS (nomes pt-BR, consistentes com armas.json)
// base: número, ou função (chars) para bases derivadas
// ─────────────────────────────────────────────────────────────
const PERICIAS = {
  "Armas de Fogo (Pistola)":        { base: 20, spec: "Armas de Fogo", props: { combat: true, firearm: true } },
  "Armas de Fogo (Rifle)":          { base: 25, spec: "Armas de Fogo", props: { combat: true, firearm: true } },
  "Armas de Fogo (Espingarda)":     { base: 25, spec: "Armas de Fogo", props: { combat: true, firearm: true } },
  "Armas de Fogo (Submetralhadora)":{ base: 15, spec: "Armas de Fogo", props: { combat: true, firearm: true } },
  "Armas Pesadas":                  { base: 10, spec: "",              props: { combat: true, firearm: true } },
  "Briga":                          { base: 25, spec: "Lutar",         props: { combat: true, fighting: true } },
  "Arremesso":                      { base: 20, spec: "Lutar",         props: { combat: true, fighting: true } },
  "Esquiva":                        { base: (c) => Math.floor(c.dex / 2), spec: "", props: { special: true } },
  "Furtividade":                    { base: 20 },
  "Perceber":                       { base: 25 },
  "Escutar":                        { base: 20 },
  "Navegar":                        { base: 10 },
  "Psicologia":                     { base: 10 },
  "Medicina":                       { base: 1 },
  "Primeiros Socorros":             { base: 30 },
  "Consertos Mecânicos":            { base: 10 },
  "Consertos Elétricos":            { base: 10 },
  "Eletrônica":                     { base: 1 },
  "Usar Computadores":              { base: 5 },
  "Ciência (Biologia)":             { base: 1, spec: "Ciência" },
  "Ciência (Química)":              { base: 1, spec: "Ciência" },
  "Ciência (Física)":               { base: 1, spec: "Ciência" },
  "Ocultismo":                      { base: 5 },
  "Sobrevivência (Urbana)":         { base: 10, spec: "Sobrevivência" },
  "Escalar":                        { base: 20 },
  "Saltar":                         { base: 20 },
  "Nadar":                          { base: 20 },
  "Rastrear":                       { base: 10 },
  "Persuasão":                      { base: 10 },
  "Intimidação":                    { base: 15 },
  "Lábia":                          { base: 5 },
  "Charme":                         { base: 15 },
  "Chaveiro":                       { base: 1 },
  "Disfarce":                       { base: 5 },
  "Dirigir Automóvel":              { base: 20 },
  "Pilotar (Drone)":                { base: 1,  spec: "Pilotar" },
  "Demolições":                     { base: 1 },
  "Operar Maquinário Pesado":       { base: 1 },
  "Usar Bibliotecas":               { base: 20 },
  "História":                       { base: 5 },
  "Antropologia":                   { base: 1 },
  "Mundo Natural":                  { base: 10 },
  "Língua (Inglês)":                { base: 1,  spec: "Língua" },
  "Língua (Português)":             { base: 1,  spec: "Língua" },
  "Crédito":                        { base: 0,  props: { special: true } },
  "Mitos de Cthulhu":               { base: 0,  props: { special: true, push: false } }
};

// ─────────────────────────────────────────────────────────────
// HELPERS DE FICHA
// ─────────────────────────────────────────────────────────────
function derivados(c, idade, pulp = true) {
  const hpBase = Math.floor((c.con + c.siz) / 10);
  const hp = pulp ? hpBase * 2 : hpBase;
  const soma = c.str + c.siz;
  let db = "0", build = 0;
  if (soma <= 64)       { db = "-2", build = -2; }
  else if (soma <= 84)  { db = "-1", build = -1; }
  else if (soma <= 124) { db = "0",  build = 0; }
  else if (soma <= 164) { db = "1D4", build = 1; }
  else if (soma <= 204) { db = "1D6", build = 2; }
  else                  { db = "2D6", build = 3; }

  let mov = 8;
  if (c.dex < c.siz && c.str < c.siz) mov = 7;
  else if (c.dex > c.siz && c.str > c.siz) mov = 9;
  if (idade >= 40) mov -= Math.floor((idade - 30) / 10);

  return { hp, mp: Math.floor(c.pow / 5), mov, db, build };
}

function skillItem(nome, valor, chars) {
  const def = PERICIAS[nome];
  if (!def) throw new Error(`Perícia desconhecida: ${nome}`);
  const base = typeof def.base === "function" ? def.base(chars) : def.base;
  return {
    name: nome,
    type: "skill",
    img: "icons/svg/aura.svg",
    system: {
      skillName: nome,
      specialization: def.spec ?? "",
      description: { value: "", opposingDifficulty: "", pushedFaillureConsequences: "", chat: "", keeper: "" },
      base: String(base),
      bonusDice: 0,
      adjustments: { personal: null, occupation: null, archetype: null, experiencePackage: null, experience: null },
      value: valor,
      attributes: {},
      properties: { push: true, ...(def.props ?? {}) },
      flags: {}
    },
    flags: {}
  };
}

function operador(o) {
  const c = o.chars;
  const d = derivados(c, o.idade);
  const skills = Object.entries(o.pericias).map(([n, v]) => skillItem(n, v, c));

  return {
    name: o.nome,
    type: "character",
    img: o.img ?? "icons/svg/mystery-man.svg",
    system: {
      characteristics: {
        str: { value: c.str }, con: { value: c.con }, siz: { value: c.siz }, dex: { value: c.dex },
        app: { value: c.app }, int: { value: c.int }, pow: { value: c.pow }, edu: { value: c.edu }
      },
      attribs: {
        hp:  { value: d.hp, max: d.hp },
        mp:  { value: d.mp, max: d.mp },
        san: { value: o.san, max: o.san },
        lck: { value: o.luck },
        mov: { value: d.mov },
        db:  { value: d.db },
        build: { value: d.build },
        armor: { value: o.armadura }
      },
      infos: {
        occupation: o.funcao,
        age: String(o.idade),
        sex: o.sexo,
        residence: o.residencia,
        birthplace: o.natural,
        archetype: o.arquetipo,
        organization: "E CORP — Divisão de Contenção de Campo",
        playername: ""
      },
      backstory: o.background,
      description: { keeper: o.notasKeeper }
    },
    items: skills,
    effects: [],
    flags: {
      "debaixo-da-pele": {
        aurora: 0,
        slots_bolsos: 0,
        slots_mochila: 0,
        max_mochila: o.capacidade,
        mochila_nome: o.mochila,
        vestindo_epi: true,
        ocupacao: o.funcao,
        conexoes: o.conexoes,
        // metadados E CORP
        ecorp: {
          classe: o.classe,
          codinome: o.codinome,
          patente: o.patente,
          clearance: o.clearance,
          custoEquipamentoUSD: o.custoUSD,
          altura: o.altura,
          peso: o.peso,
          frase: o.frase
        }
      }
    }
  };
}

// ─────────────────────────────────────────────────────────────
// OS QUATRO OPERADORES
// ─────────────────────────────────────────────────────────────
const OPERADORES = [
  // ══════════════════════════ RECON ══════════════════════════
  operador({
    classe: "RECON", codinome: "VESPER",
    nome: "Ingrid Halvorsen \"Vesper\"",
    img: ico("arma-carabina.svg"),
    idade: 33, sexo: "F", altura: "1,71 m", peso: "63 kg",
    natural: "Tromsø, Noruega", residencia: "Apartamento corporativo — Roterdã, Países Baixos",
    funcao: "Operadora de Reconhecimento",
    arquetipo: "Explorador (Pulp Cthulhu)",
    patente: "Senior Operator",
    clearance: "ÂMBAR-3",
    custoUSD: 96400,
    mochila: "Mochila de patrulha 45L", capacidade: 18,
    armadura: 3,
    frase: "Eu já estou olhando pra isso há quarenta minutos. Vocês acabaram de chegar.",
    conexoes: "E CORP (contrato de 6 anos) · FSK/Noruega (baixa honrosa, 2004) · irmão mais novo, Jonas, não fala com ela desde 2007",
    chars: { str: 55, con: 65, siz: 50, dex: 80, app: 60, int: 75, pow: 70, edu: 65 },
    san: 70, luck: 65,
    pericias: {
      "Armas de Fogo (Rifle)": 85,
      "Armas de Fogo (Pistola)": 55,
      "Armas Pesadas": 20,
      "Briga": 45,
      "Arremesso": 40,
      "Esquiva": 65,
      "Furtividade": 85,
      "Perceber": 80,
      "Escutar": 70,
      "Navegar": 70,
      "Psicologia": 45,
      "Primeiros Socorros": 55,
      "Medicina": 5,
      "Consertos Elétricos": 30,
      "Consertos Mecânicos": 25,
      "Eletrônica": 35,
      "Usar Computadores": 40,
      "Pilotar (Drone)": 65,
      "Rastrear": 60,
      "Sobrevivência (Urbana)": 50,
      "Escalar": 55,
      "Saltar": 45,
      "Nadar": 45,
      "Demolições": 15,
      "Persuasão": 25,
      "Intimidação": 30,
      "Lábia": 20,
      "Charme": 20,
      "Chaveiro": 20,
      "Disfarce": 30,
      "Dirigir Automóvel": 50,
      "Ocultismo": 10,
      "Mundo Natural": 30,
      "Língua (Inglês)": 70,
      "Língua (Português)": 10,
      "Crédito": 40,
      "Mitos de Cthulhu": 0
    },
    background:
      "<p>Ingrid cresceu numa casa a nove quilômetros do vizinho mais próximo, acima do Círculo Polar Ártico. Aprendeu a atirar antes de aprender a andar de bicicleta. Entrou no exército norueguês aos 19 e foi uma das primeiras mulheres admitidas na seleção do FSK.</p>" +
      "<p>Saiu em 2004 depois de uma missão no Afeganistão em que passou onze dias sozinha numa posição de observação. Ela nunca contou o que viu no décimo dia. O relatório oficial diz \"sem contato\". A E CORP a recrutou em 2005, e o recrutador sabia exatamente o que tinha acontecido no décimo dia.</p>" +
      "<p><strong>Falha:</strong> confia mais no que vê pela luneta do que no que a equipe diz por rádio.</p>" +
      "<p><strong>Frase marcante:</strong> <em>\"Eu já estou olhando pra isso há quarenta minutos. Vocês acabaram de chegar.\"</em></p>",
    notasKeeper: "<p>Vesper sabe que a E CORP tem arquivos sobre o Afeganistão. Ela nunca pediu para lê-los. Se algum jogador conseguir acesso ao arquivo dela, a revelação vale 1/1D4 de Sanidade — para ela.</p>"
  }),

  // ═════════════════════════ ASSAULT ═════════════════════════
  operador({
    classe: "ASSAULT", codinome: "ÂNCORA",
    nome: "Rafael Duarte Nogueira \"Âncora\"",
    img: ico("arma-m4.svg"),
    idade: 38, sexo: "M", altura: "1,83 m", peso: "88 kg",
    natural: "Niterói, Rio de Janeiro, Brasil", residencia: "Casa alugada — Barra da Tijuca, Rio de Janeiro",
    funcao: "Operador de Assalto / Líder de Equipe",
    arquetipo: "Soldado de Fortuna (Pulp Cthulhu)",
    patente: "Lead Operator",
    clearance: "ÂMBAR-2",
    custoUSD: 71800,
    mochila: "Mochila de assalto 40L", capacidade: 16,
    armadura: 5,
    frase: "Ninguém entra sozinho. Ninguém sai sozinho. Isso não é negociável.",
    conexoes: "E CORP (contrato de 4 anos) · BOPE/RJ (reserva) · esposa Camila e duas filhas, 9 e 6 anos, que acham que ele trabalha com \"segurança de porto\"",
    chars: { str: 70, con: 75, siz: 70, dex: 65, app: 55, int: 70, pow: 65, edu: 60 },
    san: 65, luck: 60,
    pericias: {
      "Armas de Fogo (Rifle)": 75,
      "Armas de Fogo (Pistola)": 70,
      "Armas de Fogo (Espingarda)": 50,
      "Armas de Fogo (Submetralhadora)": 55,
      "Armas Pesadas": 40,
      "Briga": 70,
      "Arremesso": 55,
      "Esquiva": 55,
      "Furtividade": 45,
      "Perceber": 60,
      "Escutar": 50,
      "Navegar": 45,
      "Psicologia": 65,
      "Primeiros Socorros": 60,
      "Medicina": 10,
      "Consertos Mecânicos": 40,
      "Consertos Elétricos": 25,
      "Eletrônica": 20,
      "Usar Computadores": 30,
      "Pilotar (Drone)": 20,
      "Rastrear": 30,
      "Sobrevivência (Urbana)": 45,
      "Escalar": 45,
      "Saltar": 45,
      "Nadar": 55,
      "Demolições": 30,
      "Persuasão": 60,
      "Intimidação": 65,
      "Lábia": 35,
      "Charme": 30,
      "Chaveiro": 20,
      "Disfarce": 10,
      "Dirigir Automóvel": 65,
      "Operar Maquinário Pesado": 25,
      "Ocultismo": 15,
      "História": 15,
      "Língua (Inglês)": 60,
      "Língua (Português)": 60,
      "Crédito": 45,
      "Mitos de Cthulhu": 0
    },
    background:
      "<p>Rafael passou onze anos no BOPE. Entrou acreditando que ia consertar a cidade e saiu entendendo que não ia. O que o segurou foi a equipe — sempre foi a equipe.</p>" +
      "<p>Em 2006 comandou uma entrada num galpão em Duque de Caxias onde a E CORP já estava, de macacão branco, recolhendo alguma coisa em caixas lacradas. Foi instruído a não fazer relatório. Seis meses depois recebeu uma proposta com um número que resolvia a vida das filhas dele. Aceitou. Ainda não sabe se foi recrutamento ou compra de silêncio.</p>" +
      "<p><strong>Falha:</strong> assume responsabilidade por tudo, inclusive pelo que não pode controlar. Não delega quando deveria.</p>" +
      "<p><strong>Frase marcante:</strong> <em>\"Ninguém entra sozinho. Ninguém sai sozinho. Isso não é negociável.\"</em></p>",
    notasKeeper: "<p>Âncora é o elo social da equipe. Se ele cair, a coesão do grupo vira teste de POW. Ele guarda uma foto plastificada das filhas dentro do colete — se for destruída em combate, vale 0/1D3 de Sanidade.</p>"
  }),

  // ════════════════════════ BREACHER ═════════════════════════
  operador({
    classe: "BREACHER", codinome: "ARÍETE",
    nome: "Samuel Okonkwo \"Aríete\"",
    img: ico("arma-espingarda.svg"),
    idade: 36, sexo: "M", altura: "1,96 m", peso: "112 kg",
    natural: "Peckham, Londres, Reino Unido", residencia: "Alojamento da E CORP — Antuérpia, Bélgica",
    funcao: "Operador de Arrombamento e Contenção Física",
    arquetipo: "Grandalhão (Pulp Cthulhu)",
    patente: "Senior Operator",
    clearance: "ÂMBAR-4",
    custoUSD: 63200,
    mochila: "Mochila de arrombamento 35L", capacidade: 14,
    armadura: 8,
    frase: "Porta é sugestão.",
    conexoes: "E CORP (contrato de 5 anos) · Royal Marines / 40 Commando (baixa por lesão, 2005) · mãe, Adaeze, em Londres — liga toda quinta-feira",
    chars: { str: 90, con: 85, siz: 85, dex: 50, app: 45, int: 55, pow: 60, edu: 50 },
    san: 60, luck: 55,
    pericias: {
      "Armas de Fogo (Espingarda)": 75,
      "Armas de Fogo (Pistola)": 55,
      "Armas de Fogo (Rifle)": 45,
      "Armas Pesadas": 50,
      "Briga": 85,
      "Arremesso": 50,
      "Esquiva": 35,
      "Furtividade": 20,
      "Perceber": 45,
      "Escutar": 40,
      "Navegar": 25,
      "Psicologia": 30,
      "Primeiros Socorros": 50,
      "Consertos Mecânicos": 55,
      "Consertos Elétricos": 25,
      "Eletrônica": 10,
      "Usar Computadores": 15,
      "Rastrear": 20,
      "Sobrevivência (Urbana)": 40,
      "Escalar": 50,
      "Saltar": 40,
      "Nadar": 40,
      "Demolições": 60,
      "Chaveiro": 50,
      "Operar Maquinário Pesado": 55,
      "Persuasão": 25,
      "Intimidação": 75,
      "Lábia": 20,
      "Charme": 20,
      "Disfarce": 5,
      "Dirigir Automóvel": 45,
      "Ocultismo": 5,
      "Língua (Inglês)": 60,
      "Língua (Português)": 5,
      "Crédito": 35,
      "Mitos de Cthulhu": 0
    },
    background:
      "<p>Samuel é filho de uma enfermeira nigeriana que criou três filhos sozinha em Peckham. Entrou nos Royal Marines aos 18. Iraque, 2003. Em 2005 uma viga caiu sobre ele num prédio em Basra; três vértebras fraturadas, dispensa médica, e a informação de que ele nunca mais carregaria peso.</p>" +
      "<p>A E CORP pagou a cirurgia experimental de fusão que o NHS negou. Ele nunca perguntou de onde veio a técnica. Anda com dor todos os dias e nunca menciona.</p>" +
      "<p><strong>Falha:</strong> vai à frente sempre. Não porque é corajoso — porque não suporta a ideia de outra pessoa entrar primeiro.</p>" +
      "<p><strong>Frase marcante:</strong> <em>\"Porta é sugestão.\"</em></p>",
    notasKeeper: "<p>A coluna do Aríete tem implante. Sob exposição prolongada a anomalias (ou ao Composto Aurora, se cruzar com a campanha principal), o Guardião pode narrar que o metal \"esquenta\". Não é sugestão — é literal.</p>"
  }),

  // ═══════════════════════ SPECIALIST ════════════════════════
  operador({
    classe: "SPECIALIST", codinome: "ÍRIS",
    nome: "Dra. Mei-Lin Chao \"Íris\"",
    img: ico("aurora-amostra.svg"),
    idade: 31, sexo: "F", altura: "1,64 m", peso: "56 kg",
    natural: "Vancouver, Canadá", residencia: "Instalação E CORP Meridian — localização não divulgada",
    funcao: "Especialista em Contenção de Anomalias",
    arquetipo: "Cientista (Pulp Cthulhu)",
    patente: "Containment Specialist",
    clearance: "OBSIDIANA-1",
    custoUSD: 128700,
    mochila: "Mochila técnica modular 50L", capacidade: 20,
    armadura: 3,
    frase: "Não me peça pra dizer que é impossível. Me dá dez minutos e eu te digo o que é.",
    conexoes: "E CORP (contrato de 3 anos, cláusula de exclusividade vitalícia) · USAMRIID/Fort Detrick (consultora, 2006-2008) · nenhum contato familiar registrado desde 2008",
    chars: { str: 45, con: 60, siz: 55, dex: 70, app: 65, int: 85, pow: 75, edu: 85 },
    san: 75, luck: 70,
    pericias: {
      "Armas de Fogo (Submetralhadora)": 50,
      "Armas de Fogo (Pistola)": 45,
      "Armas de Fogo (Rifle)": 30,
      "Briga": 30,
      "Arremesso": 35,
      "Esquiva": 50,
      "Furtividade": 45,
      "Perceber": 65,
      "Escutar": 45,
      "Navegar": 30,
      "Psicologia": 50,
      "Medicina": 70,
      "Primeiros Socorros": 80,
      "Ciência (Biologia)": 85,
      "Ciência (Química)": 75,
      "Ciência (Física)": 40,
      "Eletrônica": 65,
      "Consertos Elétricos": 60,
      "Consertos Mecânicos": 35,
      "Usar Computadores": 75,
      "Usar Bibliotecas": 70,
      "Pilotar (Drone)": 30,
      "Antropologia": 25,
      "História": 25,
      "Ocultismo": 40,
      "Sobrevivência (Urbana)": 25,
      "Escalar": 25,
      "Saltar": 25,
      "Nadar": 35,
      "Rastrear": 15,
      "Demolições": 20,
      "Chaveiro": 25,
      "Persuasão": 55,
      "Intimidação": 20,
      "Lábia": 40,
      "Charme": 45,
      "Disfarce": 15,
      "Dirigir Automóvel": 35,
      "Mundo Natural": 45,
      "Língua (Inglês)": 85,
      "Língua (Português)": 15,
      "Crédito": 55,
      "Mitos de Cthulhu": 6
    },
    background:
      "<p>Mei-Lin defendeu doutorado em bioquímica aos 25 e foi contratada pelo USAMRIID em Fort Detrick como consultora externa. Trabalhou dois anos com amostras cujo número de catálogo começava com uma letra que não existia no sistema.</p>" +
      "<p>Em 2008 ela publicou — sem autorização — um artigo sobre cinética de replicação anômala. O artigo foi retirado da revista em setenta e duas horas. Três semanas depois a E CORP ofereceu a ela um laboratório com orçamento ilimitado e uma cláusula de exclusividade que não expira nem com a morte. Ela leu a cláusula inteira. Assinou mesmo assim.</p>" +
      "<p><strong>Falha:</strong> curiosidade acima da autopreservação. Já abriu contêiner que devia permanecer fechado.</p>" +
      "<p><strong>Frase marcante:</strong> <em>\"Não me peça pra dizer que é impossível. Me dá dez minutos e eu te digo o que é.\"</em></p>",
    notasKeeper: "<p>Íris é a única com Mitos de Cthulhu acima de zero (6%). Ela já sabe que algumas coisas não seguem física conhecida e trata isso como problema de engenharia. É o vetor principal de exposição do grupo ao Mitos — e o único personagem capaz de traduzir horror em procedimento.</p>"
  })
];

// ─────────────────────────────────────────────────────────────
// EQUIPAMENTO — tecnologia plausível para 2010
// ─────────────────────────────────────────────────────────────
const arma = (o) => ({
  name: o.name,
  type: "weapon",
  img: o.img,
  system: {
    description: { value: o.desc, chat: "", special: "", keeper: "" },
    skill: { main: { name: o.skill, id: "" }, alternativ: { name: "", id: "" } },
    range: {
      normal:  { value: o.r[0], units: "", damage: o.dano },
      long:    { value: o.r[1], units: "", damage: o.dano },
      extreme: { value: o.r[2], units: "", damage: o.dano }
    },
    wpnType: o.tipo,
    usesPerRound: { value: o.rof[0], max: o.rof[1], period: "" },
    bullets: { value: o.mag, max: o.mag },
    blastRadius: o.blast ?? "",
    malfunction: o.mal ?? 100,
    properties: { improv: false, ...(o.props ?? {}) },
    price: { value: 0, level: "" },
    quantity: 1,
    weight: o.pesoKg
  },
  flags: {
    "debaixo-da-pele": {
      gridW: o.grid[0], gridH: o.grid[1], slots: o.slots,
      categoria: "arma", caliber: o.calibre, notas: o.notas,
      preco: Math.round(o.usd * 1.75), precoUSD: o.usd,
      ecorp: { classe: o.classe, acessorios: o.acessorios }
    }
  }
});

const equip = (o) => ({
  name: o.name,
  type: "item",
  img: o.img,
  system: {
    description: { value: o.desc, chat: "", keeper: "" },
    quantity: o.qtd ?? 1,
    weight: o.pesoKg ?? 0,
    price: 0,
    notes: "",
    attributes: {}
  },
  flags: {
    "debaixo-da-pele": {
      gridW: o.grid[0], gridH: o.grid[1], slots: o.slots,
      usos: o.usos ?? 0,
      categoria: o.cat,
      notas: o.notas,
      preco: Math.round(o.usd * 1.75), precoUSD: o.usd,
      ecorp: { classe: o.classe }
    }
  }
});

const EQUIPAMENTO = [
  // ── RECON ──────────────────────────────────────────────────
  arma({
    classe: "RECON", name: "AI Arctic Warfare .338 LM (E CORP)",
    img: ico("arma-carabina.svg"), skill: "Armas de Fogo (Rifle)",
    dano: "2D8+1D6", r: [180, 360, 720], tipo: "ranged", rof: [1, 1], mag: 5, mal: 98, pesoKg: 6.9,
    calibre: ".338 Lapua Magnum", grid: [2, 5], slots: 8, usd: 14500,
    notas: "Ferrolho. 1 tiro/rodada. Bipé obrigatório para alcance longo — sem apoio, penalidade de um nível de dificuldade.",
    acessorios: "Luneta Schmidt & Bender 5-25×56 PM II · supressor Surefire SOCOM · bipé Harris · capa ghillie modular",
    desc: "<p>Rifle de ferrolho britânico calibre .338 Lapua Magnum, unidade modificada pela oficina interna da E CORP. Alcance efetivo real de 1.100 m. O supressor reduz a assinatura sonora o suficiente para que a origem do disparo não seja localizável acima de 300 m.</p><p><strong>Desvantagem:</strong> 6,9 kg com acessórios. Inútil em corredor. Recarga de ferrolho custa a ação de movimento.</p>"
  }),
  arma({
    classe: "RECON", name: "SIG P226 9mm (supressa)",
    img: ico("arma-pistola.svg"), skill: "Armas de Fogo (Pistola)",
    dano: "1D10", r: [15, 30, 60], tipo: "ranged", rof: [3, 3], mag: 15, mal: 99, pesoKg: 1.4,
    calibre: "9×19mm Parabellum", grid: [1, 2], slots: 3, usd: 1900,
    notas: "Com supressor: quem escuta o disparo faz Escutar com um nível de dificuldade a mais.",
    acessorios: "Supressor Gemtech Tundra · cano rosqueado · miras de trítio",
    desc: "<p>Pistola secundária padrão da E CORP para operadores de reconhecimento. Munição subsônica de 147 grãos combinada ao supressor — o som dominante passa a ser o próprio ferrolho.</p>"
  }),
  equip({
    classe: "RECON", name: "Binóculo Térmico FLIR HS-324 Command",
    img: ico("binoculo.svg"), cat: "eletronico", grid: [2, 2], slots: 3, pesoKg: 0.8, usd: 9800,
    notas: "Detecta calor através de fumaça e escuridão total. NÃO enxerga através de parede ou vidro. Bateria: 5 h.",
    desc: "<p>Monóculo térmico de mão, microbolômetro não refrigerado 320×240. Detecta assinatura humana a até 700 m. Grava vídeo em cartão SD.</p><p><strong>Uso:</strong> concede um nível de bônus em Perceber contra alvos vivos ocultos no escuro. Não funciona contra o que não gera calor.</p>"
  }),
  equip({
    classe: "RECON", name: "Óculos de Visão Noturna AN/PVS-14",
    img: ico("capacete.svg"), cat: "eletronico", grid: [2, 1], slots: 2, pesoKg: 0.35, usd: 3600,
    notas: "Monocular Gen 3. Campo de visão reduzido a 40° — penalidade de um nível em Perceber periférico. Luz forte cega por 1D3 rodadas.",
    desc: "<p>Intensificador de imagem Gen 3 monocular, montado em capacete. Anula penalidades de escuridão parcial. Requer alguma luz ambiente — em escuridão absoluta, precisa do iluminador IR embutido, que é visível para quem também tiver NVG.</p>"
  }),
  equip({
    classe: "RECON", name: "Drone de Reconhecimento RQ-11B Raven",
    img: ico("camera-video.svg"), cat: "eletronico", grid: [3, 2], slots: 5, pesoKg: 1.9, usd: 34000,
    usos: 3,
    notas: "Lançado à mão. Autonomia 80 min. Alcance 10 km. Requer Pilotar (Drone). Barulhento — não é furtivo em ambiente fechado.",
    desc: "<p>Drone de asa fixa lançado à mão, com câmera EO/IR e link de vídeo em tempo real para o terminal do operador. Padrão militar americano desde 2006.</p><p><strong>Limitação crítica:</strong> é um avião. Não voa dentro de prédios, não paira, não sobe escada. Para uso interno a equipe carrega o <em>Recon Scout</em>.</p>"
  }),
  equip({
    classe: "RECON", name: "Recon Scout XT (drone de arremesso)",
    img: ico("camera-compacta.svg"), cat: "eletronico", grid: [1, 2], slots: 2, pesoKg: 0.6, usd: 9000,
    notas: "Arremessável até 9 m. Rola. Câmera IR. Autonomia 60 min. Silencioso.",
    desc: "<p>Robô cilíndrico de duas rodas, jogado por baixo da porta ou pela janela. Transmite vídeo infravermelho sem fio. Sobrevive a queda de dois andares. Usado por SWAT americano desde 2008.</p>"
  }),

  // ── ASSAULT ────────────────────────────────────────────────
  arma({
    classe: "ASSAULT", name: "HK416 D10RS 5.56mm",
    img: ico("arma-m4.svg"), skill: "Armas de Fogo (Rifle)",
    dano: "2D8", r: [90, 180, 360], tipo: "ranged", rof: [1, 3], mag: 30, mal: 99, pesoKg: 3.6,
    calibre: "5,56×45mm NATO", grid: [2, 4], slots: 6, usd: 4200,
    notas: "Semi ou rajada de 3. Pistão de gás — funciona sujo, funciona molhado.",
    acessorios: "Mira holográfica EOTech 552 · lanterna Surefire M600 · laser IR PEQ-15 · empunhadura vertical · bandoleira de 3 pontos",
    desc: "<p>Carabina modular alemã de operação a pistão, calibre 5,56. O trilho Picatinny de quatro faces permite reconfigurar a arma entre CQB e média distância em campo.</p><p><strong>Desvantagem:</strong> 5,56 tem penetração excelente e poder de parada mediano. Contra alvo com massa muito acima do humano, o Guardião pode aplicar redução de dano.</p>"
  }),
  arma({
    classe: "ASSAULT", name: "Glock 17 Gen4 9mm",
    img: ico("arma-pistola.svg"), skill: "Armas de Fogo (Pistola)",
    dano: "1D10", r: [15, 30, 60], tipo: "ranged", rof: [3, 3], mag: 17, mal: 99, pesoKg: 0.9,
    calibre: "9×19mm Parabellum", grid: [1, 2], slots: 2, usd: 650,
    notas: "Coldre de coxa Safariland 6004. Saque rápido — não custa ação se já estiver com a mão livre.",
    acessorios: "Lanterna Streamlight TLR-1 · miras noturnas · três carregadores extras",
    desc: "<p>Pistola secundária padrão. Polímero, 17 tiros, sem trava manual. É a arma que continua funcionando quando o rifle emperra.</p>"
  }),
  equip({
    classe: "ASSAULT", name: "Granada de Concussão M84 (Flashbang)",
    img: ico("dinamite.svg"), cat: "explosivo", grid: [1, 1], slots: 1, pesoKg: 0.25, usd: 45, qtd: 4,
    notas: "Arremesso. Alvos em 3 m: teste de CON ou ficam Atordoados por 1D3 rodadas. Não causa dano.",
    desc: "<p>Granada não letal: 175 dB e 6 milhões de candelas. Padrão de entrada tática. Em ambiente fechado o efeito é brutal — inclusive para quem jogou, se calcular mal.</p>"
  }),

  // ── BREACHER ───────────────────────────────────────────────
  arma({
    classe: "BREACHER", name: "Benelli M4 Super 90 Cal.12",
    img: ico("arma-espingarda-curta.svg"), skill: "Armas de Fogo (Espingarda)",
    dano: "4D6/2D6/1D6", r: [10, 20, 50], tipo: "ranged", rof: [1, 2], mag: 7, mal: 99, pesoKg: 3.8,
    calibre: "Calibre 12 / 2¾\"", grid: [2, 4], slots: 6, usd: 2100,
    notas: "Semiautomática. Dano por faixa de alcance. Munição de arrombamento (Hatton) disponível: destrói dobradiça, não serve contra alvo.",
    acessorios: "Mira ghost ring · lanterna Surefire · coronha telescópica · porta-cartuchos lateral",
    desc: "<p>Espingarda semiautomática italiana de operação a gás ARGO, adotada pelos Marines em 1999. Sete tiros, ciclo confiável com qualquer carga.</p><p><strong>Desvantagem:</strong> recarga cartucho a cartucho. Uma rodada = 2 cartuchos.</p>"
  }),
  equip({
    classe: "BREACHER", name: "Escudo Balístico Point Blank Level IIIA",
    img: ico("colete-tatico.svg"), cat: "protecao", grid: [3, 4], slots: 8, pesoKg: 11.5, usd: 3800,
    notas: "Armadura +10 contra ataques frontais enquanto empunhado. Ocupa uma mão. Penalidade de um nível em Esquiva e Furtividade.",
    desc: "<p>Escudo de mão em aramida com visor blindado e lanterna integrada de 500 lumens. Detém 9mm, .44 Magnum e fragmentos. NÃO detém rifle.</p><p><strong>Peso real:</strong> 11,5 kg. Segurar por mais de três rodadas seguidas exige teste de CON para quem tem STR abaixo de 70.</p>"
  }),
  equip({
    classe: "BREACHER", name: "Hydra-Ram HR-1 (aríete hidráulico)",
    img: ico("alicate.svg"), cat: "ferramenta", grid: [2, 2], slots: 4, pesoKg: 7.7, usd: 1650,
    notas: "Abre porta trancada em 1 rodada com sucesso em Consertos Mecânicos ou STR. Silencioso comparado a marreta.",
    desc: "<p>Ferramenta hidráulica manual de arrombamento: 4.500 kg de força de separação aplicada no batente. Abre porta de aço comercial sem explosivo e sem barulho de impacto.</p>"
  }),
  equip({
    classe: "BREACHER", name: "Marreta de Arrombamento Thunderbolt 4,5 kg",
    img: ico("machado-bombeiro.svg"), cat: "ferramenta", grid: [1, 3], slots: 3, pesoKg: 4.5, usd: 180,
    notas: "Também é arma improvisada: 1D8 + bônus de dano, Briga.",
    desc: "<p>Marreta com cabo de fibra e cabeça de aço temperado. Quando o Hydra-Ram não encaixa, isto encaixa.</p>"
  }),

  // ── SPECIALIST ─────────────────────────────────────────────
  arma({
    classe: "SPECIALIST", name: "HK MP7A1 4.6mm",
    img: ico("arma-pistola.svg"), skill: "Armas de Fogo (Submetralhadora)",
    dano: "1D8", r: [20, 40, 80], tipo: "ranged", rof: [1, 4], mag: 40, mal: 99, pesoKg: 2.1,
    calibre: "4,6×30mm", grid: [2, 2], slots: 3, usd: 3400,
    notas: "Operável com uma mão. Perfura colete Nível IIIA. Dano baixo por projétil — compensa em volume.",
    acessorios: "Red dot Aimpoint Micro T-1 · supressor B&T · bandoleira de peito · coronha retrátil",
    desc: "<p>Arma pessoal de defesa compacta, 2,1 kg carregada. Projetada para quem tem as mãos ocupadas com outra coisa — exatamente o caso da Íris.</p>"
  }),
  equip({
    classe: "SPECIALIST", name: "Panasonic Toughbook CF-19 (terminal de campo)",
    img: ico("notebook.svg"), cat: "eletronico", grid: [3, 2], slots: 4, pesoKg: 2.3, usd: 4900,
    notas: "Tela sensível a toque, resistente a queda e água. Bateria 8 h. Requer Usar Computadores.",
    desc: "<p>Notebook conversível militarizado (MIL-STD-810G). Roda o pacote de análise da E CORP, recebe vídeo dos drones e do scanner, e mantém o banco de referência de anomalias offline.</p><p><strong>Nota 2010:</strong> não é holográfico. É pesado, tem tela de 10 polegadas e demora 40 segundos para ligar.</p>"
  }),
  equip({
    classe: "SPECIALIST", name: "Espectrômetro Portátil Thermo TruDefender FT",
    img: ico("gadget-analise.svg"), cat: "cientifico", grid: [2, 2], slots: 3, pesoKg: 1.3, usd: 28000,
    notas: "Identifica composto químico desconhecido em 60 s. Teste de Ciência (Química). Resultado 'NÃO CATALOGADO' é o gatilho narrativo.",
    desc: "<p>Espectrômetro de infravermelho por transformada de Fourier, de mão. Compara a assinatura molecular da amostra contra uma biblioteca de 10.000 substâncias.</p><p><strong>Uso em jogo:</strong> quando o resultado volta sem correspondência, a Íris sabe que está lidando com algo fora do catálogo humano. Primeira leitura assim: teste de Sanidade 0/1D4.</p>"
  }),
  equip({
    classe: "SPECIALIST", name: "Kit de Coleta e Contenção Biológica",
    img: ico("aurora-amostra.svg"), cat: "cientifico", grid: [2, 3], slots: 4, pesoKg: 3.1, usd: 2200,
    usos: 12,
    notas: "12 frascos selados, pinças, seringas, sacos de risco biológico, nitrogênio líquido em dewar de 500 ml.",
    desc: "<p>Kit padrão de recuperação de artefato biológico. Frascos de borossilicato com vedação tripla, etiquetas de cadeia de custódia da E CORP e um dewar criogênico pequeno para amostras que não podem aquecer.</p>"
  }),
  equip({
    classe: "SPECIALIST", name: "Detector Multigás + Contador Geiger (Ludlum 3)",
    img: ico("gadget-analise.svg"), cat: "cientifico", grid: [1, 2], slots: 2, pesoKg: 1.6, usd: 3100,
    notas: "Alarme sonoro. Mede O₂, CO, H₂S, LEL e radiação ionizante. Não detecta nada anômalo — e é isso que assusta.",
    desc: "<p>Dois instrumentos presos ao arnês peitoral. Confiáveis, calibrados, e completamente cegos para qualquer coisa que não seja química ou radiação conhecida.</p>"
  }),

  // ── COMUM À EQUIPE ─────────────────────────────────────────
  equip({
    classe: "TODOS", name: "Rádio Thales AN/PRC-148 MBITR + Peltor ComTac II",
    img: ico("radio-portatil.svg"), cat: "eletronico", grid: [1, 2], slots: 2, pesoKg: 1.2, usd: 5400,
    notas: "Criptografado. Alcance 8 km em campo aberto, muito menos sob estrutura de concreto. O headset também protege audição de flashbang.",
    desc: "<p>Rádio tático multibanda criptografado com headset de condução óssea e proteção auditiva ativa — comprime sons acima de 82 dB e amplifica sons baixos.</p>"
  }),
  equip({
    classe: "TODOS", name: "Conjunto de Armadura E CORP Padrão 2009",
    img: ico("colete.svg"), cat: "protecao", grid: [3, 4], slots: 0, pesoKg: 13.4, usd: 8700,
    notas: "Armadura 5 (ASSAULT) / 3 (RECON e SPECIALIST, placas leves) / 8 (BREACHER, placas Nível IV + proteções). Vestida, não ocupa slot de mochila.",
    desc: "<p><strong>Capacete:</strong> Ops-Core FAST ballistic com trilho lateral, suporte NVG e almofadas de impacto.<br>" +
          "<strong>Colete:</strong> plate carrier Crye JPC com placas ESAPI Nível III (RECON/SPECIALIST) ou Nível IV com placas laterais (ASSAULT/BREACHER).<br>" +
          "<strong>Braços:</strong> cotoveleiras rígidas e luvas Mechanix com reforço de couro de cabra.<br>" +
          "<strong>Pernas:</strong> joelheiras rígidas, calça de combate ripstop com reforço em Cordura.<br>" +
          "<strong>Peso total:</strong> 13,4 kg (padrão) a 22 kg (configuração BREACHER).<br>" +
          "<strong>Capacidade de carga:</strong> 8 pontos MOLLE frontais, 6 laterais.<br>" +
          "<strong>Comunicação:</strong> PTT no ombro esquerdo, cabo roteado por dentro do colete.<br>" +
          "<strong>Visão noturna:</strong> suporte Wilcox L4 G24 no capacete.<br>" +
          "<strong>HUD:</strong> não existe. É 2010. O que existe é um bastão químico verde preso no ombro e fita adesiva com o tipo sanguíneo escrito a caneta.</p>"
  }),
  equip({
    classe: "TODOS", name: "Kit Médico de Combate IFAK",
    img: ico("kit-pa-avancado.svg"), cat: "medico", grid: [2, 2], slots: 2, pesoKg: 0.9, usd: 220, usos: 3,
    notas: "Torniquete CAT, gaze hemostática QuikClot, selo torácico, cânula nasofaríngea. Primeiros Socorros: 1D6 HP, ou estabiliza Morrendo automaticamente.",
    desc: "<p>Kit individual de primeiros socorros de trauma, preso na cintura traseira. Todo operador carrega o seu — e a regra da E CORP é usar o kit da vítima, nunca o próprio.</p>"
  }),
  equip({
    classe: "TODOS", name: "Faca Ka-Bar USMC",
    img: ico("arma-faca.svg"), cat: "arma", grid: [1, 2], slots: 1, pesoKg: 0.32, usd: 90,
    notas: "1D4+2 + bônus de dano, Briga. Também é ferramenta.",
    desc: "<p>Faca de combate de lâmina fixa 18 cm, aço 1095. Bainha de couro no colete.</p>"
  }),
  equip({
    classe: "TODOS", name: "Lanterna Surefire G2X + bastões químicos",
    img: ico("lanterna-tatica.svg"), cat: "utilitario", grid: [1, 1], slots: 1, pesoKg: 0.2, usd: 75, usos: 6,
    notas: "320 lumens, 2 h de bateria. 6 bastões químicos (verde, vermelho, IR) de 12 h cada.",
    desc: "<p>Lanterna tática de mão em alumínio anodizado, mais um pacote de bastões químicos para marcação de rota e sinalização silenciosa.</p>"
  }),
  equip({
    classe: "TODOS", name: "Corda Estática 60 m + kit de rapel",
    img: ico("kit-rappel.svg"), cat: "utilitario", grid: [2, 3], slots: 4, pesoKg: 4.8, usd: 340,
    notas: "Corda 11 mm, cadeirinha, oito, dois mosquetões trava, fita tubular 5 m.",
    desc: "<p>Corda estática de 11 mm com kit completo de descida. Escalar recebe um nível de bônus quando usada corretamente.</p>"
  })
];

// ─────────────────────────────────────────────────────────────
// DOSSIÊS — 1 página por operador
// ─────────────────────────────────────────────────────────────
const pagina = (op, corpo) => ({
  name: `${op.flags["debaixo-da-pele"].ecorp.classe} — ${op.flags["debaixo-da-pele"].ecorp.codinome}`,
  type: "text",
  title: { show: true, level: 1 },
  text: { format: 1, content: corpo },
  ownership: { default: 0 }
});

function dossieCorpo(op) {
  const e = op.flags["debaixo-da-pele"].ecorp;
  const s = op.system;
  const c = s.characteristics;
  const a = s.attribs;
  const topo = Object.entries(op.items.reduce((m, i) => (m[i.name] = i.system.value, m), {}))
    .sort((x, y) => y[1] - x[1]).slice(0, 10)
    .map(([n, v]) => `${n} ${v}%`).join(" · ");

  return `
<p><em>E CORP — Divisão de Contenção de Campo · Dossiê de Pessoal · Clearance ${e.clearance}</em></p>
<hr>
<h2>${op.name}</h2>
<p><strong>Codinome:</strong> ${e.codinome} · <strong>Classe:</strong> ${e.classe} · <strong>Patente:</strong> ${e.patente}<br>
<strong>Idade:</strong> ${s.infos.age} · <strong>Altura:</strong> ${e.altura} · <strong>Peso:</strong> ${e.peso}<br>
<strong>Natural de:</strong> ${s.infos.birthplace}<br>
<strong>Arquétipo Pulp:</strong> ${s.infos.archetype}</p>

<h3>Atributos</h3>
<p>FOR ${c.str.value} · CON ${c.con.value} · TAM ${c.siz.value} · DES ${c.dex.value} · APA ${c.app.value} · INT ${c.int.value} · POD ${c.pow.value} · EDU ${c.edu.value}</p>
<p><strong>PV</strong> ${a.hp.value} (Pulp: dobrado) · <strong>PM</strong> ${a.mp.value} · <strong>Sorte</strong> ${a.lck.value} · <strong>Sanidade</strong> ${a.san.value} · <strong>MOV</strong> ${a.mov.value} · <strong>Corpo</strong> ${a.build.value} · <strong>Bônus de Dano</strong> ${a.db.value} · <strong>Armadura</strong> ${a.armor.value}</p>

<h3>Perícias de destaque</h3>
<p>${topo}</p>

<h3>Background</h3>
${s.backstory}

${corpoExtra(e.classe)}

<h3>Ficha administrativa</h3>
<p><strong>Nível de sigilo:</strong> ${e.clearance}<br>
<strong>Conexões:</strong> ${op.flags["debaixo-da-pele"].conexoes}</p>
<hr>
<p><em>Documento gerado pelo módulo Debaixo da Pele · Mini-campanha PROTOCOLO ÂMBAR</em></p>`;
}

function corpoExtra(classe) {
  const t = {
    RECON: `<h3>Comportamento</h3>
<p><strong>Em combate:</strong> nunca está onde a equipe está. Escolhe posição antes do tiroteio começar e só se move quando a posição queima.<br>
<strong>Fora de combate:</strong> quieta, observadora, responde em frases curtas. Faz perguntas que ninguém pensou em fazer.<br>
<strong>Em equipe:</strong> alimenta o rádio com informação constante. Se ela para de falar, alguma coisa aconteceu.<br>
<strong>Diante do medo:</strong> fica mais silenciosa e mais precisa. O medo dela é operacional, não paralisante.<br>
<strong>Diante de criaturas:</strong> mede. Distância, tamanho, padrão de movimento. Trata como problema balístico até deixar de ser.<br>
<strong>Diante do sobrenatural:</strong> é a que menos discute. Ela já viu antes.</p>
<h3>Função Tática</h3>
<p>Trabalha melhor emparelhada com o <strong>ASSAULT</strong>, que vira os olhos dela no chão. Com o <strong>BREACHER</strong> a combinação é forte em entrada planejada: ela marca, ele abre. Com a <strong>SPECIALIST</strong> funciona em escolta de coleta — ela cobre enquanto a Íris trabalha de costas para a porta.<br>
<strong>Ponto fraco:</strong> corredor. Sem distância ela é uma operadora mediana com um rifle de 6,9 kg.</p>
<h3>Vantagens Pulp</h3>
<p><strong>Olho de Águia</strong> — Perceber e Armas de Fogo (Rifle) nunca sofrem penalidade por distância extrema.<br>
<strong>Sombra</strong> — em terreno que teve tempo de estudar, Furtividade recebe um nível de bônus.</p>`,

    ASSAULT: `<h3>Comportamento</h3>
<p><strong>Em combate:</strong> ocupa o centro. Chama alvo por rádio antes de atirar. Move a equipe, não a si mesmo.<br>
<strong>Fora de combate:</strong> fala com todo mundo, lembra o nome dos filhos de todo mundo. É desarmante de propósito.<br>
<strong>Em equipe:</strong> é a equipe. Toma a decisão que ninguém quer tomar e carrega a culpa depois.<br>
<strong>Diante do medo:</strong> aumenta o volume da voz e diminui o tamanho das ordens. "Você. Porta. Agora."<br>
<strong>Diante de criaturas:</strong> atira e recua ordenadamente. Não tem orgulho.<br>
<strong>Diante do sobrenatural:</strong> reza. Baixinho, em português, e depois nega que rezou.</p>
<h3>Função Tática</h3>
<p>É a dobradiça. Emparelha com <strong>qualquer</strong> classe sem perda de eficiência, e é o único que consegue manter RECON e BREACHER coordenados quando o plano cai.<br>
<strong>Ponto fraco:</strong> não é excepcional em nada. Segundo melhor atirador, segundo melhor lutador, segundo melhor em tudo.</p>
<h3>Vantagens Pulp</h3>
<p><strong>Líder Nato</strong> — uma vez por cena, concede a um aliado ao alcance da voz um nível de bônus em qualquer teste.<br>
<strong>Duro na Queda</strong> — recupera 1D3 PV no início de cada cena de combate desde que não esteja Morrendo.</p>`,

    BREACHER: `<h3>Comportamento</h3>
<p><strong>Em combate:</strong> primeiro pela porta, sempre. Absorve o contato inicial e cria espaço para os outros três.<br>
<strong>Fora de combate:</strong> silencioso, educado, ocupa metade do corredor. Faz chá para a equipe.<br>
<strong>Em equipe:</strong> cumpre ordem sem discutir, exceto uma: recusa qualquer ordem que coloque outra pessoa na frente dele.<br>
<strong>Diante do medo:</strong> avança. É o mecanismo de defesa dele e não é saudável.<br>
<strong>Diante de criaturas:</strong> tenta segurar. Fisicamente. Já funcionou duas vezes.<br>
<strong>Diante do sobrenatural:</strong> não processa. Empurra para depois e depois nunca chega.</p>
<h3>Função Tática</h3>
<p>Combinação ideal com <strong>ASSAULT</strong>: ele abre e absorve, o Âncora limpa. Com a <strong>SPECIALIST</strong> é escudo humano literal — o escudo balístico cobre os dois. Com o <strong>RECON</strong> é a pior combinação: ele destrói a furtividade dela.<br>
<strong>Ponto fraco:</strong> DES 50 e Esquiva 35. Contra algo mais rápido que ele, a armadura é a única coisa entre ele e a morte.</p>
<h3>Vantagens Pulp</h3>
<p><strong>Força Descomunal</strong> — testes de FOR para arrombar, erguer ou segurar recebem um nível de bônus.<br>
<strong>Resistente à Dor</strong> — ignora a penalidade de Ferimento Grave por uma cena inteira.</p>`,

    SPECIALIST: `<h3>Comportamento</h3>
<p><strong>Em combate:</strong> atrás de todo mundo, MP7 em uma mão, terminal na outra. Atira só quando o alvo está a menos de dez metros.<br>
<strong>Fora de combate:</strong> falante, rápida, impaciente com procedimento. Anota tudo.<br>
<strong>Em equipe:</strong> é o motivo de a missão existir. Os outros três protegem o trabalho dela.<br>
<strong>Diante do medo:</strong> acelera. Fala mais rápido, mede mais coisas, se recusa a parar.<br>
<strong>Diante de criaturas:</strong> quer amostra. Sempre quer amostra. Isso já quase matou dois colegas.<br>
<strong>Diante do sobrenatural:</strong> é a única que fica genuinamente entusiasmada. Isso é mais perturbador para a equipe do que a própria anomalia.</p>
<h3>Função Tática</h3>
<p>Precisa de escolta permanente. Melhor com <strong>BREACHER</strong> colado — ele é a única armadura móvel que ela tem. Com o <strong>RECON</strong> funciona em operação de coleta silenciosa. Com o <strong>ASSAULT</strong> funciona porque o Âncora é o único que consegue dizer "não" para ela e ser obedecido.<br>
<strong>Ponto fraco:</strong> FOR 45, Esquiva 50, Briga 30. Se o perímetro cair, ela morre em duas rodadas.</p>
<h3>Vantagens Pulp</h3>
<p><strong>Mente Científica</strong> — uma vez por sessão, pode substituir um teste de perícia por Ciência (Biologia) se conseguir justificar narrativamente.<br>
<strong>Nervos de Aço</strong> — recebe um nível de bônus no primeiro teste de Sanidade de cada cena.</p>`
  };
  return t[classe] ?? "";
}

// ─────────────────────────────────────────────────────────────
// INJEÇÃO DE INVENTÁRIO — cada operador já vem com a ficha pronta:
// perícias + armas/equipamento da sua classe + itens comuns (TODOS).
// Clona os itens para que cada ator tenha cópias independentes.
// ─────────────────────────────────────────────────────────────
for (const op of OPERADORES) {
  const classe = op.flags["debaixo-da-pele"].ecorp.classe;
  const gear = EQUIPAMENTO
    .filter(i => {
      const cl = i.flags["debaixo-da-pele"].ecorp.classe;
      return cl === classe || cl === "TODOS";
    })
    .map(i => JSON.parse(JSON.stringify(i)));  // cópia profunda independente
  op.items.push(...gear);
}

const DOSSIES = [{
  name: "E CORP — Dossiês Operacionais (PROTOCOLO ÂMBAR)",
  pages: OPERADORES.map(op => pagina(op, dossieCorpo(op))),
  folder: null,
  flags: { "debaixo-da-pele": { minicampanha: "protocolo-ambar" } }
}];

// ─────────────────────────────────────────────────────────────
// ESCRITA
// ─────────────────────────────────────────────────────────────
const out = (rel, data) => {
  const p = resolve(__dir, rel);
  if (!existsSync(dirname(p))) mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
  console.log(`  ✓ ${rel} (${Array.isArray(data) ? data.length : 1} entradas)`);
};

console.log("📁 Gerando conteúdo PROTOCOLO ÂMBAR (E CORP, 2010)…");
out("templates/atores/ecorp-operadores.json", OPERADORES);
out("templates/itens/ecorp-equipamento.json", EQUIPAMENTO);
out("templates/jornais/ecorp-dossies.json", DOSSIES);
console.log("✅ Concluído.");
