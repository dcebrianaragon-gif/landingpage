const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;

const PORT = 5501;
const PROJECT_DIR = path.resolve(__dirname, '..');
const DATA_FILE = path.join(__dirname, 'fichajeregistros.json');

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

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '20minutemail.com',
  'dispostable.com',
  'fakeinbox.com',
  'fakemail.com',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'sharklasers.com',
  'temp-mail.org',
  'tempmail.com',
  'trashmail.com',
  'yopmail.com'
]);

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hasResolvableMailDomain(domain) {
  try {
    const mx = await dns.resolveMx(domain);
    if (Array.isArray(mx) && mx.length > 0) {
      return true;
    }
  } catch (error) {
    // Continue with A/AAAA fallback below.
  }

  try {
    const a = await dns.resolve4(domain);
    if (Array.isArray(a) && a.length > 0) {
      return true;
    }
  } catch (error) {
    // Try IPv6 next.
  }

  try {
    const aaaa = await dns.resolve6(domain);
    return Array.isArray(aaaa) && aaaa.length > 0;
  } catch (error) {
    return false;
  }
}

async function validateEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!isValidEmailFormat(normalizedEmail)) {
    return { ok: false, error: 'El correo no tiene un formato valido.' };
  }

  const [, domain = ''] = normalizedEmail.split('@');

  if (!domain) {
    return { ok: false, error: 'El correo no tiene dominio valido.' };
  }

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { ok: false, error: 'No se permiten correos temporales o desechables.' };
  }

  if (['example.com', 'test.com', 'fake.com', 'correo.com'].includes(domain)) {
    return { ok: false, error: 'El dominio del correo parece de prueba o falso.' };
  }

  const domainExists = await hasResolvableMailDomain(domain);
  if (!domainExists) {
    return { ok: false, error: 'El dominio del correo no existe o no acepta correo real.' };
  }

  return { ok: true, normalizedEmail };
}

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

      const emailValidation = await validateEmail(email);
      if (!emailValidation.ok) {
        sendJson(res, 400, { error: emailValidation.error });
        return;
      }

      const records = readRecords();
      const duplicate = records.find(
        (record) => String(record.email || '').trim().toLowerCase() === emailValidation.normalizedEmail
      );

      if (duplicate) {
        sendJson(res, 409, { error: 'Ese correo ya esta registrado.' });
        return;
      }

      records.push({
        id: Date.now(),
        piloto,
        escuderia,
        email: emailValidation.normalizedEmail,
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

  sendJson(res, 405, { error: 'Metodo no permitido.' });
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
