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
  if (env.MAIL_ENABLED !== undefined) {
    warnings.push('MAIL_ENABLED ya no se usa: reemplazar por MAIL_MODE')
  }

  const required = ['MONGO_URI', 'JWT_SECRET', 'SECRET_MAIL_KEY']
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
