// Tiny static server for previewing the built bank: node serve.mjs [port]
//   /            the bank (Loop-Ready.html)
//   /test        runs every Python solution against its hidden tests in the browser
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || 4321);
const ROUTES = {
  '/test': ['app/test-runner.html', 'text/html; charset=utf-8'],
  '/tests.json': ['dist/tests.json', 'application/json; charset=utf-8'],
};

http.createServer((req, res) => {
  const route = ROUTES[new URL(req.url, 'http://localhost').pathname] || ['Loop-Ready.html', 'text/html; charset=utf-8'];
  fs.readFile(path.join(ROOT, route[0]), (err, buf) => {
    if (err) { res.writeHead(500); res.end('Run "node build.mjs" first.'); return; }
    res.writeHead(200, { 'Content-Type': route[1], 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`Loop Ready preview on http://localhost:${PORT}  (solution tests on /test)`));
