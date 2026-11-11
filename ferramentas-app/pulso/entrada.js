// O pulso REAL da frente ui (lina-ui: src/lib/pulso.js, src/lib/pulsoForma.js, src/components/pulsoMotor.js), sem o React.
import { palco } from '/Users/felipesavassi/Documents/LINA Code/lina-ui/src/lib/pulso.js'
import { criarMotor } from '/Users/felipesavassi/Documents/LINA Code/lina-ui/src/components/pulsoMotor.js'
const U = 100
window.SavaPulso = {
  /* O mesmo que o <Pulso> faz na montagem: o palco, a caixa do SVG e o motor. Textura a (fita dupla), tom dourado. */
  montar(svg, { tamanho = 16, textura = 'a' } = {}) {
    const p = palco({ C: U })
    svg.setAttribute('viewBox', `${p.x} ${p.y} ${p.largura} ${p.altura}`)
    svg.setAttribute('width', (p.largura / U) * tamanho)
    svg.setAttribute('height', (p.altura / U) * tamanho)
    svg.classList.add('pulso', `pulso-${textura}`, 'tom-dourado')
    return criarMotor(svg, { palco: p, textura, unidadesPorPx: U / tamanho })
  },
}
