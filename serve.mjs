// Tiny static server for previewing the built bank: node serve.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || 4321);

http.createServer((req, res) => {
  const file = path.join(ROOT, 'Loop-Ready.html');
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(500); res.end('Run "node build.mjs" first.'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`Loop Ready preview on http://localhost:${PORT}`));
