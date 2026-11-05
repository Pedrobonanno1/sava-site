# savatecnologia.com.br — o site institucional da SAVA

Site estático publicado pelo GitHub Pages (branch `main`, raiz). O arquivo `CNAME` diz qual
domínio ele atende. Mudou algo aqui e deu push, entra no ar em ~1 minuto.

Origem: até 05/11/2026 o site vivia num HTML único "empacotado" na Netlify (site `savatech`, numa
conta que ninguém achou), que mostrava um "S" antes de carregar. Foi desempacotado em arquivos
normais na sessão de 05/11 (cópia e histórico em `lina-code`, pasta `sava/site/`).

## Git — salvar tudo, sempre (regra do Pedro, vale em todo projeto)

- Toda mudança que deixa o site funcionando vira **commit e push** na hora, sem perguntar.
- **Nunca** vai pro git: segredo e credencial, `node_modules`, saída gerada e dado real de cliente.
- Pedir confirmação só antes de force-push, reescrever histórico, apagar branch, ou trocar o `CNAME`.
- A versão completa está no repositório `Pedrobonanno1/claude-config`.
