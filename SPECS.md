# Especificação Técnica — Caça-Palavras Web

**Versão:** 1.0  
**Data:** 22/10/2026  
**Status:** Especificação de implementação do MVP  
**Produto:** Caça-Palavras  
**Design escolhido:** 02 · Acesso, com identidade escura verde e interação direta na grade  
**Referências:** [PRD.md](./PRD.md), [PROJETO_TECNICO.md](./PROJETO_TECNICO.md), [index.html](./index.html)

## 1. Objetivo e escopo

Este documento define como completar o jogo web usando a interface escolhida: jogo casual de caça-palavras, com a grade como foco principal, lista de alvos sempre visível, alto contraste, feedback imediato e uma experiência responsiva para mouse, toque e teclado.

A aplicação permanece client-side, construída com HTML, CSS e JavaScript nativos, sem framework, build ou backend. A geração e as regras do jogo ficam isoladas da interface; preferências, progresso diário e estatísticas são armazenados apenas no navegador.

O MVP inclui:

- Desafio diário determinístico em português e inglês.
- Partida livre em grades 8×8, 10×10 e 12×12.
- Geração de alvos na horizontal, vertical e diagonal, nos dois sentidos.
- Seleção por arraste/toque e por clique na primeira e última letra.
- Navegação e confirmação por teclado.
- Lista de palavras, progresso, dicas, conclusão e tempo de partida.
- Retomada do desafio diário e estatísticas/streak locais.
- Layout responsivo e preferência de tema claro/escuro.

Contas, sincronização, multiplayer, rankings remotos, anúncios, telemetria e backend estão fora do escopo.

## 2. Direção visual e interface

### 2.1 Princípios

- A grade é o elemento visual dominante e a ação principal aparece sem tela de marketing ou explicações extensas.
- O painel de palavras é uma região de apoio para consulta rápida, não um cartão decorativo concorrendo com o jogo.
- O cabeçalho oferece acesso ao desafio diário, partida livre e estatísticas.
- A interface privilegia leitura rápida, controles previsíveis, foco visível e feedback que não depende exclusivamente de cor.
- Os estados “selecionada”, “encontrada”, “dica” e “foco” têm tratamento visual distinto.

### 2.2 Composição

1. Cabeçalho compacto com marca e navegação.
2. Identificação do modo/data, título da partida e indicador de sequência diária.
3. Área de jogo com progresso, tamanho da grade, tabuleiro e ação de dica.
4. Lista lateral de palavras em desktop; abaixo da grade em telas estreitas.
5. Região de status acessível para anunciar seleção, erro, acerto e conclusão.

A tela atual apresenta uma grade 10×10 e oito alvos definidos para o desafio inicial: `janela`, `floresta`, `planeta`, `caminho`, `viagem`, `caderno`, `brisa` e `estrela`. A lista deve sempre ser renderizada a partir de `game.targets`; não manter uma lista visual independente que possa divergir das palavras da grade.

### 2.3 Tokens e estados

Os valores abaixo descrevem a identidade já presente no protótipo. Ao extrair o CSS, centralizá-los em propriedades customizadas e fornecer equivalentes para o tema claro.

| Token | Uso | Referência escura |
|---|---|---|
| `--bg` | Fundo da página | `#0f1716` |
| `--panel` | Superfícies principais | `#152b29` |
| `--panel-2` | Superfícies elevadas | `#1b3331` |
| `--line` | Bordas e divisores | `rgba(164, 190, 178, 0.2)` |
| `--text` | Texto principal | `#f1f6f4` |
| `--muted` | Texto auxiliar | `#a8b9b3` |
| `--accent` | Ação principal | `#6aaa64` |
| `--tile` | Fundo de célula | `#1d2f2d` |
| `--selected` | Seleção temporária | `#c9b458` |
| `--found` | Palavra encontrada | `#5da85f` |
| `--hint` | Célula revelada por dica | `#f4d36c` |
| `--focus` | Foco de teclado | `#9ad8ff` |

- Usar contorno ou indicador textual além da cor para seleção e foco.
- Palavra encontrada permanece destacada na grade e riscada na lista, com um marcador adicional.
- Erro limpa somente a seleção temporária; não afeta palavras já encontradas.
- Respeitar `prefers-reduced-motion` para transições não essenciais.

### 2.4 Responsividade

- Desktop: grade e painel de palavras lado a lado.
- Até aproximadamente 760 px: uma coluna, grade primeiro e lista em seguida.
- Manter a grade quadrada com células estáveis; nenhuma letra ou rótulo pode alterar o tamanho do tabuleiro.
- Testar larguras de 320, 375, 768, 1280 e 1920 px sem rolagem horizontal.
- Garantir que botões, progresso, foco e palavras não se sobreponham nas telas menores.

## 3. Arquitetura

### 3.1 Stack e estrutura atual

O repositório usa módulos ES e Node.js para testes. O estado atual contém HTML/CSS e bootstrap do jogo em `index.html`, lógica de domínio distribuída em `js/` e testes em `tests/`.

```text
.
├── index.html
├── js/
│   ├── main.js       # Controlador da interface e ciclo de partida
│   ├── daily.js       # Datas locais, seed diária e streak
│   ├── dictionary.js  # Vocabulários PT e EN
│   ├── generator.js   # Geração e validação das grades
│   ├── hints.js       # Escolha de alvo para dica
│   ├── normalize.js   # Normalização de texto
│   ├── prng.js        # Hash e aleatoriedade determinística
│   ├── selection.js   # Linha e correspondência de seleção
│   ├── settings.js    # Preferências e limites por grade
│   ├── stats.js       # Conclusão e formatação de tempo
│   └── storage.js     # Persistência local validada
├── tests/
│   ├── core.test.js
│   ├── daily.test.js
│   ├── dictionary.test.js
│   └── generator.test.js
└── package.json
```

A extração de CSS e do bootstrap de `index.html` para arquivos próprios pode ser feita depois de estabilizar a integração; não é requisito para ativar as regras atuais.

### 3.2 Limites de responsabilidade

- Módulos de domínio não acessam DOM, `window` nem `localStorage`.
- A interface coleta ações e reflete o estado; não deve reimplementar regras de geração, datas ou correspondência de palavras.
- O estado da partida é a fonte única para grade, seleção, lista, progresso, dicas e conclusão.
- Persistência recebe snapshots saneados, nunca eventos de movimento de ponteiro.
- A geração deve ser reproduzível a partir de uma seed conhecida.

### 3.3 Contratos dos módulos existentes

| Módulo | Contrato e responsabilidade |
|---|---|
| `normalize.js` | `normalize(text) -> string`; remove diacríticos, converte para maiúsculas e mantém somente `A-Z`. |
| `prng.js` | Hash da seed textual e PRNG determinístico; mesmo estado inicial deve produzir a mesma sequência. |
| `dictionary.js` | Vocabulários PT/EN em grafia de exibição; normalização é feita na fronteira de geração. |
| `settings.js` | `DEFAULT_SETTINGS` e configuração de quantidade/comprimento por tamanho de grade. |
| `generator.js` | `generateGame({ seed, lang, size, dictionary }) -> game`; `validateGame(game) -> boolean`. |
| `selection.js` | `resolveLine(start, end)` devolve células alinhadas ou `null`; `matchSelection(grid, targets, start, end)` reconhece alvos diretos ou reversos. |
| `hints.js` | `nextHint(targets, foundWordIds, hintsUsed)` escolhe o primeiro alvo não encontrado em ordem determinística, limitado a três usos. |
| `daily.js` | `localDateKey`, `dailySeed`, comparação de datas, reinício e conclusão de streak. |
| `stats.js` | Atualiza estatísticas de conclusão e formata duração. |
| `storage.js` | Cria, lê, saneia e grava o objeto versionado sob `cacapalavras:v1`; tolera falhas de acesso. |

## 4. Modelo de dados e estado

### 4.1 Definição imutável de partida

A geração devolve uma definição que a interface pode renderizar sem inferir onde as palavras estão:

```js
{
  id: "2026-10-22:pt:10",
  seed: "2026-10-22:pt:10",
  lang: "pt",
  size: 10,
  grid: [["A", "B"]],
  targets: [{
    id: "PLANETA",
    display: "planeta",
    normalized: "PLANETA",
    cells: [{ row: 1, col: 9 }]
  }]
}
```

`grid` é uma matriz quadrada de letras normalizadas. `targets[].cells` contém todas as células do alvo em sua ordem de geração; essas coordenadas alimentam realce, dica, validação e testes.

### 4.2 Estado mutável da sessão

```js
{
  game: null,
  mode: "daily", // "daily" | "free"
  foundWordIds: [],
  hintsUsed: 0,
  startedAt: 0,
  elapsedSeconds: 0,
  selection: { start: null, end: null, cells: [], source: null },
  completed: false
}
```

Ações recomendadas: `startGame`, `beginSelection`, `updateSelection`, `finishSelection`, `cancelSelection`, `useHint`, `restoreDaily` e `completeGame`. Cada ação valida entrada e produz estado consistente antes de atualizar a interface.

### 4.3 Persistência

Usar `STORAGE_KEY = "cacapalavras:v1"`, compatível com `js/storage.js`:

```json
{
  "version": 1,
  "prefs": { "lang": "pt", "size": 10, "theme": "system" },
  "stats": {
    "gamesCompleted": 0,
    "dailyCompleted": 0,
    "bestStreak": 0,
    "totalSeconds": 0,
    "lastDailyDate": null,
    "currentStreak": 0
  },
  "daily": {
    "2026-10-22": {
      "foundWordIds": [],
      "hintsUsed": 0,
      "startedAt": 0,
      "elapsedSeconds": 0,
      "completed": false
    }
  }
}
```

Validar e normalizar qualquer dado carregado. Se `localStorage` estiver indisponível ou o JSON for inválido, continuar em memória e não bloquear a partida. Gravar progresso após acerto, dica, conclusão ou mudança de preferência; não gravar cada movimento da seleção.

## 5. Geração de partidas

### 5.1 Configuração

| Grade | Alvos | Comprimento mínimo | Comprimento máximo |
|---|---:|---:|---:|
| 8×8 | 6 | 3 | 8 |
| 10×10 | 8 | 3 | 10 |
| 12×12 | 10 | 4 | 12 |

O desafio diário usa 10×10. A partida livre usa o tamanho escolhido. O protótipo inicial usa uma lista controlada de oito palavras, passada por `dictionary`, para assegurar que cada palavra apresentada esteja na grade. Ao ampliar o jogo para seleção diária do vocabulário, o painel deve ser construído a partir dos alvos efetivamente devolvidos pelo gerador, inclusive quando o fallback reduzir a quantidade.

### 5.2 Algoritmo

1. Derivar a seed do modo, data (diário), idioma e tamanho; partida livre recebe uma seed nova.
2. Normalizar palavras, eliminar duplicatas e filtrar pelo comprimento permitido.
3. Selecionar a quantidade configurada com o PRNG determinístico.
4. Enumerar posições possíveis nas direções `[0,1]`, `[1,0]`, `[1,1]` e `[1,-1]`; o sentido reverso é reconhecido pela seleção.
5. Embaralhar candidatos usando o PRNG e posicionar por backtracking.
6. Permitir sobreposição somente quando as letras coincidem. Limitar tentativas para impedir geração sem término.
7. Se necessário, reduzir a quantidade de alvos, limpar o tabuleiro e tentar novamente.
8. Preencher células vazias com letras do alfabeto correspondente.
9. Validar dimensões, caracteres, coordenadas, presença dos alvos e ausência de duplicatas antes de retornar.

A geração para 12×12 deve levar menos de 300 ms em dispositivo de médio porte, conforme o PRD.

### 5.3 Data e determinismo

`js/daily.js` fornece `localDateKey()` e `dailySeed(date, lang, size)`. A integração deve usar uma única política temporal e testar mudança de dia, ano novo e horário de verão. O requisito atual do PRD define data local; essa escolha pode fazer o desafio trocar em instantes diferentes por fuso. Se “mesma grade mundial no mesmo instante” for exigido, substituir a política por UTC e atualizar o PRD antes de implementar.

Não usar `new Date().toISOString().slice(0, 10)` como chave local: o método calcula a data em UTC. A data exibida no cabeçalho deve vir da mesma chave usada para gerar a grade, não de texto fixo no HTML.

## 6. Fluxos de interação

### 6.1 Seleção por arraste/toque

- No início do gesto, guardar a célula inicial e ativar estado transitório de seleção.
- Durante o movimento, resolver apenas linhas horizontais, verticais ou diagonais; selecionar as células intermediárias da linha.
- Ao soltar dentro da grade, converter início e fim para `{ row, col }` e chamar `matchSelection`; soltura fora da grade, em linha inválida ou cancelada limpa o gesto sem validar um segmento anterior.
- Em acerto novo, registrar `target.id`, marcar todas as células retornadas, atualizar lista e progresso e persistir.
- Em palavra repetida, informar que já foi encontrada e manter o estado existente.
- Em erro, limpar o estado transitório após breve feedback; não marcar letras nem alterar estatísticas.
- Tratar `pointercancel`, saída da janela e cancelamento explícito sem deixar células presas.

Usar Pointer Events, `touch-action: none` apenas na grade e, quando aplicável, `setPointerCapture` para o gesto continuar consistente em telas de toque.

### 6.2 Seleção por clique

O clique-clique deve ser compatível com a seleção por arraste e usar o mesmo resolvedor: primeiro clique define o início, segundo clique define o fim e valida o segmento. A implementação precisa distinguir um clique simples de um gesto de arraste para que `pointerup` não apague o início antes do evento `click` seguinte.

`Escape` cancela uma seleção pendente. Uma nova seleção não pode sobrescrever ou apagar células encontradas.

### 6.3 Teclado

- Manter roving `tabindex`: uma célula com `0`, demais com `-1`.
- Setas movem foco dentro dos limites da grade; não podem saltar uma linha ao atravessar a primeira/última coluna.
- `Enter` ou `Espaço` marca o início e, na confirmação seguinte, o fim.
- `Escape` cancela a seleção.
- Anunciar mensagens pela região `aria-live="polite"` sem repetir o conteúdo completo da grade.

### 6.4 Dicas

`nextHint()` devolve o alvo e a primeira coordenada disponível. O controlador deve:

1. Ignorar a ação se a partida terminou ou não houver alvos restantes.
2. Incrementar `hintsUsed` somente quando uma dica válida for aplicada.
3. Destacar a célula com o estado de dica, sem marcá-la como palavra encontrada.
4. Atualizar contador e mensagem acessível.
5. Desabilitar o botão após três usos e persistir o contador.

### 6.5 Progresso e conclusão

O progresso é derivado de `foundWordIds.length` e `game.targets.length`. A conclusão ocorre uma única vez quando todos os alvos forem encontrados. Registrar duração e estatísticas, atualizar streak somente no modo diário e apresentar um estado final com tempo, dicas usadas e confirmação de conclusão.

## 7. Acessibilidade e semântica

- Botões e campos devem ter nomes acessíveis; células informam linha, coluna e letra.
- Manter foco visível e ordem de tabulação previsível.
- A grade usa semântica de grid/células e expõe seleção (`aria-selected`) quando apropriado.
- A palavra encontrada é indicada por cor, risco e símbolo, não apenas por cor.
- Mensagens de acerto, erro, dica e progresso são anunciadas em uma região viva.
- Não mover foco automaticamente após uma seleção sem necessidade.
- O alvo de toque deve ter área suficiente e não depender de precisão perfeita.
- Validar com teclado, leitor de tela disponível e preferências de movimento reduzido.

## 8. Navegação e telas

A navegação já desenhada no cabeçalho deve ser ligada a ações reais:

- **Desafio diário:** iniciar ou restaurar a partida da data atual.
- **Partida livre:** oferecer idioma e tamanho antes de gerar nova seed.
- **Estatísticas:** exibir totais e streak armazenados localmente.

Ao alternar modo, idioma ou tamanho, atualizar título, data, tabuleiro, lista, progresso e estado sem misturar resultados da partida anterior. O modo livre nunca atualiza streak. Instruções e configurações podem ser adicionadas sem deslocar a grade da tela principal.

## 9. Segurança de dados e privacidade

- Nenhuma informação de jogo deve ser enviada a um servidor externo.
- Não incluir analytics, rastreadores ou requisições remotas no runtime.
- Tratar o conteúdo de `localStorage` como entrada não confiável e saneá-lo antes do uso.
- Nunca executar HTML recebido de palavras ou estado; inserir texto usando `textContent`.
- Se a persistência falhar, a partida continua em memória com aviso não bloqueante.

## 10. Estado atual e pendências de integração

### Implementado

- Gerador procedural determinístico, validação de grade e direções horizontal, vertical e diagonal em `js/generator.js`.
- Normalização, PRNG, seleção de linha/reverso, vocabulários, helpers de dica, data, storage e estatísticas em módulos isolados.
- Controlador `js/main.js` integra desafio diário e partida livre PT/EN, tamanhos configuráveis, cronômetro, restauração, dica, conclusão, estatísticas e tema.
- Grade e lista são renderizadas a partir dos alvos gerados; o desafio diário usa oito alvos definidos e a lista inglesa correspondente.
- Seleção por clique-clique, arraste/toque e teclado, com erro transitório, acerto permanente, tratamento de cancelamento e estados ARIA separados.
- Diálogos para partida livre, instruções, estatísticas, reinício e conclusão.
- Testes Node para geração PT/EN em 8×8, 10×10 e 12×12, seleção diagonal/reversa, normalização, persistência, dicas e streak.
- Interface responsiva, tema claro/escuro/sistema, data local e persistência sob `cacapalavras:v1`.

### Gaps conhecidos

- A seleção por coordenadas descrita no `PROJETO_TECNICO.md` não foi incluída: a decisão de interação é formar palavras diretamente pelas letras, sem campos de coordenadas.
- Não existe suíte automatizada de navegador no repositório; os fluxos principais foram verificados manualmente no navegador. `npm test` cobre os módulos de domínio.
- A lista diária é fixa para preservar os oito alvos solicitados; a ampliação futura para seleção de palavras do dicionário pode tornar os alvos diários variáveis por seed.
- Ainda é necessária revisão manual com leitor de tela e confirmação de contraste nos temas e tamanhos de viewport estabelecidos.

## 11. Plano de implementação

1. **Endurecer testes de interface:** automatizar clique-clique, arraste, cancelamento, conclusão, retomada e falha de storage.
2. **Revisar acessibilidade:** testar leitor de tela, contraste de ambos os temas e navegação completa por teclado.
3. **Ampliar o desafio diário:** decidir se os alvos permanecem fixos ou passam a ser selecionados do dicionário por seed, atualizando o contrato de produto.
4. **Conferir dispositivos:** validar toque e layout nos breakpoints descritos nesta especificação.

Cada etapa deve manter os módulos de domínio sem dependência de DOM e concluir seus testes antes da seguinte.

## 12. Testes e critérios de aceite

### Testes automatizados existentes

```bash
npm test
```

A suíte deve continuar cobrindo normalização, PRNG, datas/streak, storage, dicas, estatísticas, geração e seleção. Novos testes devem ser adicionados junto ao módulo responsável.

### Critérios adicionais de aceite

- Para uma seed, idioma e tamanho iguais, grade e alvos são idênticos.
- Todo alvo listado existe na grade e cada célula marcada pertence à palavra validada.
- Uma palavra encontrada permanece destacada depois de outras tentativas.
- Seleção inválida não altera palavras encontradas nem progresso.
- Clique-clique, arraste, toque e teclado resolvem a mesma linha e aceitam reversos.
- Dicas não revelam palavras já encontradas e param em três usos.
- A conclusão é registrada uma única vez; partida livre não altera streak.
- Reload restaura o desafio diário incompleto quando a persistência está disponível.
- Não há rolagem horizontal de 320 a 1920 px nem sobreposição entre grade e lista.
- Falhas de `localStorage` não impedem jogar.
- Não há requisições externas em runtime.

A conformidade WCAG completa não é reivindicada pelo MVP; a revisão manual de teclado e leitor de tela é necessária além dos testes automatizados.
