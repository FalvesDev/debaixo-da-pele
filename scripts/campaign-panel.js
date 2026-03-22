// ============================================================
// CAMPAIGN PANEL — Painel de Campanha por Capítulo
// Debaixo da Pele | Foundry VTT v11/v12
// ============================================================

const MODULE_ID = "debaixo-da-pele";

// ─── Dados estáticos da campanha ────────────────────────────
const CAPITULOS = [
  {
    num: 1, andar: "B1", ato: 1,
    titulo: "A Chegada",
    subtitulo: "Complexo AURORA — Nível de Recepção",
    cor: "#4488cc",
    descricao: "Os investigadores chegam ao Complexo AURORA. As instalações parecem normais, mas algo está errado. Marcos os aguarda na recepção.",
    locais: [
      { cod: "B1-G01", nome: "Garagem", desc: "2 viaturas, portão elétrico bloqueado" },
      { cod: "B1-R01", nome: "Recepção", desc: "Secretária desaparecida, câmeras ligadas" },
      { cod: "B1-S01", nome: "Posto de Segurança", desc: "PUZZLE-01: Manual Seção 14.6 (código 472)" },
      { cod: "B1-B01", nome: "Sala de Briefing", desc: "Documentos confidenciais, mapa parcial" },
      { cod: "B1-D01", nome: "Depósito", desc: "Kits de PA, lanternas, pilhas" },
      { cod: "B1-E01", nome: "Elevador / Escadas", desc: "Acesso bloqueado para B2+" }
    ],
    npcs: ["Marcos Ramos (aliado)", "Segurança morta"],
    objetivos: [
      "Encontrar Marcos Ramos",
      "Recuperar Manual Seção 14.6 (código 472___)",
      "Destravar acesso ao B2",
      "Coletar equipamentos básicos"
    ],
    puzzles: ["01 — Código de Override (primeira parte: 472)"],
    perigos: ["Câmeras de segurança ativas", "Portão da garagem bloqueado"]
  },
  {
    num: 2, andar: "B2", ato: 2,
    titulo: "O Laboratório",
    subtitulo: "Complexo AURORA — Nível de Pesquisa",
    cor: "#cc8800",
    descricao: "Os laboratórios de pesquisa. O ar tem um odor metálico faint. Primeiros sinais do Composto Aurora. Máscaras tornam-se essenciais.",
    locais: [
      { cod: "B2-L01", nome: "Laboratório Alfa", desc: "Amostras Aurora, microscópios, resultados parciais" },
      { cod: "B2-L02", nome: "Laboratório Beta", desc: "Câmera de isolamento, espécimes em frascos" },
      { cod: "B2-M01", nome: "Enfermaria", desc: "Medicamentos, Kit PA Avançado, bandagens" },
      { cod: "B2-A01", nome: "Armário de Segurança B2", desc: "CÓDIGO 1987 — Escopeta 12 Pump" },
      { cod: "B2-S01", nome: "Sala de Controle", desc: "Monitores, logs de exposição, PUZZLE-02" },
      { cod: "B2-C01", nome: "Câmara de Descontaminação", desc: "Obrigatório para passar ao B3" }
    ],
    npcs: ["Técnicos infectados (passivos)", "Refinado Básico (patrulha)"],
    objetivos: [
      "Atravessar câmara de descontaminação",
      "Recuperar logs de exposição",
      "Encontrar armário B2 (código 1987)",
      "PUZZLE-02: Liberar acesso ao B3"
    ],
    puzzles: ["02 — Acesso ao B3 (câmara de descontaminação)"],
    perigos: ["Aurora +0.5/hora sem máscara", "Refinado Básico em patrulha", "Câmeras ainda ativas"]
  },
  {
    num: 3, andar: "B3", ato: 2,
    titulo: "O Composto",
    subtitulo: "Complexo AURORA — Centro de Pesquisa Avançada",
    cor: "#aa4400",
    descricao: "O coração da pesquisa Aurora. O Laboratório da Dra. Voss. Aqui a contaminação é severa. A verdade sobre o Projeto RE começa a emergir.",
    locais: [
      { cod: "B3-V01", nome: "Laboratório de Voss", desc: "Seringa de Voss, notas pessoais, servidor principal" },
      { cod: "B3-S01", nome: "Servidor de Dados", desc: "PUZZLE-03: Senha do servidor (encontrada nas notas de Voss)" },
      { cod: "B3-C01", nome: "Câmara de Síntese", desc: "Destilador de Aurora, tanques pressurizados" },
      { cod: "B3-A01", nome: "Arquivo Confidencial", desc: "Documentos RE, história do Composto, arquivos deletados" },
      { cod: "B3-E01", nome: "Sala de Encontro Voss", desc: "Dra. Voss encontrada aqui (aliada ou antagonista)" },
      { cod: "B3-T01", nome: "Túnel de Serviço", desc: "Rota alternativa para B4, risco de colapso" }
    ],
    npcs: ["Dra. Voss (pivô narrativo)", "Valentina (se sobreviveu)", "Refinado Pesado"],
    objetivos: [
      "Localizar Dra. Voss",
      "PUZZLE-03: Acessar servidor de dados",
      "Recuperar arquivos do Projeto RE",
      "Decidir sobre Voss (aliada ou antagonista)"
    ],
    puzzles: ["03 — Servidor de Voss (senha nas notas pessoais)"],
    perigos: ["Aurora +1.0/hora", "Refinado Pesado — patruha agressiva", "Colapso estrutural possível"]
  },
  {
    num: 4, andar: "B4", ato: 3,
    titulo: "A Câmara",
    subtitulo: "Complexo AURORA — Contenção e Confronto",
    cor: "#882200",
    descricao: "O nível de contenção. Os Refinados são abundantes. O Diretor opera a partir daqui. O override de emergência pode ser ativado.",
    locais: [
      { cod: "B4-K01", nome: "Câmara de Contenção Principal", desc: "PUZZLE-04: Desligar sistema de contenção" },
      { cod: "B4-O01", nome: "Sala de Override", desc: "Terminal de emergência, código completo 472-___" },
      { cod: "B4-D01", nome: "Gabinete do Diretor", desc: "O Diretor opera aqui, segunda parte do código" },
      { cod: "B4-G01", nome: "Gerador de Emergência", desc: "PUZZLE-06: Ativar gerador para abrir saídas" },
      { cod: "B4-C01", nome: "Centro de Comunicações", desc: "PUZZLE-05: Antena para contato externo" },
      { cod: "B4-H01", nome: "Hangar Interno", desc: "Veículo blindado, alternativa de fuga" }
    ],
    npcs: ["O Diretor (antagonista principal)", "Espécime Canino", "Refinado Pesado (múltiplos)"],
    objetivos: [
      "PUZZLE-04: Neutralizar câmara de contenção",
      "PUZZLE-05: Estabelecer comunicação externa",
      "PUZZLE-06: Ativar gerador de emergência",
      "Confrontar O Diretor e obter código completo"
    ],
    puzzles: ["04 — Câmara de Contenção", "05 — Comunicação Externa", "06 — Gerador Emergência"],
    perigos: ["Aurora +1.5/hora", "O Diretor — combate ou negociação", "Múltiplos Refinados", "Espécime Canino"]
  },
  {
    num: 5, andar: "B5", ato: 4,
    titulo: "O Núcleo — Fuga ou Condenação",
    subtitulo: "Complexo AURORA — Nível Profundo",
    cor: "#550000",
    descricao: "O nível mais profundo. A fonte original do Aurora. A fuga é agora. Cada escolha tem consequências permanentes para os investigadores.",
    locais: [
      { cod: "B5-N01", nome: "Câmara do Núcleo", desc: "Fonte do Aurora Concentrado — exposição máxima" },
      { cod: "B5-F01", nome: "Sala de Fernando Alencar", desc: "PUZZLE-07: Dremel, plano de fuga B, notas de escape" },
      { cod: "B5-S01", nome: "Saída de Emergência Sul", desc: "Requer override ativo (código 472-___)" },
      { cod: "B5-T01", nome: "Túnel de Evacuação", desc: "Saída alternativa, parcialmente inundada" },
      { cod: "B5-R01", nome: "Reator de Contenção", desc: "Pode ser sabotado para destruir o complexo" },
      { cod: "B5-E01", nome: "Câmara de Escape AURORA-0", desc: "O espécime original — encontro final possível" }
    ],
    npcs: ["AURORA-0 (espécime original)", "O Diretor (se sobreviveu)", "Voss (se aliada)"],
    objetivos: [
      "PUZZLE-07: Plano de Fuga B (Dremel de Fernando)",
      "Ativar override com código completo",
      "Escolha: destruir complexo ou escapar silenciosamente",
      "Desfecho de cada personagem"
    ],
    puzzles: ["07 — Plano de Fuga B (Dremel)"],
    perigos: ["Aurora +2.0/hora", "AURORA-0", "Sem retorno após escolha final"]
  }
];

// ─── Application ────────────────────────────────────────────
class DDPCampaignPanel extends Application {
  constructor(options = {}) {
    super(options);
    this._capAtivo = 1;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id:        "ddp-campaign-panel",
      title:     "📖 Campanha — Debaixo da Pele",
      template:  "modules/debaixo-da-pele/templates/campaign-panel.html",
      classes:   ["ddp-campaign-panel"],
      popOut:    true,
      width:     560,
      height:    650,
      resizable: true
    });
  }

  getData() {
    const aventuraAndar = game.settings.get(MODULE_ID, "aventuraAndar");
    const aventuraAto   = game.settings.get(MODULE_ID, "aventuraAto");
    const puzzles       = JSON.parse(game.settings.get(MODULE_ID, "puzzlesConcluidos") || "[]");

    const capitulos = CAPITULOS.map(c => ({
      ...c,
      ativo: c.num === this._capAtivo,
      andارAtual: c.andar === aventuraAndar,
      puzzlesConcluidos: c.puzzles.filter((_p, i) => {
        // Mapeia puzzle do capítulo ao índice global
        const offset = CAPITULOS.slice(0, c.num - 1).reduce((s, cc) => s + cc.puzzles.length, 0);
        return puzzles.includes(offset + i + 1);
      }).length,
      totalPuzzles: c.puzzles.length
    }));

    const capAtivo = capitulos.find(c => c.num === this._capAtivo) ?? capitulos[0];

    return { capitulos, capAtivo, aventuraAndar, aventuraAto };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".ddp-cp-tab").on("click", (e) => {
      this._capAtivo = parseInt(e.currentTarget.dataset.cap);
      this.render(false);
    });
  }
}

// ─── Singleton ───────────────────────────────────────────────
let _campaignPanel = null;

export function abrirPainelCampanha() {
  if (!_campaignPanel) _campaignPanel = new DDPCampaignPanel();
  _campaignPanel.render(true);
}

// ─── Botão na barra de cena ──────────────────────────────────
Hooks.on("getSceneControlButtons", (controls) => {
  if (!game.user.isGM) return;
  const tokenControls = controls.find(c => c.name === "token");
  if (!tokenControls) return;
  tokenControls.tools.push({
    name:    "ddp-campaign-panel",
    title:   "Campanha — Debaixo da Pele",
    icon:    "fas fa-book-open",
    visible: game.user.isGM,
    onClick: () => abrirPainelCampanha(),
    button:  true
  });
});
