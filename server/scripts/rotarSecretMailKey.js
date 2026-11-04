//Rotacion de SECRET_MAIL_KEY (etapa 11): vuelve a cifrar con la clave nueva los mails guardados en los eventos
//(tickets.prodMail y tickets.rrpp[].mailEncriptado). Los links de RRPP usan mailHash (hash del mail, sin clave): no cambian.
//
//Uso (desde server/):
//  1. En el .env: SECRET_MAIL_KEY_ANTERIOR=<clave actual>  y  SECRET_MAIL_KEY=<clave nueva>
//  2. Simular (no escribe nada):            node scripts/rotarSecretMailKey.js
//  3. Aplicar (pide el nombre de la base):  node scripts/rotarSecretMailKey.js --aplicar --base <nombre>
//  4. Borrar SECRET_MAIL_KEY_ANTERIOR del .env y reiniciar el servidor
//
//Es seguro repetirlo: lo que ya esta cifrado con la clave nueva se saltea. Antes de escribir guarda un backup
//de los valores cifrados originales en server/backups/ (ignorado por git). Si algun valor no se puede descifrar
//con ninguna de las dos claves, NO se aplica nada.
import "dotenv/config"
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import mongoose from "mongoose"

const args = process.argv.slice(2)
const aplicar = args.includes("--aplicar")
const baseConfirmada = args.includes("--base") ? args[args.indexOf("--base") + 1] : null

const claveVieja = process.env.SECRET_MAIL_KEY_ANTERIOR
const claveNueva = process.env.SECRET_MAIL_KEY
const salir = (msg) => { console.error(msg); process.exit(1) }
if (!claveVieja || !claveNueva) salir("Faltan SECRET_MAIL_KEY_ANTERIOR (clave actual) y/o SECRET_MAIL_KEY (clave nueva) en el .env")
if (claveVieja === claveNueva) salir("SECRET_MAIL_KEY_ANTERIOR y SECRET_MAIL_KEY son iguales: no hay nada que rotar")
if (!process.env.MONGO_URI) salir("Falta MONGO_URI")

//Mismo formato que encrypt/decrypt de eventController: aes-256-cbc, clave = sha256(secreto), "ivHex:cifradoHex"
const llave = (secreto) => crypto.createHash("sha256").update(secreto).digest()
const cifrar = (texto, secreto) => {
  const iv = crypto.randomBytes(16)
  const c = crypto.createCipheriv("aes-256-cbc", llave(secreto), iv)
  return `${iv.toString("hex")}:${c.update(texto, "utf8", "hex")}${c.final("hex")}`
}
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//Devuelve el mail o null. Exige que parezca un mail: con una clave equivocada a veces "descifra" basura
const descifrar = (valor, secreto) => {
  try {
    const [ivHex, cifrado] = String(valor).split(":")
    const d = crypto.createDecipheriv("aes-256-cbc", llave(secreto), Buffer.from(ivHex, "hex"))
    const texto = d.update(cifrado, "hex", "utf8") + d.final("utf8")
    return MAIL_RE.test(texto) ? texto : null
  } catch {
    return null
  }
}

await mongoose.connect(process.env.MONGO_URI, process.env.MONGO_DB_NAME ? { dbName: process.env.MONGO_DB_NAME } : {})
const db = mongoose.connection.db
const base = db.databaseName
const eventos = db.collection("ticketsmodels")  //coleccion de models/ticketsModel.js
console.log(`Base: ${base} | modo: ${aplicar ? "APLICAR" : "simulacion (no escribe)"}`)
if (aplicar && baseConfirmada !== base) {
  await mongoose.disconnect()
  salir(`Para aplicar hay que confirmar la base: --aplicar --base ${base}`)
}

const cuenta = { eventos: 0, aCambiar: 0, yaNuevos: 0, ilegibles: 0 }
const ilegibles = []
const cambios = []  //{ _id, set: {campo: nuevoValor}, original: {campo: valorViejo} }

//Clasifica un valor cifrado: 'vieja' (hay que recifrarlo), 'nueva' (ya rotado) o null (no se puede leer)
const clasificar = (valor) => {
  if (descifrar(valor, claveVieja)) return "vieja"
  if (descifrar(valor, claveNueva)) return "nueva"
  return null
}

for await (const ev of eventos.find({ $or: [{ prodMail: { $nin: [null, ""] } }, { "rrpp.mailEncriptado": { $nin: [null, ""] } }] }, { prodMail: 1, rrpp: 1, nombreEvento: 1 })) {
  cuenta.eventos++
  const set = {}
  const original = {}
  const revisar = (campo, valor) => {
    if (!valor) return
    const tipo = clasificar(valor)
    if (tipo === "vieja") { set[campo] = cifrar(descifrar(valor, claveVieja), claveNueva); original[campo] = valor; cuenta.aCambiar++ }
    else if (tipo === "nueva") cuenta.yaNuevos++
    else { cuenta.ilegibles++; ilegibles.push(`${ev._id} (${ev.nombreEvento ?? "sin nombre"}) ${campo}`) }
  }
  revisar("prodMail", ev.prodMail)
  ;(ev.rrpp ?? []).forEach((r, i) => revisar(`rrpp.${i}.mailEncriptado`, r?.mailEncriptado))
  if (Object.keys(set).length) cambios.push({ _id: ev._id, set, original })
}

console.log(`Eventos revisados: ${cuenta.eventos} | mails a recifrar: ${cuenta.aCambiar} | ya con la clave nueva: ${cuenta.yaNuevos} | ilegibles: ${cuenta.ilegibles}`)
if (ilegibles.length) {
  console.error("No se pueden descifrar con ninguna de las dos claves (revisar a mano antes de aplicar):")
  for (const l of ilegibles.slice(0, 50)) console.error("  -", l)
  await mongoose.disconnect()
  process.exit(aplicar ? 1 : 0)
}
if (!aplicar || !cambios.length) {
  console.log(aplicar ? "Nada que cambiar." : "Simulacion OK. Para aplicar: node scripts/rotarSecretMailKey.js --aplicar --base " + base)
  await mongoose.disconnect()
  process.exit(0)
}

//Backup de los valores originales antes de escribir
const dir = path.resolve(import.meta.dirname, "../backups")
fs.mkdirSync(dir, { recursive: true })
const archivo = path.join(dir, `mails-cifrados-${base}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
fs.writeFileSync(archivo, JSON.stringify(cambios.map(({ _id, original }) => ({ _id: String(_id), original })), null, 2))
console.log(`Backup: ${archivo}`)

//Cada evento se actualiza solo si sus valores siguen siendo los originales (si alguien los cambio mientras tanto, se saltea)
let escritos = 0, salteados = 0
for (const { _id, set, original } of cambios) {
  const r = await eventos.updateOne({ _id, ...original }, { $set: set })
  if (r.modifiedCount) escritos++
  else salteados++
}
console.log(`Listo: ${escritos} eventos actualizados${salteados ? `, ${salteados} salteados (cambiaron durante la rotacion: volver a correr)` : ""}`)
await mongoose.disconnect()
