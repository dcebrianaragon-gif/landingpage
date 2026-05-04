const CIRCUITS_KEY = 'minijuego_local_circuits';
const BIKES_KEY = 'minijuego_local_bikes';

const circuitImages = {
  qatar: new URL('../../imagenes/qatar.png', import.meta.url).href,
  portimao: new URL('../../imagenes/portimao.png', import.meta.url).href,
  cota: new URL('../../imagenes/cota.png', import.meta.url).href,
  jerez: new URL('../../imagenes/jerez.png', import.meta.url).href,
  lemans: new URL('../../imagenes/lemans.png', import.meta.url).href,
  mugello: new URL('../../imagenes/mugello.png', import.meta.url).href,
  catalunya: new URL('../../imagenes/catalunya.png', import.meta.url).href,
  assen: new URL('../../imagenes/assen.png', import.meta.url).href,
  sachsen: new URL('../../imagenes/sachsenring.png', import.meta.url).href,
  silverstone: new URL('../../imagenes/silverstone.png', import.meta.url).href,
  redbullring: new URL('../../imagenes/redbullring.png', import.meta.url).href,
  misano: new URL('../../imagenes/misano.png', import.meta.url).href,
  aragon: new URL('../../imagenes/aragon.png', import.meta.url).href,
  phillip: new URL('../../imagenes/philipisland.png', import.meta.url).href,
  sepang: new URL('../../imagenes/sepang.png', import.meta.url).href,
  valencia: new URL('../../imagenes/valencia.png', import.meta.url).href,
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const defaultCircuits = [
  {
    id: 'qatar',
    name: 'LUSAIL',
    flag: 'QA',
    laps: 5,
    track_width: 14,
    image_url: circuitImages.qatar,
    image_aspect: 1.3445,
    image_scale: 1.76,
    waypoints: [
      { x: 0, z: 0 }, { x: 86, z: -8 }, { x: 150, z: 18 }, { x: 172, z: 72 }, { x: 150, z: 128 },
      { x: 102, z: 154 }, { x: 48, z: 142 }, { x: 28, z: 96 }, { x: 58, z: 58 }, { x: 25, z: 36 },
      { x: -36, z: 48 }, { x: -82, z: 86 }, { x: -108, z: 138 }, { x: -150, z: 132 }, { x: -165, z: 74 },
      { x: -130, z: 20 }, { x: -70, z: -8 },
    ],
  },
  {
    id: 'portimao',
    name: 'PORTIMAO',
    flag: 'PT',
    laps: 5,
    track_width: 13,
    image_url: circuitImages.portimao,
    image_aspect: 2.048,
    image_scale: 1.58,
    waypoints: [
      { x: 0, z: 0 }, { x: 80, z: -18 }, { x: 142, z: -5 }, { x: 178, z: 34 }, { x: 166, z: 88 },
      { x: 116, z: 112 }, { x: 76, z: 88 }, { x: 44, z: 114 }, { x: 12, z: 158 }, { x: -52, z: 164 },
      { x: -106, z: 132 }, { x: -138, z: 82 }, { x: -116, z: 36 }, { x: -64, z: 18 },
    ],
  },
  {
    id: 'cota',
    name: 'COTA',
    flag: 'US',
    laps: 5,
    track_width: 14,
    image_url: circuitImages.cota,
    image_aspect: 0.8889,
    image_scale: 1.86,
    waypoints: [
      { x: 0, z: 0 }, { x: 48, z: -42 }, { x: 96, z: -20 }, { x: 118, z: 34 }, { x: 100, z: 82 },
      { x: 132, z: 132 }, { x: 118, z: 206 }, { x: 58, z: 240 }, { x: -10, z: 226 }, { x: -44, z: 176 },
      { x: -20, z: 132 }, { x: -58, z: 104 }, { x: -104, z: 130 }, { x: -140, z: 96 }, { x: -132, z: 40 },
      { x: -82, z: 8 },
    ],
  },
  {
    id: 'jerez',
    name: 'JEREZ',
    flag: 'ES',
    laps: 5,
    track_width: 13,
    image_url: circuitImages.jerez,
    image_aspect: 1.0051,
    image_scale: 1.62,
    waypoints: [
      { x: 0, z: 0 }, { x: 55, z: -8 }, { x: 100, z: 0 }, { x: 120, z: 40 }, { x: 118, z: 90 },
      { x: 100, z: 140 }, { x: 65, z: 168 }, { x: 25, z: 175 }, { x: -20, z: 168 }, { x: -62, z: 145 },
      { x: -85, z: 100 }, { x: -88, z: 50 }, { x: -70, z: 5 }, { x: -35, z: -15 }, { x: -5, z: -5 },
    ],
  },
  {
    id: 'lemans',
    name: 'LE MANS',
    flag: 'FR',
    laps: 5,
    track_width: 12,
    image_url: circuitImages.lemans,
    image_aspect: 2.0253,
    image_scale: 1.6,
    waypoints: [
      { x: 0, z: 0 }, { x: 72, z: -6 }, { x: 122, z: 18 }, { x: 132, z: 66 }, { x: 96, z: 94 },
      { x: 52, z: 82 }, { x: 28, z: 116 }, { x: 52, z: 154 }, { x: 8, z: 176 }, { x: -62, z: 164 },
      { x: -108, z: 122 }, { x: -116, z: 72 }, { x: -84, z: 28 }, { x: -34, z: 6 },
    ],
  },
  {
    id: 'mugello',
    name: 'MUGELLO',
    flag: 'IT',
    laps: 5,
    track_width: 14,
    image_url: circuitImages.mugello,
    image_aspect: 0.661,
    image_scale: 2.15,
    waypoints: [
      { x: 0, z: 0 }, { x: 75, z: -5 }, { x: 130, z: 10 }, { x: 165, z: 60 }, { x: 160, z: 130 },
      { x: 135, z: 195 }, { x: 80, z: 225 }, { x: 15, z: 230 }, { x: -50, z: 215 }, { x: -95, z: 175 },
      { x: -118, z: 115 }, { x: -112, z: 55 }, { x: -75, z: 10 }, { x: -20, z: -3 },
    ],
  },
  {
    id: 'catalunya',
    name: 'CATALUNYA',
    flag: 'ES',
    laps: 5,
    track_width: 14,
    image_url: circuitImages.catalunya,
    image_aspect: 2.8194,
    image_scale: 1.42,
    waypoints: [
      { x: 0, z: 0 }, { x: 102, z: -10 }, { x: 190, z: 6 }, { x: 214, z: 50 }, { x: 184, z: 88 },
      { x: 126, z: 90 }, { x: 98, z: 126 }, { x: 126, z: 166 }, { x: 74, z: 188 }, { x: 8, z: 172 },
      { x: -52, z: 132 }, { x: -112, z: 120 }, { x: -176, z: 92 }, { x: -196, z: 44 }, { x: -148, z: 8 },
      { x: -76, z: -6 },
    ],
  },
  {
    id: 'assen',
    name: 'ASSEN',
    flag: 'NL',
    laps: 5,
    track_width: 12,
    image_url: circuitImages.assen,
    image_aspect: 1.055,
    image_scale: 1.85,
    waypoints: [
      { x: 0, z: 0 }, { x: 42, z: 8 }, { x: 78, z: 35 }, { x: 88, z: 75 }, { x: 75, z: 115 },
      { x: 45, z: 138 }, { x: 8, z: 145 }, { x: -28, z: 138 }, { x: -52, z: 110 }, { x: -62, z: 72 },
      { x: -52, z: 35 }, { x: -22, z: 8 },
    ],
  },
  {
    id: 'silverstone',
    name: 'SILVERSTONE',
    flag: 'GB',
    laps: 5,
    track_width: 14,
    image_url: circuitImages.silverstone,
    image_aspect: 1.7927,
    image_scale: 1.54,
    waypoints: [
      { x: 0, z: 0 }, { x: 92, z: -22 }, { x: 166, z: 2 }, { x: 188, z: 58 }, { x: 150, z: 112 },
      { x: 92, z: 98 }, { x: 72, z: 142 }, { x: 116, z: 186 }, { x: 64, z: 224 }, { x: -8, z: 210 },
      { x: -64, z: 168 }, { x: -126, z: 178 }, { x: -170, z: 130 }, { x: -154, z: 70 }, { x: -92, z: 38 },
      { x: -42, z: 18 },
    ],
  },
  {
    id: 'redbullring',
    name: 'RB RING',
    flag: 'AT',
    laps: 5,
    track_width: 13,
    image_url: circuitImages.redbullring,
    image_aspect: 1.513,
    image_scale: 1.74,
    waypoints: [
      { x: 0, z: 0 }, { x: 84, z: -24 }, { x: 148, z: 18 }, { x: 160, z: 76 }, { x: 118, z: 118 },
      { x: 64, z: 96 }, { x: 30, z: 136 }, { x: -8, z: 184 }, { x: -76, z: 176 }, { x: -122, z: 128 },
      { x: -134, z: 72 }, { x: -92, z: 26 }, { x: -42, z: 10 },
    ],
  },
  {
    id: 'misano',
    name: 'MISANO',
    flag: 'IT',
    laps: 5,
    track_width: 12,
    image_url: circuitImages.misano,
    image_aspect: 1.4254,
    image_scale: 1.72,
    waypoints: [
      { x: 0, z: 0 }, { x: 70, z: -8 }, { x: 122, z: 20 }, { x: 132, z: 78 }, { x: 102, z: 124 },
      { x: 48, z: 132 }, { x: 12, z: 104 }, { x: -26, z: 134 }, { x: -74, z: 158 }, { x: -124, z: 126 },
      { x: -138, z: 72 }, { x: -104, z: 24 }, { x: -48, z: 6 },
    ],
  },
  {
    id: 'aragon',
    name: 'MOTORLAND',
    flag: 'ES',
    laps: 5,
    track_width: 14,
    image_url: circuitImages.aragon,
    image_aspect: 1.3319,
    image_scale: 1.74,
    waypoints: [
      { x: 0, z: 0 }, { x: 92, z: -12 }, { x: 154, z: 28 }, { x: 142, z: 82 }, { x: 92, z: 100 },
      { x: 68, z: 146 }, { x: 112, z: 190 }, { x: 54, z: 226 }, { x: -20, z: 216 }, { x: -78, z: 176 },
      { x: -132, z: 188 }, { x: -164, z: 136 }, { x: -142, z: 74 }, { x: -88, z: 34 }, { x: -42, z: 14 },
    ],
  },
  {
    id: 'valencia',
    name: 'VALENCIA',
    flag: 'ES',
    laps: 5,
    track_width: 13,
    image_url: circuitImages.valencia,
    image_aspect: 0.9364,
    image_scale: 1.72,
    waypoints: [
      { x: 0, z: 0 }, { x: 68, z: -5 }, { x: 112, z: 12 }, { x: 125, z: 62 }, { x: 112, z: 118 },
      { x: 72, z: 148 }, { x: 22, z: 158 }, { x: -28, z: 148 }, { x: -68, z: 110 }, { x: -85, z: 60 },
      { x: -72, z: 10 }, { x: -35, z: -12 },
    ],
  },
  {
    id: 'sepang',
    name: 'SEPANG',
    flag: 'MY',
    laps: 5,
    track_width: 15,
    image_url: circuitImages.sepang,
    image_aspect: 1.211,
    image_scale: 1.82,
    waypoints: [
      { x: 0, z: 0 }, { x: 92, z: -12 }, { x: 156, z: 22 }, { x: 170, z: 84 }, { x: 126, z: 128 },
      { x: 58, z: 118 }, { x: 20, z: 156 }, { x: 56, z: 206 }, { x: 4, z: 244 }, { x: -72, z: 230 },
      { x: -128, z: 184 }, { x: -152, z: 120 }, { x: -132, z: 54 }, { x: -76, z: 16 },
    ],
  },
  {
    id: 'sachsen',
    name: 'SACHSEN.',
    flag: 'DE',
    laps: 5,
    track_width: 11,
    image_url: circuitImages.sachsen,
    image_aspect: 1.9532,
    image_scale: 1.62,
    waypoints: [
      { x: 0, z: 0 }, { x: 38, z: -3 }, { x: 65, z: 12 }, { x: 72, z: 50 }, { x: 62, z: 88 },
      { x: 28, z: 108 }, { x: -15, z: 105 }, { x: -48, z: 78 }, { x: -58, z: 38 }, { x: -42, z: -10 },
    ],
  },
  {
    id: 'phillip',
    name: 'PHILLIP IS.',
    flag: 'AU',
    laps: 5,
    track_width: 14,
    image_url: circuitImages.phillip,
    image_aspect: 0.5114,
    image_scale: 2.25,
    waypoints: [
      { x: 0, z: 0 }, { x: 40, z: -18 }, { x: 85, z: -6 }, { x: 118, z: 36 }, { x: 116, z: 98 },
      { x: 90, z: 152 }, { x: 42, z: 178 }, { x: -12, z: 172 }, { x: -58, z: 132 }, { x: -76, z: 74 },
      { x: -62, z: 22 }, { x: -26, z: -8 },
    ],
  },
];

const defaultBikes = [
  { id: 'ducati', name: 'DUCATI', flag: 'IT', info: 'Potencia bruta - V4', max_speed: 2.65, accel: 0.04, brake: 0.072, turn: 0.038, lean: 0.13, top_gear: 6, color_hex: 'e10000' },
  { id: 'ktm', name: 'KTM', flag: 'AT', info: 'Giros rapidos - V4', max_speed: 2.05, accel: 0.031, brake: 0.066, turn: 0.056, lean: 0.17, top_gear: 6, color_hex: 'ff6600' },
  { id: 'honda', name: 'HONDA', flag: 'JP', info: 'Equilibrada - V4', max_speed: 2.15, accel: 0.033, brake: 0.068, turn: 0.048, lean: 0.15, top_gear: 6, color_hex: 'ffd700' },
  { id: 'yamaha', name: 'YAMAHA', flag: 'JP', info: 'Suave - 4 cilindros', max_speed: 2.25, accel: 0.029, brake: 0.063, turn: 0.043, lean: 0.11, top_gear: 6, color_hex: '3399ff' },
];

const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return clone(fallback);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return clone(fallback);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : clone(fallback);
  } catch {
    return clone(fallback);
  }
};

const writeStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const localData = {
  async listCircuits() {
    const defaultsById = new Map(defaultCircuits.map((circuit) => [circuit.id, circuit]));
    const stored = readStorage(CIRCUITS_KEY, defaultCircuits);
    const merged = stored.map((circuit) => {
      const defaults = defaultsById.get(circuit.id);
      return defaults ? { ...defaults, ...circuit, image_url: defaults.image_url } : circuit;
    });
    const storedIds = new Set(merged.map((circuit) => circuit.id));
    const missingDefaults = defaultCircuits.filter((circuit) => !storedIds.has(circuit.id));
    return [...merged, ...missingDefaults];
  },

  async listBikes() {
    return readStorage(BIKES_KEY, defaultBikes);
  },

  async saveCircuit(data, existingId = null) {
    const collection = await this.listCircuits();
    const payload = { ...data, id: existingId || data.id || createId('circuit') };
    const next = existingId
      ? collection.map((item) => item.id === existingId ? payload : item)
      : [...collection, payload];
    writeStorage(CIRCUITS_KEY, next);
    return payload;
  },

  async saveBike(data, existingId = null) {
    const collection = await this.listBikes();
    const payload = { ...data, id: existingId || data.id || createId('bike') };
    const next = existingId
      ? collection.map((item) => item.id === existingId ? payload : item)
      : [...collection, payload];
    writeStorage(BIKES_KEY, next);
    return payload;
  },

  async deleteCircuit(id) {
    const collection = await this.listCircuits();
    writeStorage(CIRCUITS_KEY, collection.filter((item) => item.id !== id));
  },

  async deleteBike(id) {
    const collection = await this.listBikes();
    writeStorage(BIKES_KEY, collection.filter((item) => item.id !== id));
  },
};
