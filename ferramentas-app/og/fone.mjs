// Fotografa o iPhone do topo da landing no fim da cena (bloqueado, com a nota autorizada), em fundo transparente.
// uso: node og/fone.mjs <url da landing> <saida.png>
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const [url, saida] = process.argv.slice(2)
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--hide-scrollbars', '--remote-debugging-port=9365', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'sava-og-'))}`, 'about:blank'], { stdio: 'ignore' })
const espera = (t) => new Promise((r) => setTimeout(r, t))
let alvo; for (let i = 0; i < 60 && !alvo; i++) { try { alvo = (await (await fetch('http://127.0.0.1:9365/json/list')).json()).find((t) => t.type === 'page') } catch { await espera(150) } }
const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let id = 0; const pend = new Map(); ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) } })
const cdp = (method, params = {}) => new Promise((r) => { const n = ++id; pend.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
const js = async (e) => (await cdp('Runtime.evaluate', { expression: e, returnByValue: true })).result?.result?.value
await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 2, mobile: false })
await cdp('Page.enable'); await cdp('Page.navigate', { url })
await espera(19500) // a cena anda sozinha até a autorizada
await cdp('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })
await js(`(() => { const s = document.createElement('style'); s.textContent = 'html,body,.capa{background:transparent!important}.demo::before,.mao,.chamada-app,.demo-rodape,.topo,.barra,.bloq-abrir{visibility:hidden!important}'; document.head.append(s) })()`)
await espera(400)
const r = JSON.parse(await js(`JSON.stringify(document.querySelector('#iphone').getBoundingClientRect())`))
const m = 40 // folga pra sombra
const s = await cdp('Page.captureScreenshot', { format: 'png', clip: { x: r.x - m, y: r.y - m, width: r.width + 2 * m, height: r.height + 2 * m + 30, scale: 1 } })
writeFileSync(saida, Buffer.from(s.result.data, 'base64')); console.log('fone', Math.round(r.width), 'x', Math.round(r.height)); ws.close(); chrome.kill()
