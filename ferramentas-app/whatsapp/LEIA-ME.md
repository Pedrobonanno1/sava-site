# Teste dos botões de WhatsApp (computador com o WhatsApp Web instalado como app)

## O problema que já voltou duas vezes (06/11 e 12/11/2026)

Quem tem o WhatsApp Web instalado como app do Chrome (o Pedro tem) não abre a conversa por link comum:

- O Chrome captura todo link que **abre aba nova** em `web.whatsapp.com` (o do `wa.me`, pelo botão "Continuar para o
  WhatsApp Web", e o link direto pra `web.whatsapp.com/send`).
- O manifesto do WhatsApp pede `launch_handler: focus-existing`: o Chrome só traz pra frente a janela que já está
  aberta, **sem navegar**. Resultado: abre o WhatsApp, sem a conversa com a SAVA.
- Navegação **na mesma aba** não é capturada (é o que o botão "Abrir app" do `wa.me` faz).

## A solução no site

No computador, todo botão de WhatsApp abre numa aba nova a nossa página `/whatsapp.html?text=...`, e ela navega
sozinha (mesma aba) pra `web.whatsapp.com/send/?phone=5531984992474&text=...`. No celular segue o `wa.me`, que abre o
app. **Não trocar por link direto nem por `wa.me` no computador**: os dois quebram pra quem tem o app instalado.

## Como testar (nada aparece na tela)

```powershell
# o site servido em http://127.0.0.1:8090/ (python -m http.server 8090 na pasta do site), ou o endereço público
powershell -File oculto.ps1 -Script testar-whatsapp.mjs -Log teste.log -Perfil chrome-teste -Extras "http://127.0.0.1:8090/"
```

`oculto.ps1` roda o teste numa área de trabalho invisível do Windows. `testar-whatsapp.mjs` sobe um Chrome completo
pelo pipe de depuração (é o único jeito de usar o domínio `PWA` do DevTools: pela porta e no modo headless ele não
existe), instala o WhatsApp Web como app em janela própria com captura de links, abre o app e clica, com clique de
verdade, em:

1. um link direto pra `web.whatsapp.com/send` em aba nova (o jeito ERRADO) — esperado: nenhuma aba nova, o app parado
   em `https://web.whatsapp.com/`;
2. o "WhatsApp" e o "Quero a SAVA" do menu, o "Quero falar com a SAVA" do topo e o telefone do rodapé — esperado: uma `NOVA aba` em
   `https://web.whatsapp.com/send/?phone=5531984992474&text=...`.

O site não tem mais formulário (saiu em 12/11/2026): o contato é só pelos botões. O teste não loga no WhatsApp,
então confere até a aba chegar no endereço da conversa; abrir o chat a partir daí é do próprio WhatsApp.
