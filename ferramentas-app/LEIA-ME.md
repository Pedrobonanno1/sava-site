# Ferramentas: as telas do app dentro do iPhone do site

O celular do site (savatecnologia.com.br) mostra o app de VERDADE: o HTML e o CSS das telas tirados do build de
produção do app (repo privado `felipesavassi1/lina-app-2`, branch `main`) e montados nos `<template id="tela-*">` e no
`<style id="app-real">` do `index.html`. Estas ferramentas vieram de `LINA Code/landing-anuncio-ferramentas` e foram
ajustadas em 11/11/2026, quando as telas foram recapturadas da main `381f5bc` (antes eram de 26/10, main `0719719`).

## Atualizar as telas quando o app mudar (Windows)

O código do app não está no GitHub do Pedro: vem do zip "LINA Code" (pasta `lina-app 2`, que tem o `.git`).

```sh
# 1. a main do app numa pasta limpa, buildada SEM backend (o app roda com a médica de exemplo)
git -C "<LINA Code>/lina-app 2" archive origin/main | tar -x -C <pasta>
cd <pasta> && npm ci
VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx vite build --outDir dist-landing
npx vite preview --host 127.0.0.1 --port 5198 --strictPort --outDir dist-landing &

# 2. daqui: captura cada estado, monta e troca os blocos gerados no index.html do site
node dom.mjs http://127.0.0.1:5198 dom/estados.json
MAIN_SHA=<sha> node montar-telas.mjs
python -I atualizar-telas.py ../index.html

# 3. confere: serve o site e percorre a demonstração com cliques de verdade
python -m http.server 8090 --bind 127.0.0.1    (na pasta do site)
node testar-demo.mjs http://127.0.0.1:8090/ <pasta-das-fotos> 1440
node testar-demo.mjs http://127.0.0.1:8090/ <pasta-das-fotos> 390
```

`dom.mjs` também salva um PNG de cada tela capturada ao lado do `estados.json`: é o jeito mais rápido de ver como o
app está hoje.

## O que mudou em 11/11/2026 (e por quê)

- `cenas.mjs` (a Dra. Ana): o app passou a exigir o aceite dos Termos (`termosUsoVersao: '1.1'`) e a tela do
  endereço (`enderecoVistoEm`); sem isso ele prende a persona no cadastro. As duas notas dela agora são do mês
  corrente (há 9 e há 4 dias), senão a Home mostra "R$ 0".
- `estados.mjs`: capturas novas das abas Financeiro (`/financeiro`) e Quem paga (`/quem-paga`); o plantão da
  Santa Casa é marcado em 19 de OUTUBRO (o mês anterior), porque o calendário abre no mês corrente.
- `dom.mjs`: espera 6 s por tela (o app de hoje demora mais pra abrir) e usa o Chrome do Windows.
- `atualizar-telas.py`: o fim do módulo da demonstração agora é o bloco "o iPhone: reto, de frente" (o aparelho
  não gira mais) e o arquivo é gravado com quebra de linha LF.
- No `index.html` (não aqui): a demonstração vive em 11/11/2026 (`HOJE`), liga as abas Financeiro e Quem paga, e
  redesenha o cartão "Minhas notas" do Financeiro e as fichas da Home quando a pessoa emite uma nota.
- A cena do celular bloqueado e o pulso ficam no próprio `index.html`; `atualizar-telas.py` não mexe neles.

Se o app mudar classe ou estrutura de uma tela, a demonstração do `index.html` pode precisar de ajuste (ela procura
`.payer-row`, `.calendario-dia`, `.key`, `.summary-row`, `.sheet`, `.fin-card`, `.ficha` etc.). O `testar-demo.mjs`
acusa: "não achei" ou erro de JavaScript.
