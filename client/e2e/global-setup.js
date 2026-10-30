import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

//Vacia la base ipass_e2e antes de correr. Usa mongoose/dotenv del server para no sumar dependencias.
const serverDir = fileURLToPath(new URL('../../server/', import.meta.url))
const require = createRequire(serverDir + 'package.json')
const E2E_DB = 'ipass_e2e'

export default async function globalSetup() {
  const fs = require('fs')
  const env = require('dotenv').parse(fs.readFileSync(serverDir + '.env'))
  const mongoose = require('mongoose')
  await mongoose.connect(env.MONGO_URI, { dbName: E2E_DB })
  //Proteccion: nunca borrar otra base
  if (mongoose.connection.db.databaseName !== E2E_DB) throw new Error('Base inesperada: ' + mongoose.connection.db.databaseName)
  await mongoose.connection.db.dropDatabase()
  await mongoose.disconnect()
}
