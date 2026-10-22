# Caça-Palavras

Jogo casual de **caça-palavras em grade**, feito em **HTML, CSS e JavaScript puros** (sem framework, sem build, sem backend).

- 📅 **Desafio diário** — a mesma grade para todo mundo no mesmo dia (gerada por PRNG determinístico a partir da data).
- 🎮 **Partida livre** — jogue quantas vezes quiser, escolhendo idioma e tamanho da grade.
- 🌍 **Dois idiomas** — português e inglês.
- 💡 **Dica** — destaca a primeira letra de uma palavra ainda não encontrada.
- 🔥 **Streak e estatísticas** — salvos apenas no seu navegador (`localStorage`).
- 🆓 **Gratuito e sem anúncios**, 100% offline depois de carregado.

O documento de requisitos está em [`PRD.md`](./PRD.md).

---

## Como jogar

```bash
# qualquer servidor estático serve (módulos ES exigem http://, não file://)
npm start          # python3 -m http.server 8080
# ou: npx serve .  /  php -S localhost:8080
```

Abra <http://localhost:8080>.

- **Arraste** sobre as letras para formar uma palavra.
- Ou **clique na primeira e na última letra**.
- As palavras podem estar na horizontal, vertical ou diagonal, em qualquer sentido.
- Encontre todas as palavras da lista para concluir a partida.

---

## Estrutura

```
├── index.html          # telas do jogo (menu, jogo, estatísticas, instruções)
├── css/
│   ├── themes.css      # variáveis de tema (claro/escuro)
│   └── style.css       # layout e componentes
├── js/
│   ├── main.js         # bootstrap e ligação entre os módulos
│   ├── generator.js    # geração da grade (backtracking)
│   ├── dictionary.js   # dicionários PT e EN
│   ├── prng.js         # FNV-1a + mulberry32 (aleatoriedade determinística)
│   ├── normalize.js    # acentos/caiixa
│   ├── grid.js         # renderização e seleção na grade
│   ├── words.js        # lista de palavras
│   ├── hints.js        # lógica das dicas
│   ├── daily.js        # data, seed do dia e streak
│   ├── stats.js/…      # estatísticas
│   ├── storage.js      # persistência em localStorage
│   ├── state.js        # estado global
│   └── ui.js           # navegação de telas, modal e avisos
└── tools/              # scripts de teste
```

---

## Testes

```bash
npm test           # 36.024 verificações: gerador + lógica de streak/daily
npm run test:browser   # 32 verificações de interface no Chrome headless
```

- `tools/test-generator.mjs` — valida 1.800 grades (PT/EN × 8×8/10×10/12×12):
  todas as palavras presentes, sem conflito de letras, sem duplicatas, determinismo
  da seed e tempo de geração (< 300 ms por grade de 12×12; na prática ~1 ms).
- `tools/test-daily.mjs` — datas, seed do dia e regras de streak.
- `tools/dom-smoke.html` + `tools/run-browser-tests.mjs` — simulam o jogo real no
  Chrome: arrastar, clique-clique, seleção inválida, dica, conclusão da partida,
  modal, estatísticas e troca de idioma.

---

## Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge).
- Node.js apenas para rodar os testes (o jogo não precisa de Node).
