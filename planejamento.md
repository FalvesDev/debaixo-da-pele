# FOUNDRY VTT — Debaixo da Pele
### Guia Técnico de Implementação — Call of Cthulhu 7e

> **Sistema:** CoC7 (pacote oficial)
> **Foundry alvo:** v11 / v12
> **Módulo:** `debaixo-da-pele` (pasta deste repositório)
> **Ambientação:** Survival horror corporativo — Brasil, 2010

---

## ÍNDICE RÁPIDO

| Seção | Conteúdo |
|---|---|
| [1. Setup](#1-setup-inicial) | Instalação, mundo, módulo |
| [2. Módulos](#2-módulos-para-instalar) | Dependências recomendadas |
| [3. Cenas](#3-cenas--estrutura-por-mapa) | 6 andares, configurações |
| [4. Atores](#4-atores) | PJs, NPCs, Inimigos |
| [5. Itens](#5-itens--compêndio) | Armas, equipamentos, slots |
| [6. Macros](#6-macros) | 6 macros prontas |
| [7. Journals](#7-journals--documentos-in-game) | 13 documentos |
| [8. Áudio](#8-playlists-de-áudio) | Playlists e SFX |
| [9. Referência](#9-referência-rápida) | Console, flags, dicas |

---

## 1. SETUP INICIAL

### 1.1 — Instalar o módulo deste repositório

```
1. Copiar a pasta "debaixo-da-pele" para:
   [Foundry Data]/modules/debaixo-da-pele/

2. No Foundry: Settings → Manage Modules → ativar "Debaixo da Pele"
```

### 1.2 — Instalar o sistema CoC7

```
Foundry → Game Systems → Search: "Call of Cthulhu"
→ Instalar: "Call of Cthulhu 7th Ed." (id: CoC7)
```

### 1.3 — Criar o mundo

```
Nome:        Debaixo da Pele
Sistema:     CoC7
Descrição:   Survival horror corporativo — Brasil, 2010
             Lockdown em instalação farmacêutica de pesquisa secreta.
```

### 1.4 — Estrutura de compêndios a criar no Foundry

```
/Atores
  ├── PJs (5 fichas)
  ├── NPCs
  └── Inimigos (Refinados)

/Itens
  ├── Armas
  └── Equipamentos

/Cenas
  ├── Exterior — Guarita
  ├── Solo — Galpão
  ├── B1 — Administração
  ├── B2 — Laboratórios
  ├── B3 — Alta Segurança
  └── B4 — Contenção

/Journals
  └── Documentos In-Game (DOC-01 a DOC-13)

/Playlists
  └── Debaixo da Pele — Áudio

/Macros
  └── (importar da pasta /macros deste repositório)
```

---

## 2. MÓDULOS PARA INSTALAR

### Essenciais
| Módulo | Função |
|---|---|
| `dice-so-nice` | Dados 3D animados |
| `monks-little-details` | Automações de combate e UI |
| `simple-calendar` | Rastrear dias/horas do lockdown |
| `item-piles` | Baús e mochilas físicas nas cenas |

### Atmosfera
| Módulo | Função |
|---|---|
| `fxmaster` | Névoa, luz, efeitos visuais |
| `monks-sound-enhancements` | Áudio ambiente por cena |
| `ambient-doors` | Sons ao abrir/fechar portas |

### Utilidade GM
| Módulo | Função |
|---|---|
| `monks-active-tile-triggers` | Tiles com código de acesso (portas) |
| `combat-utility-belt` | Condições automáticas em combate |
| `token-action-hud` | HUD rápida no token |
| `argon-combat-hud` | HUD de combate com slots de acesso rápido |

---

## 3. CENAS — ESTRUTURA POR MAPA

### Configurações padrão (todas as cenas subterrâneas)

```js
{
  globalLight: false,          // escuridão total
  globalLightThreshold: 0,
  darkness: 1,                 // máximo de escuridão
  tokenVision: true,           // visão por token
  fogExploration: true,        // névoa de guerra
  fogOverlay: "",              // pode adicionar textura
  gridAlpha: 0.3               // grid sutil
}
```

### Lista de cenas

| Cena | Andar | Notas especiais |
|---|---|---|
| Exterior — Guarita e Estrada | Solo | Luz natural, visão normal |
| Galpão de Produção | Solo | Meia-luz, entrada dos PJs |
| B1 — Administração Subterrânea | −1 | Primeiro código: 1229 |
| B2 — Laboratórios Principais | −2 | Safe room da Voss. Código: 3391 |
| B3 — Alta Segurança | −3 | Castilho patrulha aqui. Refinados pesados |
| B4 — Contenção | −4 | Clímax da campanha. Sem retorno fácil |

### Porta com código — Monks Active Tile Triggers

```
Porta B1 (código 1-2-2-9):
  Trigger: Players clicam no tile da porta
  Ação:    Dialog → input numérico

  Condição TRUE  (input === "1229"):
    → porta.locked = false
    → Reproduzir: "SFX — Porta Abrindo"
    → Animação: porta abre

  Condição FALSE:
    → Reproduzir: "SFX — Erro de Código"
    → ChatMessage: "⛔ Acesso negado."
```

---

## 4. ATORES

> Os JSONs completos estão em `/templates/atores/`
> Importe via: Compêndio → Importar JSON

### PJs — 5 fichas CoC7

| Nome | Ocupação | STR | INT | EDU | SAN | HP |
|---|---|---|---|---|---|---|
| Antônio Figueiredo | Engenheiro de Segurança | 65 | 75 | 80 | 65 | 13 |
| Carolina Melo | Médica | 45 | 85 | 90 | 70 | 12 |
| Sérgio Dantas | Gerente de Operações | 70 | 70 | 70 | 55 | 14 |
| Beatriz Fontes | Advogada Corporativa | 40 | 90 | 95 | 75 | 11 |
| Tiago Araújo | Fotógrafo | 55 | 75 | 65 | 65 | 12 |

### NPCs

| Nome | Tipo | Localização |
|---|---|---|
| Marcos Heleno | Aliado | Guarita / Galpão |
| Dra. Isabela Voss | Aliada | B2 — sala-forte |
| Valentina Costa | Ambígua | B3 — quarto 3-C |
| Dr. Castilho | Antagonista | B3 — patrulha |

### Inimigos — Stats completos

#### Refinado Básico
```
STR:80 CON:70 SIZ:65 DEX:50 INT:20 POW:30 APP:5
HP: 14 | MP: 6 | Armadura: 2 (tecido endurecido)

Perícias: Briga 60% | Esquivar 25% | Furtividade 45%
          Ouvir 70% | Rastrear 50%

Ataques:
  Garras  → 1D6+1D4 (toque)
  Mordida → 1D4+1D4 (toque) | Especial: 20% chance +3 Aurora

SAN: 1D6 (1º encontro) / 1D3 (posteriores)
```

#### Refinado Pesado ("Patrícia")
```
STR:100 CON:90 SIZ:80 DEX:30 INT:10 POW:25
HP: 18 | Armadura: 4

Ataques:
  Impacto (Maça Óssea) → 2D6+1D6 | Knockback automático (SIZ ≤70)
  Arremesso            → 1D6     | Alcance 5m

SAN: 1D8 (1º encontro) / 1D4 (posteriores)
Especial: Imune a intimidação. Derruba portas sem teste.
```

#### Espécime Canino
```
STR:60 CON:50 SIZ:40 DEX:75 INT:15 POW:20
HP: 9 | Sem armadura

Perícias: Esquivar 60% | Furtividade 65% | Farejar 95% | Rastrear 80%

Ataque: Mordida → 1D6+1D4 | Especial: 20% chance +3 Aurora

SAN: 1D4 (1º encontro)
```

---

## 5. ITENS — COMPÊNDIO

> JSONs completos em `/templates/itens/`

### Sistema de Slots

O sistema de inventário usa **slots** como unidade de peso/espaço.

| Tamanho | Slots | Exemplos |
|---|---|---|
| Micro | 0,5 | Morfina, isqueiro, pilhas |
| Pequeno | 1 | Canivete, documento, faca |
| Médio | 2 | Lanterna, walkie-talkie, kit PA básico |
| Grande | 3 | Revólver, kit PA avançado, corda 10m |
| Muito Grande | 4–6 | Espingarda, corda 15m |

**Capacidades:**

| Contêiner | Slots |
|---|---|
| Bolsos / Cinto | 7 (configurável) |
| Bolsa de Campo | 8 |
| Mochila 20L | 12 |
| Mochila 30L | 16 |
| Mochila Tática | 20 |

**Penalidade de sobrecarga:** −5% em perícias físicas por slot excedente.

Itens equipados (lanterna de cabeça, máscara de gás) **não contam slots** quando vestidos.

### Armas

| Item | Dano | Alcance | Malfunction | Slots |
|---|---|---|---|---|
| Revólver .38 Taurus | 1D10 | 15m | 100 | 3 |
| Pistola 9mm PT92 | 1D10 | 15m | 100 | 3 |
| Espingarda 12 pump | 4D6 | 10m | 99 | 6 |
| Faca tática | 1D6 | cc | 100 | 2 |
| Pé de cabra | 1D6+2 | cc | 100 | 3 |

### Equipamentos

| Item | Usos | Slots | Notas |
|---|---|---|---|
| Kit PA Básico | 3 | 2 | Cura 1D3 HP |
| Kit PA Avançado | 5 | 3 | Cura 1D6 HP |
| Lanterna LED | — | 2 | Ocupa 1 mão |
| Lanterna de cabeça | — | 2 | 0 slots quando equipada |
| Máscara gás civil | — | 2 | Aurora −50%; 0 slots equipada |
| Máscara gás especial | — | 2 | Aurora 0%; 0 slots equipada |
| Morfina (seringa) | 1 | 0,5 | Elimina penalidade de dor |
| Corda 15m | — | 3 | Resistência 300kg |
| Walkie-talkie | — | 2 | Alcance ~500m (interno) |
| Pilhas AA (4x) | — | 0,5 | 8h de lanterna |

---

## 6. MACROS

> Código-fonte em `/macros/` — copiar conteúdo e colar em Foundry > Macros > Create

### Macro 1 — Teste de Sanidade (`01-san-check.js`)
- Eventos pré-definidos da campanha (selecionáveis)
- Custo de falha **e** de sucesso configuráveis
- Atualiza SAN automaticamente no ator
- Alertas de SAN crítica (≤20% do máximo)

### Macro 2 — Tracker de Exposição Aurora (`02-aurora-exposure.js`)
- Barra visual de progresso (0–10)
- 5 fases com cores e efeitos
- Penalidade de SAN automática ao atingir Fase 3 (4–6)
- Alerta de transformação iniciada no UI do GM
- Suporte a ajuste absoluto ou relativo (+/−)

### Macro 3 — Timer do Override (`03-override-timer.js`)
- 6 alertas temporizados em tempo real
- Integração com playlists de SFX
- Verificação de Override já ativo
- Instruções para cancelamento via console

### Macro 4 — Inventário por Slots (`04-inventory-slots.js`)  ⭐ Principal
- Grade visual de slots (bolsos e mochila)
- Slots verdes = ocupados | Slots vermelhos = sobrecarga
- Penalidade de sobrecarga calculada automaticamente
- Seletor de tipo de mochila
- Flag de EPI equipado
- Tabela de referência de tamanhos embutida

### Macro 5 — Gerador: Combustível (`05-generator-fuel.js`)
- Barra visual do combustível
- Eventos de consumo pré-definidos (normal, elevador, labs)
- Rastreamento do dia da campanha
- Alerta automático no UI quando crítico (≤1 dia)
- Regras de consumo embutidas no dialog

### Macro 6 — Revelar Documentos (`06-reveal-document.js`)  ⭐ Novo
- Lista todos os DOC-XX dos Journals
- Preview de conteúdo inline
- Revelar múltiplos documentos de uma vez
- Botões "Marcar todos / Desmarcar todos"

---

## 7. JOURNALS — DOCUMENTOS IN-GAME

```
Criar Journal com permissão padrão: NONE (jogadores não veem)
Revelar via Macro 6 ou clique direito → Show Players

📁 Documentos In-Game
  ├── DOC-01 — Memorando Turnos Noturnos
  ├── DOC-02 — Email Fernando → ANVISA
  ├── DOC-03 — Email Sem Remetente
  ├── DOC-04 — Relatório Aurora 2003
  ├── DOC-05 — Notas de Voss
  ├── DOC-06 — Ficha Valentina
  ├── DOC-07 — Diário Fernando Alencar
  ├── DOC-08 — Diário Castilho
  ├── DOC-09 — Log de Acesso (portas, datas, horas)
  ├── DOC-10 — Manual de Segurança Seção 14
  ├── DOC-11 — Nota do Gerador (alerta de combustível)
  ├── DOC-12 — Whiteboard Lab A (equação química parcial)
  └── DOC-13 — Requisição de Dremel (pista sobre B4)
```

**Revelar documentos via macro:**
```js
// Console — revelar DOC-01 para todos
game.journal.getName("DOC-01").show("text", true);
```

---

## 8. PLAYLISTS DE ÁUDIO

```
📁 Debaixo da Pele — Áudio
  ├── 🎵 Exploração — Tensão Baixa      (loop, vol 0.3)
  ├── 🎵 Perseguição — Tensão Alta      (loop, vol 0.6)
  ├── 🎵 Combate                         (loop, vol 0.7)
  ├── 🎵 B1 — Ambiente                  (zumbido elétrico)
  ├── 🎵 B2 — Ambiente                  (gotejamento, ventilação)
  ├── 🎵 B3/B4 — Ambiente               (sons orgânicos, respiração)
  ├── 🔔 SFX — Lockdown Sirene          (one-shot)
  ├── 🔔 SFX — Porta Fechando           (one-shot)
  ├── 🔔 SFX — Override Ativado         (one-shot)
  └── 🔔 SFX — Erro de Código           (one-shot)
```

**Fontes gratuitas:**
- [freesound.org](https://freesound.org) — buscar: `industrial drone`, `lab ambience`, `alarm`
- [tabletopaudio.com](https://tabletopaudio.com) — buscar: `dungeon`, `lab`, `horror`

---

## 9. REFERÊNCIA RÁPIDA

### Códigos de Acesso

| Local | Código | Notas |
|---|---|---|
| Guarita (exterior) | 4471 | Marcos Heleno sabe |
| Porta B1 (subsolo) | 1229 | Encontrado no DOC-09 |
| Safe room B2 | 3391 | Isabela Voss sabe |
| Reinicializar Override | 880417 | Seção 14.7 do manual |

### Flags do Módulo (por ator)

```js
// Exposição Aurora
actor.getFlag("debaixo-da-pele", "aurora")         // Number (0-10)

// Inventário
actor.getFlag("debaixo-da-pele", "slots_bolsos")   // Number
actor.getFlag("debaixo-da-pele", "slots_mochila")  // Number
actor.getFlag("debaixo-da-pele", "max_mochila")    // Number
actor.getFlag("debaixo-da-pele", "vestindo_epi")   // Boolean
```

### Comandos Úteis no Console

```js
// Revelar documento
game.journal.getName("DOC-04").show("text", true);

// Setar Aurora manualmente
let a = game.actors.getName("Carolina Melo");
await a.setFlag("debaixo-da-pele", "aurora", 3.5);

// Ver todos os tokens na cena
canvas.tokens.placeables.map(t => t.name);

// Tocar SFX de lockdown
game.playlists.getName("SFX — Lockdown Sirene").playAll();

// Escurecer cena
await canvas.scene.update({ darkness: 0.9 });

// Ver dias do gerador
game.settings.get("debaixo-da-pele", "geradorDias");

// Cancelar Override manualmente
(window._ddpOverrideTimers || []).forEach(clearTimeout);
await game.settings.set("debaixo-da-pele", "overrideAtivo", false);
```

---

## 10. CHECKLIST DE PREPARAÇÃO

```
INSTALAÇÃO
[ ] Copiar módulo para /modules/debaixo-da-pele/
[ ] Ativar módulo no Foundry
[ ] Instalar módulos de dependência (Seção 2)

MUNDO
[ ] Criar mundo "Debaixo da Pele" com sistema CoC7
[ ] Configurar pastas de compêndios

ATORES
[ ] Importar PJs de /templates/atores/pjs.json
[ ] Importar NPCs de /templates/atores/npcs.json
[ ] Importar Inimigos de /templates/atores/inimigos.json

ITENS
[ ] Importar armas de /templates/itens/armas.json
[ ] Importar equipamentos de /templates/itens/equipamentos.json

CENAS
[ ] Criar 6 cenas com configurações de escuridão
[ ] Configurar portas com código (Monks Active Tile)
[ ] Adicionar tokens de inimigos nas cenas corretas

MACROS (copiar de /macros/)
[ ] 01 — Teste de Sanidade
[ ] 02 — Tracker Aurora
[ ] 03 — Timer Override
[ ] 04 — Inventário por Slots
[ ] 05 — Gerador: Combustível
[ ] 06 — Revelar Documentos

JOURNALS
[ ] Criar DOC-01 a DOC-13 com permissão NONE
[ ] Configurar conteúdo de cada documento

ÁUDIO
[ ] Criar playlists com nomes exatos (para integração com macros)
[ ] Adicionar arquivos de áudio correspondentes

TESTE
[ ] Testar cada macro com token selecionado
[ ] Verificar que SFX integra com macros de Override
[ ] Confirmar que DOC-XX aparece para jogadores ao revelar
```

---

*Foundry VTT | Sistema CoC7 | Campanha: Debaixo da Pele | v1.0.0*
