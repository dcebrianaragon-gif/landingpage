# Despliegue en Render

Este proyecto ya esta preparado para desplegarse en Render con un unico servicio web.

## Que he dejado configurado

- `render.yaml` para que Render cree el servicio automaticamente.
- `server.js` preparado para leer la ruta del JSON desde la variable `DATA_FILE`.
- `server.js` preparado para usar `DATABASE_URL` si quieres conectar Render Postgres.
- `registro.html` preparado para usar el mismo dominio en produccion, en vez de forzar siempre el puerto `5501`.
- Build automatica del minijuego durante el despliegue.

## Como subirlo

1. Sube el proyecto a GitHub.
2. En Render, entra en `New > Blueprint`.
3. Conecta tu repositorio.
4. Render detectara `render.yaml` y te mostrara el servicio.
5. Acepta la creacion del servicio.

## Como conectar Render Postgres

Si ya tienes una base de datos en Render, abre tu servicio web y anade la variable:

- `DATABASE_URL` = URL interna de tu Postgres de Render

En cuanto exista esa variable, el backend dejara de usar el JSON como sistema principal y empezara a guardar los registros en la base de datos. Si no existe `DATABASE_URL`, seguira usando el JSON persistente como respaldo.

## Importante sobre el JSON

El archivo de registros necesita persistencia. Por eso el blueprint usa:

- plan `starter`
- disco persistente montado en `/var/data`
- variable `DATA_FILE=/var/data/fichajeregistros.json`

Sin disco persistente, Render perderia los cambios del JSON al redeployar o reiniciar el servicio. El JSON ahora queda como modo de respaldo si todavia no has conectado Postgres.

## Resultado esperado

Cuando termine el deploy:

- la web se abrira desde una URL `onrender.com`,
- `registro.html` llamara a la API en el mismo dominio,
- el backend respondera en `/api/health` y `/api/registros`,
- los registros se guardaran en Postgres si `DATABASE_URL` esta configurada,
- y, si no, el JSON se conservara en el disco de Render.

## Nota

No puedo conectar tu cuenta de Render desde aqui, pero el proyecto ya esta listo para que lo despliegues en cuanto subas el repo y crees el Blueprint.
