# INSTALAÇÃO — Debaixo da Pele

Guia rápido para colocar o módulo em funcionamento no Foundry VTT.

---

## Passo 1 — Copiar o módulo

Copie a pasta inteira para o diretório de módulos do Foundry:

```
[Foundry Data]/Data/modules/debaixo-da-pele/
```

Estrutura esperada após a cópia:
```
debaixo-da-pele/
├── module.json
├── planejamento.md
├── INSTALL.md
├── scripts/
│   └── main.js
├── styles/
│   └── debaixo-da-pele.css
├── macros/
│   ├── 01-san-check.js
│   ├── 02-aurora-exposure.js
│   ├── 03-override-timer.js
│   ├── 04-inventory-slots.js
│   ├── 05-generator-fuel.js
│   └── 06-reveal-document.js
└── templates/
    ├── atores/
    │   ├── pjs.json
    │   ├── npcs.json
    │   └── inimigos.json
    └── itens/
        ├── armas.json
        └── equipamentos.json
```

---

## Passo 2 — Ativar o módulo

1. Abra o Foundry VTT
2. Acesse **Settings → Manage Modules**
3. Ative **"Debaixo da Pele — CoC7 Sistema de Inventário e Macros"**
4. Salve e recarregue

---

## Passo 3 — Importar os templates

### Atores

1. Foundry → **Actors** → Create Folder (ex: "PJs", "NPCs", "Inimigos")
2. Para cada JSON em `/templates/atores/`:
   - Botão direito na pasta → **Import Data**
   - Selecionar o arquivo `.json`
   - O Foundry importa todos os atores do array de uma vez

### Itens

1. Foundry → **Items** → Create Folder (ex: "Armas", "Equipamentos")
2. Para cada JSON em `/templates/itens/`:
   - Botão direito na pasta → **Import Data**

> **Nota:** Alguns campos (como imagens de ícone) podem precisar de ajuste após a importação, pois dependem dos assets disponíveis no seu Foundry.

---

## Passo 4 — Criar as macros

As macros precisam ser criadas manualmente no Foundry (não há importação automática por segurança do sistema).

Para cada arquivo em `/macros/`:

1. Foundry → **Macros** → **Create Macro**
2. Tipo: **Script**
3. Nome: use o nome do arquivo (ex: "01 — Teste de Sanidade")
4. Abra o arquivo `.js` com qualquer editor de texto
5. Copie todo o conteúdo e cole no campo de script da macro
6. Salve

**Atalho sugerido para as macros** (configurar na barra de macros do Foundry):

| Slot | Macro |
|---|---|
| 1 | 01 — Teste de Sanidade |
| 2 | 02 — Tracker Aurora |
| 3 | 03 — Timer Override |
| 4 | 04 — Inventário por Slots |
| 5 | 05 — Gerador: Combustível |
| 6 | 06 — Revelar Documentos |

---

## Passo 5 — Verificar as configurações do módulo

1. Foundry → **Settings → Module Settings**
2. Encontrar **"Debaixo da Pele"**
3. Configurar:
   - **Gerador — Dias de Combustível:** 6 (início da campanha)
   - **Dia Atual da Campanha:** 1
   - **Slots máximos — Bolsos/Cinto:** 7

---

## Passo 6 — Testar

```
1. Abra qualquer cena
2. Arraste um PJ para o mapa e selecione o token
3. Execute a Macro 4 (Inventário) → deve abrir o dialog
4. Execute a Macro 1 (SAN) → deve abrir o dialog
5. Execute a Macro 5 (Gerador) → deve mostrar os dias configurados
```

---

## Dependências (módulos externos)

Para funcionalidade completa, instale também:

```
dice-so-nice
monks-little-details
simple-calendar
item-piles
fxmaster
monks-sound-enhancements
monks-active-tile-triggers
combat-utility-belt
```

> As macros de **SAN**, **Aurora**, **Inventário** e **Gerador** funcionam sem nenhuma dependência.
> O **Override Timer** integra com as playlists de SFX se estiverem criadas com os nomes corretos.

---

## Solução de Problemas

**"Macro não encontra o módulo de settings"**
→ Certifique que o módulo está ativado. Se estiver rodando a macro sem o módulo, os `game.settings.register` no topo de cada macro registram os settings automaticamente como fallback.

**"JSON não importa no Foundry"**
→ Foundry v11/v12 exige que o JSON de um único ator/item (não array) seja importado. Se necessário, separe cada objeto do array em um arquivo `.json` individual.

**"Timer de Override parou após recarregar"**
→ `setTimeout` usa memória do servidor. Recarregamentos cancelam os timers. Não há solução nativa sem um módulo de persistência. Anote o tempo restante e recrie o timer manualmente.

**"Ator não tem sistema CoC7"**
→ Certifique que o mundo usa o sistema CoC7. Os campos `system.characteristics`, `system.attribs.san`, etc. são exclusivos desse sistema.
