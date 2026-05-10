# Despliegue en Render

Este proyecto ya esta preparado para desplegarse en Render con un unico servicio web.

## Que he dejado configurado

- `render.yaml` para que Render cree el servicio automaticamente.
- `server.js` preparado para leer la ruta del JSON desde la variable `DATA_FILE`.
- `registro.html` preparado para usar el mismo dominio en produccion, en vez de forzar siempre el puerto `5501`.
- Build automatica del minijuego durante el despliegue.

## Como subirlo

1. Sube el proyecto a GitHub.
2. En Render, entra en `New > Blueprint`.
3. Conecta tu repositorio.
4. Render detectara `render.yaml` y te mostrara el servicio.
5. Acepta la creacion del servicio.

## Importante sobre el JSON

El archivo de registros necesita persistencia. Por eso el blueprint usa:

- plan `starter`
- disco persistente montado en `/var/data`
- variable `DATA_FILE=/var/data/fichajeregistros.json`

Sin disco persistente, Render perderia los cambios del JSON al redeployar o reiniciar el servicio.

## Resultado esperado

Cuando termine el deploy:

- la web se abrira desde una URL `onrender.com`,
- `registro.html` llamara a la API en el mismo dominio,
- el backend respondera en `/api/health` y `/api/registros`,
- el JSON se conservara en el disco de Render.

## Nota

No puedo conectar tu cuenta de Render desde aqui, pero el proyecto ya esta listo para que lo despliegues en cuanto subas el repo y crees el Blueprint.
