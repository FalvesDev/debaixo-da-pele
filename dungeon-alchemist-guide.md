# GUIA DUNGEON ALCHEMIST — DEBAIXO DA PELE
### Construção completa do Complexo Elara Cosméticos | 6 Mapas | Cataguá/SP · Abril 2010

---

## CONFIGURAÇÕES GLOBAIS ANTES DE COMEÇAR

### Tema recomendado por mapa
| Mapa | Tema DA | Subtema |
|------|---------|---------|
| Exterior | **City / Urban** | Industrial Exterior |
| Galpão | **City / Urban** | Factory / Warehouse |
| B1 | **Dungeon** | Stone com floor tile Office |
| B2 | **Dungeon** | Stone + props Laboratory |
| B3 | **Dungeon** | Dark Stone / Sewers |
| B4 | **Cave** | Organic / Corrupted |

### Escala
- **1 tile = 5 pés (1,5m)** — padrão CoC7 / Foundry VTT
- Paredes: **1 tile de espessura** em todos os andares
- Portas: **1 tile de largura**
- Corredores: **3 tiles de largura** (mínimo 2)

### Export para Foundry VTT
```
Settings → Export
  Resolution: 140px por tile  (70px = low · 140px = standard · 200px = high)
  Format: PNG
  Grid: ON (para alinhar no Foundry)
  Size: o que for definido abaixo para cada cena
```
No Foundry ao importar:
- Grid size: 140px (se exportou 140px/tile)
- Scenes → Grid → 140

---

## MAPA 1 — EXTERIOR + GUARITA
### Tamanho: 40 × 30 tiles

```
Distribuição do espaço:
┌─────────────────────────────────────────┐
│  MATA DENSA (borda: 3 tiles todos lados)│  tiles: borda
│                                         │
│  ESTRADA (horizontal, centro-norte)     │  40×4
│  CANCELA + PAINEL                       │  4×4
│  GUARITA (noroeste)                     │  8×6
│  ESTACIONAMENTO (nordeste)              │  14×10
│  PASSARELA (guarita→cancela)            │  10×2
│  GALPÃO (sul, placeholder)              │  22×8
│  MATA SUL (entre galpão e borda)        │  tiles restantes
└─────────────────────────────────────────┘
```

### Rooms — passo a passo

**1. Mata / Terreno externo**
- Criar room: 40×30 tiles, Floor: Grass/Dirt, Wall: None
- Cobrir todo o mapa como base
- Adicionar trees (árvores densas) na borda: 3 tiles em todos os lados

**2. Estrada de acesso**
- Room: 34×4 tiles, posição Y=8, alinhada centro-horizontal
- Floor: Stone Road / Cobblestone
- Sem paredes (aberta)
- Props: tire tracks (rastros de pneu), lamp post nas laterais

**3. Guarita**
- Room: 8×6 tiles, canto noroeste (X=4, Y=10)
- Floor: Concrete / Tile
- Paredes: Metal/Concrete (estilo industrial)
- Teto: sim (espaço interno)
- **Props internos:**
  - Mesa + cadeira (NW do room)
  - Armário de aço (parede norte)
  - Walkie-talkie (em cima da mesa)
  - Lanterna (armário)
  - Pilhas AA (armário)
  - Walkie extra (gaveta)
  - Token: Marcos Heleno (posição: Y=3 do room)
- Janela: parede sul (olhando para estacionamento)
- Porta: parede leste

**4. Cancela + painel**
- Room/Tile: 4×4 tiles, posição central (X=20, Y=8)
- Props: gate/barrier (travada), painel elétrico na parede
- Monks Active Tile: código 4471
- Decorativo: spotlight apontando para a cancela

**5. Estacionamento**
- Room: 14×10 tiles, nordeste (X=22, Y=8)
- Floor: Asphalt / Concrete
- Sem teto
- **Props:**
  - Carros (3×3 filas) — usar vehicle props, portas abertas
  - Blood splatter / stain: rastro do canto sul saindo em direção ao galpão
  - Broken glass no chão

**6. Passarela (guarita → cancela)**
- Corridor: 10×2 tiles ligando guarita à cancela
- Floor: Concrete, sem paredes laterais

**7. Galpão (placeholder sul)**
- Room: 22×8, canto sul
- Floor: Concrete
- Paredes apenas norte (limite com pátio)
- Props: loading dock, ramp
- Porta: centro-norte (entrada para Cena 2)

### Iluminação Exterior
```
Global Light: ON (dia nublado)
Darkness: 0.1
Cor da luz: branco-acinzentado (#D4D4CC)
Sun angle: 45°, intensidade 0.7
Adicionar: light source laranja em cada poste (intensidade 0.3)
```

---

## MAPA 2 — GALPÃO DE PRODUÇÃO
### Tamanho: 50 × 35 tiles

```
Distribuição do espaço:
┌──────────────────────────────────────────────────────┐
│  PAREDE EXTERNA (borda: 2 tiles todos lados)          │
│                                                       │
│  ÁREA DE CARGA (noroeste)          20 × 12           │
│  VESTIMENTA ♂ (nordeste)            8 × 8            │
│  VESTIMENTA ♀ (nordeste)            8 × 8            │
│  CORREDOR TRANSVERSAL (meio)       44 × 3            │
│  LINHA DE PRODUÇÃO (centro)        36 × 6            │
│  CORREDOR SUL                      44 × 3            │
│  ALMOXARIFADO (sudoeste)           14 × 10           │
│  SALA DO GERADOR (sudeste)         10 × 10           │
│  ESCADA PARA B1 (sul-centro)        4 × 4            │
└──────────────────────────────────────────────────────┘
```

### Rooms — passo a passo

**1. Estrutura base (paredes externas)**
- Room: 50×35 tiles, Floor: Concrete industrial
- Paredes: Concrete/Brick, espessura 2
- Teto: sim (interior)
- Janelas: parede norte, posição Y=1 — 6 janelas altas quebradas (broken window props)

**2. Área de Carga (noroeste)**
- Room: 20×12, posição X=2, Y=2
- Floor: Concrete manchado
- Sem divisória sul (aberta para corredor)
- **Props:**
  - Paletes de madeira: 4 grupos (2×2) espalhados
  - Empilhadeira (canto NE, tombada/abandonada)
  - Caixas abertas (scattered)
  - Shelving unit (parede norte)
  - Loading dock (parede oeste)
  - Broken crate (perto da empilhadeira)

**3. Vestiário Masculino (nordeste)**
- Room: 8×8, posição X=26, Y=2
- **Props:**
  - Locker (3-4 armários de aço)
  - Bench (banco de vestiário)
  - Item Pile: Kit PA Básico ×1
  - Item Pile: Uniforme (flavor)
  - Broken mirror (parede)

**4. Vestiário Feminino (nordeste)**
- Room: 8×8, posição X=36, Y=2
- **Props:**
  - Locker (armários)
  - Item Pile: N95 ×2 (parede, pendurados)
  - Item Pile: N95 ×1 (gaveta)
  - Broken locker apontado

**5. Corredor Transversal (ligando norte ao centro)**
- Corridor: 44×3, posição Y=12
- Floor: Concrete
- Sem props, deixar aberto para movimento
- Lighting: 2 fluorescentes piscando (flickering light, intensity 0.5)

**6. Linha de Produção (centro)**
- Room: 36×6, posição X=7, Y=15
- Floor: Concrete sujo
- **Props:**
  - Conveyor belt (esteira industrial) — usar table/platform props se não tiver
  - 4-5 máquinas industriais em linha
  - 🔴 MÁQUINA GRANDE: posição X=24 da room — prop de machine grande
  - Oil stain (manchas de óleo) no chão
  - Spawn de inimigo: atrás da máquina grande (token Refinado Básico)
  - Broken machine parts (scattered)
  - Chain hanging from ceiling (corrente no teto)

**7. Corredor Sul**
- Corridor: 44×3, posição Y=21
- Conecta Almoxarifado ↔ Gerador ↔ Escada

**8. Almoxarifado (sudoeste)**
- Room: 14×10, posição X=2, Y=23
- Porta: trancada (Mecânica para arrombar)
- **Props:**
  - Heavy shelving (2 prateleiras grandes)
  - Crate stack (pilha de caixas)
  - **Cofre (código 0713):** safe prop, parede sul
  - Item Pile no cofre: Revólver .38 + 12 balas
  - Item Pile shelves: Corda 15m, Isqueiro ×3, Pilhas ×2

**9. Sala do Gerador (sudeste)**
- Room: 10×10, posição X=38, Y=23
- **Props:**
  - Generator (prop de gerador — grande, central)
  - Fuel can × 2 (galões de combustível)
  - Tool rack (ferramentas na parede)
  - Control panel (painel de controle lateral)
  - Pipes (tubulações nas paredes — decorativo)

**10. Escada para B1 (sul, centro)**
- Room/Tile: 4×4, posição X=23, Y=30
- Props: Staircase descendo
- Porta trancada: Lock prop com teclado numérico
- Label: "🔒 1229"

### Iluminação Galpão
```
Global Light: OFF
Darkness: 0.7
Adicionar light sources:
  - 6x janelas norte: cone de luz branco-cinza, 4 tiles, intensidade 0.4
  - Corredor central: 2x fluorescente piscando, 3 tiles, branco-esverdeado
  - Gerador: laranja, 2 tiles, intensity 0.6 (quando ligado)
  - Tudo mais: escuro
```

---

## MAPA 3 — B1 — ADMINISTRAÇÃO SUBTERRÂNEA
### Tamanho: 45 × 35 tiles

```
Distribuição do espaço:
┌────────────────────────────────────────────────────┐
│  ESCADA DO GALPÃO (norte-centro)        4 × 4      │
│  HALL DE ENTRADA B1 (norte)            40 × 6      │
│                                                    │
│  SALA RH (noroeste)                    10 × 10     │
│  COPA (norte-centro)                   10 × 10     │
│  SALA DE REUNIÕES (nordeste)           14 × 10     │
│                                                    │
│  CORREDOR CENTRAL                      40 × 3      │
│  (Espécimes Caninos patrulham aqui)                │
│                                                    │
│  BANHEIROS (sudoeste)                  10 × 8      │
│  ARQUIVO (sul-centro)                  10 × 10     │
│  SALA TI (sul)                         12 × 10     │
│                                                    │
│  ESCRITÓRIO DO DIRETOR (sul-leste)     22 × 10     │
│  ESCADA PARA B2 (canto sudeste)         4 × 4      │
└────────────────────────────────────────────────────┘
```

### Rooms — passo a passo

**1. Escada de entrada (norte)**
- Room: 4×4, posição X=20, Y=0
- Props: Staircase (subindo para galpão)
- Fluorescente acima

**2. Hall B1 (norte)**
- Room: 40×6, posição X=2, Y=4
- Floor: Office tile (azulejo comercial)
- **Props:**
  - Reception desk (balcão de recepção, centro)
  - Cadeiras tombadas (2-3 espalhadas)
  - Vaso de planta tombado
  - Vidro quebrado no chão
  - Item Pile gaveta recepção: **DOC-09**
  - Fluorescente: 3 luzes, 2 apagadas, 1 piscando

**3. Sala RH (noroeste)**
- Room: 10×10, posição X=2, Y=10
- **Props:**
  - 3x computer desk com monitor
  - Filing cabinet (2 arquivos)
  - Item Pile filing cabinet: **DOC-06** (ficha Valentina)
  - Shelving (prateleiras com pastas)

**4. Copa (norte-centro)**
- Room: 10×10, posição X=17, Y=10
- **Props:**
  - Fridge (geladeira)
  - Counter + sink (bancada)
  - Microwave
  - Table + 4 chairs
  - Item Pile fridge: Barra de Energia ×3, Garrafa de Água ×2
  - Item Pile counter: Codeína ×1
  - **NOTA:** Água da torneira = +0.1 Aurora (label/note no tile da pia)
  - Fluorescente funcional (prop de luz ligado — único nesse andar)

**5. Sala de Reuniões (nordeste)**
- Room: 14×10, posição X=29, Y=10
- **Props:**
  - Long conference table (mesa oval)
  - 6 chairs ao redor
  - Whiteboard (quadro branco) — parede norte
  - Projector screen (opcional)
  - Item Pile mesa: **DOC-01**, **DOC-02**
  - Coffee mug (xícaras abandonadas)

**6. Corredor Central**
- Corridor: 40×3, posição X=2, Y=20
- Floor: Office tile
- Lighting: escuro, 1 fluorescente apagado no centro
- **Tokens:** Espécime Canino ×2 (posição: X=15 e X=28)
- Nota: cães evitam tile da copa se luz estiver acesa

**7. Banheiros (sudoeste)**
- Room: 10×8, posição X=2, Y=25
- **Props:**
  - Stall dividers (cabines)
  - Sinks
  - **AVISO:** tile da torneira com label "⚠️ Aurora +0.1 por uso"
  - Mirror (espelho quebrado)

**8. Arquivo (sul-centro)**
- Room: 10×10, posição X=16, Y=25
- Porta: trancada (Lockpicking 50% ou chave no armário de TI)
- **Props:**
  - Filing cabinets (4 arquivos pesados)
  - Shelving com pastas
  - Poeira (dust/cobweb props)

**9. Sala TI (sul)**
- Room: 12×10, posição X=27, Y=25
- **Props:**
  - Server rack (2 racks de servidor)
  - Monitor (terminal ativo — prop com luz)
  - Computer desk
  - Item Pile: Lanterna de Cabeça
  - **Label no terminal:** "Câmeras B1+B2 ativas"

**10. Escritório do Diretor (sudeste)**
- Room: 22×10, posição X=19, Y=25 *(separado de TI por corredor)*
- Porta: trancada com chave (chave com Sérgio Dantas, PJ)
- **Props:**
  - Executive desk (escrivaninha grande)
  - Executive chair
  - Couch/sofa (sofá executivo)
  - Bookcase (estante)
  - Desk lamp
  - Safe/drawer: **Pistola 9mm PT92 + 16 balas** (gaveta inferior)
  - Item Pile desk: **DOC-03**, **DOC-07**
  - Diploma/frame na parede (flavor)

**11. Escada para B2 (canto sudeste)**
- Room: 4×4, posição X=40, Y=30
- Props: Staircase descendo
- Porta: teclado numérico (código 3391 — Voss sabe)
- Label: "🔒 3391"

### Iluminação B1
```
Global Light: OFF
Darkness: 0.85
Adicionar light sources:
  - Copa: fluorescente branco, 6 tiles, intensity 0.7 (funcional)
  - Hall recepção: 1 fluorescente piscando, 4 tiles, white-green, flickering
  - Corredor: NENHUMA luz (depende de lanternas)
  - TI: monitor glow azul, 2 tiles, intensity 0.3
  - Restante: escuridão total
```

---

## MAPA 4 — B2 — LABORATÓRIOS PRINCIPAIS
### Tamanho: 50 × 40 tiles

```
Distribuição do espaço:
┌─────────────────────────────────────────────────────┐
│  ESCADA DE B1 (norte-centro)             4 × 4      │
│  AIRLOCK (câmara descontam., norte)     12 × 5      │
│                                                     │
│  CORREDOR B2 (central horizontal)       44 × 4      │
│                                                     │
│  LAB B2-A — SÍNTESE (oeste)            22 × 16      │
│  LAB B2-B — ANÁLISE (leste)            18 × 14      │
│                                                     │
│  BANHEIRO CONTAMINADO (sul-centro)      8 × 8       │
│  SALA DE ARMAZENAMENTO 2-F (sul-leste) 16 × 12      │
│    (Safe room improvisada da Dra. Voss)             │
│  DEPÓSITO DE AMOSTRAS (sul-oeste)      12 × 10      │
│                                                     │
│  ESCADA PARA B3 (canto sudeste)         4 × 4       │
│    (biométrica — só Castilho)                       │
└─────────────────────────────────────────────────────┘
```

### Rooms — passo a passo

**1. Escada de B1 (norte)**
- Room: 4×4, posição X=23, Y=0
- Props: Staircase, handrails

**2. Airlock / Câmara de Descontaminação**
- Room: 12×5, posição X=19, Y=4
- Floor: White tile (azulejo branco)
- **Props:**
  - Shower head (4 chuveiros, estilo industrial)
  - Grate drain (ralos no chão)
  - Hook ×3 na parede com máscaras
  - Item Pile: Máscara Gás Civil ×3
  - **WARNING sign:** prop de placa amarela "USE EPI ALÉM DESTE PONTO"
  - Hazmat light (luz amarela no teto — alerta)
- Duas portas: norte (vem de B1) e sul (entra no corredor B2)

**3. Corredor B2**
- Corridor: 44×4, posição X=3, Y=9
- Floor: Tile branco (manchado)
- **Luz:** emergência vermelha — tudo neste andar tem tonalidade vermelha
- Props: overhead emergency light (luz vermelha no teto, a cada 8 tiles)

**4. Lab B2-A — Síntese (oeste, GRANDE)**
- Room: 22×16, posição X=2, Y=13
- Floor: Lab tile (azulejo de laboratório)
- **Props:**
  - 4x Lab bench (bancadas de lab — 2 fileiras centrais)
  - Broken glass/glassware (vidro estilhaçado no chão)
  - Chemical container (frascos, alguns virados)
  - Fume hood (capelas de exaustão, parede norte)
  - **Armário embutido parede leste:**
    - Item Pile: Máscara Gás Especial ×2
  - **Prateleira B (parede sul):**
    - Item Pile: ANTÍDOTO PARCIAL (flask prop especial)
  - Whiteboard parede norte: **DOC-12** (equação parcial)
  - **Tokens:** Refinado Básico ×2 (entre as bancadas)
  - **DUTO DE VENTILAÇÃO:** tile no fundo (parede sul), prop de vent/grate
    - Percepção 40% para notar
    - Label: "duto → B3/B4"
  - Spilled liquid + stain (Aurora no chão — tonalidade azul-esverdeada)
  - **Hazmat label no chão:** "☣️ +1 Aurora/hora sem máscara especial"

**5. Lab B2-B — Análise (leste)**
- Room: 18×14, posição X=30, Y=13
- Floor: Lab tile
- **Props:**
  - Microscope ×3
  - Computer (terminal ativo)
  - Test tube rack × 4
  - Centrifuge (centrífuga)
  - Sample storage (freezer de amostras)
  - Item Pile bancada: Kit PA Avançado ×2, Morfina ×3, Bandagem ×4
  - **Computer terminal:** Item Pile / DOC-04 (Relatório Aurora 2003)

**6. Banheiro Contaminado (sul, centro)**
- Room: 8×8, posição X=21, Y=29
- Floor: Tile sujo
- **Props:**
  - Sink (2 pias)
  - Stall
  - Hazmat tape no chão
  - **WARNING sign na parede:** "⛔ NÃO USAR — Aurora +0.5 por contato"
  - Green/blue stain nas paredes (composto Aurora)

**7. Sala de Armazenamento 2-F — Safe Room de Voss (sul-leste)**
- Room: 16×12, posição X=31, Y=27
- **Porta barricada por dentro** — lock prop + barricade note
- **Props:**
  - Conference table (mesa)
  - 4 chairs
  - Barricade props na porta (mesa empurrada)
  - Sleeping bag / blanket (Voss dormindo aí)
  - Documents scattered (DOC-04, DOC-05, DOC-12 no token de Voss)
  - Empty food containers (latas de comida)
  - Water bottle
  - **Token: Dra. Isabela Voss** (centro do room)
  - Whiteboard com notas (equações, setas, rabiscos desesperados)

**8. Depósito de Amostras (sul-oeste)**
- Room: 12×10, posição X=2, Y=28
- Porta: trancada (chave com Voss)
- **Props:**
  - Refrigerated storage (freezer de amostras)
  - Shelving
  - Sample boxes
  - Item Pile: Adrenalina ×2, Codeína ×2, Respirador N95 ×3

**9. Escada para B3 (sudeste)**
- Room: 4×4, posição X=45, Y=35
- Props: Staircase
- Porta biométrica: fingerprint scanner prop
- Label: "🔒 BIOMÉTRICA — Castilho"
- Nota: alternativa = duto de ventilação

### Iluminação B2
```
Global Light: OFF
Darkness: 0.9
TONS VERMELHOS em tudo (emergency lighting)

Adicionar light sources:
  - Airlock: amarelo-alaranjado, 5 tiles, intensity 0.5 (hazmat)
  - Corredor: vermelho, overhead, 4 tiles, intensity 0.4 (a cada 8 tiles)
  - Lab B2-A: vermelho + leve azul-verde no chão (Aurora), intensity 0.3
  - Lab B2-B: computador azul, 2 tiles, intensity 0.4
  - Sala Voss: NENHUMA — escura, apenas luz que vem pelo corredor
  - Airlock: adicionar particle effect (névoa leve) se usar FXMaster
```

---

## MAPA 5 — B3 — ALTA SEGURANÇA
### Tamanho: 45 × 40 tiles

```
Distribuição do espaço:
┌──────────────────────────────────────────────────┐
│  ENTRADA (escada biométrica + duto, norte)        │
│                                                  │
│  CORREDOR PRINCIPAL B3 (horizontal, norte)       │
│    40 × 4 tiles — patrulha de Castilho           │
│                                                  │
│  QUARTO 3-A (noroeste)          10 × 10          │
│  QUARTO 3-B (norte-centro)      10 × 10          │
│  QUARTO 3-C — VALENTINA (norte-leste) 10 × 10    │
│  ARMARIA (nordeste)             10 × 10          │
│                                                  │
│  CORREDOR SUL (horizontal, centro)               │
│    40 × 3 tiles — conecta quartos ao lab         │
│                                                  │
│  LAB 3 — PROCESSAMENTO (sul, GRANDE)             │
│    40 × 16 tiles — Patrícia aqui                 │
│                                                  │
│  ESCADA PARA B4 (canto sudeste)  4 × 4           │
└──────────────────────────────────────────────────┘
```

### Rooms — passo a passo

**1. Entrada (norte)**
- Room: 6×4, posição X=20, Y=0
- Props: Staircase (vem de B2 biométrica), grate de ventilação no teto (duto)
- **AVISO:** ESCURIDÃO TOTAL — nenhuma luz neste andar além de lanternas

**2. Corredor Principal B3**
- Corridor: 40×4, posição X=2, Y=4
- Floor: Dark concrete / Stone
- NENHUMA LUZ (escuridão total)
- **Tokens:**
  - Dr. Castilho (posição X=20 — patrulha leste-oeste)
  - Refinado Básico ×3 (escolta, ao redor de Castilho)
  - DICA: configurar patrol route para Castilho

**3. Quarto 3-A (noroeste — vazio)**
- Room: 10×10, posição X=2, Y=8
- Floor: Concrete sujo
- **Props:**
  - Single bed (cama, poeira/cobweb)
  - Cobwebs nas paredes
  - Broken chair
  - Dust motes (partículas de poeira)
  - VAZIO — sem itens

**4. Quarto 3-B (norte-centro)**
- Room: 10×10, posição X=14, Y=8
- Floor: Concrete
- **Props:**
  - Destroyed desk (mesa destruída)
  - Overturned bookcase
  - Scattered papers (papéis espalhados)
  - Blood stain no chão
  - Item Pile: Corda 10m (debaixo da cama destruída)
  - Item Pile: **DOC-08** (diário Castilho, atrás da estante virada)

**5. Quarto 3-C — VALENTINA (norte-leste)**
- Room: 10×10, posição X=26, Y=8
- Porta: barricaded (barricada por dentro — mesas empurradas)
- **Props:**
  - Barricade na porta (furniture pushed against door)
  - Sleeping area (colchonete no chão, cobertor)
  - Ration/food (restos de comida)
  - Empty bottles
  - Scratch marks nas paredes (arranhões)
  - **Token: Valentina Costa** (centro, agachada)
  - Label na porta: "bater 3× para resposta"

**6. Armaria (nordeste)**
- Room: 10×10, posição X=34, Y=8
- Porta: trancada (chave no cinto de Castilho)
- **Props:**
  - Weapon rack (suporte de armas)
  - Ammo crate
  - Locker de equipamento
  - Item Pile: Espingarda 12 pump + 18 cartuchos
  - Item Pile: Colete antibalístico (Armor — reduz 2 de dano físico)
  - Item Pile: Kit PA Avançado ×3
  - Item Pile: Bandagem Hemostática ×6
  - Item Pile: Máscara Gás Especial ×4

**7. Corredor Sul**
- Corridor: 40×3, posição X=2, Y=18
- Conecta quartos ao Lab 3
- NENHUMA LUZ

**8. Lab 3 — Processamento (sul, GRANDE)**
- Room: 40×16, posição X=2, Y=21
- Floor: Dark industrial tile (manchado, Aurora)
- ☣️ **+2 Aurora/hora** — Aurora level mais alto
- **Props:**
  - Industrial tanks (6 tanques grandes selados — Aurora pura dentro)
  - Pipe network (tubulações nas paredes e teto)
  - Industrial bench (bancadas pesadas)
  - Containment pods (pods de contenção, alguns abertos)
  - Cracked floor (chão rachado)
  - **Aurora stain no chão:** azul-esverdeado cobrindo 40% do lab
  - **Token: REFINADO PESADO "PATRÍCIA"** (centro do lab)
  - Item Pile armário embutido: Adrenalina ×4 (atrás de Patrícia)
  - Item Pile mesa: **DOC-10** (manual seção 14 — código 880417)
  - Item Pile caixa: **DOC-13** (requisição Dremel — pista B4)
  - Broken equipment (destroços de equipamento)
  - Body on floor (corpo de segurança, flavor)

**9. Escada para B4 (sudeste)**
- Room: 4×4, posição X=40, Y=36
- Props: Staircase descendo
- Porta numérica: keypad prop
- Label: "🔒 880417 (DOC-10 seção 14.7)"

### Iluminação B3
```
Global Light: OFF
Darkness: 1.0 (MÁXIMO — escuridão absoluta)

NENHUMA luz ambiente.
Apenas:
  - Lab 3: aurora glow azul-verde, intensity 0.2, range 3 tiles
    (emana dos tanques de composto)
  - Castilho: light source em seu token (lanterna táctica, cone branco)
  - FXMaster: partículas de névoa azul flutuando no Lab 3

Players DEPENDEM das lanternas deles para ver qualquer coisa.
```

---

## MAPA 6 — B4 — CONTENÇÃO (CLÍMAX)
### Tamanho: 35 × 30 tiles

```
Distribuição do espaço:
┌────────────────────────────────────────┐
│  ENTRADA (escada B3 + duto, norte)     │
│                                        │
│  CÂMARA DE ENTRADA (norte)  30 × 10   │
│    Refinados dormentes nas paredes     │
│                                        │
│  CÂMARA DE CONTENÇÃO (centro) 22 × 12 │
│    Aurora-0 aqui                       │
│                                        │
│  SALA DE CONTROLE (sul)     18 × 8    │
│    Painel Override, saída emergência   │
└────────────────────────────────────────┘
```

### Rooms — passo a passo

**1. Entrada (norte)**
- Room: 6×4, posição X=14, Y=0
- Props: Staircase (vem de B3), grate no teto (duto de ventilação)
- Nota: "ponto sem retorno fácil"

**2. Câmara de Entrada B4**
- Room: 30×10, posição X=2, Y=4
- Floor: Organic/corroded tile (ou usar Cave theme aqui)
- **AMBIENTE:** bioluminescência azul-verde NAS PAREDES
- **Props:**
  - Organic growth / fungus nas paredes (cobrindo 30% da superfície)
  - Tendril props (tentáculos orgânicos — usar vine/root props)
  - Slime pool no chão
  - Cracked walls (paredes rachadas com Aurora vazando)
  - **Refinados FUNDIDOS às paredes (dormentes):**
    - 4 tokens: Refinado Básico, estado "sleeping"
    - Posição: 2 na parede norte, 2 na parede sul
    - Props de organic growth ao redor deles (fundindo com a parede)
    - Acordam com LUZ (lanterna perto) ou BARULHO
  - **DOC-11** pregado na parede: note/parchment prop
  - Aurora puddle (poças no chão — brilhante)

**3. Câmara de Contenção Principal (CENTRO)**
- Room: 22×12, posição X=6, Y=14
- Floor: Organic / cracked stone
- **Esta é a cena mais visualmente importante do módulo**
- **Props:**
  - **AURORA-0 (central):** token grande, centralizado
    - Usar prop de creature/boss no centro
    - 6 pipes / tubes conectados ao corpo saindo em direção às paredes
    - Light source própria no token: azul-branco pulsante (intensity 0.8)
  - **6 Tubos destrutíveis** (ao redor do Aurora-0):
    - Props de pipe/tube, 1 tile cada, espalhados em arco
    - Cada destruído: remove 1 "fonte de vida" do Aurora-0
    - Liquid flowing animation (FXMaster) em cada tubo
  - Containment walls (paredes internas com vidro reforçado)
  - Organic growth cobrindo 60% das paredes
  - Bioluminescence (props de glowing mushroom/crystal distribuídos)
  - Blood stain + Aurora stain no chão
  - Broken equipment (experimentos abandonados nos cantos)
  - Body remnants (restos de sujeitos anteriores nos cantos)

**4. Sala de Controle (sul)**
- Room: 18×8, posição X=8, Y=26
- Floor: Industrial tile (único espaço "técnico" do B4)
- **Props:**
  - Control panel (painel grande, parede norte — olhando para contenção)
  - Monitor bank (4-6 monitores com feeds de câmera)
  - Computer terminal (para acessar arquivos completos do Aurora)
  - **PAINEL DO OVERRIDE:** large console prop
    - Label: "472391 → Override → abre saída de emergência"
  - Filing cabinet (arquivos finais — provas do projeto)
  - **SAÍDA DE EMERGÊNCIA:** door prop na parede sul
    - Lacrada: lock prop + barricade
    - Arrombar: pé de cabra + 3D6 rodadas de barulho
    - OU: Override ativo → abre automaticamente
    - **Esta porta leva para o exterior (final da campanha)**

### Iluminação B4
```
Global Light: OFF
Darkness: 1.0

Substituir toda iluminação por:
  - BIOLUMINESCÊNCIA:
    Distributed point lights azul-verde (#3AE5A0), range 2-3 tiles, intensity 0.4
    Posicionar em cada prop de organic growth

  - AURORA-0 token: pulsing light source
    Cor: #60B8FF (azul puro), range 6 tiles, intensity 0.7-1.0 pulsante
    Se usar Torch: set dim light = 6, bright light = 3

  - Sala de Controle: único espaço com luz técnica (branco frio, telas)

  - FXMaster effects RECOMENDADOS:
    - Underwater distortion (B4 inteiro — efeito de deformação visual)
    - Blue particles floating (câmara de contenção)
    - Fog/mist baixo (câmara de entrada)
```

---

## CONFIGURAÇÕES DE EXPORT PARA FOUNDRY VTT

### Exportar cada mapa
```
No Dungeon Alchemist:
  File → Export

  Quality: 140 pixels per tile (recomendado)
    → Mapa 1 (40×30): imagem 5600×4200 px
    → Mapa 2 (50×35): imagem 7000×4900 px
    → Mapa 3 (45×35): imagem 6300×4900 px
    → Mapa 4 (50×40): imagem 7000×5600 px
    → Mapa 5 (45×40): imagem 6300×5600 px
    → Mapa 6 (35×30): imagem 4900×4200 px

  Format: PNG
  Include Grid: OFF (Foundry tem o próprio grid)
  Export as flat top-down view: ON
```

### Importar no Foundry VTT
```
1. Scene Settings → Background Image → escolher o PNG exportado
2. Grid:
   Type: Square
   Size: 140 (pixels por tile — deve bater com export)
3. Lighting:
   Global Illumination: OFF
   Darkness Level: (conforme tabela abaixo)
4. Vision:
   Token Vision: ON
   Fog of War: ON
```

| Cena | Darkness | Global Light |
|------|----------|-------------|
| Exterior | 0.1 | ON |
| Galpão | 0.7 | OFF |
| B1 | 0.85 | OFF |
| B2 | 0.9 | OFF |
| B3 | 1.0 | OFF |
| B4 | 1.0 | OFF |

---

## TIPS DE ATMOSFERA — DETALHES QUE FAZEM DIFERENÇA

### Props que elevam o horror
| Efeito | Onde usar | Como |
|--------|-----------|------|
| Blood trail (rastro de sangue) | Galpão → estacionamento | Stain props em linha |
| Scratch marks nas paredes | Quartos B3, corredor B3 | Prop de arranhão |
| Broken glass scattered | Lab B2-A, galpão | Debris props |
| Abandoned food/coffee | B1 copa, recepção | Xícaras, latas abandonadas |
| Papers on floor | B1 corredor, RH | Scattered paper props |
| Flickering light | B1 (maioria das lâmpadas) | Light source com animation |
| Cobwebs | B3 quartos, B1 arquivo | Cobweb prop nos cantos |
| Overturned furniture | B1 recepção, quarto 3-B | Flip props |
| Emergency light (vermelho) | B2 todo | Overhead light vermelha |
| Organic growth | B4 | Vine/mushroom/fungal props |
| Pipes on wall | B3 lab, B4 | Pipe props (decorativos) |
| Warning signs | B2 airlock, B3 lab | Sign prop + texto |

### Portas e acessos — configuração visual
| Porta | Visual sugerido | Lock state |
|-------|----------------|------------|
| Galpão → B1 (1229) | Metal door + keypad | Locked |
| B1 → B2 (3391) | Reinforced metal | Locked |
| B2 → B3 (biométrica) | High-tech scanner | Locked (secret) |
| B3 → B4 (880417) | Heavy blast door | Locked |
| Sala Voss 2-F (por dentro) | Door barred | Locked — interior |
| Quarto Valentina | Door barricaded | Locked — interior |
| Armaria B3 | Metal door, keychain | Locked |
| Saída emergência B4 | Reinforced + welded | Sealed |

### Sequência de construção recomendada
```
1. Criar todos os 6 mapas em projetos separados no DA
   (não em um só mapa — ficaria enorme e pesado)

2. Ordem de construção por prioridade narrativa:
   PRIORIDADE 1: B3 e B4 (clímax — mais tempo de tela)
   PRIORIDADE 2: B2 (segunda mais importante — Voss)
   PRIORIDADE 3: Galpão (entrada dos PJs)
   PRIORIDADE 4: B1 (documentos)
   PRIORIDADE 5: Exterior (simples, menos tempo)

3. Exportar com o MESMO pixel-per-tile em TODOS os mapas
   Isso garante que tokens e reguas sejam consistentes entre cenas

4. Importar todos no Foundry antes da sessão zero
   Testar visão de token em cada cena
```

---

## RESUMO DE DIMENSÕES — COLINHA RÁPIDA

| Mapa | Tamanho | Rooms principais |
|------|---------|-----------------|
| Exterior | 40×30 | Guarita 8×6 · Estac. 14×10 · Estrada 34×4 |
| Galpão | 50×35 | Carga 20×12 · Prod. 36×6 · Almox. 14×10 · Gerador 10×10 |
| B1 | 45×35 | Hall 40×6 · Copa 10×10 · Reuniões 14×10 · Dir. 22×10 |
| B2 | 50×40 | Lab A 22×16 · Lab B 18×14 · Conferências 16×12 |
| B3 | 45×40 | Corredor 40×4 · Quartos 10×10 × 4 · Lab 3 40×16 |
| B4 | 35×30 | Entrada 30×10 · Contenção 22×12 · Controle 18×8 |

---

*Dungeon Alchemist Build Guide — Complexo Elara Cosméticos · Debaixo da Pele · v1.0*
