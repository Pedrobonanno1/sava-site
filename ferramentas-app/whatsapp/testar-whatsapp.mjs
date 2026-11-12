// Roda NUMA ÁREA DE TRABALHO INVISÍVEL. Sobe um Chrome completo pelo pipe de depuração (o único que libera o domínio
// PWA), instala o WhatsApp Web como app com captura de links (como no computador do Pedro), deixa o app aberto e testa:
//   VELHO: link direto pra web.whatsapp.com/send em aba nova  -> esperado: capturado, nenhuma aba com a conversa
//   NOVO : botões do site (aba nova em /whatsapp.html, que navega sozinha) -> esperado: aba do navegador em /send
// uso: node pwa-exp.mjs <log> <perfil> <site>
import { spawn } from 'node:child_process'
import fs from 'node:fs'
const [, , LOG, perfil, SITE] = process.argv
fs.writeFileSync(LOG, '')
const log = (...a) => fs.appendFileSync(LOG, a.join(' ') + '\n')
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
try {
  const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--remote-debugging-pipe', '--user-data-dir=' + perfil, '--no-first-run', '--no-default-browser-check', '--window-size=1300,900', 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] })
  const w = chrome.stdio[3], r = chrome.stdio[4]
  let buf = Buffer.alloc(0), id = 0
  const pend = new Map()
  const send = (method, params = {}, sessionId) => new Promise((res) => { const i = ++id; pend.set(i, res); w.write(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0') })
  r.on('data', (d) => {
    buf = Buffer.concat([buf, d])
    let i
    while ((i = buf.indexOf(0)) >= 0) {
      const m = JSON.parse(buf.subarray(0, i).toString('utf8')); buf = buf.subarray(i + 1)
      // A gravação da inscrição no CRM é respondida aqui mesmo: nenhuma inscrição de teste chega ao banco.
      if (m.method === 'Fetch.requestPaused') send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 201, responseHeaders: [{ name: 'Access-Control-Allow-Origin', value: '*' }], body: '' }, m.sessionId)
      if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) }
    }
  })
  const anexar = async (targetId) => (await send('Target.attachToTarget', { targetId, flatten: true })).result.sessionId
  const ev = async (s, e) => { const x = await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, s); return x.result?.result?.value ?? JSON.stringify(x.result?.exceptionDetails?.text ?? x.error) }
  const paginas = async () => (await send('Target.getTargets')).result.targetInfos.filter((t) => t.type === 'page')
  const foto = async (rotulo, appId, antes) => {
    const ps = await paginas()
    log(`  [${rotulo}] janelas: ${ps.length}`)
    for (const p of ps) {
      let modo = '?'
      try { const s = await anexar(p.targetId); modo = (await ev(s, "matchMedia('(display-mode: standalone)').matches")) === true ? 'APP' : 'aba' } catch {}
      log(`    ${p.targetId === appId ? 'app-instalado' : antes.has(p.targetId) ? 'ja-existia   ' : 'NOVA         '} ${modo}  ${p.url.slice(0, 120)}`)
    }
  }
  const fecharNovas = async (antes) => { for (const p of await paginas()) if (!antes.has(p.targetId)) await send('Target.closeTarget', { targetId: p.targetId }) }
  const clicar = async (s, seletorJs) => {
    const p = JSON.parse(await ev(s, `(()=>{const e=${seletorJs};if(!e)return 'null';e.scrollIntoView({block:'center',behavior:'instant'});const r=e.getBoundingClientRect();return JSON.stringify({x:r.x+r.width/2,y:r.y+r.height/2,href:e.href||''})})()`))
    if (!p) { log('  ! elemento não achado: ' + seletorJs); return '' }
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 }, s)
    return p.href
  }

  await espera(3000)
  const MID = 'https://web.whatsapp.com/'
  const t0 = (await send('Target.createTarget', { url: 'https://web.whatsapp.com/' })).result.targetId
  const s0 = await anexar(t0); await espera(9000)
  let x = await send('PWA.install', { manifestId: MID }, s0); log('instalar app:', JSON.stringify(x.error || 'ok'))
  if (x.error) { x = await send('PWA.install', { manifestId: MID, installUrlOrBundleUrl: MID }); log('instalar app (pelo navegador):', JSON.stringify(x.error || 'ok')) }
  await espera(4000)
  x = await send('PWA.changeAppUserSettings', { manifestId: MID, linkCapturing: true }); log('captura de links ligada:', JSON.stringify(x.error || 'ok'))
  x = await send('PWA.changeAppUserSettings', { manifestId: MID, displayMode: 'standalone' }); log('app abre em janela própria:', JSON.stringify(x.error || 'ok'))
  await send('Target.closeTarget', { targetId: t0 }); await espera(1500)
  x = await send('PWA.launch', { manifestId: MID }); log('abrir app:', JSON.stringify(x.error || 'ok'))
  const appId = x.result?.targetId
  await espera(8000)
  await foto('app aberto, antes de qualquer clique', appId, new Set((await paginas()).map((p) => p.targetId)))

  const site = (await send('Target.createTarget', { url: SITE })).result.targetId
  const ss = await anexar(site); await espera(4000)
  await ev(ss, "document.documentElement.style.scrollBehavior='auto'")
  await send('Fetch.enable', { patterns: [{ urlPattern: '*supabase.co/rest/v1/inscricoes*' }] }, ss)

  let antes = new Set((await paginas()).map((p) => p.targetId))
  log('\n=== VELHO: link direto pra web.whatsapp.com/send, aba nova (o que estava no ar)')
  await ev(ss, "(()=>{const a=document.createElement('a');a.id='velho';a.href='https://web.whatsapp.com/send?phone=5531984992474&text=oi&type=phone_number&app_absent=0';a.target='_blank';a.rel='noopener';a.textContent='velho';a.style.cssText='position:fixed;left:20px;top:120px;z-index:99999;background:#fff;padding:20px;font-size:20px';document.body.append(a)})()")
  await clicar(ss, "document.querySelector('#velho')"); await espera(7000)
  await foto('depois do clique', appId, antes)
  await fecharNovas(antes)
  await ev(ss, "document.querySelector('#velho').remove()")

  for (const [nome, sel] of [['link "WhatsApp" do menu', "document.querySelector('.topo .zap-link')"], ['botão "Quero falar com a SAVA" do topo', "document.querySelector('.hero-acoes .pilula')"]]) {
    antes = new Set((await paginas()).map((p) => p.targetId))
    log(`\n=== NOVO: ${nome}`)
    log('  aponta pra: ' + String(await clicar(ss, sel)).slice(0, 90)); await espera(8000)
    await foto('depois do clique', appId, antes)
    await fecharNovas(antes); await espera(1000)
  }

  antes = new Set((await paginas()).map((p) => p.targetId))
  log('\n=== NOVO: formulário preenchido e enviado (gravação no CRM bloqueada no teste)')
  await ev(ss, "(()=>{const f=document.querySelector('#form');f.elements.nome.value='Teste Claude';f.elements.whatsapp.value='(31) 99999-0000';f.elements.especialidade.value='Plantonista'})()")
  await clicar(ss, "document.querySelector('#enviar')"); await espera(8000)
  await foto('depois do envio', appId, antes)
  log('\nFIM')
  chrome.kill()
} catch (e) { log('ERRO: ' + (e.stack || e)) }
process.exit(0)
