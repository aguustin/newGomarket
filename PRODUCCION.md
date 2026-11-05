# Pasar Ipass a producción

Lista de lo que hay que hacer el día que se publique. Se actualiza en cada etapa: si algo cambia, anotarlo acá.
Última actualización: 2026-11-05 (etapa 13).

## 1. Antes de publicar: pendientes de código

- [ ] **Commit** de todo lo hecho desde la etapa 12 (está sin guardar en git).
- [ ] **E2E pendiente:** "registro → verificación → login → la sesión persiste al recargar" falló en la etapa 13 y no se investigó. Probarlo a mano o revisar el test.
- [ ] **Reemplazar `xlsx` por `exceljs`** al leer los Excel de cortesías y RRPP (`server/controllers/cortesieController.js`). `xlsx` tiene una vulnerabilidad alta sin arreglo publicado y procesa archivos que suben los usuarios. `exceljs` ya está instalado.
- [ ] **(Recomendado) SDK de Mercado Pago v1 → v3** (`server/lib/mercadopago.js`). Arrastra 7 vulnerabilidades por la librería `request`. El riesgo real es bajo (solo habla con la API de MP), pero toca los pagos: hacerlo solo, en su propia etapa, y probarlo aparte.

## 2. Servicios externos

**Render (backend)**
- [ ] Plan pago, **siempre encendido** y con **una sola instancia**. Las tareas programadas (reservas vencidas, reintentos de pagos, mails e invitaciones, desactivar eventos viejos) corren dentro del servidor (`server/lib/cron.js`): si el servicio se duerme no corren, y con 2 instancias corren dos veces.
- [ ] Revisar el comando `start`: usa `--max-old-space-size=8192` (8 GB). Ajustarlo a la memoria real del plan, o sacarlo.
- [ ] Confirmar la rama que despliega Render (hoy es el último commit de `ipass_v_0.8`).

**MongoDB Atlas**
- [ ] Base de producción **separada** de la de desarrollo, con **backups automáticos** activados.
- [ ] Usuario de la base con contraseña nueva (rotar la actual) y acceso de red restringido a Render.
- [ ] Los índices se crean solos al arrancar. Revisar en los logs del primer arranque que no haya errores de índices.

**Resend (mails)**
- [ ] Dominio `ipassi.com` **verificado** (todos los mails salen de `no-reply@ipassi.com`).
- [ ] API key de producción.

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
