# savatecnologia.com.br — o site institucional da SAVA

Site estático publicado pelo GitHub Pages (branch `main`, raiz). O arquivo `CNAME` diz qual
domínio ele atende. Mudou algo aqui e deu push, entra no ar em ~1 minuto.

Desde 11/11/2026 o site É a landing do anúncio na versão clara (lp2, repo `sava-landing-2`), com o
menu (Emitir nota, Como funciona, Comparativo, Preços, Dúvidas), a seção Comparativo e o rodapé de
colunas trazidos do site antigo, a pedido do Pedro. Tudo num `index.html` só, sem build.

- A landing do anúncio continua em lp2.savatecnologia.com.br. Mudança de conteúdo (texto, preço, demo)
  vale pras duas. O que só existe aqui: menu, Comparativo, rodapé de colunas, canonical sem noindex,
  WhatsApp "vim pelo site" e `de = "site"` nas inscrições (tabela `inscricoes` da SAVA Gestão).
- O site antigo (React empacotado) está na tag `site-antigo-2026-11-11`.

Antes de 05/11/2026 o site vivia num HTML único "empacotado" na Netlify (conta que ninguém achou); de
05/11 a 11/11 foi esse pacote desempacotado (histórico em `lina-code`, pasta `sava/site/`).

## Git — salvar tudo, sempre (regra do Pedro, vale em todo projeto)

- Toda mudança que deixa o site funcionando vira **commit e push** na hora, sem perguntar.
- **Nunca** vai pro git: segredo e credencial, `node_modules`, saída gerada e dado real de cliente.
- Pedir confirmação só antes de force-push, reescrever histórico, apagar branch, ou trocar o `CNAME`.
- Publicar (push na `main`) não pede confirmação: regra do Pedro de 05/11/2026.
- A versão completa está no repositório `Pedrobonanno1/claude-config`.

## Páginas legais

Privacidade, termos e exclusão de conta moram no domínio do app (app.savatecnologia.com.br/privacidade,
/termos, /excluir-conta), que é o endereço cadastrado na App Store. Aqui os arquivos `privacidade.html`,
`termos.html` e `excluir-conta.html` só redirecionam pra lá (o GitHub Pages não faz 301; é refresh +
canonical). Não recriar o texto aqui: duas versões no ar foi exatamente o que se quis evitar (09/11/2026).
