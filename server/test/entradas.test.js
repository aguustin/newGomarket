import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import jwt from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid"
import { loadApp, closeDb, resetDb, crearSesion } from "./helpers.js"

//Etapa 8: abrir el QR solo muestra la entrada; validar el ingreso es del dueño o un RRPP del evento
let app, ticketModel, tokenModel
const SECRET = () => process.env.JWT_SECRET || 'kidjaskdhajsdbjadlfgkjmlkjbnsdlfgnsñlknamnczmjcf'

before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  ticketModel = (await import('../models/ticketsModel.js')).default
  tokenModel = (await import('../models/tokenModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)
const ayer = () => new Date(Date.now() - 24 * 3600 * 1000)

const escenario = async ({ cierreTicket = enUnMes(), finEvento = enUnMes() } = {}) => {
  const dueno = await crearSesion()
  const rrpp = await crearSesion()
  const tercero = await crearSesion()
  const evento = await ticketModel.create({
    userId: dueno.id, nombreEvento: 'Evento Puerta', active: true, fechaInicio: enUnMes(), fechaFin: finEvento, direccion: 'Calle 1', localidad: 'CABA',
    tickets: [{ nombreTicket: 'General', precio: 100, cantidad: 10, estado: 1, fechaDeCierre: cierreTicket }],
    cortesiaRRPP: [{ nombreTicket: 'VIP cortesía', cantidadDeCortesias: 5, fechaDeCierre: enUnMes() }],
    rrpp: [{ mail: rrpp.user.mail.toUpperCase(), ticketsCortesias: [] }]
  })
  return { dueno, rrpp, tercero, evento }
}

//Emite un QR igual que qrGeneratorController (pagas y cortesias RRPP) o sendCortesiesController (Excel)
const emitir = async (payload) => {
  const token = jwt.sign({ ...payload, iat: Math.floor(Date.now() / 1000), jti: uuidv4() }, SECRET())
  await tokenModel.create({ token })
  return token
}
const qrTicket = (e) => emitir({ nombreCompleto: 'Comprador', dni: 1, eventId: e.evento._id, ticketId: e.evento.tickets[0]._id })
const ver = (token, auth) => { const r = request(app).get(`/ticket/validate/${token}`); return auth ? r.set(auth) : r }
const validar = (token, auth) => { const r = request(app).post(`/ticket/validate/${token}`); return auth ? r.set(auth) : r }

test('CRITICO: abrir el QR (comprador o cualquiera) solo muestra la entrada y no la marca como usada', async () => {
  const e = await escenario()
  const token = await qrTicket(e)
  for (let i = 0; i < 3; i++) {
    const res = await ver(token)
    assert.equal(res.status, 200)
    assert.equal(res.body.estado, 'vigente')
    assert.equal(res.body.puedeValidar, false)
    assert.equal(res.body.nombreTicket, 'General')
    assert.equal(res.body.nombreCompleto, 'Comprador')
  }
  assert.equal((await tokenModel.findOne({ token }).lean()).used, false)
})

test('puedeValidar solo para el dueño y los RRPP del evento (con sesion)', async () => {
  const e = await escenario()
  const token = await qrTicket(e)
  assert.equal((await ver(token, e.dueno.auth)).body.puedeValidar, true)
  assert.equal((await ver(token, e.rrpp.auth)).body.puedeValidar, true, 'el mail del RRPP se compara sin mayusculas')
  assert.equal((await ver(token, e.tercero.auth)).body.puedeValidar, false)
  assert.equal((await ver(token, { Authorization: 'Bearer sesion-vencida' })).status, 200, 'una sesion invalida no rompe la vista publica')
})

test('el dueño valida el ingreso: queda usada con quien y cuando; la segunda vez dice "ya usada"', async () => {
  const e = await escenario()
  const token = await qrTicket(e)
  const ok = await validar(token, e.dueno.auth)
  assert.equal(ok.status, 200)
  assert.equal(ok.body.validada, true)
  assert.equal(ok.body.estado, 'usada')

  const doc = await tokenModel.findOne({ token }).lean()
  assert.equal(doc.used, true)
  assert.equal(doc.usedBy, e.dueno.id)
  assert.ok(doc.usedAt instanceof Date)

  const otra = await validar(token, e.dueno.auth)
  assert.equal(otra.status, 409)
  assert.equal(otra.body.code, 'YA_USADA')
  assert.ok(otra.body.usadaEn)
  assert.equal((await ver(token)).body.estado, 'usada')
})

test('un RRPP del evento tambien puede validar; un tercero o sin sesion no', async () => {
  const e = await escenario()
  const t1 = await qrTicket(e)
  assert.equal((await validar(t1, e.tercero.auth)).status, 403)
  assert.equal((await validar(t1)).status, 401)
  assert.equal((await tokenModel.findOne({ token: t1 }).lean()).used, false, 'los rechazos no la marcan')
  assert.equal((await validar(t1, e.rrpp.auth)).status, 200)
})

test('CRITICO: dos celulares validando la misma entrada a la vez: solo uno la valida', async () => {
  const e = await escenario()
  const token = await qrTicket(e)
  const res = await Promise.all([validar(token, e.dueno.auth), validar(token, e.rrpp.auth), validar(token, e.dueno.auth), validar(token, e.rrpp.auth)])
  assert.equal(res.filter((r) => r.status === 200).length, 1)
  assert.equal(res.filter((r) => r.status === 409 && r.body.code === 'YA_USADA').length, 3)
})

test('entrada vencida: se informa y NO se marca como usada (antes se marcaba igual)', async () => {
  const e = await escenario({ cierreTicket: ayer() })
  const token = await qrTicket(e)
  assert.equal((await ver(token)).body.estado, 'vencida')
  const res = await validar(token, e.dueno.auth)
  assert.equal(res.status, 409)
  assert.equal(res.body.code, 'VENCIDA')
  assert.equal((await tokenModel.findOne({ token }).lean()).used, false)
})

test('cortesia de RRPP: se muestra como "Cortesia" y se valida igual', async () => {
  const e = await escenario()
  const token = await emitir({ nombreCompleto: 'Invitado', dni: null, eventId: e.evento._id, ticketId: e.evento.cortesiaRRPP[0]._id })
  const vista = await ver(token)
  assert.equal(vista.body.tipo, 'Cortesia')
  assert.equal(vista.body.nombreTicket, 'VIP cortesía')
  assert.equal((await validar(token, e.rrpp.auth)).status, 200)
})

test('cortesia por Excel (token con prodId): ahora valida como "Invitación" hasta el fin del evento', async () => {
  const e = await escenario()
  const token = await emitir({ nombreCompleto: 'Invitado Excel', prodId: e.evento._id })
  const vista = await ver(token)
  assert.equal(vista.status, 200)
  assert.equal(vista.body.tipo, 'Invitación')
  assert.equal(vista.body.estado, 'vigente')
  assert.equal(new Date(vista.body.fechaDeCierreTicket).getTime(), new Date(e.evento.fechaFin).getTime())
  assert.equal((await validar(token, e.dueno.auth)).status, 200)

  const terminado = await escenario({ finEvento: ayer() })
  const vieja = await emitir({ nombreCompleto: 'Tarde', prodId: terminado.evento._id })
  assert.equal((await validar(vieja, terminado.dueno.auth)).body.code, 'VENCIDA')
})

test('QR falsos: token invalido, de otra clave, no emitido por Ipass, de sesion o de un ticket borrado -> 404', async () => {
  const e = await escenario()
  const noGuardado = jwt.sign({ eventId: e.evento._id, ticketId: e.evento.tickets[0]._id, jti: 'x' }, SECRET())
  const otraClave = jwt.sign({ eventId: e.evento._id, ticketId: e.evento.tickets[0]._id }, 'otra-clave')
  const sesion = jwt.sign({ sub: e.dueno.id, typ: 'sesion' }, SECRET())
  await tokenModel.create({ token: sesion })
  const ticketBorrado = await emitir({ eventId: e.evento._id, ticketId: '000000000000000000000000' })
  for (const token of ['basura', noGuardado, otraClave, sesion, ticketBorrado]) {
    assert.equal((await ver(token)).status, 404)
    assert.equal((await validar(token, e.dueno.auth)).status, 404)
  }
})
