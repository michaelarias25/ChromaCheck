# F1 · Iniciar sesión

## Historia

Como usuario del taller, quiero entrar con mi usuario y contraseña para que solo el personal autorizado maneje los lotes y el sensor.

## Relación

Pantalla `/login`. API: `POST /api/auth/login`, `POST /api/auth/logout` ([contratos/autenticacion.md](../contratos/autenticacion.md)). Responsable: Michael.

## Comportamiento

1. Sin sesión, cualquier pantalla lleva a `/login`.
2. El usuario escribe usuario y contraseña y pulsa "Ingresar".
3. Si son correctos, llega a la pantalla de lotes (F2).
4. "Cerrar sesión", en el encabezado, lo devuelve a `/login`.

## Criterios de aceptación

Ya en `development`:

- [x] Sin cookie `sesion` válida, toda página redirige a `/login`; con sesión, `/login` redirige a `/`.
- [x] Con credenciales incorrectas el mensaje no dice cuál campo falló.
- [x] La contraseña se guarda como hash (scrypt), nunca en texto plano.

Pendientes (identidad visual):

- [ ] Campos de 56 px de alto con etiqueta visible "Usuario" y "Contraseña" (sin mayúsculas sostenidas).
- [ ] Botón "Mostrar contraseña" con texto, para revisar lo escrito.
- [ ] Botón "Ingresar" principal de 72 px de alto y ancho completo del formulario.
- [ ] El error aparece debajo del botón, en texto de 18 px con "⚠", y no se borra solo.

## Fuera de alcance

Registro público, recuperar contraseña por correo, roles distintos.
