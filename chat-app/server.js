import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const PORT = process.env.PORT || 3000;

const server = createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  try {
    const file = readFileSync('.' + url, 'utf8');
    res.writeHead(200, { 'Content-Type': url.endsWith('js') ? 'text/javascript' : 'text/html' });
    res.end(file);
  } catch { res.writeHead(404).end('Not found'); }
});

const wss = new WebSocketServer({ server });
wss.on('connection', ws => {
  ws.on('message', data => {
    // send to **all** clients (including sender)
    wss.clients.forEach(c => {
      if (c.readyState === 1) c.send(data);   // removed the c !== ws check
    });
  });
});

server.listen(PORT, () => console.log(`http://localhost:${PORT}`));