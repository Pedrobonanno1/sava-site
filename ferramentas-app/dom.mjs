// Guarda, de cada estado do app REAL (build da main, sem backend), o HTML do `.phone` (a moldura 390x844 do
// modo computador) e as regras de CSS que valem pra ele, na ordem do bundle de produção.
// uso: node dom.mjs <base> <saida.json>
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ESTADOS } from './estados.mjs'

const [base, saida] = process.argv.slice(2)
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORTA = 9362
const perfil = mkdtempSync(join(tmpdir(), 'sava-dom-'))
const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', '--no-first-run', `--remote-debugging-port=${PORTA}`, `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' })
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
let alvo
for (let i = 0; i < 60 && !alvo; i++) {
  try { alvo = (await (await fetch(`http://127.0.0.1:${PORTA}/json/list`)).json()).find((t) => t.type === 'page') } catch { await espera(150) }
}
const ws = new WebSocket(alvo.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let id = 0
const pendentes = new Map(), erros = []
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pendentes.has(m.id)) { pendentes.get(m.id)(m); pendentes.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description?.split('\n')[0])
})
const cdp = (method, params = {}) => new Promise((r) => { const n = ++id; pendentes.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
const avaliar = async (expression) => {
  const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.result?.exceptionDetails) console.log('   ! passo falhou:', expression.slice(0, 80), '→', r.result.exceptionDetails.exception?.description?.split('\n')[0])
  return r.result?.result?.value
}

/* Roda na página: o HTML limpo do .phone e as regras que casam com ele (pseudo tirado só pra testar). */
const COLETAR = `(() => {
  const raiz = document.querySelector('.phone')
  if (!raiz) return null
  const regras = [], keyframes = {}
  let n = 0
  const sempre = /^(:root|html|body|\\*|\\*::before|\\*::after|\\*,\\s*\\*::before,\\s*\\*::after)$/
  const casa = (sel) => {
    const t = sel.trim()
    if (sempre.test(t)) return true
    let limpo = t.replace(/::?[a-zA-Z-]+(\\((?:[^()]|\\([^()]*\\))*\\))?/g, '').replace(/[>+~]\\s*$/, '').trim()
    if (!limpo) return true
    try { return raiz.matches(limpo) || Boolean(raiz.querySelector(limpo)) } catch { return true }
  }
  const visitar = (lista, movimento) => {
    for (const r of lista) {
      if (r instanceof CSSStyleRule) {
        n++
        if (r.selectorText.split(/,(?![^(]*\\))/).some(casa)) regras.push({ i: n, movimento, texto: r.cssText })
      } else if (r instanceof CSSMediaRule) {
        if (/prefers-reduced-motion/.test(r.conditionText)) visitar(r.cssRules, r.conditionText)
        else if (matchMedia(r.conditionText).matches) visitar(r.cssRules, movimento)
      } else if (r instanceof CSSSupportsRule) {
        if (CSS.supports(r.conditionText)) visitar(r.cssRules, movimento)
      } else if (r instanceof CSSKeyframesRule) keyframes[r.name] = r.cssText
    }
  }
  for (const folha of document.styleSheets) { try { visitar(folha.cssRules, null) } catch {} }
  const clone = raiz.cloneNode(true)
  clone.querySelectorAll('a[href]').forEach((a) => { a.dataset.href = a.getAttribute('href'); a.removeAttribute('href') })
  const imagens = [...clone.querySelectorAll('img')].map((i) => i.getAttribute('src'))
  const usos = [...clone.querySelectorAll('use')].map((u) => u.getAttribute('href') || u.getAttribute('xlink:href'))
  const classes = [...new Set([...clone.querySelectorAll('[class]')].flatMap((e) => [...e.classList]))]
  return { html: clone.outerHTML, regras, keyframes, imagens, usos, classes }
})()`

await cdp('Page.enable'); await cdp('Runtime.enable')
await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false })
const resultado = {}
for (const est of ESTADOS) {
  erros.length = 0
  await cdp('Page.navigate', { url: `${base}/comecar` }); await espera(800)
  await avaliar('localStorage.clear(); sessionStorage.clear()')
  if (est.semente) await avaliar(est.semente)
  await cdp('Page.navigate', { url: base + est.rota }); await espera(6000)
  for (const p of est.passos ?? []) { if (typeof p === 'number') await espera(p); else await avaliar(p) }
  await espera(900)
  const onde = await avaliar('location.pathname')
  const r = await avaliar(COLETAR)
  if (!r) { console.log(est.nome, 'SEM .phone em', onde); continue }
  resultado[est.nome] = r
  const shot = await cdp('Page.captureScreenshot', { format: 'png' })
  writeFileSync(saida.replace(/\.json$/, '') + '-' + est.nome + '.png', Buffer.from(shot.result.data, 'base64'))
  console.log(est.nome.padEnd(16), onde.padEnd(30), (r.html.length / 1024).toFixed(1) + ' KB html ·', r.regras.length, 'regras', r.imagens.length ? '· img ' + r.imagens.join(' ') : '', r.usos.length ? '· use ' + r.usos.length : '', erros.length ? '· ERROS ' + erros.join(' | ') : '')
}
writeFileSync(saida, JSON.stringify(resultado))
ws.close(); chrome.kill()
