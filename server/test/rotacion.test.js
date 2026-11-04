import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"
import { loadApp, closeDb, resetDb, crearSesion } from "./helpers.js"

//Etapa 11: rotacion de JWT_SECRET. Con JWT_SECRET_ANTERIOR, los QR vendidos antes del cambio siguen valiendo
//(solo para leerlos), pero las sesiones firmadas con la clave vieja ya no
const CLAVE_VIEJA = 'clave-vieja-de-test-para-rotacion-0123456789'
process.env.JWT_SECRET_ANTERIOR = CLAVE_VIEJA

let app, ticketModel, tokenModel
before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  ticketModel = (await import('../models/ticketsModel.js')).default
  tokenModel = (await import('../models/tokenModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)
const escenario = async () => {
  const dueno = await crearSesion()
  const evento = await ticketModel.create({
    userId: dueno.id, nombreEvento: 'Rotacion', active: true, fechaInicio: enUnMes(), fechaFin: enUnMes(),
    tickets: [{ nombreTicket: 'General', precio: 100, cantidad: 10, estado: 1, fechaDeCierre: enUnMes() }]
  })
  return { dueno, evento }
}
const emitir = async (e, clave, { guardar = true } = {}) => {
  const token = jwt.sign({ nombreCompleto: 'C', dni: 1, eventId: e.evento._id, ticketId: e.evento.tickets[0]._id, jti: uuidv4() }, clave)
  if (guardar) await tokenModel.create({ token })
  return token
}

test('CRITICO: un QR firmado con la clave anterior sigue valiendo y se puede validar en la puerta', async () => {
  const e = await escenario()
  const token = await emitir(e, CLAVE_VIEJA)
  assert.equal((await request(app).get(`/ticket/validate/${token}`)).body.estado, 'vigente')
  const res = await request(app).post(`/ticket/validate/${token}`).set(e.dueno.auth)
  assert.equal(res.status, 200)
  assert.equal((await request(app).post(`/ticket/validate/${token}`).set(e.dueno.auth)).status, 409, 'y no dos veces')
})

test('los QR nuevos se firman con la clave actual', async () => {
  const e = await escenario()
  const token = await emitir(e, process.env.JWT_SECRET)
  assert.equal((await request(app).get(`/ticket/validate/${token}`)).body.estado, 'vigente')
})

test('CRITICO: la clave anterior NO abre sesiones, ni sirve para QR que Ipass no guardo, ni acepta otras claves', async () => {
  const e = await escenario()
  const sesionVieja = jwt.sign({ sub: e.dueno.id, typ: 'sesion' }, CLAVE_VIEJA, { expiresIn: '1h' })
  const conSesion = (t) => request(app).post('/get_favorites').set({ Authorization: `Bearer ${t}` }).send({ userId: e.dueno.id })
  assert.notEqual((await conSesion(jwt.sign({ sub: e.dueno.id, typ: 'sesion' }, process.env.JWT_SECRET, { expiresIn: '1h' }))).status, 401, 'control: la clave actual si')
  assert.equal((await conSesion(sesionVieja)).status, 401)

  const noGuardado = await emitir(e, CLAVE_VIEJA, { guardar: false })
  assert.equal((await request(app).get(`/ticket/validate/${noGuardado}`)).status, 404)

  const otraClave = await emitir(e, 'cualquier-otra-clave')
  assert.equal((await request(app).get(`/ticket/validate/${otraClave}`)).status, 404)
})

test('config: sin JWT_SECRET o SECRET_MAIL_KEY no arranca en ningun entorno; la anterior no puede ser igual a la actual', async () => {
  const { validateConfig } = await import('../config.js')  //despues de loadApp (que fija la base de test)
  const dev = { APP_ENV: 'development', MONGO_URI: 'x', JWT_SECRET: 'a', SECRET_MAIL_KEY: 'b', MAIL_MODE: 'bandeja' }
  assert.deepEqual(validateConfig(dev).errors, [])
  for (const key of ['JWT_SECRET', 'SECRET_MAIL_KEY']) {
    const { [key]: _, ...sin } = dev
    assert.ok(validateConfig(sin).errors.includes(`Falta la variable ${key}`), key)
  }
  assert.ok(validateConfig({ ...dev, JWT_SECRET_ANTERIOR: 'a' }).errors.some((e) => e.includes('JWT_SECRET_ANTERIOR')))
  assert.deepEqual(validateConfig({ ...dev, JWT_SECRET_ANTERIOR: 'vieja' }).errors, [])
})
