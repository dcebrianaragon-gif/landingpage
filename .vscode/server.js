const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5500;
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, '.vscode', 'fichajeregistros.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readRecords() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
  if (!raw) return [];

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeRecords(records) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload demasiado grande.'));
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function normalizePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const sanitized = decoded === '/' ? '/loadervideo.html' : decoded;
  const joined = path.join(ROOT_DIR, sanitized);
  const resolved = path.resolve(joined);

  if (!resolved.startsWith(path.resolve(ROOT_DIR))) {
    return null;
  }

  return resolved;
}

function serveStatic(req, res) {
  const filePath = normalizePath(req.url);
  if (!filePath) {
    res.writeHead(403);
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

async function handleApi(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET') {
    try {
      const records = readRecords();
      sendJson(res, 200, records);
    } catch (error) {
      sendJson(res, 500, { error: 'No se pudo leer el archivo JSON.' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = await collectBody(req);
      const payload = JSON.parse(body || '{}');
      const piloto = String(payload.piloto || '').trim();
      const escuderia = String(payload.escuderia || '').trim();
      const email = String(payload.email || '').trim();

      if (!piloto || !escuderia || !email) {
        sendJson(res, 400, { error: 'Faltan piloto, escuderia o email.' });
        return;
      }

      const records = readRecords();
      records.push({
        id: Date.now(),
        piloto,
        escuderia,
        email,
        fecha_registro: new Date().toLocaleString('es-ES')
      });
      writeRecords(records);

      sendJson(res, 201, {
        ok: true,
        total: records.length
      });
    } catch (error) {
      sendJson(res, 500, { error: 'No se pudo guardar el registro en el JSON.' });
    }
    return;
  }

  sendJson(res, 405, { error: 'Método no permitido.' });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/registros')) {
    handleApi(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  ensureDataFile();
  console.log(`Servidor listo en http://localhost:${PORT}`);
  console.log(`Guardando registros en ${DATA_FILE}`);
});
