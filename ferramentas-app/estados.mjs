// Os estados do app real que a landing usa. A semente é a mesma da varredura (cenas.mjs).
import { SEMENTE } from './cenas.mjs'

const clicar = (regex, seletor = 'button, a, [role=button], [role=radio], [role=checkbox]') =>
  `[...document.querySelectorAll(${JSON.stringify(seletor)})].find(b => ${regex}.test(b.textContent.trim()))?.click()`
const digitar = (valor) => valor.split('').map((d) => `document.querySelector('.keypad .key[aria-label="${d}"]').click()`)
const CONTINUAR = `document.querySelector('.wizard-foot button').click()`
const marcarDias = (mes, dias) => [
  `document.querySelectorAll('.calendario-mes')[${mes}].click()`, 200,
  ...dias.flatMap((d) => [`[...document.querySelectorAll('.calendario-dia')].find((b) => b.textContent.trim() === '${d}' && !b.disabled).click()`, 150]),
]
/* O Santa Casa com prazo de nota daqui a dois dias: é o card "Vence em 2 dias" da Home. */
const PRAZO = `(() => {
  const g = (k, v) => localStorage.setItem('lina.v01.' + k, JSON.stringify(v))
  const ler = (k) => JSON.parse(localStorage.getItem('lina.v01.' + k) || '[]')
  const dia = new Date(Date.now() + 2 * 86400e3).getDate()
  g('pagadores', ler('pagadores').map((p) => p.id === 'santa-casa' ? { ...p, notaAteDia: dia, pagamentoRegra: 'dias_depois', pagamentoDia: 8 } : p))
})()`
/* A conta com o celular cadastrado: some o card "Cadastre seu WhatsApp". */
const CELULAR = `(() => { const k = 'lina.v01.sessao'; const s = JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify({ ...s, celular: '+5531984992474' })) })()`
const S = SEMENTE + ';' + PRAZO + ';' + CELULAR

const TIPO = [clicar('/^Plantão/'), 300]
const PAGADOR = [...TIPO, CONTINUAR, 700]
const SANTA_CASA = [...PAGADOR, clicar('/Hospital Santa Casa/'), 300, ...marcarDias(0, [19])]
const VALOR = [...SANTA_CASA, CONTINUAR, 700]
const VALOR_4200 = [...VALOR, ...digitar('4200'), 200]
const REVISAO = [...VALOR_4200, CONTINUAR, 900]
const ENVIADA = [...REVISAO, clicar('/^Emitir/'), 2500]

export const ESTADOS = [
  { nome: 'home', rota: '/', semente: S },
  { nome: 'home-sem-celular', rota: '/', semente: SEMENTE + ';' + PRAZO },
  { nome: 'notas', rota: '/financeiro/notas', semente: S },
  { nome: 'empresa', rota: '/empresa', semente: S },
  { nome: 'financeiro', rota: '/financeiro', semente: S },
  { nome: 'quem-paga', rota: '/quem-paga', semente: S },
  { nome: 'tipo', rota: '/financeiro/notas/nova/tipo', semente: S },
  { nome: 'tipo-plantao', rota: '/financeiro/notas/nova/tipo', semente: S, passos: TIPO },
  { nome: 'pagador', rota: '/financeiro/notas/nova/tipo', semente: S, passos: PAGADOR },
  { nome: 'pagador-sc', rota: '/financeiro/notas/nova/tipo', semente: S, passos: SANTA_CASA },
  { nome: 'valor', rota: '/financeiro/notas/nova/tipo', semente: S, passos: VALOR },
  { nome: 'valor-4200', rota: '/financeiro/notas/nova/tipo', semente: S, passos: VALOR_4200 },
  { nome: 'revisao', rota: '/financeiro/notas/nova/tipo', semente: S, passos: REVISAO },
  { nome: 'enviada', rota: '/financeiro/notas/nova/tipo', semente: S, passos: ENVIADA },
  { nome: 'revisao-iss', rota: '/financeiro/notas/nova/tipo', semente: S, passos: [...REVISAO, `document.querySelector('.interruptor-linha').click()`, 500] },
  { nome: 'home-card', rota: '/', semente: S, passos: [`document.querySelector('a.card, .card').click()`, 900] },
  { nome: 'repetir-valor', rota: '/financeiro/notas', semente: S, passos: [`document.querySelector('.repetir-card').click()`, 900] },
  { nome: 'repetir-revisao', rota: '/financeiro/notas', semente: S, passos: [`document.querySelector('.repetir-card').click()`, 900, CONTINUAR, 900] },
  { nome: 'particular', rota: '/financeiro/notas/nova/tipo', semente: S, passos: [clicar('/^Atendimento particular/'), 300, CONTINUAR, 900] },
  { nome: 'autorizada', rota: '/financeiro/notas/nova/tipo', semente: S, passos: [...ENVIADA, clicar('/^Entendi$/'), 22000] },
]
