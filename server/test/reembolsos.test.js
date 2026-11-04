import { test, before, after, beforeEach, mock } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import jwt from "jsonwebtoken"
import axios from "axios"
import { v4 as uuidv4 } from "uuid"
import { loadApp, closeDb, resetDb, crearSesion, uniqueMail } from "./helpers.js"

//Etapa 10: cancelacion de eventos y reembolsos. Mercado Pago simulado (reembolsos y consulta de pagos)
let app, mercadopago, ticketModel, tokenModel, transactionModel, purchaseModel, orderModel, reembolsos
let reembolsosHechos = []      //[paymentId, monto]
let fallasReembolso = 0
let mpPayments = {}
//Simulaciones de Mercado Pago (se reinstalan si un test las restaura)
const simularReembolso = async (paymentId, monto) => {
  if (fallasReembolso > 0) { fallasReembolso--; throw Object.assign(new Error('MP caido'), { response: { data: { message: 'internal_error' } } }) }
  reembolsosHechos.push([paymentId, monto])
  return { id: Number(`9${reembolsosHechos.length}`), status: 'approved' }
}
const simularPago = async (id) => {
  const body = mpPayments[String(id)]
  if (!body) throw Object.assign(new Error('Payment not found'), { status: 404 })
  return { body: { currency_id: 'ARS', transaction_amount: body.metadata?.total, ...body } }
}
const SECRET = () => process.env.JWT_SECRET

before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  mercadopago = (await import('../lib/mercadopago.js')).default
  ticketModel = (await import('../models/ticketsModel.js')).default
  tokenModel = (await import('../models/tokenModel.js')).default
  transactionModel = (await import('../models/transactionsModel.js')).default
  purchaseModel = (await import('../models/purchaseModel.js')).default
  orderModel = (await import('../models/orderModel.js')).default
  reembolsos = await import('../lib/reembolsos.js')
  mock.method(reembolsos.mpReembolsos, 'reembolsar', simularReembolso)
  mock.method(mercadopago.payment, 'findById', simularPago)
})
after(closeDb)
beforeEach(async () => { reembolsosHechos = []; fallasReembolso = 0; mpPayments = {}; await resetDb() })

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)
const esperar = async (cond, ms = 10000) => {
  const fin = Date.now() + ms
  while (Date.now() < fin) { if (await cond()) return; await new Promise((r) => setTimeout(r, 150)) }
  throw new Error('timeout')
}

const escenario = async () => {
  const dueno = await crearSesion()
  const evento = await ticketModel.create({
    userId: dueno.id, nombreEvento: 'Evento a cancelar', active: true, comisionServicio: 15, fechaInicio: enUnMes(), fechaFin: enUnMes(),
    tickets: [{ nombreTicket: 'General', precio: 20000, cantidad: 8, ventas: 2, estado: 1, fechaDeCierre: enUnMes() }],
    cortesiaRRPP: [{ nombreTicket: 'VIP', cantidadDeCortesias: 5, fechaDeCierre: enUnMes() }]
  })
  const otro = await ticketModel.create({ userId: dueno.id, nombreEvento: 'Otro evento', active: true, fechaFin: enUnMes(),
    tickets: [{ nombreTicket: 'G', precio: 1, cantidad: 5, estado: 1, fechaDeCierre: enUnMes() }] })
  const prodId = evento._id.toString()
  //Dos compras pagas (reembolsable 40.000 y 20.000) y sus compradores
  await transactionModel.create([
    { prodId, paymentId: '7101', transaccionId: '7101', montoPagado: 40000, montoCobrado: 46000, ventaRegistrada: true, entregado: true },
    { prodId, paymentId: '7102', transaccionId: '7102', montoPagado: 20000, montoCobrado: 23000, ventaRegistrada: true, entregado: true },
    { prodId: otro._id.toString(), paymentId: '7103', transaccionId: '7103', montoPagado: 1, ventaRegistrada: true, entregado: true }
  ])
  await purchaseModel.create([{ prodId, nombreCompleto: 'A', email: 'a@x.com' }, { prodId, nombreCompleto: 'B', email: 'b@x.com' }])
  return { dueno, evento, prodId, otro }
}

//QR como los emite Ipass: con eventId (desde la etapa 10), viejos sin eventId, e invitaciones por Excel
const emitir = async (payload, extra = {}) => {
  const token = jwt.sign({ ...payload, jti: uuidv4() }, SECRET())
  await tokenModel.create({ token, ...extra })
  return token
}
const qrs = async (e) => ({
  nuevo: await emitir({ eventId: e.evento._id, ticketId: e.evento.tickets[0]._id, nombreCompleto: 'N' }, { eventId: e.prodId, paymentId: '7101' }),
  viejo: await emitir({ eventId: e.evento._id, ticketId: e.evento.tickets[0]._id, nombreCompleto: 'V' }),
  cortesia: await emitir({ eventId: e.evento._id, ticketId: e.evento.cortesiaRRPP[0]._id, nombreCompleto: 'C' }),
  excel: await emitir({ prodId: e.evento._id, nombreCompleto: 'E' }),
  deOtroEvento: await emitir({ eventId: e.otro._id, ticketId: e.otro.tickets[0]._id, nombreCompleto: 'O' })
})
const cancelar = (e, auth = e.dueno.auth) => request(app).post('/cancelar_evento').set(auth).send({ prodId: e.prodId })
const tx = (id) => transactionModel.findOne({ paymentId: id }).lean()

test('CRITICO: cancelar anula todos los QR del evento (nuevos, viejos, cortesias, Excel), reembolsa cada compra y no toca otros eventos', async () => {
  const e = await escenario()
  const t = await qrs(e)
  const res = await cancelar(e)
  assert.equal(res.status, 200)
  assert.equal(res.body.entradasAnuladas, 4)
  assert.equal(res.body.reembolsosEnCurso, 2)

  const ev = await ticketModel.findById(e.prodId).lean()
  assert.equal(ev.cancelado, true)
  assert.equal(ev.active, false)

  for (const token of [t.nuevo, t.viejo, t.cortesia, t.excel]) {
    const vista = await request(app).get(`/ticket/validate/${token}`)
    assert.equal(vista.body.estado, 'anulada')
    const validar = await request(app).post(`/ticket/validate/${token}`).set(e.dueno.auth)
    assert.equal(validar.status, 409)
    assert.equal(validar.body.code, 'ANULADA')
  }
  assert.equal((await request(app).get(`/ticket/validate/${t.deOtroEvento}`)).body.estado, 'vigente', 'otro evento intacto')

  await esperar(async () => reembolsosHechos.length === 2)
  assert.deepEqual(reembolsosHechos.sort(), [['7101', 40000], ['7102', 20000]], 'se devuelve el valor de las entradas, sin el cargo por servicio')
  for (const id of ['7101', '7102']) {
    const r = await tx(id)
    assert.equal(r.reembolsado, true)
    assert.equal(r.reembolsoEstado, 'ok')
    assert.ok(r.reembolsadoEn)
  }
  assert.equal((await tx('7103')).reembolsado, false, 'el pago de otro evento no se toca')
  assert.equal(await purchaseModel.countDocuments({ prodId: e.prodId, reembolsado: true }), 2)
})

test('CRITICO: cancelar dos veces (o a la vez) no reembolsa dos veces', async () => {
  const e = await escenario()
  await Promise.all([cancelar(e), cancelar(e), cancelar(e)])
  await esperar(async () => reembolsosHechos.length >= 2)
  await new Promise((r) => setTimeout(r, 800))
  await cancelar(e)
  await reembolsos.procesarReembolsosPendientes()
  await new Promise((r) => setTimeout(r, 500))
  assert.equal(reembolsosHechos.length, 2)
})

test('el pedido de reembolso a MP usa una clave de idempotencia fija por pago y el monto de las entradas', async () => {
  const e = await escenario()
  mock.restoreAll()  //este test mira el pedido HTTP real a Mercado Pago (axios), sin la simulacion de arriba
  const llamadas = []
  const postOriginal = axios.post
  axios.post = async (url, body, opts) => { llamadas.push({ url, body, key: opts.headers['X-Idempotency-Key'] }); return { data: { id: 1 } } }
  try {
    await reembolsos.marcarParaReembolso(e.prodId)
    await reembolsos.procesarReembolsosPendientes(e.prodId)
  } finally {
    axios.post = postOriginal
    mock.method(reembolsos.mpReembolsos, 'reembolsar', simularReembolso)
    mock.method(mercadopago.payment, 'findById', simularPago)
  }
  const p1 = llamadas.find((l) => l.url.includes('/7101/refunds'))
  assert.equal(p1.key, 'refund-7101')
  assert.deepEqual(p1.body, { amount: 40000 })
})

test('reembolso que falla: se reintenta (cron) hasta 5 veces y despues queda para revision', async () => {
  const e = await escenario()
  fallasReembolso = 1
  await cancelar(e)
  await esperar(async () => reembolsosHechos.length === 1 && (await tx('7101')).reembolsoEstado !== 'pendiente' && (await tx('7102')).reembolsoEstado !== 'pendiente')
  const fallido = [await tx('7101'), await tx('7102')].find((t) => t.reembolsoEstado === 'fallido')
  assert.equal(fallido.reembolsoIntentos, 1)
  assert.match(fallido.reembolsoError, /internal_error/)

  //El cron lo reintenta y sale bien
  assert.deepEqual(await reembolsos.procesarReembolsosPendientes(), { ok: 1, fallidos: 0, revision: 0 })
  assert.equal((await tx(fallido.paymentId)).reembolsado, true)

  //Uno que falla siempre: a los 5 intentos deja de reintentarse
  await transactionModel.updateOne({ paymentId: '7103' }, { $set: { reembolsoEstado: 'pendiente' } })
  fallasReembolso = 100
  for (let i = 0; i < 7; i++) await reembolsos.procesarReembolsosPendientes()
  const agotado = await tx('7103')
  assert.equal(agotado.reembolsoIntentos, 5)
  assert.equal(agotado.reembolsoEstado, 'fallido')
  assert.equal(agotado.reembolsado, false)
})

test('rechazo definitivo de MP (4xx, ej. credenciales): no se reintenta y queda para revision manual', async () => {
  const e = await escenario()
  await transactionModel.updateOne({ paymentId: '7103' }, { $set: { reembolsoEstado: 'pendiente' } })
  let llamadas = 0
  mock.method(reembolsos.mpReembolsos, 'reembolsar', async () => {
    llamadas++
    throw Object.assign(new Error('Request failed with status code 401'), { response: { status: 401, data: { message: 'Unauthorized use of live credentials' } } })
  })
  try {
    assert.deepEqual(await reembolsos.procesarReembolsosPendientes(e.otro._id), { ok: 0, fallidos: 0, revision: 1 })
    for (let i = 0; i < 3; i++) await reembolsos.procesarReembolsosPendientes()  //el cron no lo vuelve a tomar
    assert.equal(llamadas, 1)
    const r = await tx('7103')
    assert.equal(r.reembolsoEstado, 'revision')
    assert.equal(r.reembolsado, false)
    assert.match(r.reembolsoError, /live credentials/)
    //Volver a marcar el evento no lo reabre: lo resuelve una persona
    await reembolsos.marcarParaReembolso(e.otro._id)
    assert.equal((await tx('7103')).reembolsoEstado, 'revision')
  } finally {
    mock.method(reembolsos.mpReembolsos, 'reembolsar', simularReembolso)
  }
})

test('errores transitorios (sin respuesta, 5xx, 429, 409, 408) se reintentan; 4xx no', () => {
  const con = (status) => Object.assign(new Error('x'), status ? { response: { status } } : {})
  for (const s of [null, 500, 502, 503, 429, 409, 408]) assert.equal(reembolsos.esErrorPermanente(con(s)), false, `HTTP ${s}`)
  for (const s of [400, 401, 403, 404]) assert.equal(reembolsos.esErrorPermanente(con(s)), true, `HTTP ${s}`)
})

test('cancelar libera las reservas pendientes del evento', async () => {
  const e = await escenario()
  const ticketId = e.evento.tickets[0]._id.toString()
  await ticketModel.updateOne({ _id: e.prodId }, { $inc: { 'tickets.0.cantidad': -2 } })  //reserva hecha en /buy
  await orderModel.create({ prodId: e.prodId, quantities: { [ticketId]: { amount: 2, free: false } }, total: 46000, expiraEn: enUnMes() })
  await cancelar(e)
  assert.equal((await orderModel.findOne().lean()).estado, 'cancelada')
  assert.equal((await ticketModel.findById(e.prodId).lean()).tickets[0].cantidad, 8)
  //Los reembolsos corren en segundo plano: esperarlos para que no se crucen con el test siguiente
  await esperar(async () => reembolsosHechos.length === 2)
})

test('pago que llega con el evento ya cancelado: no se entregan entradas y se reembolsa', async () => {
  const e = await escenario()
  await cancelar(e)
  await esperar(async () => reembolsosHechos.length === 2)
  const mail = uniqueMail('tarde')
  mpPayments['7200'] = { status: 'approved', status_detail: 'accredited', metadata: {
    prod_id: e.prodId, nombre_evento: 'Evento a cancelar', mail, state: 1, total: 23000, monto_entradas: 20000,
    quantities: { [e.evento.tickets[0]._id.toString()]: { amount: 1, free: false } }, nombre_completo: 'Tarde', dni: 1, telefono: '1', email_hash: null, discount_code: null
  } }
  const res = await request(app).post('/payment_confirm/7200')
  assert.equal(res.body.procesado, false)
  await esperar(async () => (await tx('7200'))?.reembolsoEstado === 'ok')
  assert.deepEqual(reembolsosHechos.find(([id]) => id === '7200'), ['7200', 20000])
  assert.equal((await request(app).get('/dev/mails.json').query({ to: mail })).body.length, 0, 'no se mando ningun mail con entradas')
  assert.equal((await tx('7200')).ventaRegistrada, false)
})

test('reactivar un evento cancelado pide confirmacion; los QR anulados siguen anulados', async () => {
  const e = await escenario()
  const t = await qrs(e)
  await cancelar(e)
  await esperar(async () => reembolsosHechos.length === 2)

  const sinConfirmar = await request(app).post('/reactivar_evento').set(e.dueno.auth).send({ prodId: e.prodId })
  assert.equal(sinConfirmar.status, 409)
  assert.equal(sinConfirmar.body.code, 'CONFIRMAR_REACTIVACION')
  assert.equal(sinConfirmar.body.reembolsadas, 2)
  assert.equal((await ticketModel.findById(e.prodId).lean()).active, false)

  const confirmado = await request(app).post('/reactivar_evento').set(e.dueno.auth).send({ prodId: e.prodId, confirmar: true })
  assert.equal(confirmado.status, 200)
  const ev = await ticketModel.findById(e.prodId).lean()
  assert.equal(ev.active, true)
  assert.equal(ev.cancelado, false)
  assert.equal((await request(app).get(`/ticket/validate/${t.nuevo}`)).body.estado, 'anulada', 'las entradas reembolsadas no vuelven a valer')
})

test('reactivar un evento solo inactivo (no cancelado) no pide confirmacion', async () => {
  const e = await escenario()
  await ticketModel.updateOne({ _id: e.prodId }, { $set: { active: false } })
  assert.equal((await request(app).post('/reactivar_evento').set(e.dueno.auth).send({ prodId: e.prodId })).status, 200)
})

test('solo el dueño puede cancelar: un tercero recibe 403 y no se reembolsa nada', async () => {
  const e = await escenario()
  const tercero = await crearSesion()
  assert.equal((await cancelar(e, tercero.auth)).status, 403)
  await new Promise((r) => setTimeout(r, 300))
  assert.equal(reembolsosHechos.length, 0)
  assert.equal((await ticketModel.findById(e.prodId).lean()).cancelado, false)
})
