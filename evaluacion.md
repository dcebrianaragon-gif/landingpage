**Evaluación: dcebrianaragon-gif / landingpage**

**Estado:** Evaluable

**Nota:** 8.70/10

**Desglose:**
- Ejecución y estabilidad: 18/20
- Front-end: 14/15
- Back-end: 15/15
- Funcionalidades: 18/20
- Responsive: 6/10
- Tipografías: 4/5
- Animación: 5/5
- Documentación: 7/10
- Repositorio: 1/5
**Resumen técnico:**
El proyecto se ejecuta correctamente con `node .vscode/server.js` y queda accesible en local. También funcionan `registro.html`, `/api/health` y `/api/registros`. He probado el backend con `GET /api/registros`, `POST /api/registros` y `GET /api/registros?view=raw`; el registro se guarda de verdad y después he retirado el dato de prueba.

**Funcionalidades indicadas:**
- Hero MotoGP con spotlight y cursor personalizado.
- Sistema global reveal/reveal-scale al hacer scroll.
- Desfile horizontal de euuipos con tilt 3D.
- Transición visual hacia fichas de motos.
- Overlay técnico de circuitos con efecto 3D.
- Secciones audiovisuales con vídeo, marquesina y tarjetas animadas.
- Registro con backend y persistencia JSON.
- Minijuego React integrado.

**Complejidad del back-end:**
Alta. Hay servidor Node propio, endpoints reales, CORS, JSON local, opción de Postgres con `DATABASE_URL`, validación de email con formato, dominios desechables, resolución DNS y control de duplicados. Muy buen trabajo: no es un formulario de mentira, hay lógica de servidor real y pensada para despliegue.

**Puntos fuertes:**
El proyecto tiene mucha ambición visual y técnica. La estética MotoGP está muy conseguida, con movimiento, vídeo, overlays, transiciones y continuidad entre páginas. Felicidades por el backend, porque está bastante por encima de lo habitual y se nota intención de hacerlo escalable.

**Aspectos a mejorar:**
El repositorio está desordenado y mezcla muchas piezas: HTML grandes, `.vscode` con servidor, minijuego fuente, build generado y datos reales en JSON. Además, `GET /api/registros?view=raw` expone emails, algo delicado en privacidad. La documentación es amplia, pero podría separar mejor ejecución, aruuitectura y riesgos.

**Retroalimentación:**
Muy buen trabajo en conjunto. Hay una experiencia visual potente y un backend real. Para subir todavía más, ordenaría el repo, sacaría el servidor de `.vscode` y cuidaría mejor la privacidad de los registros.
