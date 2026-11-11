// As cenas da landing, fotografadas no app real. A persona é a da landing: Dra. Ana, BH, três hospitais.
const cnpj = (raiz) => {
  const d = raiz.split('').map(Number)
  const dv = (ns, pesos) => { const s = ns.reduce((a, n, i) => a + n * pesos[i], 0) % 11; return s < 2 ? 0 : 11 - s }
  const d1 = dv(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]); const d2 = dv([...d, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return raiz + d1 + d2
}
export const CNPJ = { ana: cnpj('481736250001'), saoLucas: cnpj('172943580001'), vidaPlena: cnpj('305128660001'), santaCasa: cnpj('174307440001') }

export const SEMENTE = `(() => {
  const d = 86400e3, agora = Date.now(), iso = (ms) => new Date(ms).toISOString(), mes = new Date().toLocaleString('pt-BR', { month: 'long' })
  const g = (k, v) => localStorage.setItem('lina.v01.' + k, JSON.stringify(v))
  g('sessao', { id: 'local-ana', email: 'ana.souza@exemplo.com.br', emailConfirmado: true, anonimo: false, entrouEm: iso(agora - 60 * d) })
  g('empresa', { cnpj: '${CNPJ.ana}', razaoSocial: 'Ana Souza Serviços Médicos Ltda', municipio: 'Belo Horizonte', uf: 'MG', municipioIbge: '3106200', inscricaoMunicipal: '', cnae: '8630-5/03', optanteSimples: true, ativa: true, manual: false, inicioAtividade: '2024-03-04' })
  g('perfil', { plantaoTipico: 4200, frequenciaMensal: 6, nome: 'Ana Souza', nomeCompleto: 'Ana Souza Ribeiro', crmNumero: '61234', crmUf: 'MG', encaminhamentoVistoEm: iso(agora - 50 * d), termosUsoVersao: '1.1', enderecoVistoEm: iso(agora - 50 * d), temConsultorio: false })
  g('certificado', { titular: 'ANA SOUZA SERVICOS MEDICOS LTDA', cnpj: '${CNPJ.ana}', validade: '14/03/2027', nomeArquivo: 'certificado.pfx' })
  g('onboardingConcluido', true)
  g('pagadores', [
    { id: 'sao-lucas', nome: 'Hospital São Lucas', cnpj: '${CNPJ.saoLucas}', documento: '${CNPJ.saoLucas}', tipo: 'empresa', contato: null, canal: 'email', iniciais: 'SL', tomAvatar: 'sage', usadoHaDias: 9, usadoHa: 'usado há 9 dias', criadoEm: iso(agora - 200 * d) },
    { id: 'vida-plena', nome: 'Clínica Vida Plena', cnpj: '${CNPJ.vidaPlena}', documento: '${CNPJ.vidaPlena}', tipo: 'empresa', contato: null, canal: 'email', iniciais: 'VP', tomAvatar: 'steel', usadoHaDias: 4, usadoHa: 'usado há 4 dias', criadoEm: iso(agora - 150 * d) },
    { id: 'santa-casa', nome: 'Hospital Santa Casa', cnpj: '${CNPJ.santaCasa}', documento: '${CNPJ.santaCasa}', tipo: 'empresa', contato: null, canal: 'email', iniciais: 'SC', tomAvatar: 'amber', usadoHaDias: 40, usadoHa: 'usado há 40 dias', criadoEm: iso(agora - 120 * d) },
  ])
  g('notas', [
    { id: 'nf-1', pagadorId: 'sao-lucas', pagador: 'Hospital São Lucas', valor: 4200, valorFormatado: 'R$ 4.200', imposto: 252, impostoFormatado: 'R$ 252,00', aliquotaIss: 0.02, competencia: mes, emitidaEm: 'há 9 dias', emitidaEmIso: iso(agora - 9 * d), status: 'autorizada', numero: '001283', avisada: true, ehDocumentoFiscal: true },
    { id: 'nf-2', pagadorId: 'vida-plena', pagador: 'Clínica Vida Plena', valor: 3100, valorFormatado: 'R$ 3.100', imposto: 186, impostoFormatado: 'R$ 186,00', aliquotaIss: 0.02, competencia: mes, emitidaEm: 'há 4 dias', emitidaEmIso: iso(agora - 4 * d), status: 'autorizada', numero: '001284', avisada: true, ehDocumentoFiscal: true },
  ])
})()`

const clicar = (regex, seletor = 'button, a, [role=button], [role=radio], [role=checkbox]') =>
  `[...document.querySelectorAll(${JSON.stringify(seletor)})].find(b => ${regex}.test(b.textContent.trim()))?.click()`
const digitar = (valor) => valor.split('').map((d) => `document.querySelector('.keypad .key[aria-label="${d}"]').click()`)
const CONTINUAR = `document.querySelector('.wizard-foot button').click()`

const marcarDias = (mes, dias) => [
  `document.querySelectorAll('.calendario-mes')[${mes}].click()`, 200,
  ...dias.flatMap((d) => [`[...document.querySelectorAll('.calendario-dia')].find((b) => b.textContent.trim() === '${d}' && !b.disabled).click()`, 120]),
]
const PRAZO = `(() => {
  const g = (k, v) => localStorage.setItem('lina.v01.' + k, JSON.stringify(v))
  const ler = (k) => JSON.parse(localStorage.getItem('lina.v01.' + k) || '[]')
  const dia = new Date(Date.now() + 2 * 86400e3).getDate()
  g('pagadores', ler('pagadores').map((p) => p.id === 'santa-casa' ? { ...p, notaAteDia: dia, pagamentoRegra: 'dias_depois', pagamentoDia: 8 } : p))
})()`
const ATE_VALOR = [clicar('/^Plantão/'), 300, CONTINUAR, 600, clicar('/Hospital Santa Casa/'), 300, ...marcarDias(1, [19]), CONTINUAR, 600]

export const CENAS = [
  { nome: 'r01-home', rota: '/', semente: SENTE() },
  { nome: 'r02-notas', rota: '/financeiro/notas', semente: SENTE() },
  { nome: 'r03-nova-tipo', rota: '/financeiro/notas/nova/tipo', semente: SENTE() },
  { nome: 'r04-nova-pagador', rota: '/financeiro/notas/nova/tipo', semente: SENTE(), passos: [clicar('/^Plantão/'), 300, CONTINUAR, 600] },
  { nome: 'r05-simples', rota: '/financeiro/simples', semente: SENTE() },
  { nome: 'r06-mes', rota: '/financeiro/mes', semente: SENTE(), passos: [800] },
  { nome: 'r07-empresa', rota: '/empresa', semente: SENTE() },
  { nome: 'r08-pagadores', rota: '/empresa/pagadores', semente: SENTE() },
  { nome: 'r09-home-prazo', rota: '/', semente: SENTE() + ';' + PRAZO, inteira: true },
  { nome: 'r10-valor', rota: '/financeiro/notas/nova/tipo', semente: SENTE(), passos: [...ATE_VALOR, ...digitar('4200')] },
  { nome: 'r11-revisao', rota: '/financeiro/notas/nova/tipo', semente: SENTE(), passos: [...ATE_VALOR, ...digitar('4200'), CONTINUAR, 700], inteira: true },
  { nome: 'r12-emitida', rota: '/financeiro/notas/nova/tipo', semente: SENTE(), passos: [...ATE_VALOR, ...digitar('4200'), CONTINUAR, 700, clicar('/^Emitir/'), 3500] },
  { nome: 'r13-notas-inteira', rota: '/financeiro/notas', semente: SENTE(), inteira: true },
  { nome: 'r14-mes-inteira', rota: '/financeiro/mes', semente: SENTE(), passos: [800], inteira: true },
  { nome: 'r15-empresa-inteira', rota: '/empresa', semente: SENTE(), inteira: true },
  { nome: 'r16-pagador-dias', rota: '/financeiro/notas/nova/tipo', semente: SENTE(), passos: [clicar('/^Plantão/'), 300, CONTINUAR, 600, clicar('/Hospital Santa Casa/'), 300, ...marcarDias(1, [19]), 'window.scrollTo(0, document.body.scrollHeight)', 300] },
]
function SENTE() { return SEMENTE }
