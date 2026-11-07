import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, resetDb, uniqueMail, crearSesion } from "./helpers.js"

//Cortesias para el publico (estado 5) y edicion de entradas que cambian de lista (cortesia <-> entrada)
let app, ticketModel, cortesiaPublicaModel, orderModel
before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  ticketModel = (await import('../models/ticketsModel.js')).default
  cortesiaPublicaModel = (await import('../models/cortesiaPublicaModel.js')).default
  orderModel = (await import('../models/orderModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)

const crearEvento = (userId, extra = {}) => ticketModel.create({
  userId, nombreEvento: 'Evento Cortesias', comisionServicio: 15, active: true, soldOut: false,
  fechaInicio: enUnMes(), fechaFin: enUnMes(), direccion: 'Calle 1', imgEvento: 'https://example.com/i.png',
  totalVentas: 0, totalMontoVendido: 0,
  tickets: [
    { nombreTicket: 'General', precio: 20000, cantidad: 10, ventas: 0, fechaDeCierre: enUnMes(), estado: 1, limit: 5, visibilidad: '1' },
    { nombreTicket: 'Invitacion', precio: 0, cantidad: 3, ventas: 0, fechaDeCierre: enUnMes(), estado: 5, limit: 2, visibilidad: '5' }
  ],
  cortesiaRRPP: [{ nombreTicket: 'VIP', cantidadDeCortesias: 10, entregados: 0, estado: 3, distribution: 1, fechaDeCierre: enUnMes(), limit: 30 }],
  ...extra
})

const idDe = (ev, nombre) => String([...ev.tickets, ...ev.cortesiaRRPP].find((t) => t.nombreTicket === nombre)._id)

const pedir = (ev, cantidades, mail, extra = {}) => request(app).post('/buy').send({
  prodId: String(ev._id),
  quantities: Object.fromEntries(Object.entries(cantidades).map(([nombre, amount]) => [idDe(ev, nombre), { amount, free: false }])),
  mail, nombreCompleto: 'Persona', dni: '30111222', telefono: '1155550000', total: 0, ...extra
})

const mailsA = async (mail) => (await request(app).get(`/dev/mails.json?to=${encodeURIComponent(mail)}`)).body

// ---------- Cortesias para el publico ----------

test('cortesia publica: se piden gratis, sin Mercado Pago, y llegan los QR por mail', async () => {
  const ev = await crearEvento('u1')
  const mail = uniqueMail('publico')
  const res = await pedir(ev, { Invitacion: 2 }, mail)
  assert.equal(res.status, 200)
  assert.equal(res.body, 3)

  assert.equal((await mailsA(mail)).length, 1, 'llego el mail con las entradas')
  const t = (await ticketModel.findById(ev._id).lean()).tickets.find((x) => x.nombreTicket === 'Invitacion')
  assert.equal(t.cantidad, 1, 'se desconto del cupo total')
  assert.equal(t.ventas, 2)
})

test('cortesia publica: maximo por email (sin importar mayusculas), cada email tiene su propio cupo', async () => {
  const ev = await crearEvento('u1', { tickets: [{ nombreTicket: 'Invitacion', precio: 0, cantidad: 50, ventas: 0, fechaDeCierre: enUnMes(), estado: 5, limit: 2 }] })
  const mail = uniqueMail('max')
  assert.equal((await pedir(ev, { Invitacion: 1 }, mail)).status, 200)
  assert.equal((await pedir(ev, { Invitacion: 1 }, mail)).status, 200)

  const otraVez = await pedir(ev, { Invitacion: 1 }, mail.toUpperCase())
  assert.equal(otraVez.status, 409)
  assert.equal(otraVez.body.code, 'LIMITE_POR_EMAIL')
  assert.match(otraVez.body.error, /2 por email/)

  assert.equal((await pedir(ev, { Invitacion: 3 }, uniqueMail('otro'))).body.code, 'LIMITE_SUPERADO', 'mas del maximo en un solo pedido')
  assert.equal((await pedir(ev, { Invitacion: 2 }, uniqueMail('otro'))).status, 200, 'otro email tiene su cupo')
})

test('cortesia publica: pedidos simultaneos del mismo email nunca superan el maximo', async () => {
  const ev = await crearEvento('u1', { tickets: [{ nombreTicket: 'Invitacion', precio: 0, cantidad: 50, ventas: 0, fechaDeCierre: enUnMes(), estado: 5, limit: 2 }] })
  const mail = uniqueMail('carrera')
  const respuestas = await Promise.all(Array.from({ length: 6 }, () => pedir(ev, { Invitacion: 1 }, mail)))
  assert.equal(respuestas.filter((r) => r.status === 200).length, 2)
  assert.equal(respuestas.filter((r) => r.body.code === 'LIMITE_POR_EMAIL').length, 4)
  const [registro] = await cortesiaPublicaModel.find({ prodId: String(ev._id) }).lean()
  assert.equal(registro.cantidad, 2)
})

test('cortesia publica: sin cupo total no se descuenta el maximo del email', async () => {
  const ev = await crearEvento('u1', { tickets: [{ nombreTicket: 'Invitacion', precio: 0, cantidad: 1, ventas: 0, fechaDeCierre: enUnMes(), estado: 5, limit: 2 }] })
  const mail = uniqueMail('sin-cupo')
  const res = await pedir(ev, { Invitacion: 2 }, mail)
  assert.equal(res.status, 409)
  assert.equal(res.body.code, 'SIN_STOCK')
  const registro = await cortesiaPublicaModel.findOne({ prodId: String(ev._id) }).lean()
  assert.equal(registro?.cantidad ?? 0, 0, 'el email conserva su cupo')
  assert.equal((await pedir(ev, { Invitacion: 1 }, mail)).status, 200)
})

test('cortesia publica: no se mezcla con entradas pagas ni tiene precio aunque la base diga otra cosa', async () => {
  const ev = await crearEvento('u1')
  const mezcla = await pedir(ev, { Invitacion: 1, General: 1 }, uniqueMail('mezcla'), { total: 23000 })
  assert.equal(mezcla.status, 400)
  assert.equal(mezcla.body.code, 'CORTESIA_SOLA')

  await ticketModel.updateOne({ _id: ev._id, 'tickets.nombreTicket': 'Invitacion' }, { $set: { 'tickets.$.precio': 5000 } })
  assert.equal((await pedir(ev, { Invitacion: 1 }, uniqueMail('precio'))).status, 200, 'sigue siendo gratis')
})

test('cortesia publica: el creador fija el maximo por email (obligatorio) y se guarda sin precio', async () => {
  const yo = await crearSesion()
  const ev = await crearEvento(yo.id, { tickets: [] })
  const crear = (limit) => request(app).post('/createEventTickets').set(yo.auth)
    .field('prodId', String(ev._id)).field('nombreTicket', 'Free').field('precio', '1500').field('cantidad', '100')
    .field('fechaDeCierre', enUnMes().toISOString()).field('visibilidad', '5').field('estado', '5').field('limit', limit)

  const sinMaximo = await crear('')
  assert.equal(sinMaximo.status, 400)
  assert.equal(sinMaximo.body.code, 'LIMITE_REQUERIDO')
  assert.equal((await crear('0')).status, 400)

  assert.equal((await crear('3')).status, 200)
  const [t] = (await ticketModel.findById(ev._id).lean()).tickets
  assert.equal(t.estado, 5)
  assert.equal(Number(t.precio), 0)
  assert.equal(t.limit, 3)
})

test('cortesia publica: al convertir una entrada sin maximo hay que indicarlo', async () => {
  const yo = await crearSesion()
  const ev = await crearEvento(yo.id, { tickets: [{ nombreTicket: 'SinLimite', precio: 100, cantidad: 5, ventas: 0, fechaDeCierre: enUnMes(), estado: 1 }] })
  const r = await request(app).post('/updateTickets').set(yo.auth).field('ticketId', idDe(ev, 'SinLimite')).field('estado', '5').field('limit', '')
  assert.equal(r.body.code, 'LIMITE_REQUERIDO')
})

// ---------- Editar entradas ----------

const editar = (yo, ev, nombre, campos) => {
  let r = request(app).post('/updateTickets').set(yo.auth).field('ticketId', idDe(ev, nombre))
  for (const [k, v] of Object.entries(campos)) r = r.field(k, String(v))
  return r
}

test('editar: una cortesia sin usar pasa a entrada activa con precio y cantidad (mismo id)', async () => {
  const yo = await crearSesion()
  const ev = await crearEvento(yo.id)
  const id = idDe(ev, 'VIP')
  const res = await editar(yo, ev, 'VIP', { estado: 1, precio: 15000, cantidad: 40, nombreTicket: 'VIP', descripcionTicket: '', limit: 4, fechaDeCierre: 'undefined', imgTicket: 'undefined' })
  assert.equal(res.status, 200)

  const d = await ticketModel.findById(ev._id).lean()
  assert.equal(d.cortesiaRRPP.length, 0, 'ya no es cortesia')
  const t = d.tickets.find((x) => String(x._id) === id)
  assert.ok(t, 'esta entre las entradas con el mismo id')
  assert.deepEqual({ estado: t.estado, precio: t.precio, cantidad: t.cantidad, limit: t.limit, ventas: t.ventas }, { estado: 1, precio: 15000, cantidad: 40, limit: 4, ventas: 0 })
  assert.ok(t.fechaDeCierre, 'conserva la fecha de cierre')
})

test('editar: una entrada sin ventas pasa a cortesia y una cortesia publica queda gratis', async () => {
  const yo = await crearSesion()
  const ev = await crearEvento(yo.id)
  assert.equal((await editar(yo, ev, 'General', { estado: 3, cantidad: 5 })).status, 200)
  assert.equal((await editar(yo, ev, 'Invitacion', { estado: 5, precio: 999, cantidad: 7 })).status, 200)

  const d = await ticketModel.findById(ev._id).lean()
  const vip = d.cortesiaRRPP.find((c) => c.nombreTicket === 'General')
  assert.deepEqual({ estado: vip.estado, cantidad: vip.cantidadDeCortesias, entregados: vip.entregados }, { estado: 3, cantidad: 5, entregados: 0 })
  const inv = d.tickets.find((t) => t.nombreTicket === 'Invitacion')
  assert.deepEqual({ precio: inv.precio, cantidad: inv.cantidad }, { precio: 0, cantidad: 7 })
})

test('editar: no convierte una cortesia ya asignada a RRPP ni una entrada con ventas o pagos en curso', async () => {
  const yo = await crearSesion()
  const ev = await crearEvento(yo.id, { rrpp: [{ mail: 'rrpp@x.com', ticketsCortesias: [], ventasRRPP: [] }] })
  await ticketModel.updateOne({ _id: ev._id }, { $push: { 'rrpp.0.ticketsCortesias': { ticketIdCortesia: idDe(ev, 'VIP'), cantidadDeCortesias: 2 } } })
  const c = await editar(yo, ev, 'VIP', { estado: 1, precio: 100, cantidad: 5 })
  assert.equal(c.status, 409)
  assert.equal(c.body.code, 'ENTRADA_EN_USO')

  await ticketModel.updateOne({ _id: ev._id, 'tickets.nombreTicket': 'General' }, { $set: { 'tickets.$.ventas': 3 } })
  assert.equal((await editar(yo, ev, 'General', { estado: 3, cantidad: 5 })).body.code, 'ENTRADA_EN_USO')

  await orderModel.create({ prodId: String(ev._id), quantities: { [idDe(ev, 'Invitacion')]: { amount: 1, free: false } }, total: 0, expiraEn: enUnMes() })
  assert.equal((await editar(yo, ev, 'Invitacion', { estado: 3, cantidad: 5 })).body.code, 'ENTRADA_EN_USO')

  const d = await ticketModel.findById(ev._id).lean()
  assert.equal(d.cortesiaRRPP.length, 1)
  assert.equal(d.tickets.length, 2, 'nada se movio')
})

test('editar: en la misma lista actualiza los campos y conserva los que llegan vacios', async () => {
  const yo = await crearSesion()
  const ev = await crearEvento(yo.id)
  const res = await editar(yo, ev, 'General', { estado: 4, precio: 25000, cantidad: '', limit: 'undefined', nombreTicket: 'General B' })
  assert.equal(res.status, 200)
  const t = (await ticketModel.findById(ev._id).lean()).tickets.find((x) => x.nombreTicket === 'General B')
  assert.deepEqual({ estado: t.estado, precio: t.precio, cantidad: t.cantidad, limit: t.limit }, { estado: 4, precio: 25000, cantidad: 10, limit: 5 })

  assert.equal((await editar(yo, ev, 'General', { estado: 9 })).body.code, 'ESTADO_INVALIDO')
})
