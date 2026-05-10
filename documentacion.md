# Documentacion tecnica del proyecto MotoGP

Este documento explica el proyecto siguiendo la estructura pedida en el PDF. En esta version, las funcionalidades principales se entienden como las animaciones e interacciones visuales que se han ido construyendo por toda la web, ya que esa ha sido una parte clave del trabajo.

## 1. Instrucciones de inicio/ejecucion de vuestra web (Obligatorio)

Este proyecto mezcla frontend estatico, backend local y un minijuego hecho en React. La forma mas clara de arrancarlo es esta:

1. Abrir una terminal en la carpeta del proyecto: `C:\Users\DAVID\Desktop\Imagenes mto gp pagina`.
2. Iniciar el backend con uno de estos comandos:
   - `npm start`
   - `node .vscode/server.js`
3. El backend queda escuchando en `http://localhost:5501`.
4. Abrir el frontend con un servidor estatico. En desarrollo se ha usado `Live Server`, dejando la web en `http://localhost:5502`.
5. Entrar en `entrada1.html`, `registro.html` o cualquier otra pagina desde ese servidor estatico.

Tambien existe el archivo `iniciar-backend.bat`, que lanza el backend y abre la pagina de registro.

### Ejecucion real usada en este proyecto

- Frontend: `http://localhost:5502`
- Backend: `http://localhost:5501`
- Conexion entre ambos: `registro.html` detecta el host actual y fuerza el puerto `5501` para llamar a la API.

### Rutas importantes

- Pagina principal: `entrada1.html`
- Pagina de motos: `motos.html`
- Ficha de moto: `moto-detalle.html`
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

La idea practica es sencilla: la parte visual se abre desde el puerto `5502`, mientras que el backend funcional trabaja en `5501`.

## 2. Enumeracion de al menos las 5 funcionalidades mas importantes implementadas (Obligatorio)

En esta memoria, las cinco funcionalidades principales se plantean como animaciones e interacciones visuales distribuidas por la web:

1. Hero cinematografico interactivo con spotlight, cursor personalizado y entrada animada.
2. Sistema global de aparicion progresiva al hacer scroll con las clases `reveal` y `reveal-scale`.
3. Desfile horizontal de equipos con tilt 3D, desplazamiento lateral y transicion cinematica hacia la ficha.
4. Tarjetas de circuitos con expansion visual, overlay tecnico y efecto 3D sobre el mapa.
5. Bloques audiovisuales como `Danger Zone` y la seccion de pilotos, con marquesina animada, video de fondo y entrada escalonada de tarjetas.

Funcionalidad adicional destacable:

6. Animaciones del modulo de motos y de la ficha individual para mantener continuidad visual fuera de la landing principal.

## 3. Funcionalidad 1 (Obligatorio)

### 3.1 Descripcion por escrito del comportamiento (Que hace)

La primera funcionalidad importante es el hero principal de la landing. Nada mas abrir la pagina, el usuario se encuentra con una entrada animada del texto, un efecto de flotacion, un cursor personalizado y un spotlight que revela la tipografia principal siguiendo el movimiento del raton.

Esta parte es importante porque fija el tono de toda la web. La pagina no arranca como una web comun, sino como una presentacion visual de MotoGP con mucha presencia y sensacion de velocidad.

### 3.2 Explicacion del funcionamiento (Como lo hace)

La animacion mezcla CSS y JavaScript:

- CSS se encarga de la entrada principal del titulo, el blur inicial, el escalado y la flotacion.
- JavaScript controla el spotlight y el cursor personalizado, porque ambos dependen del movimiento real del usuario.

El texto principal esta duplicado en dos capas:

- `#hero-base`, que actua como base visual.
- `#hero-lit`, que representa la capa iluminada.

El script modifica el `clip-path` de `#hero-lit` para que solo se vea una zona circular, como si un foco se desplazara por encima del titulo. Para que el movimiento sea fluido, se usa `requestAnimationFrame` a traves de una funcion `rafThrottle()`.

### 3.3 Codigo relevante

Archivo principal: `entrada1.html`
```html
body.ready #hero-base,
body.ready #hero-lit {
    animation: heroIn 1.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
}

body.ready #hero-spotlight-zone {
    animation: heroFloat 8s ease-in-out 2.1s infinite;
}

body.ready .hero-copy {
    animation: heroCopyIn 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.95s forwards;
}

const zone = document.getElementById('hero-spotlight-zone');
const litDiv = document.getElementById('hero-lit');

const updateSpotlight = rafThrottle((clientX, clientY) => {
    const rect = zone.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    litDiv.style.clipPath = `circle(150px at ${x}px ${y}px)`;
});

zone.addEventListener('pointermove', (event) => {
    updateSpotlight(event.clientX, event.clientY);
});
```

Este bloque demuestra bien la idea del proyecto: se combinan animaciones declarativas en CSS con control dinamico por JavaScript cuando la experiencia lo necesita.

## 4. Funcionalidad 2 (Obligatorio)

### 4.1 Descripcion por escrito del comportamiento (Que hace)

La segunda funcionalidad importante es el sistema general de aparicion progresiva al hacer scroll. Casi todos los bloques de la landing se van activando con entradas suaves en vez de aparecer todos a la vez.

Esto da a la pagina un ritmo visual mucho mejor. El contenido no cae de golpe sobre el usuario, sino que se va presentando poco a poco mientras avanza.

### 4.2 Explicacion del funcionamiento (Como lo hace)

El sistema usa dos clases principales:

- `.reveal`, para elementos que deben aparecer con desplazamiento y blur.
- `.reveal-scale`, para bloques que deben aparecer con un pequeno escalado.

Al cargar la pagina, el script recoge todos los elementos con esas clases, les asigna un pequeno retraso y, en cada scroll, comprueba si ya han entrado en la zona visible. Cuando un bloque entra en pantalla, recibe la clase `active`, que dispara la transicion.

### 4.3 Codigo relevante

Archivo principal: `entrada1.html`

```html
.reveal {
    transform: translate3d(0, var(--reveal-distance), 0);
    filter: blur(14px);
    transition:
        opacity 0.95s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.95s cubic-bezier(0.16, 1, 0.3, 1),
        filter 0.95s cubic-bezier(0.16, 1, 0.3, 1);
    transition-delay: var(--reveal-delay, 0ms);
}

.reveal.active {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    filter: blur(0);
}

revealTargets = Array.from(document.querySelectorAll('.reveal, .reveal-scale'));

revealTargets.forEach((el, index) => {
    const stagger = Math.min(index * 35, 220);
    el.style.setProperty('--reveal-delay', `${stagger}ms`);
});

function revealElements() {
    revealTargets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9) {
            el.classList.add('active');
        }
    });
}
```

Lo valioso aqui es que no es una animacion aislada, sino un sistema reutilizable que se aplica a titulos, tarjetas, bloques de texto y secciones completas.

## 5. Funcionalidad 3 (Obligatorio)

### 5.1 Descripcion por escrito del comportamiento (Que hace)

La tercera funcionalidad importante es el desfile horizontal de equipos. En esta zona el usuario puede desplazarse lateralmente, ver las tarjetas con profundidad y luz dinamica, y lanzar una transicion visual al entrar en una ficha.

No es un carrusel normal. La intencion es que parezca un desfile de motos dentro de un tunel visual, no una simple lista de tarjetas.

### 5.2 Explicacion del funcionamiento (Como lo hace)

La funcion `initTeams()` construye las tarjetas a partir de un array de datos. Despues se activan tres capas de comportamiento:

1. Scroll horizontal con rueda y con botones.
2. Movimiento 3D de cada tarjeta con `initTeamCardMotion()`.
3. Transicion de salida con `launchMotoTransition()`.

`initTeamCardMotion()` actualiza variables CSS como `--tilt-x`, `--tilt-y`, `--glow-x` y `--glow-y`. Luego la propia tarjeta usa esas variables para inclinarse y desplazar el reflejo. Cuando el usuario hace click, `launchMotoTransition()` genera un overlay de velocidad antes de cambiar de pagina.

### 5.3 Codigo relevante

Archivo principal: `entrada1.html`

```html
function initTeams() {
    const container = document.getElementById('team-target');
    const teams = [
        { name: "Ducati Lenovo", code: "DUC-01", riders: "Bagnaia // Marquez", img: "motogp3.jpg", detail: "moto-detalle.html?id=ducati-lenovo-93" },
        { name: "Pertamina VR46", code: "VR4-02", riders: "Di Giannantonio // Morbidelli", img: "motogp7.jpg", detail: "moto-detalle.html?id=vr46-49" }
    ];

    teams.forEach((team, i) => {
        const card = document.createElement('a');
        card.className = 'team-card team-card-link reveal';
        card.href = team.detail;
        card.style.setProperty('--reveal-delay', `${i * 85}ms`);
        container.appendChild(card);
    });

    const teamCards = Array.from(container.querySelectorAll('.team-card-link'));
    attachMotoLaunchSequence(teamCards, 'team-card-launching');
    initTeamCardMotion(teamCards);
}

function initTeamCardMotion(elements) {
    elements.forEach((element) => {
        const updateCardMotion = rafThrottle((px, py) => {
            const tiltY = (px - 0.5) * 10;
            const tiltX = (0.5 - py) * 10;

            element.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
            element.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
            element.style.setProperty('--glow-x', `${(px * 100).toFixed(2)}%`);
            element.style.setProperty('--glow-y', `${(py * 100).toFixed(2)}%`);
        });
    });
}

function launchMotoTransition(element, overlay) {
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

Esta funcionalidad resume muy bien el tipo de trabajo hecho en la web: datos, animacion, interaccion y continuidad visual entre paginas.

## 6. Funcionalidad 4 (Obligatorio)

### 6.1 Descripcion por escrito del comportamiento (Que hace)

La cuarta funcionalidad importante esta en el bloque de circuitos. Aqui cada pista puede abrirse como una pequena experiencia visual: la tarjeta se expande, el overlay entra como si fuera una pantalla de telemetria y la imagen del circuito reacciona al movimiento del raton.

De cara al usuario, esta parte hace que el contenido tecnico no resulte seco, porque se presenta de una forma mucho mas viva.

### 6.2 Explicacion del funcionamiento (Como lo hace)

El modulo parte de un objeto `trackData` con la informacion de cada pista, pero la funcionalidad importante no es solo el dato, sino la forma de mostrarlo.

Cuando el usuario pulsa una tarjeta:

1. Se crea un clon visual de esa misma tarjeta.
2. El clon recibe clases como `is-expanding` y `clicked-pulse`.
3. La tarjeta parece salir hacia delante durante un instante.
4. Despues se abre el overlay real con la informacion del circuito.

Dentro del overlay, el mapa del circuito aplica rotacion 3D calculando la posicion del puntero dentro de su contenedor.

### 6.3 Codigo relevante

Archivo principal: `entrada1.html`

```html
card.addEventListener('click', function () {
    if (document.querySelector('.is-expanding')) return;

    const rect = this.getBoundingClientRect();
    const clone = this.cloneNode(true);
    clone.classList.add('is-expanding', 'clicked-pulse');
    clone.style.position = 'fixed';
    clone.style.top = rect.top + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
});

function openTrackOverlay(trackId) {
    lastOverlayFocus = document.activeElement;
    populateTrackOverlay(trackId);
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
}

container3D.addEventListener('mousemove', (e) => {
    const rect = container3D.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - (rect.height / 2)) / (rect.height / 2)) * -20;
    const rotateY = ((x - (rect.width / 2)) / (rect.width / 2)) * 20;
    img3D.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
});
```

Esta funcionalidad esta bien resuelta porque mezcla animacion de click, modal y respuesta al puntero dentro de una misma seccion.

## 7. Funcionalidad 5 (Obligatorio)

### 7.1 Descripcion por escrito del comportamiento (Que hace)

La quinta funcionalidad principal reune dos bloques audiovisuales de la landing: `Danger Zone` y la seccion de pilotos. En ambos casos la idea ha sido convertir la pagina en algo mas vivo usando video, movimiento continuo y apariciones escalonadas.

En `Danger Zone` hay una marquesina de alerta en movimiento y una parrilla de videos incrustados. En la seccion de pilotos hay un video de fondo con tratamiento cinematografico y tarjetas que entran una detras de otra.

### 7.2 Explicacion del funcionamiento (Como lo hace)

`Danger Zone` se apoya sobre todo en CSS:

- La marquesina usa una animacion infinita con `scrollMarquee`.
- Las tarjetas de video aprovechan el mismo sistema `reveal` del resto de la landing.

La seccion de pilotos mezcla varias capas:

- Un `video` de fondo colocado con `position: absolute`.
- Un overlay oscuro y rojo para que el texto siga siendo legible.
- Aparicion escalonada de las tarjetas mediante distintos `transition-delay`.

### 7.3 Codigo relevante

Archivo principal: `entrada1.html`

```html
.marquee-inner {
    display: inline-block;
    animation: scrollMarquee 30s linear infinite;
}

@keyframes scrollMarquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
}

.pilotos-stage.reveal.active .pilotos-video {
    opacity: 0.34;
    transform: scale(1.06);
}

.pilotos-stage.reveal.active .piloto-card:nth-child(2) { transition-delay: 0.08s; }
.pilotos-stage.reveal.active .piloto-card:nth-child(3) { transition-delay: 0.16s; }
.pilotos-stage.reveal.active .piloto-card:nth-child(4) { transition-delay: 0.24s; }

<video class="pilotos-video" autoplay muted loop playsinline preload="auto" aria-hidden="true">
    <source src="imagenes/Video_de_MotoGP_Celebracion_y_Carrera.mp4" type="video/mp4">
</video>
```

Aunque aqui hay menos logica de JavaScript que en otras secciones, visualmente es una de las zonas mas importantes porque da mucho ambiente a la pagina.

## 8. Funcionalidades adicionales (Opcional)

### 8.1 Que hace

Como funcionalidad adicional quiero destacar las animaciones del modulo de motos y de la ficha individual. La idea ha sido mantener el mismo nivel de intensidad visual tambien fuera de la landing principal, para que el proyecto no parezca hecho por partes desconectadas.

### 8.2 Como lo hace

En `motos.html` hay un hero con profundidad 3D, arcos de velocidad, entrada escalonada de texto y respuesta al movimiento del puntero. En `moto-detalle.html` se reutiliza una logica parecida para que el cambio a la ficha no se sienta brusco.

La pagina de motos usa GSAP para algunas entradas y usa variables CSS para inclinar el hero y las tarjetas. La ficha de detalle se apoya en `data-reveal` y en un orden de aparicion para texto, estadisticas y bloques relacionados.

### 8.3 Codigo relevante

Archivos principales: `motos.html`, `moto-detalle.html`

```html
gsapApi.from('.hero-copy > *', {
    y: 30,
    opacity: 0,
    duration: 0.9,
    stagger: 0.08
});

const updateHeroPointer = rafThrottle((px, py) => {
    const tiltX = (0.5 - py) * 8;
    const tiltY = (px - 0.5) * 10;
    const shiftX = (px - 0.5) * 18;
    const shiftY = (py - 0.5) * 14;

    frame.style.setProperty('--hero-tilt-x', `${tiltX.toFixed(2)}deg`);
    frame.style.setProperty('--hero-tilt-y', `${tiltY.toFixed(2)}deg`);
    frame.style.setProperty('--hero-shift-x', `${shiftX.toFixed(2)}px`);
    frame.style.setProperty('--hero-shift-y', `${shiftY.toFixed(2)}px`);
});

[data-reveal] {
    opacity: 0;
    transform: translateY(28px);
}

body.page-ready [data-reveal] {
    opacity: 1;
    transform: translateY(0);
    transition-delay: calc(var(--reveal-order, 0) * 120ms);
}
```

Esta funcionalidad adicional sirve para demostrar que el trabajo visual no se concentra solo en una pagina, sino que se mantiene en el resto del proyecto.

## 9. Funcionalidad Backend (Obligatorio solo si no lo habeis explicado antes)

### 9.1 Que hace

El backend se encarga de tres tareas fundamentales:

1. Servir los endpoints de la API.
2. Validar y guardar los registros.
3. Devolver informacion sobre el estado del sistema.

Gracias a esto, el formulario no guarda datos de mentira, sino que escribe en un archivo JSON real.

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

Despues guarda el nuevo registro en `.vscode/fichajeregistros.json`. Ademas, construye un resumen con numero total de registros, equipos mas repetidos y actividad reciente.

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
```

Este apartado es importante porque demuestra que el proyecto no se queda solo en la parte visual. Tambien hay una capa funcional real y persistente.

## 10. Responsividad (Obligatorio)

### 10.1 Que hace

La web se adapta a distintos tamanos de pantalla y tambien tiene en cuenta preferencias del usuario relacionadas con el movimiento. Eso significa que la pagina sigue siendo usable tanto en escritorio como en movil, y que las animaciones no fuerzan una experiencia incomoda.

### 10.2 Como lo hace

La responsividad se resuelve de dos maneras:

1. Con CSS, usando `@media` para reorganizar el layout y reducir ciertos bloques.
2. Con JavaScript, recalculando el render del minijuego cuando cambia el tamano de la ventana.

Ademas, existe una media query para `prefers-reduced-motion`, lo que ayuda a reducir movimientos largos cuando el sistema del usuario asi lo pide.

### 10.3 Codigo relevante

Archivos principales: `entrada1.html`, `minijuego/Game.jsx`

```css
@media (max-width: 768px) {
    section { padding: 80px 5%; min-height: auto; }
    .team-card { flex: 0 0 85vw; height: 450px; }
    .pilotos-stage { grid-template-columns: 1fr; min-height: auto; }
}

@media (max-width: 560px) {
    .maps-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
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

La responsividad es especialmente importante aqui porque el proyecto tiene muchos elementos visuales grandes, videos, overlays, tarjetas y animaciones. Si eso no se adapta bien, la experiencia se rompe muy rapido.

## Cierre

En conjunto, el proyecto no se limita a ser una pagina informativa sobre MotoGP. La parte mas fuerte del trabajo esta en como se ha construido una experiencia visual con movimiento, ritmo, profundidad y continuidad entre secciones.

Por eso, en esta memoria las funcionalidades principales se han explicado como animaciones e interacciones visuales repartidas por la web: porque son una parte central del valor del proyecto y de la sensacion final que transmite al usuario.
