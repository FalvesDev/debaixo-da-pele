# Planejamento: Ficha de Veículo — Debaixo da Pele

## Objetivo
Criar um tipo de ator "veículo" no Foundry com ficha dedicada, integrando ao módulo DDP.
Veículos podem ser conduzidos pelos investigadores, carregar itens no porta-malas/carroceria,
e sofrer dano estrutural durante perseguições ou combate.

---

## Dados da Ficha

### Identificação
| Campo        | Tipo     | Exemplo                    |
|--------------|----------|----------------------------|
| Nome         | string   | "Saveiro 97 — Placa XYZ"   |
| Tipo         | select   | Carro, Caminhonete, Moto, Van, Caminhão, Barco |
| Imagem       | img      | Foto/ícone do veículo      |
| Placa        | string   | "ABC-1234"                 |
| Proprietário | string   | Nome do PJ ou NPC          |
| Combustível  | select   | Gasolina, Diesel, Álcool   |

### Atributos de Desempenho (CoC7)
| Campo              | Tipo    | Notas                                        |
|--------------------|---------|----------------------------------------------|
| Velocidade Máx     | number  | km/h — usada para determinar dano em colisão |
| Aceleração         | number  | 1–5 (lento a muito rápido)                  |
| Manobrabilidade    | number  | base % para testes de Dirigir               |
| Blindagem          | number  | redução de dano para ocupantes               |

### HP Estrutural
- **HP Atual / HP Máx** — baseado no tipo do veículo
  - Moto: 12 | Carro: 20 | Van/Pickup: 30 | Caminhão: 50
- **Estado**: Intacto → Avariado (HP ≤ 50%) → Imobilizado (HP ≤ 0)
- **Avariado**: velocidade máx reduzida à metade, −20% Dirigir
- **Imobilizado**: veículo para, possível incêndio (1D6 rodadas)

### Combustível
- **Nível** (0–100%) — medidor visual na ficha
- Consumo: −10% por hora de uso intenso, −5% por hora normal
- Abastecimento: item "Galão de Gasolina" restaura +30%

### Passageiros
- Grid visual mostrando assentos (Motorista + N passageiros)
- Cada assento: campo para nome/link do ator PJ

### Porta-Malas / Carroceria
- **Grid de inventário** (simplificado) — slots = tipo do veículo
  - Moto: 2 slots | Carro: 6 slots | Van: 12 slots | Caminhão: 20 slots
- Itens armazenados aparecem listados (não precisa de grid espacial)
- Transferência com inventário do PJ via o sistema já existente

### Danos Especiais
| Estado              | Efeito                                              |
|---------------------|-----------------------------------------------------|
| Pneu furado         | −30% Dirigir, velocidade ≤ 60 km/h                 |
| Motor danificado    | −50% velocidade, falha possível (1D6 ≤ 3)          |
| Vidro quebrado      | PJs expostos a projéteis sem cobertura              |
| Em chamas           | 1D6 dano/rodada, ocupantes devem evacuar            |

---

## Estrutura do Actor em Foundry

```js
// Tipo de ator: "vehicle" (novo tipo customizado)
// Ou: ator do tipo "npc" com flag ddp.tipo = "veiculo"

actor.flags["debaixo-da-pele"] = {
  tipo: "veiculo",
  veiculo: {
    tipo: "carro",        // carro | moto | van | caminhão | barco
    placa: "ABC-1234",
    combustivel: 80,      // 0–100%
    velocidade: 120,
    aceleracao: 3,
    manobrabilidade: 40,
    blindagem: 0,
    pneuFurado: false,
    motorDanificado: false,
    emChamas: false
  }
}

// HP via system.attribs.hp (igual ao personagem)
// Itens via actor.items (mesma coleção)
```

---

## Template HTML da Ficha (`templates/vehicle-sheet.html`)

```
┌─────────────────────────────────────────────────┐
│  [IMG]  Nome do Veículo          Tipo: [Carro ▼] │
│         Placa: ____  Dono: ____                  │
├─────────────────────────────────────────────────┤
│  HP  [████████░░]  20/20    Estado: Intacto      │
│  Combustível [██████░░░░] 60%                    │
├────────────────────┬────────────────────────────┤
│  ATRIBUTOS         │  ESTADOS                   │
│  Vel. Máx: 120     │  ✅ Pneus OK               │
│  Acel.: 3/5        │  ✅ Motor OK               │
│  Manobrabilidade:  │  ❌ Vidro Traseiro         │
│  40% [+/−]         │  ⬜ Em Chamas             │
├────────────────────┴────────────────────────────┤
│  PASSAGEIROS                                     │
│  [🧑 Motorista] [👤 Passageiro] [👤 Passageiro] │
├─────────────────────────────────────────────────┤
│  PORTA-MALAS / CARGA  (6 slots)                  │
│  [item 1] [item 2] [item 3] ...                  │
└─────────────────────────────────────────────────┘
```

---

## Arquivos a Criar

| Arquivo                              | Descrição                              |
|--------------------------------------|----------------------------------------|
| `scripts/vehicle-sheet.js`           | Classe `DDPVehicleSheet extends FormApplication` |
| `templates/vehicle-sheet.html`       | Template Handlebars da ficha           |
| `assets/icons/vehicle-*.svg`         | Ícones por tipo de veículo             |
| Editar `scripts/main.js`             | Registrar sheet + hook de tipo de ator |
| Editar `module.json`                 | Declarar o novo template               |

---

## Regras de Combate / Colisão (CoC7 adaptado)

- **Atropelamento**: dano = 1D6 × (velocidade / 30), mín 1D6, máx 6D6
- **Colisão frontal**: ambos os veículos sofrem dano proporcional às velocidades
- **Disparo de dentro do carro**: penalidade −10% por estar em movimento
- **Perseguição**: teste de Dirigir oposto, vantagem para maior aceleração

---

## Integração com o Módulo Existente

- **Item transfer**: porta-malas do veículo aparece como ator destino no picker de transferência (se veículo estiver na mesma cena)
- **Token HUD**: mostra HP estrutural e nível de combustível no token
- **Party Frame**: veículos aparecem em seção separada "Veículos" abaixo dos investigadores (GM pode toggle)

---

## Prioridade de Implementação

1. **MVP**: Ficha básica com HP, combustível, tipo, atributos, listagem de itens no porta-malas
2. **V2**: Grid visual de passageiros, estados de dano com efeitos mecânicos
3. **V3**: Integração com token HUD + party frame + sistema de colisão
