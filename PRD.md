# PRD — Caça-Palavras (Web)

**Versão:** 1.0
**Status:** Aprovado para desenvolvimento (MVP)
**Data:** 20/10/2026
**Autor(a):** Melissa
**Projeto:** `cacapalavras`

---

## 1. Resumo executivo

Jogo casual de **caça-palavras em grade**, gratuito, executado inteiramente no navegador (HTML/CSS/JS puro, sem build e sem backend). O jogador deve localizar palavras escondidas em uma grade de letras arrastando o mouse ou o dedo.

O produto oferece dois modos:

- **Desafio diário** — uma grade por dia, idêntica para todos os jogadores do mesmo idioma, gerada de forma determinística a partir da data. É o principal motor de hábito (streak).
- **Partida livre** — o jogador escolhe idioma, tamanho da grade e joga quantas vezes quiser.

Público-alvo: adolescentes e adultos casuais. Idioma inicial: português e inglês.

---

## 2. Objetivos e metas

### 2.1 Objetivos do produto
1. Entregar uma experiência de caça-palavras que funcione de forma fluida em desktop e celular, sem instalação.
2. Criar o hábito de retorno diário por meio do desafio diário e do streak.
3. Manter a base de código 100% client-side, simples de hospedar (GitHub Pages / Netlify / Vercel) e sem custo de infraestrutura.

### 2.2 Métricas de sucesso (pós-lançamento)
| Métrica | Meta |
|---|---|
| Taxa de conclusão do desafio diário | ≥ 80% dos jogadores que iniciam |
| Tempo médio para completar (10×10) | ≤ 4 minutos |
| Retenção D1 (streak ≥ 2) | ≥ 30% |
| Retenção D7 | ≥ 10% |
| Erros de geração (grade inválida) | 0 (com fallback automático) |

> MVP não possui telemetria remota. As métricas serão aproximadas a partir das estatísticas locais do jogador.

---

## 3. Escopo

### 3.1 Dentro do escopo (MVP)
- Geração procedural de grade com palavras-alvo embutidas em PT e EN.
- Seleção de letras por clique/arraste e por clique no início + clique no fim.
- Marcação de palavras encontradas e conclusão de partida.
- Desafio diário determinístico por data.
- Partida livre com escolha de idioma e tamanho de grade.
- Dica de "primeira letra" (limitada).
- Streak diário e estatísticas locais persistidas em `localStorage`.
- Interface responsiva mínima e funcional.

### 3.2 Fora do escopo (MVP)
- Backend, contas de usuário, sincronização entre dispositivos.
- Monetização e anúncios.
- Multiplayer, ranking online e desafiadores entre amigos.
- PWA / funcionamento offline / instalação.
- Temas de palavras, categorization, sons e animações elaboradas.
- Conformidade WCAG completa (apenas acessibilidade mínima).

### 3.3 Backlog futuro (pós-MVP)
- Exportação/compartilhamento do resultado (imagem ou grid em emojis).
- Ranking online e perfil do jogador.
- Temas de palavras por dia.
- PWA com notificações de lembrete do desafio diário.
- Sons e animações de rico feedback.

---

## 4. Decisões de produto (consolidadas)

| Item | Decisão |
|---|---|
| Gênero | Caça-palavras em grade (word search) |
| Plataforma | Web — HTML, CSS e JavaScript puros, sem framework e sem build |
| Execução | Apenas navegador (sem PWA, sem offline) |
| Idiomas | Português e Inglês (dicionário + lista de palavras selecionáveis) |
| Tamanho da grade | Escolhido pelo jogador (8×8, 10×10, 12×12) |
| Direções | Horizontal, vertical e diagonais (8 sentidos) |
| Modos | Desafio diário + partida livre |
| Pontuação | Não existe. O objetivo é apenas completar a grade |
| Dicas | Destacar a primeira letra de uma palavra ainda não encontrada |
| Lista de palavras | Sempre visível; riscada quando encontrada |
| Social | Somente streak diário e estatísticas locais |
| Acessibilidade | Mínima: navegação por teclado e mouse/toque |
| Monetização | Gratuito, sem anúncios |
| Geração do diário | PRNG determinístico por data, executado no cliente |
| Temas | Nenhum; lista geral de palavras |
| Visual | Mínimo funcional |

---

## 5. Histórias de usuário

- **US-01** — Como jogador, quero que o desafio diário gere a mesma grade para todo mundo no mesmo dia, para poder comparar meu resultado com o de amigos.
- **US-02** — Como jogador, quero arrastar o mouse ou o dedo sobre a grade para selecionar uma palavra, para achar as palavras de forma natural.
- **US-03** — Como jogador, quero ver a lista de palavras que preciso encontrar, para saber o que buscar.
- **US-04** — Como jogador, quero uma dica que destaque a primeira letra de uma palavra, quando estiver travado.
- **US-05** — Como jogador, quero escolher o tamanho da grade na partida livre, para adequar ao meu tempo disponível.
- **US-06** — Como jogador, quero jogar em português ou inglês, para jogar no meu idioma.
- **US-07** — Como jogador, quero ver meu streak e minhas estatísticas, para manter a consistência de jogar.
- **US-08** — Como jogador, quero continuar uma partida diária inacabada ao voltar ao site, para não perder meu progresso.

---

## 6. Requisitos funcionais

### 6.1 Geração de grade

| ID | Requisito | Prioridade |
|---|---|---|
| RF-01 | O sistema deve gerar uma grade quadrada preenchida por letras do alfabeto do idioma selecionado. | Must |
| RF-02 | O sistema deve embutir N palavras-alvo na grade nas direções horizontal, vertical e diagonal, nos 8 sentidos. | Must |
| RF-03 | As palavras podem compartilhar letras, mas nunca devem exigir letras conflitantes na mesma célula. | Must |
| RF-04 | O número de palavras deve variar conforme o tamanho da grade (ver 7.2). | Must |
| RF-05 | A geração deve ser rápida (ver RNF-02) e nunca falhar: em caso de impossibilidade, o algoritmo reduz a quantidade de palavras, limpa a grade e tenta novamente. | Must |
| RF-06 | As palavras de uma mesma partida devem ser distintas entre si. | Must |
| RF-07 | A normalização de acentos deve ser aplicada: `A/Á/Ã/Â`, `E/É/Ê`, `I/Í`, `O/Ó/Ô/Õ`, `U/Ú`, `C/Ç` são gravadas sem acento. A lista exibe a palavra original, com acentos. | Must |
| RF-08 | O dicionário deve ser filtrado por comprimento mínimo e máximo compatíveis com a grade. | Must |
| RF-09 | O sistema deve registrar a seed usada para gerar a partida (para depuração e testes). | Should |

### 6.2 Modo Desafio Diário

| ID | Requisito | Prioridade |
|---|---|---|
| RF-10 | A seed do dia deve ser derivada de `YYYY-MM-DD` + idioma + tamanho padrão, garantindo a mesma grade para todos no mesmo idioma. | Must |
| RF-11 | A data deve ser calculada no fuso horário local do navegador do jogador. | Must |
| RF-12 | Somente uma partida diária pode ser concluída por dia; ao concluir, a próxima edição fica disponível no dia seguinte. | Must |
| RF-13 | O sistema deve informar a data do desafio em andamento. | Should |
| RF-14 | O progresso de um desafio diário inacabado deve ser salvo e restaurado ao recarregar a página. | Should |
| RF-15 | O sistema deve permitir "reiniciar" o desafio diário, zerando as palavras encontradas do dia (com confirmação em modal). | Should |

### 6.3 Modo Partida Livre

| ID | Requisito | Prioridade |
|---|---|---|
| RF-16 | O jogador deve escolher o idioma (PT/EN) antes de iniciar. | Must |
| RF-17 | O jogador deve escolher o tamanho da grade (8×8, 10×10, 12×12) antes de iniciar. | Must |
| RF-18 | O jogador deve poder iniciar uma nova partida a qualquer momento, com nova seed aleatória. | Must |
| RF-19 | A partida livre não deve alterar o streak diário. | Must |

### 6.4 Interação com a grade

| ID | Requisito | Prioridade |
|---|---|---|
| RF-20 | O jogador deve selecionar letras arrastando (mouse/touch) a partir de uma célula até outra célula. | Must |
| RF-21 | Ao arrastar, o sistema deve destacar visualmente as células selecionadas, em tempo real. | Must |
| RF-22 | Ao soltar, o sistema deve validar se a seleção é uma linha reta válida (horizontal, vertical ou diagonal) e, se não for, descartar a seleção. | Must |
| RF-23 | A seleção por clique no início + clique no fim deve ser suportada como alternativa ao arraste. | Should |
| RF-24 | Ao encontrar uma palavra, o sistema deve marcá-la permanentemente na grade (destaque de cor) e riscá-la na lista de palavras. | Must |
| RF-25 | Ao errar, o sistema deve fornecer feedback visual breve de seleção inválida, sem penalidade. | Must |
| RF-26 | O sistema deve exibir o progresso "X de Y palavras encontradas". | Must |
| RF-27 | Ao encontrar todas as palavras, o sistema deve exibir a tela de conclusão com o tempo decorrido e as estatísticas. | Must |

### 6.5 Dicas

| ID | Requisito | Prioridade |
|---|---|---|
| RF-28 | O jogador pode acionar a dica "primeira letra", que destaca na grade a primeira letra de uma palavra ainda não encontrada. | Must |
| RF-29 | O jogador dispõe de no máximo 3 dicas por partida; o contador deve ser exibido. | Must |
| RF-30 | A dica deve ser aplicada imediatamente após a ativação, sem reiniciar a partida. | Must |
| RF-31 | Ao atingir o limite, o botão deve ser desabilitado com mensagem explicativa. | Must |

### 6.6 Streak e estatísticas

| ID | Requisito | Prioridade |
|---|---|---|
| RF-32 | O sistema deve manter o contador de dias consecutivos de desafio diário concluído. | Must |
| RF-33 | O streak deve ser zerado quando o jogador deixar de concluir um dia inteiro entre duas conclusões. | Must |
| RF-34 | O sistema deve registrar: total de partidas concluídas, total de desafios diários concluídos, maior streak, tempo total jogado e último dia concluído. | Must |
| RF-35 | As estatísticas devem ser exibidas em uma tela/painel acessível a partir do menu. | Should |
| RF-36 | Todos os dados de progresso e estatísticas devem ser persistidos localmente (`localStorage`). | Must |
| RF-37 | Nenhum dado do jogador deve ser enviado a servidores externos. | Must |

### 6.7 Interface

| ID | Requisito | Prioridade |
|---|---|---|
| RF-38 | A interface deve ser responsiva e utilizável em telas de 320px a 1920px de largura. | Must |
| RF-39 | Em telas pequenas, a lista de palavras deve ficar abaixo da grade; em telas grandes, ao lado. | Should |
| RF-40 | O botão de dica deve estar sempre acessível, próximo à grade. | Must |
| RF-41 | Deve existir uma tela inicial (menu) com: modo diário, modo livre, troca de idioma, estatísticas e instruções. | Must |
| RF-42 | Deve existir uma tela de instruções explicando seleção, direções e objetivo. | Should |
| RF-43 | O tema claro e o tema escuro devem ser suportados, com detecção da preferência do sistema. | Should |

---

## 7. Regras de jogo e parâmetros

### 7.1 Direções permitidas
Horizontal (→, ←), vertical (↓, ↑) e diagonal (↘, ↙, ↗, ↖). A seleção do jogador deve ser sempre em linha reta; palavras em sentido inverso são aceitas na leitura do jogador.

### 7.2 Configuração por tamanho de grade

| Tamanho | Nº de palavras | Comprimento mínimo | Comprimento máximo |
|---|---|---|---|
| 8×8 | 6 | 3 | 8 |
| 10×10 | 8 | 3 | 10 |
| 12×12 | 10 | 4 | 12 |

**Tamanho padrão do desafio diário:** 10×10.

### 7.3 Dicionário
- Um dicionário por idioma, em código (array de strings), com acentuação original.
- Palavras devem ser relacionadas/comuns, sem conteúdo ofensivo.
- Meta de cobertura inicial: ≥ 300 palavras por idioma, com distribuição equilibrada de comprimentos.
- Palavras devem ser mantidas em lowercase e sem espaços.

### 7.4 Normalização
Função única de normalização (`js/normalize.js`) aplicada à palavra, à letra da grade e à seleção do jogador:

```
NÃO Acentuação: A Á À Â Ã E É Ê I Í O Ó Ô Õ U Ú C Ç → A E I O U C
NÃO Caixa      → maiúsculas
NÃO Outros     → qualquer caractere que não seja A–Z é removido
```

A palavra exibida na lista permanece com a grafia original (minúscula, com acentos).

### 7.5 Dicas
Ao acionar a dica, o sistema escolhe a primeira palavra (em ordem alfabética, por determinismo) ainda não encontrada, destaca sua primeira célula na grade com um estilo visual distinto e conta 1 de 3 usos. A palavra permanece na lista, apenas com a inicial revelada.

### 7.6 Conclusão
A partida é concluída quando o número de palavras encontradas iguala o total de palavras da partida. A tela final exibe: tempo decorrido, palavras encontradas, dicas usadas e, se for o desafio diário, a atualização do streak.

---

## 8. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | O jogo deve funcionar nos navegadores Chromium, Firefox, Safari e Edge nas duas versões mais recentes. |
| RNF-02 | A geração de uma grade 12×12 deve ser concluída em menos de 300 ms em dispositivos de médio porte. |
| RNF-03 | A interface deve responder ao toque em menos de 100 ms, sem perceptible delay entre o arraste e o destaque das células. |
| RNF-04 | O jogo deve ser responsivo, sem rolagem horizontal, entre 320px e 1920px. |
| RNF-05 | O código deve ser organizado em módulos ES (`type="module"`), sem dependências externas. |
| RNF-06 | Deve haver um caminho de teste unitário para a geração da grade, validação de seleção e cálculo de streak. |
| RNF-07 | Nenhuma requisição de rede é feita em runtime (exceto carregamento dos arquivos estáticos do jogo). |
| RNF-08 | O código deve seguir boas práticas de acessibilidade mínima: `label` em todos os controles, foco visível, textos com contraste adequado. |

---

## 9. Modelo de dados (localStorage)

Chave: `cacapalavras:v1`

```json
{
  "prefs": {
    "lang": "pt",
    "size": 10,
    "theme": "system"
  },
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
      "found": ["palavra1", "palavra2"],
      "hintsUsed": 1,
      "startedAt": 1760000000000
    }
  }
}
```

Regras:
- Ao concluir o diário de um dia: `currentStreak++`, `bestStreak = max(bestStreak, currentStreak)`, `lastDailyDate = data de hoje`.
- Ao abrir o jogo e `lastDailyDate` for anterior a ontem: `currentStreak = 0`.

---

## 10. Especificação do algoritmo de geração

1. **Seed:** `hash = fnv1a(seedTexto + ":" + lang + ":" + size)`; PRNG = `mulberry32(hash)`.
2. **Seleção de palavras:** filtrar dicionário por comprimento e faixa de dificuldade; embaralhar com o PRNG; selecionar N palavras distintas.
3. **Posicionamento (backtracking):**
   - Para cada palavra, gerar todas as posições válidas (célula inicial + direção) que caibam na grade.
   - Embaralhar as posições candidatas com o PRNG.
   - Testar cada posição: cada célula vazia recebe a letra; cada célula já ocupada precisa ter a mesma letra. Em caso de incompatibilidade, fazer backtrack.
   - Limite de iterações: 5.000 por palavra; ao exceder, reduzir o número de palavras restantes e recomeçar a placement da palavra atual.
4. **Preenchimento:** células vazias recebem letras aleatórias do alfabeto do idioma, ponderadas pela frequência de letras do próprio dicionário (para que a grade "pareça" natural).
5. **Validação final:** verificar que todas as palavras estão presentes nas direções permitidas e que não há duplicatas.

---

## 11. Arquitetura sugerida

```
cacapalavras/
├── index.html
├── css/
│   ├── style.css
│   └── themes.css
├── js/
│   ├── main.js          # bootstrap e roteamento de telas
│   ├── state.js         # estado global + persistência
│   ├── storage.js       # localStorage (leitura/escrita/migração)
│   ├── prng.js          # fnv1a + mulberry32
│   ├── normalize.js     # normalização de acentos/lowercase
│   ├── dictionary.js    # dicionários PT e EN
│   ├── generator.js     # geração da grade (backtracking)
│   ├── grid.js          # renderização e seleção na grade
│   ├── words.js         # lista de palavras e estado de encontrados
│   ├── hints.js         # lógica de dicas
│   ├── daily.js         # desafio diário, seed e streak
│   ├── stats.js         # estatísticas e tela de resultados
│   └── ui.js            # componentes e transições de tela
└── assets/              # ícones, sons (futuro)
```

Padrão: módulos ES, funções puras para `prng`, `normalize`, `generator` e `streak` (facilitam testes), estado compartilhado em um objeto simples (`state.js`) com funções de atualização.

---

## 12. Fluxos principais

### 12.1 Menu inicial
```
Menu ──► Desafio diário ──► (jogo) ──► Conclusão ──► Menu
  │                              ▲
  └──► Partida livre ───────────┘
        (idioma + tamanho)
Menu ──► Estatísticas
Menu ──► Instruções
```

### 12.2 Seleção de palavra
```
pointerdown em célula ──► inicia seleção
pointermove ──► destaca células na linha reta
pointerup ──► valida:
   ├── é palavra-alvo e não encontrada? ──► marca encontrada (grade + lista)
   ├── é palavra-alvo já encontrada? ──► feedback "já encontrada"
   └── não é palavra? ──► feedback de seleção inválida
```

---

## 13. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Dicionário pequeno gera grades repetitivas | Médio | Ampliar dicionários; exibir seed na depuração |
| Geração lenta em grades grandes | Alto | Limite de iterações, backtracking, cache de PRNG |
| Acentos confusam o jogador | Médio | Normalização única + exibição da palavra original; dica explica |
| Jogador abandona o diário sem querer | Médio | Salvar progresso do dia; restaurar ao voltar |
| Detecção de dia no fuso horário incorreta | Baixo | Usar data local (`new Date()`), não UTC |
| Interface confusa em telas pequenas | Médio | Testar em 320px; lista abaixo da grade |

---

## 14. Plano de implementação (sugestão)

1. **Fase 1 — Fundação:** `index.html`, CSS base, `prng.js`, `normalize.js`, `dictionary.js` (listas iniciais).
2. **Fase 2 — Geração:** `generator.js` + script de teste em console que valida 1.000 grades aleatórias sem conflito.
3. **Fase 3 — Jogo:** `grid.js` (render + seleção), lista de palavras, contador de progresso, tela de conclusão.
4. **Fase 4 — Modos:** `daily.js` (seed por data, streak) e partida livre com escolhas de idioma/tamanho.
5. **Fase 5 — Extras:** dicas, estatísticas, instruções, tema escuro.
6. **Fase 6 — Polimento:** responsividade, feedback visual, acessibilidade mínima, revisão de textos.

---

## 15. Critérios de aceite do MVP

Estado de verificação em 22/10/2026. A suíte automatizada disponível é `npm test`; não há script ou ferramentas de teste de navegador neste repositório. Os fluxos abaixo foram verificados manualmente no navegador onde indicado.

- [x] A interface abre diretamente no jogo, com navegação para desafio diário, partida livre, estatísticas e instruções.
- [x] A partida livre permite escolher idioma e tamanho e gera os alvos na grade.
- [x] Clique-clique e arraste foram verificados para encontrar palavras.
- [x] Palavras encontradas ficam marcadas na grade e riscadas na lista.
- [x] A conclusão exibe tempo, dicas usadas, alvos encontrados e streak diário.
- [x] Dicas destacam uma letra e param no limite de três usos.
- [x] A seed diária usa data local e é determinística por data, idioma e tamanho.
- [x] Conclusão do desafio diário atualiza streak; partidas livres não alteram o streak.
- [x] Progresso diário e estatísticas persistem em `localStorage`.
- [x] A viewport móvel foi verificada sem rolagem horizontal em 360 px de largura.
- [ ] Testes automatizados de navegador, comparação entre navegadores e validação completa nos breakpoints continuam pendentes.

---

## 16. Questões em aberto

1. O tamanho da grade do desafio diário deve ser fixo em 10×10 ou o jogador pode alterá-lo (afetando a comparação entre jogadores)?
2. O vocabulário do dicionário deve ser mais restrito (palavras de 4–8 letras, mais fácil) ou amplo (3–12 letras, mais difícil)?
3. Deve haver um ranking semanal local (recorde de tempo por tamanho)?
4. Deve existir um sistema de categorias/word packs para download futuro?

---

## 17. Registro de implementação (v1.1)

Implementação atualizada em 22/10/2026, baseada nos módulos de domínio existentes e no design 02 · Acesso.

### Entregue
- Gerador de grades com backtracking, PRNG determinístico (FNV-1a + mulberry32) e preenchimento por frequência de letras.
- Dicionários PT/EN, gerador determinístico com backtracking e preenchimento ponderado.
- Jogo em `index.html`, controlado pelo módulo `js/main.js`, com desafio diário e partida livre.
- Desafio diário com oito alvos fixos por idioma; em português, a lista inclui janela, floresta, planeta, caminho, viagem, caderno, brisa e estrela.
- Partida livre com escolha de idioma (PT/EN) e tamanho (8×8, 10×10, 12×12).
- Seleção por arraste/toque, clique-clique e teclado, nas direções retas válidas, incluindo reversos.
- Dicas (3 por partida), cronômetro, conclusão, streak, estatísticas e persistência local.
- Diálogos nativos para configurações da partida livre, instruções, estatísticas, reinício e conclusão.
- Tema claro/escuro/sistema, estado de foco e responsividade da grade.

### Testes automatizados
| Suíte | Cobertura | Resultado atual |
|---|---|---|
| `npm test` | 15 testes de normalização, PRNG, datas/streak, storage, dicas, estatísticas, dicionários, geração e seleção | ✅ 15/15 |
| Navegador integrado | Acerto por clique-clique/arraste, dica, partida livre, tamanhos, reload, conclusão e viewport móvel | ✅ verificação manual |

### Divergências do PRD
| Item | PRD | Implementação | Motivo |
|---|---|---|---|
| Normalização | minúsculas | maiúsculas | Simplifica a comparação com as células da grade, que já são maiúsculas |
| Confirmação de reinício | confirmação genérica | modal próprio | `window.confirm` bloqueia a execução e quebra testes automatizados |
| Seleção por coordenadas | documentada no projeto técnico anterior | não oferecida | A interação escolhida é selecionar diretamente as letras da grade |
| Lista diária | vocabulário geral selecionado pela seed | oito alvos fixos por idioma | Preserva as palavras apresentadas no protótipo e garante que PLANETA esteja na grade PT |

### Pendências
- Testes automatizados de interface e compatibilidade em mais de um navegador.
- Revisão manual completa com leitor de tela e contraste.
- Decidir se os alvos diários devem permanecer fixos ou variar a cada data.
- Backlog futuro permanece como na seção 3.3.
