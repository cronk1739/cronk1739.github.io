// server.js  –  zero-linter-warning version
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const PORT = process.env.PORT || 3000;

/* ---------- static file server ---------- */
const server = createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  try {
    const file = readFileSync('.' + url, 'utf8');
    res.writeHead(200, { 'Content-Type': url.endsWith('js') ? 'text/javascript' : 'text/html' });
    res.end(file);
  } catch { res.writeHead(404).end('Not found'); }
});

/* ---------- WebSocket relay ---------- */
const wss = new WebSocketServer({ server });   // <- now declared AFTER server
wss.on('connection', ws => {
  ws.on('message', data => {
    wss.clients.forEach(c => c !== ws && c.readyState === 1 && c.send(data));
  });
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));