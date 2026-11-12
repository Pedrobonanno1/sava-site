// Auditoria do site em tela de celular, no Chrome escondido (:9444).
// uso: node auditar.mjs <url> <largura> <pasta> [fotos=1]
// Emula iPhone (toque, UA), rola a página de tela em tela fotografando, e mede: estouro lateral, alvos de toque
// pequenos, textos miúdos e elementos que passam da largura da tela.
import fs from 'node:fs'
const [, , url, larg = '390', pasta, fotos = '1'] = process.argv
fs.mkdirSync(pasta, { recursive: true })
const W = Number(larg), H = W <= 360 ? 740 : W >= 430 ? 932 : 844
const t = await (await fetch('http://127.0.0.1:9444/json/new?about:blank', { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const p = new Map(); const erros = []
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.method === 'Runtime.exceptionThrown') erros.push(d.params.exceptionDetails.exception?.description?.split('\n')[0]); if (d.id && p.has(d.id)) { p.get(d.id)(d); p.delete(d.id) } }
const send = (method, params = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.text }
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
await new Promise((r) => (ws.onopen = r))
await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true })
await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' })
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true })
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
await send('Page.navigate', { url }); await espera(3500)
await ev("document.documentElement.style.scrollBehavior='auto'")
const total = await ev('document.documentElement.scrollHeight')
console.log(`largura ${W} · altura da página ${total}px · ${Math.ceil(total / (H - 120))} telas`)

if (fotos === '1') {
  let n = 0
  for (let y = 0; y < total; y += H - 120) {
    await ev(`scrollTo(0, ${y})`); await espera(650)
    const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 })
    fs.writeFileSync(`${pasta}/${String(++n).padStart(2, '0')}.jpg`, Buffer.from(s.result.data, 'base64'))
  }
  console.log('fotos:', n)
}

await ev('scrollTo(0,0)'); await espera(300)
const rel = await ev(`(() => {
  const vw = innerWidth, out = { estouro: document.documentElement.scrollWidth - vw, largos: [], toques: [], miudos: [], cortados: [] }
  const nome = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '')).slice(0, 60)
  const visivel = (e) => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
  const dentroDoFone = (e) => Boolean(e.closest('.app-real, .tela, .palco-mini, .fluxo'))
  for (const e of document.querySelectorAll('body *')) {
    if (!visivel(e)) continue
    const r = e.getBoundingClientRect()
    // passa da largura da tela (fora do que rola de lado de propósito)
    if ((r.right > vw + 1 || r.left < -1) && !e.closest('.menu, .conferencia, .anel, .demo, .palco-mini, .escura') && getComputedStyle(e).position !== 'fixed') out.largos.push(nome(e) + ' [' + Math.round(r.left) + '→' + Math.round(r.right) + ']')
    // alvos de toque
    if (e.matches('a, button, summary, [role=button], input, select') && !dentroDoFone(e)) {
      if (r.height < 40 || r.width < 40) out.toques.push(nome(e) + ' "' + (e.textContent || '').trim().slice(0, 22) + '" ' + Math.round(r.width) + 'x' + Math.round(r.height))
    }
    // texto miúdo (só folhas com texto próprio)
    if (!dentroDoFone(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1)) {
      const fs = parseFloat(getComputedStyle(e).fontSize)
      if (fs < 12.5) out.miudos.push(nome(e) + ' ' + fs + 'px "' + e.textContent.trim().slice(0, 26) + '"')
      if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible' && !e.matches('.menu')) out.cortados.push(nome(e) + ' "' + e.textContent.trim().slice(0, 30) + '"')
    }
  }
  for (const k of ['largos', 'toques', 'miudos', 'cortados']) out[k] = [...new Set(out[k])]
  return JSON.stringify(out)
})()`)
const r = JSON.parse(rel)
console.log('estouro lateral (px):', r.estouro)
for (const k of ['largos', 'toques', 'miudos', 'cortados']) { console.log(`--- ${k}: ${r[k].length}`); r[k].slice(0, 40).forEach((x) => console.log('   ' + x)) }
console.log('erros de JavaScript:', erros.length ? erros.join(' | ') : 'nenhum')
await fetch('http://127.0.0.1:9444/json/close/' + t.id); ws.close()
