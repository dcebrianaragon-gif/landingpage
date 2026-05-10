# Explicacion corta de React

React es una libreria de JavaScript que se usa para construir interfaces web de forma ordenada y reutilizable. En lugar de hacer una pagina enorme con todo mezclado, React divide la interfaz en piezas pequenas llamadas componentes.

## Ideas clave

### 1. Componentes

Un componente es una parte de la interfaz que se puede reutilizar. Por ejemplo:

- un menu,
- un boton,
- un minimapa,
- un HUD del juego.

En este proyecto, el minijuego usa varios componentes separados, como `Game.jsx`, `HUD.jsx` y `MiniMap.jsx`.

### 2. JSX

React usa JSX, que es una forma de escribir HTML dentro de JavaScript.

Ejemplo:

```jsx
function Titulo() {
  return <h1>Hola, MotoGP</h1>;
}
```

Eso hace que el codigo visual sea mas facil de leer.

### 3. Props

Las `props` son datos que un componente recibe desde fuera.

Ejemplo:

```jsx
function Saludo({ nombre }) {
  return <p>Hola {nombre}</p>;
}
```

Si llamas a ese componente con otro nombre, el texto cambia sin tener que reescribirlo.

### 4. State

El `state` es la informacion que puede cambiar dentro de un componente. Cuando cambia el estado, React actualiza la pantalla automaticamente.

Ejemplo:

```jsx
import { useState } from 'react';

function Contador() {
  const [valor, setValor] = useState(0);

  return (
    <button onClick={() => setValor(valor + 1)}>
      {valor}
    </button>
  );
}
```

### 5. Hooks

Los hooks son funciones especiales de React que permiten controlar cosas como:

- estado (`useState`),
- efectos (`useEffect`),
- referencias (`useRef`).

En el minijuego se usan para controlar el estado de carrera, la velocidad, las vueltas, el HUD y el render.

## React en este proyecto

En este trabajo, React se usa sobre todo en el minijuego. Sirve para:

- separar mejor el codigo,
- actualizar la interfaz en tiempo real,
- controlar datos como vueltas, velocidad y turbo,
- reutilizar componentes visuales.

Gracias a React, el minijuego esta mas ordenado que si todo estuviera en un unico archivo gigante.

## Resumen final

React sirve para construir interfaces de forma modular, dinamica y mas facil de mantener. Su idea principal es dividir la web en componentes, pasar datos con `props` y actualizar la pantalla automaticamente cuando cambia el `state`.

En una frase: React ayuda a que una interfaz compleja sea mas clara, mas reutilizable y mas facil de programar.
