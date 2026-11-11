// Monta, a partir dos estados capturados do app real (dom/estados.json), o pacote que entra na landing:
//   dom/app-real.css   — as regras que as telas usam, na ordem do bundle de produção, com escopo `.app-real`
//   dom/templates.html — um <template> por tela, limpo pra viver fora do React
import { readFileSync, writeFileSync } from 'node:fs'

const E = JSON.parse(readFileSync('dom/estados.json', 'utf8'))
/* O CSS junta TODOS os estados capturados: a regra de um estado (o dia marcado, o rádio escolhido, o botão liberado)
   só casa no estado em que ela aparece. */
const USADOS = Object.keys(E)

/* --- CSS --------------------------------------------------------------------------------------- */
const porIndice = new Map(), keyframes = {}
for (const nome of USADOS) {
  for (const r of E[nome].regras) porIndice.set(`${r.i}|${r.movimento ?? ''}`, r)
  Object.assign(keyframes, E[nome].keyframes)
}
const regras = [...porIndice.values()].sort((a, b) => a.i - b.i)

const dividir = (lista) => { const out = []; let nivel = 0, atual = ''
  for (const c of lista) { if (c === '(') nivel++; if (c === ')') nivel--; if (c === ',' && nivel === 0) { out.push(atual); atual = '' } else atual += c }
  return [...out, atual].map((s) => s.trim()).filter(Boolean) }
const escopar = (sel) => {
  if (/^(:root|html|body)$/.test(sel)) return '.app-real'
  if (/^(html|body)\s/.test(sel)) return sel.replace(/^(html|body)/, '.app-real')
  return '.app-real ' + sel
}
const comEscopo = (texto) => {
  const k = texto.indexOf('{')
  const seletores = [...new Set(dividir(texto.slice(0, k)).map(escopar))]
  return seletores.join(', ') + ' ' + texto.slice(k)
}
const normais = regras.filter((r) => !r.movimento).map((r) => comEscopo(r.texto))
const quietas = regras.filter((r) => r.movimento)
const corpo = normais.join('\n')
const usadas = Object.keys(keyframes).filter((n) => new RegExp(`(animation(-name)?:[^;}]*\\b${n}\\b)`).test(corpo))
let css = `/* As telas REAIS do app (main ${process.env.MAIN_SHA ?? ''}): as regras que elas usam, tiradas do bundle de
   produção na ordem dele, com escopo .app-real pra não vazarem pra landing. Gerado por montar-telas.mjs; não editar à mão. */\n`
css += corpo + '\n'
if (quietas.length) {
  const porMidia = {}
  for (const r of quietas) (porMidia[r.movimento] ??= []).push(comEscopo(r.texto))
  for (const [m, rs] of Object.entries(porMidia)) css += `@media ${m} {\n${rs.join('\n')}\n}\n`
}
css += usadas.map((n) => keyframes[n]).join('\n') + '\n'
writeFileSync('dom/app-real.css', css)

/* --- HTML -------------------------------------------------------------------------------------- */
const ICONES = '<svg width="17" height="11" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0zM3.5 6.9a6.4 6.4 0 0 1 9 0l-1.4 1.4a4.4 4.4 0 0 0-6.2 0zM1.3 4.7a9.5 9.5 0 0 1 13.4 0l-1.4 1.4a7.5 7.5 0 0 0-10.6 0z"/></svg><svg width="25" height="11" viewBox="0 0 26 12" fill="currentColor" aria-hidden="true"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="17" height="8" rx="2"/><rect x="23.5" y="4" width="2" height="4" rx="1" opacity=".4"/></svg>'
const limpar = (html) => html
  .replace(/ data-discover="true"/g, '')
  .replace(/<a class="fb-convite"[\s\S]*?<\/a>/, '') /* "Versão de teste · Me conta como foi": convite do teste de usabilidade, não é produto */
  .replace(/(<div class="phone-status"><span>9:41<\/span>)<span>[^<]*<\/span>/, `$1<span class="phone-icones">${ICONES}</span>`)
const pegar = (html, abre, fecha) => { const i = html.indexOf(abre); const j = html.indexOf(fecha, i) + fecha.length; if (i < 0 || j < fecha.length) throw new Error('não achei ' + abre); return html.slice(i, j) }

const tpl = (id, html) => `<template id="tela-${id}">${html}</template>`
const partes = []
for (const nome of ['home', 'notas', 'empresa', 'financeiro', 'quem-paga', 'tipo', 'pagador', 'valor', 'revisao']) partes.push(tpl(nome, limpar(E[nome].html)))
/* Pedaços que a demonstração encaixa nas telas acima. */
const enviada = limpar(E.enviada.html), autorizada = limpar(E.autorizada.html), iss = limpar(E['revisao-iss'].html)
partes.push(tpl('folha-enviada', pegar(enviada, '<div class="dim-bg">', '</div>') + pegar(enviada, '<div class="sheet centro"', '</button></div></div>')))
partes.push(tpl('folha-autorizada', pegar(autorizada, '<div class="dim-bg">', '</div>') + pegar(autorizada, '<div class="sheet centro"', '</button></div></div>')))
partes.push(tpl('linha-enviando', pegar(enviada, '<div class="list-item"><span class="li-icon steel"', 'R$ 4.200</div></div>')))
partes.push(tpl('linha-iss', pegar(iss, '<div class="summary-row"><div class="k">Alíquota de ISS na nota</div>', '</div></div>')))
writeFileSync('dom/templates.html', partes.join('\n') + '\n')

console.log('css', (css.length / 1024).toFixed(1), 'KB ·', normais.length, 'regras +', quietas.length, 'de movimento +', usadas.length, 'keyframes (' + usadas.join(', ') + ')')
console.log('templates', (partes.join('').length / 1024).toFixed(1), 'KB ·', partes.length)
const classes = new Set(USADOS.flatMap((n) => E[n].classes))
writeFileSync('dom/classes.json', JSON.stringify([...classes].sort()))
