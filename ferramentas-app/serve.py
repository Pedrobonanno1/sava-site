# Serve a landing do Bonanno em localhost com window.SAVA_PREVIA ligado (o formulário não grava na produção).
import functools, http.server, sys

PASTA, PORTA = sys.argv[1], int(sys.argv[2])
TRAVA = b'<script>window.SAVA_PREVIA = true</script>'

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        caminho = self.path.split('?')[0]
        if caminho.endswith('/'):
            caminho += 'index.html'
        if not caminho.endswith('.html') or '..' in caminho:
            return super().do_GET()
        try:
            f = open(f'{PASTA}{caminho}', 'rb')
        except OSError:
            return super().do_GET()
        with f:
            html = f.read().replace(b'<head>', b'<head>' + TRAVA, 1)
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(html)))
        self.end_headers()
        self.wfile.write(html)

http.server.ThreadingHTTPServer(('127.0.0.1', PORTA), functools.partial(Handler, directory=PASTA)).serve_forever()
