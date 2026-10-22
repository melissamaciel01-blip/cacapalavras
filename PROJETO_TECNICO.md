# Projeto Técnico — Caça-Palavras Web

**Versão:** 1.0  
**Data:** 20/10/2026  
**Requisitos:** [PRD.md](./PRD.md)  
**Interface escolhida:** 02 · Acesso, implementada em [index.html](./index.html)

## 1. Objetivo e estado atual

O MVP está implementado em HTML, CSS e JavaScript nativos. A interface preserva a direção escolhida: alto contraste, foco visível, grade como foco principal e seleção direta das letras por clique, arraste/toque e teclado. A lógica é distribuída entre módulos puros em `js/` e o controlador da interface em `js/main.js`.

O jogo inclui geração determinística, desafio diário, partida livre, dicas, persistência local, estatísticas e streak. A seleção por coordenadas foi intencionalmente excluída para manter a interação diretamente na grade.

### Princípios

- O desafio diário é a ação principal; partida livre, estatísticas e instruções continuam acessíveis.
- Regras de geração, seleção, datas e streak ficam em funções independentes da interface e testáveis sem DOM.
- O estado da partida é a única fonte para a grade, lista, dicas, progresso e conclusão.
- Dados ficam exclusivamente no navegador. O jogo não inclui telemetria, backend ou requisições externas em runtime.
- Nenhum estado depende apenas da cor, do arraste ou da precisão motora.

## 2. Interface escolhida: 02 · Acesso

### Hierarquia

1. Cabeçalho compacto: marca e acesso ao desafio diário, partida livre e estatísticas.
2. Data e modo, título da partida e streak em posição secundária.
3. Progresso `X de Y palavras` e dimensão da grade.
4. Grade como foco principal; botão de dica e contador próximos dela.
5. Lista de palavras sempre visível, encontrada riscada e marcada com indicação adicional.
6. Acesso às instruções e aos atalhos de teclado sem substituir a grade.

### Tokens visuais do protótipo

| Uso | Claro |
|---|---|
| Fundo | `#EDF2EF` |
| Superfície | `#FFFFFF` |
| Texto | `#111B18` |
| Texto secundário | `#43514B` |
| Borda | `#78877F` |
| Ação/seleção | `#075B45` |
| Palavra encontrada | `#A8DDC1` |
| Dica | `#F7ED8B` |
| Foco | `#064FC2` |

Extrair cores para propriedades customizadas CSS e criar equivalentes no tema escuro. Tema inicial segue `prefers-color-scheme`; uma escolha manual persistida prevalece. Verificar contraste de texto, controles, bordas relevantes e estados nos dois temas. Diferenciar seleção, encontrada e dica também por contorno, risco, símbolo e mensagem.

### Responsividade

- Desktop: grade à esquerda e palavras/controles à direita.
- Até o breakpoint visual definido na implementação (760 px): coluna única, grade primeiro e lista abaixo.
- Testar em 320, 375, 768, 1280 e 1920 px, sem rolagem horizontal.
- Manter grade quadrada e dimensões das células estáveis. As letras podem se adaptar ao espaço interno.

## 3. Escopo

### MVP

- Desafio diário PT/EN, determinístico, em grade 10×10.
- Partida livre em PT/EN, tamanhos 8×8, 10×10 e 12×12.
- Geração procedural, normalização de acentos, seleção nas oito direções, palavras encontradas, dicas, conclusão, streak e estatísticas locais.
- Retomada do desafio diário inacabado.
- Seleção por arraste/toque, clique no início e fim e teclado. Coordenadas não fazem parte da interação escolhida.
- Instruções, tema claro/escuro e interface responsiva.

### Fora do MVP

Contas, sincronização, anúncios, monetização, multiplayer, ranking remoto, PWA e envio de dados a servidores externos.

## 4. Organização de módulos

```text
cacapalavras/
├── index.html
├── js/
│   ├── main.js       # estado da sessão, DOM, eventos e navegação
│   ├── settings.js   # preferências padrão e limites por tamanho
│   ├── normalize.js  # normalização de palavras
│   ├── prng.js       # hash e aleatoriedade determinística
│   ├── dictionary.js # vocabulários PT/EN
│   ├── generator.js  # geração e validação da grade
│   ├── selection.js  # resolução de linhas e correspondência
│   ├── hints.js      # escolha de alvo para dica
│   ├── daily.js      # data local, seed e streak
│   ├── stats.js      # métricas e formatação do tempo
│   └── storage.js   # leitura, saneamento e gravação local
└── tests/            # testes de domínio executados pelo Node.js
```

Usar módulos ES. `main.js` compõe a interface e delega regras aos módulos de domínio. Gerador, seleção, data/streak, dica e storage não dependem do DOM.

| Módulo | Contrato/responsabilidade |
|---|---|
| `normalize.js` | `normalize(value) -> string`: remover diacríticos, converter para maiúsculas e remover não A–Z. A grafia original continua na lista. |
| `prng.js` | Hash determinístico de seed e PRNG `() => number`, sem ler relógio nem usar `Math.random()` durante a geração. |
| `dictionary.js` | Arrays PT/EN em minúsculas, sem espaços e deduplicados pela forma normalizada. |
| `generator.js` | `generateGame({seed, lang, size, dictionary}) -> GameDefinition`; determinístico, com limite e fallback. |
| `selection.js` | Recebe células inicial/final, resolve linha reta e compara palavra normalizada ou reversa com alvos. |
| `daily.js` | Data local, seed do dia, retomada, transição e reinício do streak. |
| `hints.js` | Primeira palavra ainda não encontrada em ordem determinística; devolve célula inicial e contador. |
| `storage.js` | Leitura/gravação versionada, validação, migração e tolerância a falha de storage. |
| `main.js` | Controla o estado da sessão, inicializa modos, liga eventos, atualiza DOM e integra os módulos. |

## 5. Modelo de dados

### Definição de partida

```js
{
  id: "daily:2026-10-20:pt:10",
  mode: "daily", // "daily" | "free"
  date: "2026-10-20", // data local, somente diário
  lang: "pt", // "pt" | "en"
  size: 10, // 8 | 10 | 12
  seed: 123456789,
  grid: [["A", "B"]], // matriz size × size em runtime
  targets: [{
    display: "janela",
    normalized: "JANELA",
    cells: [{ row: 0, col: 0 }]
  }]
}
```

`cells` guarda todas as coordenadas reais do alvo na grade e é usada para destacar palavra encontrada e dica. O exemplo mostra apenas a forma do objeto.

### Estado da sessão

```js
{
  game: null,
  foundWordIds: [],
  hintsUsed: 0,
  startedAt: 0,
  elapsedSeconds: 0,
  selection: { start: null, end: null, source: null }
}
```

### Persistência local

Usar a chave compatível com o PRD, `cacapalavras:v1`.

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
    "2026-10-20": {
      "foundWordIds": [],
      "hintsUsed": 0,
      "startedAt": 0,
      "elapsedSeconds": 0,
      "completed": false
    }
  }
}
```

Validar dados na leitura. Estado ausente inicia uma partida nova; JSON inválido ou versão incompatível é descartado sem travar o jogo. Capturar exceções de leitura/escrita, incluindo quota indisponível: manter a sessão em memória e avisar que o progresso pode não persistir. Gravar após mudança efetiva de estado, nunca em cada movimento do ponteiro.

## 6. Geração determinística

1. Seed diária de texto: `YYYY-MM-DD:lang:size`; a recomendação é fixar o desafio diário em 10×10 para permitir comparação. Partida livre usa uma seed aleatória gerada no cliente e mantida na definição.
2. Aplicar FNV-1a à seed textual e alimentar mulberry32. Nenhuma outra fonte aleatória participa da geração.
3. Selecionar palavras distintas, filtradas pelos limites do PRD: 8×8 (6 alvos, 3–8 letras), 10×10 (8, 3–10), 12×12 (10, 4–12).
4. Enumerar posição inicial e direções horizontal, vertical e diagonal. Embaralhar candidatos com o PRNG.
5. Posicionar por backtracking. Sobreposição é aceita somente quando a letra existente coincide. Limitar tentativas a 5.000 por palavra (parâmetro inicial do PRD).
6. Se não houver solução, reduzir o número de alvos e reiniciar o posicionamento da grade. A lista exibida deve refletir a quantidade final.
7. Preencher células vazias usando distribuição de letras ponderada pela frequência do idioma.
8. Validar internamente que todos os alvos estão presentes, não há duplicatas normalizadas e não houve conflito. Só então devolver a partida.

Normalização central: por exemplo `ação` resulta em `ACAO`; a lista continua exibindo `ação`. A função é compartilhada por dicionário, geração e seleção.

## 7. Seleção e entradas acessíveis

### Ponteiro/toque e clique-clique

- Pointer Events: `pointerdown`, `pointermove`, `pointerup` e `pointercancel`; capturar ponteiro ao iniciar arraste.
- Para início `a` e fim `b`, a seleção é válida se `deltaRow === 0`, `deltaCol === 0` ou `abs(deltaRow) === abs(deltaCol)`. Percorrer a linha pelos passos normalizados do vetor.
- Destacar células transitórias durante o movimento. Ao soltar, concatenar letras e testar alvo normalizado e reverso.
- Acerto novo: marcar todas as células, riscar a palavra, atualizar progresso e persistir. Palavra repetida: anunciar “já encontrada”. Erro: remover destaque transitório e informar sem penalidade.
- Clique no início seguido de clique no fim chama o mesmo resolvedor. `Escape` cancela uma seleção pendente.

### Teclado

Usar roving `tabindex`: somente a célula ativa tem `tabindex="0"`; as demais, `-1`.

- Setas: mover foco sem iniciar ou confirmar seleção.
- `Enter` ou `Espaço`: marcar a célula inicial; na segunda confirmação, validar o fim.
- `Escape`: cancelar seleção atual.
- Não prender foco ao limite da grade; quando o movimento não for válido, mantê-lo na célula corrente.

### Decisão de interação

A entrada é feita diretamente pelas letras, usando clique-clique, arraste/toque ou teclado. Campos para selecionar coordenadas não fazem parte do jogo: foram omitidos para preservar a interação natural de caça-palavras solicitada para esta interface.

### Semântica e feedback

Representar a grade com `role="grid"`, linhas `role="row"` e células `role="gridcell"`; expor contagem de linhas/colunas, nome por célula e `aria-selected` durante seleção. Células encontradas e estado da lista devem comunicar o estado além da cor/risco. Uma região `aria-live="polite"` anuncia mensagens breves de erro, palavra encontrada, dica, progresso e conclusão; não anunciar a grade toda a cada movimento. Manter foco visível em todos os controles e ordem de foco coerente.

## 8. Dicas, tempo e conclusão

- Máximo de três dicas por partida. Escolher a próxima palavra ainda não encontrada em ordem alfabética; revelar sua primeira célula, sem removê-la da lista.
- Exibir usos restantes. No limite, desabilitar a ação, manter o rótulo e explicar o limite em texto acessível.
- Cronometrar com `performance.now()` durante sessão ativa; persistir segundos acumulados. Retomar sem somar o período com a página fechada (decisão recomendada).
- Concluir quando todos os alvos forem encontrados; proteger contra registro duplicado. Mostrar tempo, alvos, dicas usadas e, no diário, streak atualizado.
- Usar `<dialog>` nativo ou modal acessível: foco no título/primeiro controle, contenção de foco, Escape quando não houver ação destrutiva pendente e devolução ao controle que abriu o diálogo.

## 9. Diário, streak e estatísticas

- Calcular `YYYY-MM-DD` com componentes locais do navegador, não com `toISOString()`.
- Comparar datas por número de dia construído a partir dos componentes e UTC, evitando erro em dias de 23/25 horas por horário de verão.
- Conclusão diária única: se última data foi ontem, incrementar; se foi hoje, não incrementar outra vez; se anterior a ontem, iniciar streak em 1. Atualizar recorde e última data.
- Partida livre pode contar em jogos/tempo total, mas nunca altera streak ou diários concluídos.
- Ao voltar no mesmo dia, regenerar a grade determinística e restaurar palavras, dicas e tempo. Reinício do dia exige confirmação e afeta apenas progresso incompleto atual.

## 10. Estado e próximos passos

O jogo funcional está conectado em `index.html` e `js/main.js`; as regras reutilizam módulos independentes para geração, seleção, dicas, data, streak, estatísticas e persistência. A suíte atual é executada com `npm test`.

Próximos passos de qualidade:

1. Automatizar testes de navegador para arraste, clique-clique, cancelamento, conclusão, restauração e falhas de storage.
2. Validar contraste e navegação com leitor de tela nos temas disponíveis.
3. Decidir se os oito alvos diários definidos devem continuar fixos ou variar por data/seed; manter lista e grade derivadas da mesma definição.
4. Testar interações por toque nos breakpoints de 320, 375, 768, 1280 e 1920 px.

## 11. Testes e critérios de aceite

### Testes unitários (Node.js)

- Normalização: diacríticos, cedilha, caixa, espaços e símbolos.
- PRNG: sequência reproduzível, intervalo `[0, 1)` e seeds distintas.
- Gerador: PT/EN × 8×8/10×10/12×12; presença dos alvos, ausência de conflito e duplicata, determinismo, fallback e grade 12×12 abaixo de 300 ms.
- Seleção: três eixos, reverso, célula isolada, bordas, vetor inválido e palavra inexistente.
- Dica: ordem determinística, alvos encontrados ignorados e limite três.
- Diário: data local, ano novo, dias consecutivos, dia perdido e conclusão repetida.
- Storage: ausente, válido, inválido, versão incompatível e falha de escrita.

### Verificação de interface

- Fluxos diários, livre, dica, estatísticas, conclusão, persistência, seleção e responsividade foram verificados manualmente no navegador durante a integração.
- Não há suíte automatizada de navegador neste repositório; `npm test` executa os testes dos módulos de domínio.
- Seleção por coordenadas não é requisito de interface nesta implementação.
- Revisão manual com leitor de tela e cobertura de todos os breakpoints permanecem como validação adicional.

Automação não substitui uma revisão manual de teclado e leitor de tela (NVDA ou VoiceOver, quando disponível). A conformidade a WCAG completa não é reivindicada pelo escopo do PRD; os critérios acima são requisitos mínimos verificáveis para esta interface.

## 12. Decisões abertas e recomendações

- **Tamanho do diário:** fixar em 10×10 é recomendado para que o desafio seja comparável; tamanhos configuráveis ficam na partida livre.
- **Cronômetro em segundo plano:** contar apenas tempo ativo da sessão, sem somar o período em que a página esteve fechada.
- **Versão do conteúdo diário:** alterações no dicionário/algoritmo podem mudar desafios. Evitar publicar mudanças incompatíveis durante o mesmo dia; documentar versão caso a comparação histórica se torne requisito.
- **Alvos diários:** o desafio atual preserva a lista fixa de oito palavras pedida para o protótipo, com tradução correspondente em inglês; uma seleção variável do dicionário requer decisão de produto.
