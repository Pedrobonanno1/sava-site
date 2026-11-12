// node interacoes.mjs <url> <largura> <prefixo> — confere, com toque de verdade, o que só existe no celular.
import fs from 'node:fs'
const [, , url, larg = '390', prefixo] = process.argv
const W = Number(larg), H = W <= 360 ? 740 : 844
const t = await (await fetch('http://127.0.0.1:9444/json/new?about:blank', { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const p = new Map(); const erros = []
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === 'Runtime.exceptionThrown') erros.push(d.params.exceptionDetails.exception?.description?.split('\n')[0]); if (d.id && p.has(d.id)) { p.get(d.id)(d); p.delete(d.id) } }
const send = (method, params = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const foto = async (nome) => { const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 }); fs.writeFileSync(`${prefixo}-${nome}.jpg`, Buffer.from(s.result.data, 'base64')) }
const toque = async (x, y) => { await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await espera(700) }
const tocar = async (sel) => { const r = JSON.parse(await ev(`(()=>{const e=${sel};if(!e)return 'null';const b=e.getBoundingClientRect();return JSON.stringify({x:b.x+b.width/2,y:b.y+b.height/2})})()`)); if (!r) return console.log('  ! não achei', sel); await toque(r.x, r.y) }
const barra = async () => !(await ev("document.querySelector('#barra').classList.contains('some')"))
const ok = (nome, cond, extra = '') => console.log((cond ? '  ok   ' : '  FALHA ') + nome + (extra ? ' — ' + extra : ''))
await new Promise((r) => (ws.onopen = r))
await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true })
await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' })
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true })
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
await send('Page.navigate', { url }); await espera(3500)
await ev("document.documentElement.style.scrollBehavior='auto'")
console.log(`== largura ${W}`)

// 1. menu
await tocar("document.querySelector('#menuBotao')")
ok('menu abre no toque', await ev("document.querySelector('.topo').classList.contains('aberto')"))
ok('página não rola por trás do menu', (await ev("getComputedStyle(document.documentElement).overflow")) === 'hidden')
const painel = JSON.parse(await ev("(()=>{const r=document.querySelector('#menu').getBoundingClientRect();return JSON.stringify({b:r.bottom,h:innerHeight})})()"))
ok('painel cabe na tela', painel.b <= painel.h, `termina em ${Math.round(painel.b)} de ${painel.h}`)
await toque(W / 2, Math.min(H - 20, painel.b + 60))
ok('menu fecha no toque fora', !(await ev("document.querySelector('.topo').classList.contains('aberto')")))
await tocar("document.querySelector('#menuBotao')"); await tocar("document.querySelector('#menu a[href=\"#duvidas\"]')"); await espera(900)
const topoSecao = await ev("Math.round(document.querySelector('#duvidas').getBoundingClientRect().top)"), alturaTopo = await ev("Math.round(document.querySelector('.topo').getBoundingClientRect().height)")
ok('escolher uma seção fecha o menu e leva até ela', !(await ev("document.querySelector('.topo').classList.contains('aberto')")) && Math.abs(topoSecao - alturaTopo) < 12, `seção a ${topoSecao}px, topo com ${alturaTopo}px`)

// 2. dúvidas: abrir uma resposta
await tocar("document.querySelector('.duvidas summary')")
ok('dúvida abre no toque', await ev("document.querySelector('.duvidas details').open"))
await foto('duvida-aberta')

// 3. barra de baixo
await ev('scrollTo(0,0)'); await espera(600)
ok('no topo, sem barra (o botão do hero está na tela)', !(await barra()))
await ev("document.querySelector('#palco3d').scrollIntoView({block:'center'})"); await espera(900)
ok('com o celular da demonstração na tela, sem barra', !(await barra()))
await foto('demo-na-tela')
const sobra = JSON.parse(await ev("(()=>{const r=document.querySelector('#palco3d .escala').getBoundingClientRect(), t=document.querySelector('.topo').getBoundingClientRect();return JSON.stringify({topo:r.top-t.bottom,baixo:innerHeight-r.bottom,alt:r.height})})()"))
ok('o celular inteiro cabe entre o topo e o fim da tela', sobra.topo >= -2 && sobra.baixo >= -2, `aparelho ${Math.round(sobra.alt)}px · folga em cima ${Math.round(sobra.topo)} · embaixo ${Math.round(sobra.baixo)}`)
await ev("document.querySelector('#muda').scrollIntoView({block:'start'})"); await espera(900)
ok('depois da demonstração, a barra aparece', await barra())

// 4. carrossel dos passos
await ev("document.querySelector('#tresFones').scrollIntoView({block:'center'})"); await espera(700)
const antes = await ev("[...document.querySelectorAll('#fonesPontos i')].findIndex(i=>i.classList.contains('atual'))")
await ev("(()=>{const c=document.querySelector('#tresFones');c.scrollTo({left:c.querySelectorAll('.fone-passo')[2].offsetLeft-20,behavior:'instant'})})()"); await espera(900)
const depois = await ev("[...document.querySelectorAll('#fonesPontos i')].findIndex(i=>i.classList.contains('atual'))")
ok('o ponto do carrossel acompanha o passo', antes === 0 && depois === 2, `ponto ${antes + 1} → ${depois + 1}`)
await foto('carrossel-passo-3')

// 5. conferir o mês
await ev("document.querySelector('#conferir').scrollIntoView({block:'center'})"); await espera(500)
await tocar("document.querySelector('#conferir')"); await espera(3600)
ok('"Conferir o mês" roda e termina', (await ev("[...document.querySelectorAll('#mesa .estado')].map(e=>e.textContent).join('|')")) === '✓ bate|✓ bate|parou · equipe resolve|✓ bate')

// 6. botões de WhatsApp no celular vão direto pro app (wa.me)
const zaps = JSON.parse(await ev("JSON.stringify([...document.querySelectorAll('a')].filter(a=>/wa\\.me|whatsapp/.test(a.href)).map(a=>a.href.split('?')[0]))"))
ok('todos os botões de WhatsApp apontam pro wa.me', zaps.length >= 5 && zaps.every((u) => u === 'https://wa.me/5531984992474'), `${zaps.length} botões`)
ok('sem erros de JavaScript', erros.length === 0, erros.join(' | '))
await fetch('http://127.0.0.1:9444/json/close/' + t.id); ws.close()
