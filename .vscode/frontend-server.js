const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number.parseInt(process.env.FRONTEND_PORT || '5502', 10) || 5502;
const HOST = process.env.FRONTEND_HOST || '127.0.0.1';
const PROJECT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.glb': 'model/gltf-binary'
};

function normalizePath(urlPath) {
  const decoded = decodeURIComponent(String(urlPath || '').split('?')[0]);
  const sanitized = decoded === '/' ? '/loadervideo.html' : decoded;
  const joined = path.join(PROJECT_DIR, sanitized);
  const resolved = path.resolve(joined);

  if (!resolved.startsWith(PROJECT_DIR)) {
    return null;
  }

  return resolved;
}

function serveStatic(req, res) {
  const filePath = normalizePath(req.url);
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Archivo no encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/__frontend_health')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, port: PORT }));
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Frontend listo en http://${HOST}:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`No se pudo iniciar el frontend: el puerto ${PORT} ya esta ocupado.`);
    process.exit(1);
  }

  console.error('No se pudo iniciar el frontend:', error.message);
  process.exit(1);
});
