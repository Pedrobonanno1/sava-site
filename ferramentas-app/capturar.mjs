// Captura a página inteira com emulação de aparelho, por CDP puro (como lina-ui/scripts/capturar-prancha.mjs).
// uso: node capturar.mjs <url> <largura> <saida.png> [mobile=1] [js-antes-de-capturar]
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const [url, largura, saida, mobile = '1', js = ''] = process.argv.slice(2)
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORTA = 9347
const perfil = mkdtempSync(join(tmpdir(), 'sava-cap-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${PORTA}`, `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' })
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

let alvo
for (let i = 0; i < 50 && !alvo; i++) {
  try { alvo = (await (await fetch(`http://127.0.0.1:${PORTA}/json/list`)).json()).find((t) => t.type === 'page') } catch { await espera(150) }
}
const ws = new WebSocket(alvo.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let id = 0
const pendentes = new Map()
const erros = []
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pendentes.has(m.id)) { pendentes.get(m.id)(m); pendentes.delete(m.id) }
  if (m.method === 'Runtime.exceptionThrown') erros.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') erros.push(m.params.args.map((a) => a.value ?? a.description).join(' '))
})
const cdp = (method, params = {}) => new Promise((r) => { const n = ++id; pendentes.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })

const movel = mobile === '1'
await cdp('Emulation.setDeviceMetricsOverride', { width: +largura, height: movel ? 844 : 900, deviceScaleFactor: movel ? 2 : 1, mobile: movel })
if (movel) await cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
await cdp('Page.enable'); await cdp('Runtime.enable')
await cdp('Page.navigate', { url })
await espera(3500)
if (js) { const r = await cdp('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true }); console.log('js:', JSON.stringify(r.result?.result?.value ?? r.result?.exceptionDetails?.text)); await espera(1500) }
const medidas = (await cdp('Runtime.evaluate', { expression: 'JSON.stringify({h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})', returnByValue: true })).result.result.value
const { h, sw, cw } = JSON.parse(medidas)
console.log('altura', h, '· largura do conteúdo', sw, '· largura da tela', cw, sw > cw ? '· TRANSBORDA' : '· sem transbordo horizontal')
const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: +largura, height: h, scale: 1 } })
writeFileSync(saida, Buffer.from(shot.result.data, 'base64'))
console.log(erros.length ? 'ERROS: ' + erros.join(' | ') : 'nenhum erro de JavaScript')
ws.close(); chrome.kill()
