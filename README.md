# Debaixo da Pele — Módulo Foundry VTT

> Módulo completo para a campanha **Debaixo da Pele** — Call of Cthulhu 7ª Edição no Foundry VTT v11/v12.

**Sistema:** Call of Cthulhu 7e (`CoC7` v7.0+, verificado v7.22)
**Foundry VTT:** v11 / v12
**Versão atual:** 1.5.0

---

## Instalação

### Via Foundry (recomendado)

1. Abra o Foundry VTT → **Add-on Modules** → **Install Module**
2. Cole o link do manifesto:
   ```
   https://raw.githubusercontent.com/FalvesDev/debaixo-da-pele/main/module.json
   ```
3. Clique em **Install**
4. Ative o módulo na sua world (CoC7 obrigatório)

### Primeira inicialização

Na primeira vez que o GM abrir a mesa com o módulo ativo, um popup aparecerá perguntando se deseja **importar as 13 macros** da campanha automaticamente para a world. Recomenda-se aceitar.

---

## Sistemas incluídos

### 1. Composto Aurora — Rastreador de Exposição

O sistema central da campanha. Cada investigador acumula exposição ao **Composto Aurora** (0–10) conforme explora o complexo.

**5 fases com efeitos automáticos:**

| Nível | Fase | Cor | Efeitos mecânicos |
|-------|------|-----|-------------------|
| 0–2 | Traço | Verde | Nenhum |
| 2,01–4 | Subcutâneo | Amarelo | Cicatrização acelerada |
| 4,01–6 | Ativo | Laranja | −5 SAN na entrada da fase |
| 6,01–8 | Progressivo | Vermelho | +2 HP max, −10% perícias mentais |
| 8,01+ | Transformação | Crítico | Personagem progressivamente não jogável |

**Localização do painel:** Aba Aurora na ficha CoC7 do personagem (colapsável).

**Exposição por andar:**
- B2 (sem máscara): +0,5/hora
- B3 (sem máscara): +1/hora
- B4 (entrada): +1 imediato, +1 após 2 minutos
- Mordida de Refinado: +1 a +2

**O painel Aurora fica oculto dos jogadores até o GM revelar** (ver Painel GM → Revelações).

---

### 2. Painel de Investigadores — Party Frame

Overlay persistente na lateral da tela mostrando todos os PJs em tempo real.

**Exibe por personagem:**
- Avatar + nome abreviado
- Barra de HP (com cores: verde / laranja / vermelho)
- Barra de SAN (mesma escala)
- Indicador de fase Aurora (pip colorido)
- Ícones de status: 🩸 Hemorragia · 💤 Inconsciente · 🛡️ Máscara ativa

**Interações:**
- Clique simples → foca o token no canvas
- Clique duplo → abre a ficha do personagem

**Controle:** Pode ser ocultado pelo jogador em Configurações do Módulo.

---

### 3. Token HUD — Barras HP/SAN/Aurora

Barras visuais desenhadas **acima** de cada token de investigador no canvas.

- **Barra vermelha:** HP (proporcional ao máximo)
- **Barra azul:** SAN (proporcional ao máximo)
- **Barra Aurora:** visível apenas quando o GM revelar o composto

Visibilidade controlada individualmente pelo GM no **Painel de Controle** (ver abaixo).

---

### 4. Status Automáticos

O módulo aplica e remove efeitos de status automaticamente baseado nos atributos:

| Status | Ícone | Condição |
|--------|-------|----------|
| Ferido | 🟡 | HP ≤ 50% |
| Inconsciente | 💤 | HP ≤ 0 |
| Ferimento Grave | 🔴 | Queda brusca de ≥ 50% do HP máximo em 1 atualização |
| Hemorragia | 🩸 | Aplicado manualmente pelo GM |
| Aurora F2/F3/F4 | ☣ | Fase Aurora correspondente |

**Hemorragia em combate:** desconta 1 HP por turno automaticamente enquanto o efeito estiver ativo.

---

### 5. Painel GM — Controle do Mestre

Acessado pelo ícone 💀 na barra de controles de token (canto esquerdo do canvas).
Redimensionável — arraste as bordas.

#### Aba Sessão
- **Dia da Campanha** (±1): rastreia em qual dia os jogadores estão
- **Combustível do Gerador** (±1 dias): alerta quando crítico (≤3 dias: aviso; ≤1 dia: erro permanente)
- **Override do Sistema:** toggle que ativa/desativa o estado de override narrativo
- **Resumo da Mesa:** total de PJs ativos, hemorragias, inconscientes, média de Aurora

#### Aba Investigadores
- Ver HP, SAN e Aurora de cada PJ com cores de alerta
- Ajustar Aurora individualmente (−1 / −½ / +½ / +1)
- Exposição em massa (+½ ou +1 Aurora para todos os PJs de uma vez)
- Ícones de status ativos (hemorragia, inconsciência, máscara)

#### Aba Revelações
- **HP e SAN visível para jogadores:** toggle (afeta Token HUD e Party Frame)
- **Aurora — revelar:** envia popup dramático para todas as telas com título e texto personalizados, ativa a barra Aurora nos tokens, cria mensagem no chat
- **Aurora — ocultar:** remove visibilidade do Aurora dos jogadores
- **Empurrar documento:** seleciona um Journal ou Item e abre na tela de todos os jogadores

#### Aba Ações Rápidas
- **Teste SAN (token selecionado):** abre a macro de SAN para o token ativo
- **Teste SAN (todos os PJs):** seleciona todos os tokens e executa a macro de SAN
- **Timer de Override:** inicia o timer de 38 minutos com alertas automáticos no chat
- **Hemorragia:** aplica/remove o efeito de hemorragia em um personagem específico
- **Override do Sistema:** ativa o timer de emergência via macro
- **Mensagem Narrativa:** envia texto estilizado para o chat (itálico, fundo escuro)
- **📦 Importar Macros do Compêndio:** importa todas as 13 macros para a world

---

## Compêndios

O módulo inclui **3 compêndios** acessíveis em **Compêndios** no Foundry:

### DDP — Macros da Campanha (13 macros)

| # | Nome | Função |
|---|------|--------|
| 01 | Teste de Sanidade | Dialog com eventos pré-definidos, rola 1d100 vs SAN, aplica perda automaticamente |
| 02 | Exposição Aurora | Visualiza e ajusta o nível de Aurora do personagem selecionado |
| 03 | Timer de Override | Inicia contagem regressiva de 38 min com alertas no chat e playlist |
| 04 | Inventário por Slots | Grade visual de slots (bolsos/cinto + mochila), calcula penalidade de sobrecarga |
| 05 | Gerador: Combustível | Atualiza dias de combustível com eventos de consumo pré-definidos |
| 06 | Revelar Documento | Lista todos os Journals DOC-XX e os empurra para os jogadores |
| 07 | Kit PA Básico | Rola Primeiros Socorros, aplica 1D3 ou 1D6 PV automaticamente |
| 08 | Kit PA Avançado | Rola Medicina ou Primeiros Socorros, pode estancar hemorragia |
| 09 | Bandagem Hemostática | Remove efeito Hemorragia sem rolagem |
| 10 | Codeína | Remove penalidades de dor por 4 horas |
| 11 | Morfina | Remove toda penalidade de dor por 6 horas, avisa risco de dependência |
| 12 | Adrenalina | Permite ação de personagem inconsciente; bônus/penalidade físicos |
| 13 | Toggle de Máscara | Equipa/troca máscara respiratória, mostra tabela de proteção por andar |

### DDP — Itens e Equipamentos (25 itens)

**Armas:** Revólver .38, Pistola 9mm, Escopeta 12 Pump, Facão, Pé de Cabra, Extintor
**Consumíveis médicos:** Kit PA Básico, Kit PA Avançado, Bandagem Hemostática, Codeína, Morfina, Adrenalina
**Proteção:** Máscara Cirúrgica, N95, Máscara de Gás Civil, Máscara de Gás Especializada, Colete Balístico
**Sobrevivência:** Barra de Energia, Garrafa de Água, Pilhas, Lanterna, Walkie-Talkie
**Especiais:** Dremel, Manual de Operações (código de override), Seringa de Voss

### DDP — Personagens e Adversários (13 fichas)

**5 PJs pré-gerados:**
- Antônio Figueiredo (Engenheiro de Segurança)
- Carolina Melo (Médica)
- Beatriz Fontes (Advogada Corporativa)
- Sérgio Dantas (Gerente de Operações)
- Tiago Araújo (Fotógrafo)

**NPCs:**
- Marcos Heleno (Chefe de Manutenção — aliado, acima do solo)
- Dra. Isabela Voss (Pesquisadora Sênior — aliada, B2)
- Valentina Costa (Voluntária — B3, dilema moral)

**Adversários:**
- Refinado Básico (×6 no complexo)
- Refinado Pesado / Patricia (B3)
- Espécime Canino / Beagle (×2 em B2)
- O Diretor / Dr. Renato Castilho (chefe, B3)
- AURORA-0 (entidade, B4 — intocável)

---

## Macros — Como usar

Após importar as macros (automático na primeira vez, ou via botão no Painel GM):

1. **Selecione um token** no canvas
2. Execute a macro desejada da barra de macros do Foundry
3. Um dialog abre com todas as opções e rola os dados automaticamente

**Atalho rápido:** arraste qualquer macro da barra para um slot de hotkey (1–0).

---

## Configurações do Módulo

Acessadas em **Configurações → Configurações do Módulo → Debaixo da Pele**:

| Configuração | Escopo | Padrão | Descrição |
|---|---|---|---|
| Gerador — Dias de Combustível | World | 6 | Exibe alerta quando ≤3 dias |
| Dia Atual da Campanha | World | 1 | Rastreado no Painel GM |
| Slots máximos — Bolsos/Cinto | World | 7 | Afeta cálculo de sobrecarga |
| Painel de Investigadores — Visível | Client | true | Toggle do Party Frame |
| Token HUD — Barras HP/SAN/Aurora | Client | true | Toggle das barras nos tokens |

**Configurações ocultas** (controladas exclusivamente pelo Painel GM):
- HP/SAN visível para jogadores
- Aurora revelado / visível para jogadores
- Override ativo

---

## Estrutura de Arquivos

```
debaixo-da-pele/
├── module.json                  # Manifesto do módulo
├── scripts/
│   ├── main.js                  # Entry point, settings, socket, setup
│   ├── aurora-system.js         # Sistema Aurora: fases, painel na ficha, efeitos
│   ├── token-hud.js             # Barras PIXI.js nos tokens
│   ├── party-frame.js           # Overlay de investigadores (popOut: false)
│   ├── status-auto.js           # Status automáticos (Ferido, Inconsciente, etc.)
│   └── gm-panel.js              # Painel de controle do GM (4 abas)
├── templates/
│   ├── party-frame.html         # Template do overlay de PJs
│   └── gm-panel.html            # Template do painel GM (4 abas)
├── styles/
│   └── debaixo-da-pele.css      # Estilos de todo o módulo (~900 linhas)
├── macros/
│   ├── 01-san-check.js          # Teste de Sanidade
│   ├── 02-aurora-exposure.js    # Exposição Aurora
│   ├── 03-override-timer.js     # Timer de Override
│   ├── 04-inventory-slots.js    # Inventário por Slots
│   ├── 05-generator-fuel.js     # Combustível do Gerador
│   ├── 06-reveal-document.js    # Revelar Documentos
│   ├── 07-kit-pa-basico.js      # Kit PA Básico
│   ├── 08-kit-pa-avancado.js    # Kit PA Avançado
│   ├── 09-bandagem-hemostatica.js
│   ├── 10-codeina.js
│   ├── 11-morfina-item.js
│   ├── 12-adrenalina.js
│   └── 13-mascara-toggle.js
├── packs/
│   ├── macros.db                # Compêndio: 13 macros (NeDB)
│   ├── items.db                 # Compêndio: 25 itens (NeDB)
│   └── actors.db                # Compêndio: 13 fichas (NeDB)
└── assets/
    └── icons/                   # 34+ ícones SVG de status e UI
```

---

## Socket e Comunicação em Tempo Real

O módulo usa `game.socket` para sincronizar eventos entre GM e jogadores:

| Ação | Disparada por | Efeito em todos os clientes |
|------|--------------|----------------------------|
| `revelarComposto` | GM (Painel → Revelações) | Popup dramático + refresh dos tokens |
| `mostrarDocumento` | GM (Painel → Revelações) | Abre Journal/Item na tela de todos |
| `mostrarMensagem` | GM | Cria mensagem no chat |

Requer `"socket": true` no `module.json` ✅

---

## Dependências

| Dependência | Tipo | Obrigatório |
|---|---|---|
| [Call of Cthulhu 7e](https://foundryvtt.com/packages/CoC7) | Sistema | ✅ Sim |
| Qualquer outro módulo | — | ❌ Não |

O módulo é **auto-suficiente** — não requer módulos externos como HUD Core, Bar Brawl ou similares.

---

## Changelog

### v1.5.0
- Compêndios adicionados: Macros, Itens e Personagens/Adversários
- Seleção de macros no Painel GM completamente reescrita e robusta
- Botão de importação de macros no Painel GM (aba Ações)
- Prompt automático de importação na primeira inicialização
- Painel GM agora é redimensionável

### v1.4.2
- Corrige versão mínima do CoC7: `7.0.0` (verificado `7.22`)
- Remove declaração de packs inexistentes que bloqueavam instalação

### v1.4.1
- Adiciona `"socket": true` ao module.json (necessário para revelações)
- Corrige duplicação de lógica Aurora entre main.js e aurora-system.js

### v1.4.0
- Painel GM completo com 4 abas
- Sistema de revelação via socket
- Controle de visibilidade HP/SAN/Aurora por toggle

### v1.1.0
- Itens utilizáveis e macros de consumíveis
- Ícones SVG de status

### v1.0.0
- Sistema Aurora integrado na ficha CoC7
- Token HUD com barras HP/SAN/Aurora
- Party Frame overlay
- Status automáticos (Ferido, Hemorragia, Inconsciente)

---

## Campanha

Este módulo foi desenvolvido especificamente para a campanha **Debaixo da Pele** — um horror de sobrevivência para Call of Cthulhu 7e ambientado no Brasil em 2010. Cinco funcionários da Nova Lumière Cosméticos chegam a um complexo adquirido em Cataguá, MG para uma inspeção de rotina. O complexo trava. Algo no subsolo ainda vive.

**4 atos | ~40 sessões | Horror corporal e cósmico**

---

*Módulo desenvolvido para uso privado de mesa. Não afiliado à Chaosium ou ao sistema oficial CoC7.*
