const CIRCUITS_KEY = 'minijuego_local_circuits';
const BIKES_KEY = 'minijuego_local_bikes';

const circuitImages = {
  jerez: new URL('../../imagenes/jerez.png', import.meta.url).href,
  mugello: new URL('../../imagenes/mugello.png', import.meta.url).href,
  assen: new URL('../../imagenes/assen.png', import.meta.url).href,
  valencia: new URL('../../imagenes/valencia.png', import.meta.url).href,
  sachsen: new URL('../../imagenes/sachsenring.png', import.meta.url).href,
  phillip: new URL('../../imagenes/philipisland.png', import.meta.url).href,
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const defaultCircuits = [
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
