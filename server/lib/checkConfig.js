import { appEnv, mailMode, validateConfig } from "../config.js"

//Se importa primero en app.js: corta el arranque antes de que otros modulos usen una configuracion invalida
const { errors, warnings } = validateConfig()

for (const w of warnings) console.warn(`[CONFIG] Aviso: ${w}`)
if (errors.length > 0) {
  for (const e of errors) console.error(`[CONFIG] Error: ${e}`)
  throw new Error('Configuracion invalida: el servidor no arranca (ver mensajes [CONFIG])')
}
console.log(`[CONFIG] Entorno: ${appEnv} | Mails: ${mailMode}`)
