// Percorre a demonstração do iPhone do hero com cliques de verdade (CDP Input) e fotografa o aparelho a cada passo.
// uso: node testar-demo.mjs <url> <pasta> [largura]
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [url, pasta, largura = '1440'] = process.argv.slice(2)
mkdirSync(pasta, { recursive: true })
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORTA = 9363
const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${PORTA}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'sava-demo-'))}`, 'about:blank'], { stdio: 'ignore' })
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
let alvo
for (let i = 0; i < 60 && !alvo; i++) { try { alvo = (await (await fetch(`http://127.0.0.1:${PORTA}/json/list`)).json()).find((t) => t.type === 'page') } catch { await espera(150) } }
const ws = new WebSocket(alvo.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let id = 0; const pend = new Map(), erros = []
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description?.split('\n')[0]) })
const cdp = (method, params = {}) => new Promise((r) => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
const js = async (e) => (await cdp('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value
const movel = +largura < 600
await cdp('Page.enable'); await cdp('Runtime.enable')
await cdp('Emulation.setDeviceMetricsOverride', { width: +largura, height: movel ? 844 : 1000, deviceScaleFactor: 2, mobile: movel })
await cdp('Page.navigate', { url }); await espera(3000)
await js(`document.querySelector('#palco3d').scrollIntoView({ block: 'center' })`); await espera(400)

/* Clica no centro do primeiro elemento VISÍVEL do app que casa com o seletor (e, se houver, com o texto). */
async function tocar(sel, texto) {
  const r = await js(`(() => {
    const els = [...document.querySelectorAll('#appReal ${sel}, #demo ${sel}')].filter((e) => e.offsetParent !== null && (${JSON.stringify(texto ?? '')} === '' || e.textContent.trim().startsWith(${JSON.stringify(texto ?? '')})))
    const e = els[0]; if (!e) return null
    e.scrollIntoView({ block: 'nearest' })
    const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
  })()`)
  if (!r) { console.log('   ! não achei', sel, texto ?? ''); return }
  for (const type of ['mousePressed', 'mouseReleased']) await cdp('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 })
  await espera(350)
}
let n = 0
async function foto(nome) {
  await espera(500)
  const b = await js(`(() => { const b = document.querySelector('#palco3d').getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height } })()`)
  const s = await cdp('Page.captureScreenshot', { format: 'png', clip: { x: b.x, y: b.y, width: b.w, height: b.h, scale: 1 } })
  writeFileSync(join(pasta, `${String(++n).padStart(2, '0')}-${nome}.png`), Buffer.from(s.result.data, 'base64'))
  const tela = await js(`[...document.querySelectorAll('#appReal > .phone')].findIndex((p) => !p.hidden)`)
  console.log(String(n).padStart(2, '0'), nome.padEnd(16), 'tela', tela)
}
/* O topo começa bloqueado: espera a cena chegar ao "Abrir o app" e destrava, como a pessoa faria. */
for (let i = 0; i < 120 && !(await js(`!document.querySelector('#abrirApp').hidden`)); i++) await espera(250)
await espera(600); await tocar('#abrirApp'); await espera(900)
await foto('home')
await tocar('.chip', 'Emitir nota'); await foto('tipo')
await tocar('.payer-row', 'Plantão'); await tocar('.wizard-foot .pill-btn'); await foto('pagador')
await tocar('.payer-row', 'SC'); await tocar('.calendario-mes', 'outubro'); await tocar('.calendario-dia', '19'); await tocar('.calendario-dia', '20'); await foto('pagador-dias')
await tocar('.wizard-foot .pill-btn'); await foto('valor')
for (const k of ['4', '2', '0', '0']) await tocar(`.key[aria-label="${k}"]`)
await foto('valor-4200')
await tocar('.wizard-foot .pill-btn'); await foto('revisao')
await tocar('.interruptor-linha'); await foto('revisao-iss')
await tocar('.interruptor-linha')
await tocar('.wizard-foot .pill-btn', 'Emitir'); await foto('enviada')
await tocar('.sheet .pill-btn', 'Entendi'); await espera(2800); await foto('autorizada')
await tocar('.sheet .pill-btn', 'Copiar'); await foto('lista')
await tocar('.navitem', 'Home'); await foto('home-depois')
await tocar('.navitem', 'Empresa'); await foto('empresa')
await tocar('.navitem', 'Quem paga'); await foto('quem-paga')
await tocar('.navitem', 'Financeiro'); await foto('financeiro')
await tocar('.fin-link', 'Ver todas'); await tocar('.repetir-card'); await foto('repetir')
await tocar('.close-x'); await tocar('.navitem', 'Home'); await foto('home-fim')
console.log(erros.length ? 'ERROS: ' + erros.join(' | ') : 'nenhum erro de JavaScript')
console.log('faturado na Home:', await js(`[...document.querySelectorAll('#appReal .hero-stat-value')][0]?.textContent`), '·', await js(`[...document.querySelectorAll('#appReal .hero-stat-sub')][0]?.textContent`))
ws.close(); chrome.kill()
