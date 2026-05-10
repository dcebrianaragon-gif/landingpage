# Documentacion tecnica del proyecto MotoGP

Este documento explica el proyecto completo siguiendo el indice pedido en el PDF. La idea no es solo decir "que hace", sino dejar claro como esta construido, que archivos participan y por que cada parte aporta valor dentro de la web.

## 1. Instrucciones de inicio/ejecucion de vuestra web (Obligatorio)

Este proyecto mezcla frontend estatico, backend local y un minijuego hecho en React. La forma mas clara de arrancarlo es la siguiente:

1. Abrir una terminal en la carpeta del proyecto: `C:\Users\DAVID\Desktop\Imagenes mto gp pagina`.
2. Iniciar el backend con uno de estos dos metodos:
   - `npm start`
   - `node .vscode/server.js`
3. El backend queda escuchando en `http://localhost:5501`.
4. Abrir el frontend con un servidor estatico. En desarrollo se ha usado `Live Server`, dejando la web en `http://localhost:5502`.
5. Entrar en la pagina principal `entrada1.html` o en `registro.html` desde ese servidor estatico.

Tambien existe el archivo `iniciar-backend.bat`, que lanza el backend y abre la pagina de registro.

### Ejecucion real usada en este proyecto

- Frontend: `http://localhost:5502`
- Backend: `http://localhost:5501`
- Conexion entre ambos: `registro.html` detecta el host actual y fuerza el puerto `5501` para llamar a la API.

### Rutas importantes

- Pagina principal: `entrada1.html`
- Catalogo de motos: `motos.html`
- Registro: `registro.html`
- Circuitos: `pistas.html`
- Pilotos: `pilotos.html`
- Minijuego: `minijuego3d.html` o `minijuego/dist/index.html#/Game`

### Archivos de arranque relacionados

- `package.json`
- `iniciar-backend.bat`
- `.vscode/server.js`
- `minijuego3d.html`

Fragmento relevante:

```json
{
  "name": "motogp-registro-local",
  "private": true,
  "scripts": {
    "start": "node .vscode/server.js"
  }
}
```

La conclusion practica es sencilla: para que todo funcione de verdad, la web debe abrirse desde un servidor estatico y el backend debe estar levantado en el puerto `5501`.

## 2. Enumeracion de al menos las 5 funcionalidades mas importantes implementadas (Obligatorio)

1. Registro de pilotos con validacion y guardado real en JSON.
2. Desfile interactivo de equipos con animacion y acceso a fichas.
3. Explorador de circuitos con overlay, datos tecnicos y efecto visual 3D.
4. Catalogo de motos y ficha individual dinamica segun la moto elegida.
5. Minijuego de carreras con circuito, vueltas, turbo, HUD y minimapa.

Funcionalidad adicional destacable:

6. Team Radio local, que responde dentro de la pagina sin depender de una API externa.

## 3. Funcionalidad 1 (Obligatorio)

### 3.1 Descripcion por escrito del comportamiento (Que hace)

La funcionalidad de registro permite que un usuario rellene un formulario con nombre, escuderia y correo electronico, y que esos datos se guarden de verdad en un archivo JSON local. No es un formulario decorativo: valida, muestra errores, comprueba el estado del servidor y confirma cuando el registro se ha guardado correctamente.

Desde el punto de vista de usuario, esta parte cumple una funcion importante en la web porque convierte la pagina en algo interactivo y no solo visual. El visitante puede participar y dejar un registro persistente.

### 3.2 Explicacion del funcionamiento (Como lo hace)

En el frontend, `registro.html` calcula primero la direccion del backend. Si la pagina se abre desde `localhost:5502`, el script usa ese mismo host y cambia solo el puerto a `5501`. Despues prepara varias funciones:

- `buildRecord()`: recoge los valores del formulario, limpia espacios y valida que no falte nada.
- `fetchRecords()`: llama a la API para consultar el estado del backend.
- `checkServer()`: comprueba si el servidor responde y actualiza el mensaje de estado de la pagina.
- `saveRecord()`: envia los datos por `POST` al endpoint `/api/registros`.

Cuando el usuario pulsa el boton, el evento `submit` cancela el comportamiento normal del formulario y ejecuta `saveRecord()`. Si todo sale bien, el formulario se limpia y el usuario ve un mensaje de confirmacion.

En el backend, el servidor recibe el `POST`, valida el correo, evita duplicados por email y guarda el nuevo registro en `.vscode/fichajeregistros.json`.

### 3.3 Codigo relevante

Archivo principal del frontend: `registro.html`  
Archivo relacionado del backend: `.vscode/server.js`

```html
const API_BASE = (() => {
    const { protocol, hostname } = window.location;

    if (protocol === 'file:') {
        return 'http://localhost:5501';
    }

    const resolvedHost = hostname || 'localhost';
    return `${protocol}//${resolvedHost}:5501`;
})();

function buildRecord() {
    const name = document.getElementById('name').value.trim();
    const team = document.getElementById('team').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!name || !team || !email) {
        throw new Error('Por favor, rellena nombre, escuderia y correo.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Por favor, introduce un correo electronico valido.');
    }

    return {
        piloto: name,
        escuderia: team,
        email
    };
}

async function saveRecord() {
    const btn = document.getElementById('btnSave');

    try {
        const payload = buildRecord();
        btn.disabled = true;

        const response = await fetch(`${API_BASE}/api/registros`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'No se pudo guardar el registro.');
        }

        clearForm();
        setStatus(`Registro guardado correctamente. Total actual: ${data.total}.`, 'ok');
    } finally {
        btn.disabled = false;
    }
}
```

Este codigo es importante porque enseña tres cosas a la vez: conexion real con el backend, validacion antes de guardar y feedback visible al usuario. No es solo "mandar un formulario", sino controlar toda la experiencia de uso.

## 4. Funcionalidad 2 (Obligatorio)

### 4.1 Descripcion por escrito del comportamiento (Que hace)

La portada incluye un desfile horizontal de equipos y motos. El usuario puede recorrerlo con botones, con el raton y con scroll lateral. Cada tarjeta muestra informacion resumida del equipo y permite abrir una ficha detallada con una transicion visual.

Esta funcionalidad hace que la landing no sea una simple lista estatica. La informacion entra en escena con mas personalidad y da una sensacion de producto mas trabajado.

### 4.2 Explicacion del funcionamiento (Como lo hace)

La funcion `initTeams()` define un array de equipos con su nombre, codigo, pilotos, imagen y enlace a la ficha. A partir de ese array, el script crea las tarjetas dinamicamente en el DOM.

Despues se activan tres comportamientos:

1. Navegacion horizontal con botones `Anterior` y `Siguiente`.
2. Movimiento 3D suave sobre cada tarjeta cuando el usuario mueve el puntero.
3. Transicion de salida hacia la ficha individual con `launchMotoTransition()`.

Ademas, si el navegador detecta `prefers-reduced-motion`, la web evita forzar animaciones largas y abre directamente la ficha. Eso mejora accesibilidad y robustez.

### 4.3 Codigo relevante

Archivo principal: `entrada1.html`

```html
function initTeams() {
    const container = document.getElementById('team-target');
    const prevBtn = document.getElementById('team-scroll-prev');
    const nextBtn = document.getElementById('team-scroll-next');
    if (container.children.length > 0) return;

    const teams = [
        { name: "Ducati Lenovo", code: "DUC-01", riders: "Bagnaia // Marquez", img: "motogp3.jpg", detail: "moto-detalle.html?id=ducati-lenovo-93" },
        { name: "Pertamina VR46", code: "VR4-02", riders: "Di Giannantonio // Morbidelli", img: "motogp7.jpg", detail: "moto-detalle.html?id=vr46-49" }
    ];

    teams.forEach((team, i) => {
        const card = document.createElement('a');
        card.className = 'team-card team-card-link reveal';
        card.href = team.detail;
        card.innerHTML = `
            <div class="team-meta">
                <span>${team.code}</span>
                <span>${team.riders}</span>
            </div>
            <img src="imagenes/${team.img}" alt="${team.name}" loading="lazy" decoding="async">
        `;
        container.appendChild(card);
    });

    const teamCards = Array.from(container.querySelectorAll('.team-card-link'));
    attachMotoLaunchSequence(teamCards, 'team-card-launching');
    initTeamCardMotion(teamCards);
}

function launchMotoTransition(element, overlay) {
    if (prefersReducedMotion) {
        window.location.href = element.href;
        return;
    }

    const rect = element.getBoundingClientRect();
    const transitionData = {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
    };

    safeSessionStorageSet('motoTransition', JSON.stringify(transitionData));
    window.setTimeout(() => {
        window.location.href = element.href;
    }, 980);
}
```

Lo interesante aqui no es solo que las tarjetas se vean bien, sino que la informacion del equipo esta modelada como datos y luego se renderiza de forma dinamica. Eso hace que el modulo sea escalable: para anadir otro equipo, basta con ampliar el array.

## 5. Funcionalidad 3 (Obligatorio)

### 5.1 Descripcion por escrito del comportamiento (Que hace)

La web incluye un explorador de circuitos donde cada pista puede abrirse como una ficha ampliada con nombre, longitud, numero de curvas, record, velocidad punta y una descripcion breve. El resultado se parece a una pequena pantalla de telemetria dentro de la propia landing.

Esta funcionalidad aporta contenido tecnico y hace que la pagina no dependa solo de imagenes o animaciones. El usuario puede aprender datos del campeonato sin salir del flujo principal.

### 5.2 Explicacion del funcionamiento (Como lo hace)

Todo parte de un objeto llamado `trackData`, donde cada clave representa un circuito y guarda sus datos. Cuando el usuario pulsa una tarjeta:

- Se llama a `openTrackOverlay(trackId)`.
- Esa funcion recupera los datos con `populateTrackOverlay(trackId)`.
- El overlay se activa visualmente y bloquea el scroll del fondo.

La imagen del circuito tambien reacciona al raton con un efecto 3D calculado a partir de la posicion del puntero dentro del contenedor. Cuando el usuario sale, la imagen vuelve a su estado normal.

### 5.3 Codigo relevante

Archivo principal: `entrada1.html`

```html
const trackData = {
    "qatar": {
        name: "LUSAIL",
        length: "5.38 km",
        curves: "16 (6 Izq, 10 Der)",
        record: "1'50.789",
        speed: "350.0 km/h",
        desc: "Carrera nocturna bajo los focos del desierto."
    },
    "mugello": {
        name: "MUGELLO",
        length: "5.25 km",
        curves: "15 (6 Izq, 9 Der)",
        record: "1'44.855",
        speed: "366.1 km/h",
        desc: "Una de las rectas mas rapidas del campeonato."
    }
};

function openTrackOverlay(trackId) {
    lastOverlayFocus = document.activeElement;
    populateTrackOverlay(trackId);
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    overlayClose.focus();
}

function closeTrackOverlay() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
    lastOverlayFocus?.focus?.();
}
```

Este bloque demuestra una idea importante del proyecto: la informacion no esta "pegada" manualmente tarjeta por tarjeta, sino centralizada en un objeto de datos. Eso permite reutilizar el mismo overlay para todos los circuitos.

## 6. Funcionalidad 4 (Obligatorio)

### 6.1 Descripcion por escrito del comportamiento (Que hace)

El modulo de motos permite pasar de un catalogo general a una ficha individual de cada moto. El usuario puede entrar en una tarjeta concreta y ver una pagina con identidad propia, centrada en un piloto y una montura determinados.

La gracia de esta funcionalidad es que la ficha no esta hecha a mano para cada caso. Se rellena automaticamente segun el parametro `id` recibido en la URL.

### 6.2 Explicacion del funcionamiento (Como lo hace)

En `motos.html` existe un catalogo con las motos disponibles. Cada tarjeta apunta a `moto-detalle.html?id=...`.

En `moto-detalle.html`, el script:

1. Lee el parametro con `URLSearchParams`.
2. Busca la moto correspondiente dentro de `motoCatalog`.
3. Rellena el DOM con titulo, piloto, motor, velocidad punta y bloques de descripcion.
4. Genera tambien tarjetas relacionadas para seguir navegando.

Esto permite reutilizar una sola plantilla de detalle para muchas motos diferentes, manteniendo coherencia visual y reduciendo codigo duplicado.

### 6.3 Codigo relevante

Archivo principal del detalle: `moto-detalle.html`  
Archivo relacionado de origen: `motos.html`

```html
const motoCatalog = [
    {
        id: 'ducati-lenovo-93',
        title: 'Ducati Lenovo 93',
        team: 'Ducati Lenovo',
        rider: 'Marc Marquez',
        engine: 'V4 Desmosedici GP',
        topSpeed: '356 km/h',
        strength: 'Frenada y traccion'
    }
];

const params = new URLSearchParams(window.location.search);
const motoId = params.get('id') || 'ducati-lenovo-93';
const moto = motoCatalog.find((item) => item.id === motoId) || motoCatalog[0];

document.title = `${moto.title} | Ficha de Moto`;
document.getElementById('detail-team-kicker').textContent = moto.team;
document.getElementById('detail-title').innerHTML = `${moto.title} <span>RACE</span>`;
document.getElementById('detail-rider-name').textContent = moto.rider;

const statsGrid = document.getElementById('stats-grid');
const statItems = [
    ['PILOTO', moto.rider],
    ['MOTOR', moto.engine],
    ['TOP SPEED', moto.topSpeed],
    ['FOCO', moto.strength]
];

statItems.forEach(([label, value]) => {
    const card = document.createElement('article');
    card.className = 'stat-card';
    card.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
    statsGrid.appendChild(card);
});
```

Esta funcionalidad esta bien resuelta porque combina navegacion, datos y renderizado dinamico. A nivel tecnico demuestra uso de parametros en URL, arrays de objetos y generacion programatica del contenido.

## 7. Funcionalidad 5 (Obligatorio)

### 7.1 Descripcion por escrito del comportamiento (Que hace)

El proyecto incluye un minijuego de carreras donde el usuario puede entrar en un circuito, pilotar una moto, completar vueltas y usar turbo. Durante la partida ve informacion en pantalla como velocidad, marcha, tiempo de vuelta, mejor vuelta, precision en trazada, numero de vueltas y minimapa.

Esta es probablemente la parte mas compleja del trabajo, porque ya no se limita a mostrar informacion: crea una experiencia interactiva en tiempo real.

### 7.2 Explicacion del funcionamiento (Como lo hace)

El minijuego esta construido con React y Three.js. El archivo principal es `minijuego/Game.jsx`. Desde ahi se prepara la escena, la camara, la moto, el circuito y el bucle de actualizacion.

La logica principal hace varias cosas:

- Calcula aceleracion, frenada y giro en cada frame.
- Gestiona un sistema de turbo con carga, consumo y recuperacion.
- Detecta cuando el jugador completa una vuelta.
- Actualiza el HUD y el minimapa a intervalos controlados.
- Recoloca el render si cambia el tamano de la ventana.

El juego tambien parte de una fase de salida: seleccion de circuito, seleccion de moto y cuenta atras antes de empezar a correr.

### 7.3 Codigo relevante

Archivo principal: `minijuego/Game.jsx`  
Archivos relacionados: `minijuego/HUD.jsx`, `minijuego/MiniMap.jsx`

```jsx
const BOOST_METER_MAX = 100;
const BOOST_PAD_COOLDOWN_MS = 2200;
const BOOST_PAD_METER_GAIN = 24;
const BOOST_PAD_SPEED_KICK = 0.2;
const BOOST_DRAIN_PER_FRAME = 0.48;
const BOOST_RECOVERY_PER_FRAME = 0.18;

if (boostRequested) {
  s.boostMeter = Math.max(0, s.boostMeter - BOOST_DRAIN_PER_FRAME * deltaFactor);
  s.boostActive = s.boostMeter > 0.5;
} else if (brakeKey) {
  s.boostActive = false;
  s.boostMeter = Math.min(BOOST_METER_MAX, s.boostMeter + BOOST_RECOVERY_PER_FRAME * 0.5 * deltaFactor);
} else {
  s.boostActive = false;
  const recharge = s.onTrack ? BOOST_RECOVERY_PER_FRAME : BOOST_RECOVERY_PER_FRAME * 0.55;
  s.boostMeter = Math.min(BOOST_METER_MAX, s.boostMeter + recharge * deltaFactor);
}

if (dStart < 9) {
  const t = (performance.now() - s.lapStart) / 1000;
  if (t > 5) {
    if (!s.bestLap || t < s.bestLap) s.bestLap = t;
    s.lapCount++;
    s.lapStart = performance.now();
  }
}

window.addEventListener('resize', handleResize);
```

Este codigo representa muy bien el nivel del minijuego: no solo hay movimiento, sino reglas de partida, recursos limitados, control del tiempo y reaccion ante cambios de pantalla.

## 8. Funcionalidades adicionales (Opcional)

### 8.1 Que hace

Una funcionalidad extra especialmente interesante es el modulo `Team Radio` de la pagina principal. Es un pequeno asistente conversacional local que responde preguntas del usuario sobre pilotaje, estrategia, neumaticos, reglajes, circuitos o reglamento de MotoGP.

Su valor esta en que funciona sin API externa. Es decir, no depende de una clave, de internet ni de un modelo remoto para responder dentro de la demo.

### 8.2 Como lo hace

En `entrada1.html`, la funcion `generarRespuestaLocal(mensaje)` normaliza el texto introducido por el usuario y busca patrones mediante expresiones regulares. Segun detecte palabras clave como `frenada`, `traccion`, `lluvia`, `setup` o `reglamento`, construye una respuesta diferente.

Despues `responderIA()` anade un pequeno retardo para simular la lectura de telemetria y muestra la respuesta en el panel de chat.

### 8.3 Codigo relevante

Archivo principal: `entrada1.html`

```html
function generarRespuestaLocal(mensaje) {
    const textoOriginal = mensaje.trim();
    const texto = normalizarTexto(textoOriginal);

    if (/estrategia|carrera|sprint|vueltas|atacar|conservar|gestion|plan/.test(texto)) {
        return construirRespuesta([
            'La estrategia correcta depende de deposito, desgaste y trafico.',
            'En sprint conviene ser agresivo pronto pero sin quemar la trasera.'
        ]);
    }

    if (/freno|frenada|bloquea|bloqueo|me voy largo|no paro/.test(texto)) {
        return construirRespuesta([
            'El problema esta en como cargas la rueda delantera al entrar.',
            'Prueba una entrada un poco mas recta y suelta freno con mas progresividad.'
        ]);
    }

    return construirRespuesta([
        'Puedo ayudarte aunque la pregunta sea amplia.',
        'Dime si el problema es frenada, giro, traccion, neumaticos o estrategia.'
    ]);
}
```

Aunque esta funcionalidad es opcional, suma bastante personalidad al proyecto y demuestra creatividad tecnica dentro de una web orientada a MotoGP.

## 9. Funcionalidad Backend (Obligatorio solo si no lo habeis explicado antes)

### 9.1 Que hace

El backend se encarga de tres tareas fundamentales:

1. Servir los endpoints de la API.
2. Validar y guardar los registros.
3. Devolver informacion sobre el estado del sistema.

Gracias a esto, el formulario no guarda datos "de mentira", sino que escribe en un archivo JSON real.

### 9.2 Como lo hace

El servidor esta implementado en Node.js dentro de `.vscode/server.js`. Escucha por defecto en el puerto `5501` y maneja, entre otros, estos endpoints:

- `GET /api/health`: devuelve si el servidor esta activo.
- `GET /api/registros`: devuelve informacion de los registros.
- `POST /api/registros`: inserta un nuevo registro.

Antes de guardar, el backend valida el email de varias formas:

- Comprueba el formato.
- Rechaza dominios desechables.
- Comprueba que el dominio tenga resolucion real de correo o DNS.
- Evita correos duplicados.

Despues guarda el nuevo registro en `.vscode/fichajeregistros.json`. Ademas, construye un resumen con numero total de registros, equipos mas repetidos y actividad reciente, evitando exponer mas informacion de la necesaria.

### 9.3 Codigo relevante

Archivo principal: `.vscode/server.js`

```js
const PORT = parsePort(process.env.PORT, 5501);

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function validateEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!isValidEmailFormat(normalizedEmail)) {
    return { ok: false, error: 'El correo no tiene un formato valido.' };
  }

  const [, domain = ''] = normalizedEmail.split('@');
  const domainExists = await hasResolvableMailDomain(domain);
  if (!domainExists) {
    return { ok: false, error: 'El dominio del correo no existe o no acepta correo real.' };
  }

  return { ok: true, normalizedEmail };
}

function readRecords() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8').trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

if (req.method === 'POST') {
  const body = await collectBody(req);
  const payload = JSON.parse(body || '{}');
  const piloto = String(payload.piloto || '').trim();
  const escuderia = String(payload.escuderia || '').trim();
  const email = String(payload.email || '').trim();

  const emailValidation = await validateEmail(email);
  if (!emailValidation.ok) {
    sendJson(res, 400, { error: emailValidation.error });
    return;
  }

  const records = readRecords();
  records.push({
    id: Date.now(),
    piloto,
    escuderia,
    email: emailValidation.normalizedEmail,
    fecha_registro: new Date().toLocaleString('es-ES')
  });
  writeRecords(records);
}
```

Esta parte es importante de defender en clase porque demuestra trabajo funcional de verdad: recepcion de datos, validacion, persistencia y control de errores.

## 10. Responsividad (Obligatorio)

### 10.1 Que hace

La web se adapta a diferentes tamanos de pantalla y tambien tiene en cuenta preferencias del usuario relacionadas con el movimiento. En la practica, esto significa que la pagina sigue siendo usable tanto en escritorio como en movil, y que ciertas animaciones se suavizan o se reducen si el sistema asi lo pide.

### 10.2 Como lo hace

La responsividad se resuelve de dos maneras:

1. Con CSS, usando `@media` para reorganizar bloques, tamanos y espaciados.
2. Con JavaScript, recalculando medidas del render en el minijuego cuando cambia el tamano de la ventana.

En la landing, por ejemplo, hay reglas especificas para anchos maximos de `768px` y `560px`. Ademas existe una media query para `prefers-reduced-motion`, lo que ayuda a no saturar la experiencia en equipos o usuarios sensibles a movimientos intensos.

En el minijuego, el metodo `handleResize()` vuelve a calcular el viewport, actualiza el renderer y reaplica el encuadre de la camara.

### 10.3 Codigo relevante

Archivos principales: `entrada1.html`, `minijuego/Game.jsx`

```css
@media (max-width: 768px) {
    /* Ajustes de layout para tablet y movil */
}

@media (max-width: 560px) {
    /* Ajustes extra para pantallas muy pequenas */
}

@media (prefers-reduced-motion: reduce) {
    /* Se reducen o eliminan animaciones largas */
}
```

```jsx
const handleResize = () => {
  viewportRef.current = { width: window.innerWidth, height: window.innerHeight };
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  applyCameraFrustum(camera, stateRef.current.cameraViewHeight || ORTHO_VIEW_HEIGHT, viewportRef.current);
};

window.addEventListener('resize', handleResize);
```

La responsividad no es un detalle secundario en este proyecto. Es parte de que la experiencia se mantenga coherente en distintos dispositivos, algo especialmente importante en una web con tantas capas visuales y una parte jugable.

## Cierre

En conjunto, este proyecto no se limita a ser una landing bonita sobre MotoGP. Tiene varias capas funcionales reales: navegacion dinamica, formularios con backend, modulos informativos, animaciones, generacion de contenido a partir de datos y un minijuego propio. Precisamente por eso la parte tecnica no depende de una sola pagina, sino de la coordinacion entre HTML, CSS, JavaScript, Node.js, React y Three.js.

Si tuviera que resumir su valor en una frase, seria esta: la web no solo presenta contenido, sino que construye una experiencia completa alrededor del universo MotoGP.
