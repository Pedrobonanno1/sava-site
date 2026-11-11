# Troca na landing só os blocos gerados: o <style id="app-real">, os <template id="tela-*"> e o módulo da demonstração.
import sys
P = sys.argv[1]
h = open(P, encoding='utf-8').read()
def regiao(ini, fim, novo):
    global h
    i = h.index(ini); j = h.index(fim, i)
    h = h[:i] + novo + h[j:]
regiao('<style id="app-real">\n', '</style>', '<style id="app-real">\n' + open('dom/app-real.css', encoding='utf-8').read())
marca = '<!-- As telas REAIS do app (main), geradas por montar-telas.mjs a partir do build de produção. Não editar à mão. -->\n'
i = h.index(marca); j = h.rindex('</template>\n') + len('</template>\n')
h = h[:i] + marca + open('dom/templates.html', encoding='utf-8').read() + h[j:]
regiao('  /* ------------------------------------------------ o app dentro do iPhone', '  /* ------------------------------------------------ o iPhone: reto, de frente', open('demo-app.js', encoding='utf-8').read())
open(P, 'w', encoding='utf-8', newline='').write(h)
print('ok', len(h) // 1024, 'KB')
