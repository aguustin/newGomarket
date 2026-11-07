# Pasar Ipass a producción

Lista de lo que hay que hacer el día que se publique. Se actualiza en cada etapa: si algo cambia, anotarlo acá.
Última actualización: 2026-11-07 (limpieza de datos sensibles para producción).

## 1. Antes de publicar: pendientes de código

- [x] **E2E "registro → verificación → login → la sesión persiste al recargar":** falló una vez en la etapa 13 corriendo junto a otros, y solo pasó (2026-11-05). Probablemente fue un tiempo de espera. Si vuelve a fallar, mirar `client/test-results/` antes de reintentar.
- [x] SDK de Mercado Pago reemplazado por llamadas directas a la API (`server/lib/mercadopago.js`, 2026-11-06). `npm audit` del servidor: solo 2 moderadas por `uuid` dentro de `exceljs`, de bajo impacto.

- [x] **CBU, número de cuenta y teléfonos pasados a `String`** (usuario, RRPP y compradores; 2026-11-07). Como número se alteraba el CBU (22 dígitos) y los teléfonos perdían el 0 inicial. Sin datos reales no hace falta migrar.
- [x] **`POST /get_profile`**: a terceros solo devuelve nombre, productora, país, imagen y redes; el dueño (con sesión) ve todo menos la contraseña (2026-11-07).
- [x] Logs con datos sensibles eliminados: datos bancarios en `createSellerController`, el evento entero con CBU/mails de los RRPP en `addRRPPController`, el mail cifrado + hash del link de RRPP, y los logs de depuración de ventas e imágenes (2026-11-07).
- [x] Imagen de ejemplo del Excel reemplazada por datos ficticios (2026-11-07).
- [x] `fechaCompra` de las compras tomaba la hora de arranque del servidor (`default: Date.now()`): corregido a `Date.now` (2026-11-07).
- [ ] **Rotar TODOS los secretos que estuvieron en git**: commits viejos versionaron `server/.env` y `client/.env` (access token de MP, CLIENT_SECRET, MONGO_URI, JWT_SECRET, SECRET_MAIL_KEY, Cloudinary, Resend, reCAPTCHA, clave del webhook, contraseña de Gmail). Siguen en el historial aunque se hayan borrado: tratarlos como públicos y generar nuevos para producción.

## 2. Servicios externos

**Render (backend)**
- [ ] Plan pago, **siempre encendido** y con **una sola instancia**. Las tareas programadas (reservas vencidas, reintentos de pagos, mails e invitaciones, desactivar eventos viejos) corren dentro del servidor (`server/lib/cron.js`): si el servicio se duerme no corren, y con 2 instancias corren dos veces.
- [ ] Plan **Starter** (512 MB). Para eventos muy grandes se puede pasar a Standard (2 GB) ese día y volver.
- [ ] Runtime **Node nativo, sin Docker** (los archivos de Docker se borraron el 2026-11-07). Root Directory `server`, build `npm ci`, start `npm start`, `NODE_VERSION=22`.
- [ ] Revisar el comando `start`: `--max-old-space-size` tiene que quedar por debajo de la memoria del plan (~400 en Starter, ~1600 en Standard).
- [ ] Confirmar la rama que despliega Render (hoy es el último commit de `ipass_v_0.8`).

**Render (frontend, Static Site gratis)**
- [ ] Root Directory `client`, build `npm ci && npm run build`, publish `dist`.
- [ ] Regla de rewrite `/*` → `/index.html` (si no, recargar cualquier página que no sea el inicio da 404).

**MongoDB Atlas**
- [ ] Base de producción **separada** de la de desarrollo, con **backups automáticos** activados.
- [ ] Usuario de la base con contraseña nueva (rotar la actual) y acceso de red restringido a Render.
- [ ] Los índices se crean solos al arrancar. Revisar en los logs del primer arranque que no haya errores de índices.

**Resend (mails)**
- [ ] Dominio `ipassi.com` **verificado** (todos los mails salen de `no-reply@ipassi.com`).
- [ ] API key de producción.
- [ ] Plan **Pro** en los meses con eventos grandes: el gratis permite 100 mails por día. Resend limita además los envíos por segundo (por defecto 2): con una pausa entre invitaciones menor a 500 ms algunos envíos se rechazan y los reintenta el cron cada 5 minutos.

**Mercado Pago**
- [ ] Credenciales de **producción nuevas** (rotar access token, CLIENT_SECRET y clave del webhook de la app real).
- [ ] Webhook configurado en el panel de developers apuntando a `https://<URL_BACK>/webhook/mercadopago`.
- [ ] Con los avisos llegando bien firmados, pasar `WEBHOOK_FIRMA` de `registrar` a `estricto`.

**Google reCAPTCHA v2**
- [ ] Registrar el dominio de producción y obtener las dos claves: la del **sitio** (cliente) y la **secreta** (servidor).

**Cloudinary**
- [ ] Credenciales (pueden ser las actuales; rotarlas cuando se pueda).

## 3. Variables de entorno

**Backend (Render)**

| Variable | Valor |
|---|---|
| `APP_ENV` | sin definir (= producción) |
| `MONGO_URI` | base de producción |
| `URL_FRONT`, `URL_BACK` | URLs públicas https, sin barra final |
| `MP_ACCESS_TOKEN_PROD` | token de producción nuevo |
| `JWT_SECRET`, `SECRET_MAIL_KEY` | **nuevas**, al azar (`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`) |
| `MAIL_MODE` | `resend` (o sin definir) |
| `RESEND_API_KEY` | key de producción |
| `ADMIN_MAIL` | recibe los avisos de casos para revisar **y** los mensajes del formulario de contacto |
| `RECAPTCHA_SECRET` | clave secreta. Si falta, el captcha no se verifica (el servidor avisa al arrancar) |
| `CLOUD_NAME`, `API_KEY`, `API_SECRET` | Cloudinary |
| `WEBHOOK_SECRET_KEY` | clave secreta del webhook de MP |
| `WEBHOOK_FIRMA` | `registrar` al principio, después `estricto` |

**Borrar de Render si están:** `USER_MAIL`, `PASS`, `PASSB`, `REDIS_URL` (Gmail y Redis ya no se usan).

**Frontend (build)**

| Variable | Valor |
|---|---|
| `VITE_URL` | URL pública del backend |
| `VITE_URL_FRONT` | URL pública del frontend |
| `VITE_RECAPTCHA_KEY` | clave del **sitio** |
| `VITE_RECAPTCHA_ENABLED` | sin definir o `true` (**no** `false`) |

Al arrancar, el servidor muestra en el log lo que falta o está mal configurado: revisarlo después del primer despliegue.

## 4. Primer día: comprobaciones

- [ ] Registrarse con un mail real: llega la verificación, se verifica y se puede iniciar sesión.
- [ ] Recuperar la contraseña.
- [ ] Mandar un mensaje desde Contacto: llega a `ADMIN_MAIL`.
- [ ] Crear un evento con imágenes, publicar entradas y cargar un Excel de cortesías chico.
- [ ] **Compra real chica** con Mercado Pago: llega el mail con el QR, se valida en la puerta y la venta aparece en estadísticas.
- [ ] **Reembolso real** de esa compra: se devuelve en MP y la entrada queda anulada.
- [ ] Revisar los logs de Render: que no haya errores ni avisos de configuración.

## 5. Fuera del código

- [ ] Términos y condiciones, política de privacidad y de reembolsos revisados por alguien de legales.
- [ ] Datos fiscales / facturación de la comisión de servicio (15%).
