const http = require('http');
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const os = require('os');
let PgClient = null;

try {
  ({ Client: PgClient } = require('pg'));
} catch (error) {
  PgClient = null;
}

loadEnvFile(path.resolve(__dirname, '..', '.env'));

const PORT = parsePort(process.env.PORT, 5501);
const HOST = process.env.HOST || '0.0.0.0';
const PROJECT_DIR = path.resolve(__dirname, '..');
const DATA_FILE = resolveDataFile(process.env.DATA_FILE);
const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();
const DB_TABLE = 'motogp_registros';
let dbClientPromise = null;

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

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function parsePort(rawValue, fallbackPort) {
  const parsed = Number.parseInt(String(rawValue || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackPort;
}

function resolveDataFile(rawValue) {
  const fallback = path.join(__dirname, 'fichajeregistros.json');
  const candidate = String(rawValue || '').trim();

  if (!candidate) {
    return fallback;
  }

  return path.isAbsolute(candidate)
    ? candidate
    : path.resolve(PROJECT_DIR, candidate);
}

function isDatabaseEnabled() {
  return Boolean(DATABASE_URL && PgClient);
}

function buildPgSslConfig() {
  if (!DATABASE_URL) {
    return false;
  }

  if (
    DATABASE_URL.includes('localhost') ||
    DATABASE_URL.includes('127.0.0.1') ||
    String(process.env.PGSSLMODE || '').toLowerCase() === 'disable'
  ) {
    return false;
  }

  return { rejectUnauthorized: false };
}

async function getDbClient() {
  if (!isDatabaseEnabled()) {
    return null;
  }

  if (!dbClientPromise) {
    dbClientPromise = (async () => {
      const client = new PgClient({
        connectionString: DATABASE_URL,
        ssl: buildPgSslConfig()
      });

      await client.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${DB_TABLE} (
          id BIGINT PRIMARY KEY,
          piloto TEXT NOT NULL,
          escuderia TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          fecha_registro TEXT NOT NULL
        )
      `);

      return client;
    })().catch((error) => {
      dbClientPromise = null;
      throw error;
    });
  }

  return dbClientPromise;
}

async function ensureStorageReady() {
  if (isDatabaseEnabled()) {
    await getDbClient();
    return;
  }

  ensureDataFile();
}

function normalizeDatabaseRecord(row) {
  return {
    id: Number(row.id),
    piloto: row.piloto,
    escuderia: row.escuderia,
    email: row.email,
    fecha_registro: row.fecha_registro
  };
}

async function readDatabaseRecords() {
  const client = await getDbClient();
  const result = await client.query(`
    SELECT id, piloto, escuderia, email, fecha_registro
    FROM ${DB_TABLE}
    ORDER BY id ASC
  `);

  return result.rows.map(normalizeDatabaseRecord);
}

function getServerUrls(host, port) {
  const urls = [];

  if (host === '0.0.0.0' || host === '::') {
    urls.push(`http://localhost:${port}`);

    const interfaces = os.networkInterfaces();
    for (const addresses of Object.values(interfaces)) {
      for (const address of addresses || []) {
        if (address.family === 'IPv4' && !address.internal) {
          urls.push(`http://${address.address}:${port}`);
        }
      }
    }
  } else {
    urls.push(`http://${host}:${port}`);
  }

  return [...new Set(urls)];
}

function checkExistingBackend(port) {
  return new Promise((resolve) => {
    const request = http.get({
      host: '127.0.0.1',
      port,
      path: '/api/health',
      timeout: 800
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          resolve(Boolean(payload.ok));
        } catch (error) {
          resolve(false);
        }
      });
    });

    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.on('error', () => resolve(false));
  });
}

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

function readFileRecords() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
  if (!raw) return [];

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeFileRecords(records) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf8');
}

async function readRecords() {
  if (isDatabaseEnabled()) {
    return readDatabaseRecords();
  }

  return readFileRecords();
}

async function createRecord({ piloto, escuderia, email }) {
  if (isDatabaseEnabled()) {
    const client = await getDbClient();
    const id = Date.now();
    const fecha_registro = new Date().toLocaleString('es-ES');

    try {
      await client.query(
        `
          INSERT INTO ${DB_TABLE} (id, piloto, escuderia, email, fecha_registro)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [id, piloto, escuderia, email, fecha_registro]
      );
    } catch (error) {
      if (error && error.code === '23505') {
        const duplicateError = new Error('Ese correo ya esta registrado.');
        duplicateError.code = 'DUPLICATE_EMAIL';
        throw duplicateError;
      }

      throw error;
    }

    const records = await readDatabaseRecords();
    return {
      records,
      summary: buildRecordsSummary(records),
      total: records.length
    };
  }

  const records = readFileRecords();
  const duplicate = records.find(
    (record) => String(record.email || '').trim().toLowerCase() === email
  );

  if (duplicate) {
    const duplicateError = new Error('Ese correo ya esta registrado.');
    duplicateError.code = 'DUPLICATE_EMAIL';
    throw duplicateError;
  }

  records.push({
    id: Date.now(),
    piloto,
    escuderia,
    email,
    fecha_registro: new Date().toLocaleString('es-ES')
  });
  writeFileRecords(records);

  return {
    records,
    summary: buildRecordsSummary(records),
    total: records.length
  };
}

function buildRecordsSummary(records) {
  const safeRecords = Array.isArray(records) ? records : [];
  const teamCounts = new Map();

  for (const record of safeRecords) {
    const team = String(record.escuderia || '').trim() || 'Sin escuderia';
    teamCounts.set(team, (teamCounts.get(team) || 0) + 1);
  }

  const sortedByNewest = [...safeRecords].sort(
    (a, b) => Number(b.id || 0) - Number(a.id || 0)
  );

  const topTeams = [...teamCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const recentActivity = sortedByNewest.slice(0, 4).map((record) => ({
    escuderia: String(record.escuderia || '').trim() || 'Sin escuderia',
    fecha_registro: record.fecha_registro || null
  }));

  return {
    total: safeRecords.length,
    teamsCount: teamCounts.size,
    lastRegisteredAt: sortedByNewest[0]?.fecha_registro || null,
    topTeams,
    recentActivity,
    privacyMode: 'summary-only',
    storageFile: path.basename(DATA_FILE)
  };
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

function getRequestUrl(req) {
  const host = req.headers.host || `localhost:${PORT}`;
  return new URL(req.url, `http://${host}`);
}

async function handleApi(req, res) {
  const requestUrl = getRequestUrl(req);
  const wantsRaw = requestUrl.searchParams.get('view') === 'raw';

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET') {
    try {
      const records = await readRecords();
      if (wantsRaw) {
        sendJson(res, 200, records);
        return;
      }

      sendJson(res, 200, buildRecordsSummary(records));
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
      const { summary, total } = await createRecord({
        piloto,
        escuderia,
        email: emailValidation.normalizedEmail
      });

      sendJson(res, 201, {
        ok: true,
        total,
        summary
      });
    } catch (error) {
      if (error && error.code === 'DUPLICATE_EMAIL') {
        sendJson(res, 409, { error: error.message });
        return;
      }

      sendJson(res, 500, { error: 'No se pudo guardar el registro en el almacenamiento configurado.' });
    }
    return;
  }

  sendJson(res, 405, { error: 'Metodo no permitido.' });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/health')) {
    sendJson(res, 200, {
      ok: true,
      port: PORT,
      dataFile: DATA_FILE,
      urls: getServerUrls(HOST, PORT)
    });
    return;
  }

  if (req.url.startsWith('/api/registros')) {
    handleApi(req, res);
    return;
  }

  serveStatic(req, res);
});

async function startServer() {
  if (await checkExistingBackend(PORT)) {
    console.log(`El backend ya esta funcionando en http://localhost:${PORT}`);
    console.log(`Abre http://localhost:${PORT}/registro.html`);
    return;
  }

  await ensureStorageReady();

  server.listen(PORT, HOST, () => {
    const urls = getServerUrls(HOST, PORT);
    console.log('Servidor listo en:');
    urls.forEach((url) => console.log(`- ${url}`));
    if (isDatabaseEnabled()) {
      console.log('Guardando registros en Render Postgres mediante DATABASE_URL');
    } else {
      console.log(`Guardando registros en ${DATA_FILE}`);
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`No se pudo iniciar: el puerto ${PORT} ya esta ocupado por otro programa.`);
      console.error('Cierra ese programa o cambia PORT en el archivo .env.');
      process.exit(1);
    }

    console.error('No se pudo iniciar el backend:', error.message);
    process.exit(1);
  });
}

startServer().catch((error) => {
  console.error('No se pudo preparar el almacenamiento del backend:', error.message);
  process.exit(1);
});
