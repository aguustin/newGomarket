import dotenv from "dotenv"
dotenv.config()

export const port =  process.env.PORT
export const mongoUri = process.env.MONGO_URI
//Opcional: fuerza el nombre de la base (los tests usan ipass_test). Sin definir = la que indica MONGO_URI
export const mongoDbName = process.env.MONGO_DB_NAME
export const user_mail = process.env.USER_MAIL
export const pass = process.env.PASS

//APP_ENV: development | test | (sin definir = produccion)
//development y test usan sandbox de MP y las URLs _DEV
export const appEnv = process.env.APP_ENV || 'production'
export const isDev = appEnv === 'development' || appEnv === 'test'
export const urlFront = isDev ? process.env.URL_FRONT_DEV : process.env.URL_FRONT
export const urlBack = isDev ? process.env.URL_BACK_DEV : process.env.URL_BACK
export const mpAccessToken = isDev ? process.env.MP_ACCESS_TOKEN_DEV : process.env.MP_ACCESS_TOKEN_PROD

//MAIL_MODE: resend (envia de verdad, por defecto) | bandeja (guarda en la base, ver /dev/mails)
//           | falla (simula que el proveedor rechaza el envio) | off (no envia, solo deja registro)
//bandeja y falla solo se permiten en development/test (ver validateConfig)
export const MAIL_MODES = ['resend', 'bandeja', 'falla', 'off']
export const mailMode = process.env.MAIL_MODE || 'resend'

//WEBHOOK_FIRMA: registrar (por defecto: verifica la firma de Mercado Pago y lo deja en el log, procesa igual)
//               | estricto (rechaza avisos sin firma valida) | off (no verifica)
//Cada aviso se confirma igual contra la API de MP, asi que un aviso falso nunca crea ventas
export const WEBHOOK_FIRMA_MODOS = ['registrar', 'estricto', 'off']
export const webhookFirma = process.env.WEBHOOK_FIRMA || 'registrar'
export const webhookSecret = process.env.WEBHOOK_SECRET_KEY

//Revisa la configuracion efectiva. errors = el servidor no debe arrancar; warnings = solo avisar
export const validateConfig = (env = process.env) => {
  const errors = []
  const warnings = []
  const envName = env.APP_ENV || 'production'
  const local = envName === 'development' || envName === 'test'
  const mode = env.MAIL_MODE || 'resend'

  if (!['development', 'test', 'production'].includes(envName)) {
    errors.push(`APP_ENV="${envName}" no es valido (development | test | production)`)
  }
  if (!MAIL_MODES.includes(mode)) {
    errors.push(`MAIL_MODE="${mode}" no es valido (${MAIL_MODES.join(' | ')})`)
  }
  if (!local && (mode === 'bandeja' || mode === 'falla')) {
    errors.push(`MAIL_MODE=${mode} es solo para desarrollo/test y no se permite en produccion`)
  }
  const firma = env.WEBHOOK_FIRMA || 'registrar'
  if (!WEBHOOK_FIRMA_MODOS.includes(firma)) errors.push(`WEBHOOK_FIRMA="${firma}" no es valido (${WEBHOOK_FIRMA_MODOS.join(' | ')})`)
  if (firma === 'estricto' && !env.WEBHOOK_SECRET_KEY) errors.push('WEBHOOK_FIRMA=estricto necesita WEBHOOK_SECRET_KEY')
  if (env.MAIL_ENABLED !== undefined) {
    warnings.push('MAIL_ENABLED ya no se usa: reemplazar por MAIL_MODE')
  }

  //Claves de firma y cifrado: no hay valores por defecto en el codigo, sin ellas no se arranca en ningun entorno
  for (const key of ['JWT_SECRET', 'SECRET_MAIL_KEY']) {
    if (!env[key]) errors.push(`Falta la variable ${key}`)
    else if (!local && env[key].length < 32) warnings.push(`${key} es corta: usar al menos 32 caracteres al azar`)
  }
  if (env.JWT_SECRET_ANTERIOR && env.JWT_SECRET_ANTERIOR === env.JWT_SECRET) {
    errors.push('JWT_SECRET_ANTERIOR es igual a JWT_SECRET: poner la clave vieja o borrar la variable')
  }

  const required = ['MONGO_URI']
  required.push(...(local
    ? ['URL_FRONT_DEV', 'URL_BACK_DEV', 'MP_ACCESS_TOKEN_DEV']
    : ['URL_FRONT', 'URL_BACK', 'MP_ACCESS_TOKEN_PROD']))
  if (mode === 'resend') required.push('RESEND_API_KEY')
  for (const key of required) {
    if (!env[key]) (local ? warnings : errors).push(`Falta la variable ${key}`)
  }
  for (const key of ['CLOUD_NAME', 'API_KEY', 'API_SECRET']) {
    if (!env[key]) warnings.push(`Falta la variable ${key} (subida de imagenes)`)
  }
  if (mode === 'resend' && (!env.USER_MAIL || !env.PASS)) {
    warnings.push('Faltan USER_MAIL/PASS: contacto y cortesias por Excel no podran enviarse')
  }
  return { errors, warnings }
}
