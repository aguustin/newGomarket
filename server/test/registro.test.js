import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import bcrypt from "bcrypt"
import { loadApp, closeDb, resetDb, findLink } from "./helpers.js"

//Etapa 13: registro pendiente guardado en la base (el link solo lleva un codigo) y mails sin mayusculas
let app, userModel, registroPendienteModel
before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  userModel = (await import('../models/userModel.js')).default
  registroPendienteModel = (await import('../models/registroPendienteModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

const registrar = (mail, contrasenia = 'Clave12345') => request(app).post('/register').send({ nombreCompleto: 'Ana', mail, dni: 1, pais: 'AR', contrasenia, repetirContrasenia: contrasenia })
const linkVerificacion = async (mail) => {
  const [m] = (await request(app).get('/dev/mails.json').query({ to: mail })).body
  return new URL(findLink(m.html, '/verify_account/')).pathname
}

test('CRITICO: el link de verificacion solo lleva un codigo (ni datos ni hash de la contraseña)', async () => {
  assert.deepEqual((await registrar('ana@x.com')).body, { msj: 1 })
  const path = await linkVerificacion('ana@x.com')
  const codigo = path.split('/').pop()
  assert.match(codigo, /^[a-f0-9]{64}$/)
  const pendiente = await registroPendienteModel.findOne({ mail: 'ana@x.com' }).lean()
  assert.ok(pendiente && pendiente.codigoHash !== codigo, 'se guarda el hash del codigo, no el codigo')

  const r = await request(app).get(path)
  assert.equal(r.headers.location, `${process.env.URL_FRONT_DEV}/login?verificacion=ok`)
  assert.equal((await request(app).post('/login').send({ mail: 'ana@x.com', contrasenia: 'Clave12345' })).body.estado, 1)
  //Abrirlo de nuevo no duplica la cuenta
  assert.equal((await request(app).get(path)).headers.location, `${process.env.URL_FRONT_DEV}/login?verificacion=ok`)
  assert.equal(await userModel.countDocuments({ mail: 'ana@x.com' }), 1)
})

test('registrarse de nuevo reemplaza el link: el anterior ya no sirve; codigo inventado o vencido tampoco', async () => {
  await registrar('beto@x.com')
  const viejo = await linkVerificacion('beto@x.com')
  await (await import('../models/devMailModel.js')).default.deleteMany({})
  await registrar('beto@x.com', 'OtraClave1')
  const mails = (await request(app).get('/dev/mails.json').query({ to: 'beto@x.com' })).body
  const nuevo = new URL(findLink(mails[0].html, '/verify_account/')).pathname
  assert.notEqual(viejo, nuevo)
  assert.equal((await request(app).get(viejo)).headers.location, `${process.env.URL_FRONT_DEV}/login?verificacion=vencida`)
  assert.equal((await request(app).get(`/verify_account/${'a'.repeat(64)}`)).headers.location, `${process.env.URL_FRONT_DEV}/login?verificacion=vencida`)

  await registroPendienteModel.updateOne({ mail: 'beto@x.com' }, { $set: { expiraEn: new Date(Date.now() - 1000) } })
  assert.equal((await request(app).get(nuevo)).headers.location, `${process.env.URL_FRONT_DEV}/login?verificacion=vencida`)
  assert.equal(await userModel.countDocuments({ mail: 'beto@x.com' }), 0)
})

test('CRITICO: los mails no distinguen mayusculas: registro, login y recuperacion', async () => {
  await registrar('  Carla@X.com ')
  await request(app).get(await linkVerificacion('carla@x.com'))
  const u = await userModel.findOne({ mail: 'carla@x.com' }).lean()
  assert.ok(u, 'se guarda en minusculas y sin espacios')

  assert.equal((await request(app).post('/login').send({ mail: 'CARLA@x.COM', contrasenia: 'Clave12345' })).body.estado, 1)
  assert.deepEqual((await registrar('carla@X.com')).body, { msj: 'El usuario ya existe' }, 'no se puede crear otra cuenta con mayusculas')

  //Cuenta vieja guardada con mayusculas: tambien entra
  await userModel.create({ mail: 'Viejo@X.com', nombreCompleto: 'V', contrasenia: await bcrypt.hash('Vieja12345', 4) })
  assert.equal((await request(app).post('/login').send({ mail: 'viejo@x.com', contrasenia: 'Vieja12345' })).body.estado, 1)
  assert.deepEqual((await request(app).post('/recover_password').send({ mail: 'VIEJO@x.com' })).body, { ok: true })
  assert.equal((await request(app).get('/dev/mails.json').query({ to: 'Viejo@X.com' })).body.length, 1, 'el mail de recuperacion va a la cuenta guardada')
})
