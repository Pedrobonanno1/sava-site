# O site no celular: como conferir

Em 12/11/2026 o site foi acertado pra tela de celular (pedido do Pedro: "perfeito pra quem abrir no celular"). O que
existe só no celular, e onde mora no `index.html`:

| O quê | Onde |
|---|---|
| Topo de uma linha (marca + botão de menu) e painel das seções com linhas de 60px | CSS "topo", `@media (max-width: 899px)`; script "menu do celular" |
| Sem "Quero a SAVA" no topo: o chamado é o botão do hero e depois a barra fixa de baixo | idem |
| A barra de baixo some enquanto o celular da demonstração ocupa a tela | script "barra fixa" |
| "Como funciona": o desenho em pé (`.fluxo-v`), no lugar do deitado que aparecia cortado | CSS "como funciona", `@media (max-width: 719px)` |
| Conferência do mês: cada médico em duas linhas, com a situação à vista | CSS "o celular", `@media (max-width: 560px)` |
| Os 4 passos da nota: carrossel de arrastar, aparelhos de frente, pontos embaixo | CSS "o celular", `@media (max-width: 900px)`; script dos quatro passos |
| Rodapé: Navegação e Legal lado a lado, links com 44px de altura | CSS "rodapé", `@media (max-width: 560px)` |
| Salto de âncora para abaixo do topo fixo | `html { scroll-padding-top }` |

## Testar (nada aparece na tela)

Um Chrome escondido na porta 9444 e o site servido em `http://127.0.0.1:8090/`:

```sh
"C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --remote-debugging-port=9444 --user-data-dir=<pasta temporária> about:blank &
python -m http.server 8090 --bind 127.0.0.1     # na pasta do site

node auditar.mjs http://127.0.0.1:8090/ 390 <pasta-das-fotos> 1   # fotos de tela em tela + medições (360, 390, 430)
node interacoes.mjs http://127.0.0.1:8090/ 390 <prefixo-das-fotos>  # toques de verdade: menu, dúvidas, barra, carrossel…
```

`auditar.mjs` acusa estouro lateral, alvos de toque menores que 40px e letras abaixo de 12,5px (os rótulos em caixa
alta de 12px e a hora das mensagens ficam assim de propósito). `interacoes.mjs` escreve `ok` ou `FALHA` por item.
A demonstração do aparelho tem teste próprio: `../testar-demo.mjs <url> <pasta> 390`.
