import { test, before, after, beforeEach, mock } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, resetDb, uniqueMail } from "./helpers.js"

//Etapa 5: reserva atomica de stock con ordenes pendientes que vencen.
//Lo unico simulado es Mercado Pago (preferences.create y payment.findById).
let app, mercadopago, ticketModel, orderModel, transactionModel, tokenModel, stock
let preferencias = []
let mpPayments = {}
let mpFalla = false

before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  mercadopago = (await import('../lib/mercadopago.js')).default
  ticketModel = (await import('../models/ticketsModel.js')).default
  orderModel = (await import('../models/orderModel.js')).default
  transactionModel = (await import('../models/transactionsModel.js')).default
  tokenModel = (await import('../models/tokenModel.js')).default
  stock = await import('../lib/stock.js')

  mock.method(mercadopago.preferences, 'create', async (pref) => {
    if (mpFalla) throw new Error('MP no responde')
    preferencias.push(pref)
    return { body: { init_point: `https://www.mercadopago.com.ar/checkout?pref_id=p${preferencias.length}` } }
  })
  mock.method(mercadopago.payment, 'findById', async (id) => {
    const body = mpPayments[String(id)]
    if (!body) throw Object.assign(new Error('Payment not found'), { status: 404 })
    //Como Mercado Pago: el pago trae lo cobrado y la moneda (por defecto, lo que calculo el servidor)
    return { body: { currency_id: 'ARS', transaction_amount: body.metadata?.total, ...body } }
  })
})
after(closeDb)
beforeEach(async () => { preferencias = []; mpPayments = {}; mpFalla = false; await resetDb() })

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)

const crearEvento = (stockGeneral = 10, stockVip = 10) => ticketModel.create({
  userId: 'u1', nombreEvento: 'Evento Stock', comisionServicio: 15, active: true,
  fechaInicio: enUnMes(), fechaFin: enUnMes(), direccion: 'Calle 1', imgEvento: 'https://example.com/i.png',
  totalVentas: 0, totalMontoVendido: 0,
  tickets: [
    { nombreTicket: 'General', precio: 1000, cantidad: stockGeneral, ventas: 0, fechaDeCierre: enUnMes(), estado: 1 },
    { nombreTicket: 'VIP', precio: 2000, cantidad: stockVip, ventas: 0, fechaDeCierre: enUnMes(), estado: 1 }
  ]
})
const tid = (ev, nombre) => ev.tickets.find((t) => t.nombreTicket === nombre)._id.toString()
const cantidad = async (ev, nombre) => (await ticketModel.findById(ev._id).lean()).tickets.find((t) => t.nombreTicket === nombre).cantidad

//total = suma de precio x cantidad + 15%
const comprar = (ev, cantidades) => {
  const precios = { General: 1000, VIP: 2000 }
  const total = Math.round(Object.entries(cantidades).reduce((a, [n, c]) => a + precios[n] * c, 0) * 1.15 * 100) / 100
  return request(app).post('/buy').send({
    prodId: ev._id.toString(),
    quantities: Object.fromEntries(Object.entries(cantidades).map(([n, amount]) => [tid(ev, n), { amount, free: false }])),
    mail: uniqueMail('stock'), total, nombreCompleto: 'Comprador Stock', dni: '1', telefono: '1'
  })
}

const esperar = async (cond, ms = 15000) => {
  const fin = Date.now() + ms
  while (Date.now() < fin) { if (await cond()) return; await new Promise((r) => setTimeout(r, 200)) }
  throw new Error('timeout')
}
const aprobar = async (pref, paymentId) => {
  mpPayments[paymentId] = { status: 'approved', status_detail: 'accredited', external_reference: pref.external_reference, metadata: pref.metadata }
  return request(app).post(`/payment_confirm/${paymentId}`)
}

test('/buy reserva el stock, crea la orden pendiente y la vincula a la preferencia', async () => {
  const ev = await crearEvento(10)
  const res = await comprar(ev, { General: 3 })
  assert.equal(res.status, 200)
  assert.equal(await cantidad(ev, 'General'), 7, 'reservado al iniciar el pago')

  const [orden] = await orderModel.find().lean()
  assert.equal(orden.estado, 'pendiente')
  assert.ok(orden.expiraEn > new Date(Date.now() + 14 * 60 * 1000) && orden.expiraEn <= new Date(Date.now() + 15 * 60 * 1000))

  const [pref] = preferencias
  assert.equal(pref.external_reference, orden._id.toString())
  assert.equal(pref.metadata.order_id, orden._id.toString())
  assert.equal(pref.expires, true)
  assert.equal(new Date(pref.expiration_date_to).getTime(), new Date(orden.expiraEn).getTime())
  //Patron exacto que valida Mercado Pago (rechaza el formato ...Z de toISOString)
  const patronMP = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}-[0-9]{2}:[0-9]{2}$/
  assert.match(pref.expiration_date_from, patronMP)
  assert.match(pref.expiration_date_to, patronMP)
  assert.deepEqual(pref.payment_methods.excluded_payment_types, [{ id: 'ticket' }, { id: 'atm' }])
})

test('CRITICO: compras simultaneas por las ultimas entradas no sobrevenden', async () => {
  const ev = await crearEvento(3)
  const respuestas = await Promise.all(Array.from({ length: 8 }, () => comprar(ev, { General: 1 })))

  const ok = respuestas.filter((r) => r.status === 200).length
  const sinStock = respuestas.filter((r) => r.status === 409 && r.body.code === 'SIN_STOCK').length
  assert.equal(ok, 3)
  assert.equal(sinStock, 5)
  assert.equal(await cantidad(ev, 'General'), 0)
  assert.equal(preferencias.length, 3)
  assert.equal(await orderModel.countDocuments({ estado: 'pendiente' }), 3)
})

test('reserva todo o nada: si un ticket no alcanza, no se toca ninguno', async () => {
  const ev = await crearEvento(10, 1)
  const res = await comprar(ev, { General: 2, VIP: 2 })
  assert.equal(res.status, 409)
  assert.equal(await cantidad(ev, 'General'), 10)
  assert.equal(await cantidad(ev, 'VIP'), 1)
  assert.equal(await orderModel.countDocuments(), 0)
})

test('pago aprobado: la orden pasa a pagada y el stock NO se descuenta dos veces', async () => {
  const ev = await crearEvento(10)
  await comprar(ev, { General: 2 })
  const r = await aprobar(preferencias[0], '7001')
  assert.equal(r.body.procesado, true)

  assert.equal(await cantidad(ev, 'General'), 8)
  const evDb = await ticketModel.findById(ev._id).lean()
  assert.equal(evDb.tickets[0].ventas, 2)
  const [orden] = await orderModel.find().lean()
  assert.equal(orden.estado, 'pagada')
  assert.equal(orden.paymentId, '7001')

  //Avisos repetidos no cambian nada
  await request(app).post('/webhook/mercadopago').query({ type: 'payment', 'data.id': '7001' })
  await new Promise((res) => setTimeout(res, 1500))
  assert.equal(await cantidad(ev, 'General'), 8)
  assert.equal(await transactionModel.countDocuments(), 1)
})

test('reserva vencida sin pago: el stock vuelve, y vencer dos veces no lo duplica', async () => {
  const ev = await crearEvento(5)
  await comprar(ev, { General: 2 })
  assert.equal(await cantidad(ev, 'General'), 3)

  const enElFuturo = new Date(Date.now() + 16 * 60 * 1000)
  assert.equal(await stock.expirarOrdenesVencidas(enElFuturo), 1)
  assert.equal(await stock.expirarOrdenesVencidas(enElFuturo), 0)
  assert.equal(await cantidad(ev, 'General'), 5)
  assert.equal((await orderModel.findOne().lean()).estado, 'expirada')
})

test('una reserva vigente no se vence antes de tiempo', async () => {
  const ev = await crearEvento(5)
  await comprar(ev, { General: 2 })
  assert.equal(await stock.expirarOrdenesVencidas(new Date()), 0)
  assert.equal(await cantidad(ev, 'General'), 3)
})

test('pago tardio con stock disponible: se vuelve a reservar y se emite', async () => {
  const ev = await crearEvento(5)
  await comprar(ev, { General: 2 })
  await stock.expirarOrdenesVencidas(new Date(Date.now() + 16 * 60 * 1000))
  assert.equal(await cantidad(ev, 'General'), 5)

  const r = await aprobar(preferencias[0], '7002')
  assert.equal(r.body.procesado, true)
  assert.equal(await cantidad(ev, 'General'), 3)
  const orden = await orderModel.findOne().lean()
  assert.equal(orden.estado, 'pagada')
  assert.equal(orden.sobreventa, false)
  await esperar(async () => (await tokenModel.countDocuments()) === 2)
})

test('pago tardio SIN stock: se emite igual (decision de negocio) y queda marcado como sobreventa', async () => {
  const ev = await crearEvento(2)
  await comprar(ev, { General: 2 })
  await stock.expirarOrdenesVencidas(new Date(Date.now() + 16 * 60 * 1000))
  await comprar(ev, { General: 2 })  //otro comprador se lleva el stock liberado
  assert.equal(await cantidad(ev, 'General'), 0)

  const r = await aprobar(preferencias[0], '7003')
  assert.equal(r.body.procesado, true)
  assert.equal(await cantidad(ev, 'General'), -2)
  const pagada = await orderModel.findOne({ paymentId: '7003' }).lean()
  assert.equal(pagada.estado, 'pagada')
  assert.equal(pagada.sobreventa, true)
  await esperar(async () => (await tokenModel.countDocuments()) === 2, 15000)
})

test('vencimiento y pago al mismo tiempo: el stock queda consistente', async () => {
  const ev = await crearEvento(5)
  await comprar(ev, { General: 2 })
  mpPayments['7004'] = { status: 'approved', status_detail: 'accredited', external_reference: preferencias[0].external_reference, metadata: preferencias[0].metadata }
  await Promise.all([
    stock.expirarOrdenesVencidas(new Date(Date.now() + 16 * 60 * 1000)),
    request(app).post('/payment_confirm/7004')
  ])
  //Gane quien gane, el pago queda con sus 2 entradas descontadas una sola vez
  assert.equal(await cantidad(ev, 'General'), 3)
  assert.equal((await orderModel.findOne().lean()).estado, 'pagada')
})

test('si Mercado Pago falla al crear el pago, la reserva se libera', async () => {
  const ev = await crearEvento(5)
  mpFalla = true
  const res = await comprar(ev, { General: 2 })
  assert.equal(res.status, 500)
  assert.equal(await cantidad(ev, 'General'), 5)
  assert.equal((await orderModel.findOne().lean()).estado, 'fallida')
})

test('preferencias anteriores a las ordenes: el pago descuenta el stock como antes', async () => {
  const ev = await crearEvento(10)
  mpPayments['7005'] = { status: 'approved', status_detail: 'accredited', external_reference: '164382724', metadata: {
    prod_id: ev._id.toString(), nombre_evento: 'Evento Stock', mail: uniqueMail('viejo'), state: 1, total: 2300,
    quantities: { [tid(ev, 'General')]: { amount: 2, free: false } }, nombre_completo: 'V', dni: 1, telefono: '1', email_hash: null, discount_code: null
  } }
  const r = await request(app).post('/payment_confirm/7005')
  assert.equal(r.body.procesado, true)
  assert.equal(await cantidad(ev, 'General'), 8)
})
