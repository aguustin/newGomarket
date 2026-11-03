//Prepara el entorno de test ANTES de cargar la app (config.js lee las variables al importarse).
//Usa el mismo cluster de MONGO_URI pero siempre la base aislada ipass_test, que se borra al empezar y al terminar.
import mongoose from "mongoose"

export const TEST_DB = 'ipass_test'

export const loadApp = async ({ mailMode = 'bandeja' } = {}) => {
  process.env.APP_ENV = 'test'
  process.env.MONGO_DB_NAME = TEST_DB
  process.env.MAIL_MODE = mailMode
  const { default: app } = await import('../app.js')
  await resetDb()
  return app
}

export const resetDb = async () => {
  //Proteccion: nunca borrar otra base que no sea la de tests
  if (mongoose.connection.db?.databaseName !== TEST_DB) {
    throw new Error(`Los tests solo pueden borrar ${TEST_DB}, no "${mongoose.connection.db?.databaseName}"`)
  }
  await mongoose.connection.db.dropDatabase()
  await mongoose.connection.syncIndexes()
}

export const closeDb = async () => {
  await resetDb()
  await mongoose.disconnect()
}

export const uniqueMail = (tag) => `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@ipass-test.local`

//Devuelve el primer href del html que contenga `fragment`
export const findLink = (html, fragment) => {
  const link = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).find((h) => h.includes(fragment))
  if (!link) throw new Error(`No hay ningun link con "${fragment}" en el mail`)
  return link
}

//Usuario real en la base con un token de sesion firmado igual que en el login
export const crearSesion = async (datos = {}) => {
  const userModel = (await import('../models/userModel.js')).default
  const { firmarSesion } = await import('../lib/auth.js')
  const user = await userModel.create({ mail: uniqueMail('sesion'), nombreCompleto: 'Usuario Test', comisionServicio: 15, ...datos })
  return { user, id: user._id.toString(), auth: { Authorization: `Bearer ${firmarSesion(user)}` } }
}
