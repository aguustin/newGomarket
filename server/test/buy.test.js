import { test, before, after, beforeEach, mock } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, resetDb, uniqueMail } from "./helpers.js"

//Etapa 4: /buy calcula precio, descuento y disponibilidad con los datos de la base.
//Lo unico simulado es Mercado Pago: preferences.create (se captura la preferencia) y payment.findById.
let app, mercadopago, ticketModel, transactionModel, purchaseModel, tokenModel, discountModel
let preferencias = []
let mpPayments = {}

before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  mercadopago = (await import('../lib/mercadopago.js')).default
  ticketModel = (await import('../models/ticketsModel.js')).default
  transactionModel = (await import('../models/transactionsModel.js')).default
  purchaseModel = (await import('../models/purchaseModel.js')).default
  tokenModel = (await import('../models/tokenModel.js')).default
  discountModel = (await import('../models/discountModel.js')).default

  mock.method(mercadopago.preferences, 'create', async (pref) => {
    preferencias.push(pref)
    return { body: { id: `pref-${preferencias.length}`, init_point: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-${preferencias.length}` } }
  })
  mock.method(mercadopago.payment, 'findById', async (id) => {
    const body = mpPayments[String(id)]
    if (!body) throw Object.assign(new Error('Payment not found'), { status: 404 })
    //Como Mercado Pago: el pago trae lo cobrado y la moneda (por defecto, lo que calculo el servidor)
    return { body: { currency_id: 'ARS', transaction_amount: body.metadata?.total, ...body } }
  })
})
after(closeDb)
beforeEach(async () => { preferencias = []; mpPayments = {}; await resetDb() })

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)
const ayer = () => new Date(Date.now() - 24 * 3600 * 1000)

const crearEvento = (extra = {}) => ticketModel.create({
  userId: 'u1', nombreEvento: 'Evento Buy', comisionServicio: 15, active: true, soldOut: false,
  fechaInicio: enUnMes(), fechaFin: enUnMes(), direccion: 'Calle 1', imgEvento: 'https://example.com/i.png',
  totalVentas: 0, totalMontoVendido: 0,
  tickets: [
    { nombreTicket: 'General', precio: 20000, cantidad: 10, ventas: 0, fechaDeCierre: enUnMes(), estado: 1, limit: 5 },
    { nombreTicket: 'Vencido', precio: 20000, cantidad: 10, ventas: 0, fechaDeCierre: ayer(), estado: 1 },
    { nombreTicket: 'Gratis', precio: 0, cantidad: 10, ventas: 0, fechaDeCierre: enUnMes(), estado: 1 }
  ],
  cortesiaRRPP: [{ nombreTicket: 'Cortesía', cantidadDeCortesias: 10, entregados: 0, fechaDeCierre: enUnMes() }],
  ...extra
})

const ticketId = (ev, nombre) => ev.tickets.find((t) => t.nombreTicket === nombre)._id.toString()

const comprar = (ev, cantidades, extra = {}) => request(app).post('/buy').send({
  prodId: ev._id.toString(),
  nombreEvento: 'nombre que manda el navegador',
  quantities: Object.fromEntries(Object.entries(cantidades).map(([nombre, amount]) => [ticketId(ev, nombre), { amount, free: false }])),
  mail: uniqueMail('buy'), state: 1, emailHash: null, nombreCompleto: 'Comprador Buy', dni: '30111222', telefono: '1155550000',
  ...extra
})

test('cobra el total calculado por el servidor y guarda los montos en la metadata', async () => {
  const ev = await crearEvento()
  const res = await comprar(ev, { General: 2 }, { total: 46000 })

  assert.equal(res.status, 200)
  assert.match(res.body.init_point, /pref_id=pref-1/)
  assert.equal(res.body.total, 46000)

  const [pref] = preferencias
  assert.equal(pref.items[0].unit_price, 46000)
  assert.equal(pref.items[0].title, 'Ticket para Evento Buy', 'el nombre sale de la base, no del navegador')
  assert.equal(pref.metadata.total, 46000)
  assert.equal(pref.metadata.monto_entradas, 40000)
  assert.equal(pref.metadata.state, 1)
  assert.deepEqual(pref.metadata.quantities, { [ticketId(ev, 'General')]: { amount: 2, free: false } })
})

test('total manipulado desde el navegador: 409 con el total correcto y no se crea la preferencia', async () => {
  const ev = await crearEvento()
  for (const total of [1, 0, -5, 45000, '46000', undefined]) {
    const res = await comprar(ev, { General: 2 }, { total })
    assert.equal(res.status, 409, `total=${total}`)
    assert.equal(res.body.code, 'TOTAL_DISTINTO')
    assert.equal(res.body.total, 46000)
  }
  assert.equal(preferencias.length, 0)
})

test('CRITICO: total 0 del navegador sobre entradas pagas ya no emite entradas gratis', async () => {
  const ev = await crearEvento()
  const res = await comprar(ev, { General: 2 }, { total: 0 })
  assert.equal(res.status, 409)
  await new Promise((r) => setTimeout(r, 500))
  assert.equal(await tokenModel.countDocuments(), 0, 'no se generaron QR')
  assert.equal((await request(app).get('/dev/mails.json')).body.length, 0, 'no se envio ningun mail')
  assert.equal((await ticketModel.findById(ev._id).lean()).tickets[0].ventas, 0)
})

test('"free: true" o state 3 del navegador no hacen gratis una entrada paga', async () => {
  const ev = await crearEvento()
  const res = await request(app).post('/buy').send({
    prodId: ev._id.toString(), quantities: { [ticketId(ev, 'General')]: { amount: 1, free: true } },
    mail: uniqueMail('free'), state: 3, total: 0, nombreCompleto: 'X', dni: '1', telefono: '1'
  })
  assert.equal(res.status, 409)
  assert.equal(res.body.total, 23000)
  assert.equal(await tokenModel.countDocuments(), 0)
})

test('rechaza tickets vencidos, cortesias, de otro evento y eventos terminados, sin crear preferencia', async () => {
  const ev = await crearEvento()
  assert.equal((await comprar(ev, { Vencido: 1 }, { total: 23000 })).body.code, 'VENTA_CERRADA')

  const cortesia = await request(app).post('/buy').send({
    prodId: ev._id.toString(), quantities: { [ev.cortesiaRRPP[0]._id.toString()]: { amount: 1, free: true } },
    mail: uniqueMail('c'), total: 0, nombreCompleto: 'X', dni: '1', telefono: '1'
  })
  assert.equal(cortesia.status, 400)
  assert.equal(cortesia.body.code, 'TICKET_CORTESIA')

  const otro = await crearEvento()
  const ajeno = await request(app).post('/buy').send({
    prodId: ev._id.toString(), quantities: { [ticketId(otro, 'General')]: { amount: 1 } },
    mail: uniqueMail('a'), total: 23000, nombreCompleto: 'X', dni: '1', telefono: '1'
  })
  assert.equal(ajeno.body.code, 'TICKET_INEXISTENTE')

  const terminado = await crearEvento({ fechaFin: ayer() })
  assert.equal((await comprar(terminado, { General: 1 }, { total: 23000 })).body.code, 'VENTA_CERRADA')

  assert.equal((await comprar(ev, { General: 6 }, { total: 138000 })).body.code, 'LIMITE_SUPERADO')
  assert.equal(preferencias.length, 0)
})

test('valida datos del comprador y del evento', async () => {
  const ev = await crearEvento()
  assert.equal((await comprar(ev, { General: 1 }, { total: 23000, mail: 'no-es-mail' })).status, 400)
  assert.equal((await comprar(ev, { General: 1 }, { total: 23000, telefono: undefined })).status, 400)
  assert.equal((await comprar(ev, { General: 1 }, { total: 23000, prodId: 'invalido' })).status, 400)
  const inexistente = await comprar(ev, { General: 1 }, { total: 23000, prodId: '000000000000000000000000' })
  assert.equal(inexistente.status, 404)
  assert.equal(preferencias.length, 0)
})

test('entradas de precio 0: el servidor las emite sin pasar por MP, con stock y comprador', async () => {
  const ev = await crearEvento()
  const mail = uniqueMail('gratis')
  const res = await comprar(ev, { Gratis: 2 }, { total: 0, mail })

  assert.equal(res.status, 200)
  assert.equal(res.body, 3)
  assert.equal(preferencias.length, 0)
  assert.equal(await tokenModel.countDocuments(), 2)
  assert.equal((await request(app).get('/dev/mails.json').query({ to: mail })).body.length, 1)
  const t = (await ticketModel.findById(ev._id).lean()).tickets.find((x) => x.nombreTicket === 'Gratis')
  assert.equal(t.cantidad, 8)
  assert.equal(t.ventas, 2)
  assert.equal(await purchaseModel.countDocuments(), 1)
})

const esperar = async (cond, ms = 15000) => {
  const fin = Date.now() + ms
  while (Date.now() < fin) { if (await cond()) return; await new Promise((r) => setTimeout(r, 200)) }
  throw new Error('timeout')
}

test('descuento: se cobra, se reembolsa con descuento y se consume UNA vez al aprobarse el pago', async () => {
  const ev = await crearEvento()
  await discountModel.create({ prodId: ev._id.toString(), idDescuento: 'PROMO10', cantidadDescuentos: 3, numeroDescuento: 10 })

  //Sin el descuento en el total mostrado: el servidor avisa el total correcto
  assert.equal((await comprar(ev, { General: 2 }, { total: 46000, discountCode: 'PROMO10' })).body.total, 41400)

  const res = await comprar(ev, { General: 2 }, { total: 41400, discountCode: 'PROMO10' })
  assert.equal(res.status, 200)
  const [pref] = preferencias
  assert.equal(pref.items[0].unit_price, 41400)
  assert.equal(pref.metadata.discount_code, 'PROMO10')
  assert.equal(pref.metadata.monto_entradas, 36000)
  assert.equal((await discountModel.findOne({ idDescuento: 'PROMO10' }).lean()).cantidadDescuentos, 3, 'crear la preferencia no consume el descuento')

  //Pago aprobado: el webhook llega dos veces
  mpPayments['5001'] = { status: 'approved', status_detail: 'accredited', metadata: pref.metadata }
  await request(app).post('/webhook/mercadopago').query({ type: 'payment', 'data.id': '5001' })
  await esperar(async () => (await purchaseModel.countDocuments()) === 1)
  await esperar(async () => (await discountModel.findOne({ idDescuento: 'PROMO10' }).lean()).cantidadDescuentos === 2)
  await request(app).post('/webhook/mercadopago').query({ topic: 'payment', id: '5001' })
  await new Promise((r) => setTimeout(r, 1500))

  assert.equal((await discountModel.findOne({ idDescuento: 'PROMO10' }).lean()).cantidadDescuentos, 2, 'no se consume dos veces')
  assert.equal((await transactionModel.findOne({ paymentId: '5001' }).lean()).montoPagado, 36000)
})

test('descuento de otro evento o sin usos: 409 DESCUENTO_INVALIDO', async () => {
  const ev = await crearEvento()
  const otro = await crearEvento()
  await discountModel.create({ prodId: otro._id.toString(), idDescuento: 'AJENO', cantidadDescuentos: 5, numeroDescuento: 50 })
  await discountModel.create({ prodId: ev._id.toString(), idDescuento: 'AGOTADO', cantidadDescuentos: 0, numeroDescuento: 50 })

  for (const discountCode of ['AJENO', 'AGOTADO', 'NO-EXISTE']) {
    const res = await comprar(ev, { General: 1 }, { total: 11500, discountCode })
    assert.equal(res.status, 409, discountCode)
    assert.equal(res.body.code, 'DESCUENTO_INVALIDO')
  }
  assert.equal(preferencias.length, 0)
})

test('/find_discount con prodId solo encuentra descuentos de ese evento', async () => {
  const ev = await crearEvento()
  const otro = await crearEvento()
  await discountModel.create({ prodId: otro._id.toString(), idDescuento: 'AJENO', cantidadDescuentos: 5, numeroDescuento: 50 })
  await discountModel.create({ prodId: ev._id.toString(), idDescuento: 'PROPIO', cantidadDescuentos: 5, numeroDescuento: 20 })

  assert.equal((await request(app).get('/find_discount/PROPIO').query({ prodId: ev._id.toString() })).body.discount.numeroDescuento, 20)
  assert.equal((await request(app).get('/find_discount/AJENO').query({ prodId: ev._id.toString() })).body.discount, undefined)
})

test('/active_discount ya no existe y no toca descuentos (antes borraba el primero de la coleccion)', async () => {
  const ev = await crearEvento()
  await discountModel.create({ prodId: ev._id.toString(), idDescuento: 'A', cantidadDescuentos: 1, numeroDescuento: 10 })
  await discountModel.create({ prodId: ev._id.toString(), idDescuento: 'B', cantidadDescuentos: 1, numeroDescuento: 10 })

  const res = await request(app).post('/active_discount').send({ discountCode: 'A' })
  assert.equal(res.status, 404)
  const quedan = await discountModel.find().lean()
  assert.deepEqual(quedan.map((d) => [d.idDescuento, d.cantidadDescuentos]).sort(), [['A', 1], ['B', 1]])
})

test('pago de una preferencia vieja (sin monto_entradas): el reembolsable se deduce del total como antes', async () => {
  const ev = await crearEvento()
  const mail = uniqueMail('viejo')
  mpPayments['5002'] = { status: 'approved', status_detail: 'accredited', metadata: {
    prod_id: ev._id.toString(), nombre_evento: 'Evento Buy', mail, state: 1, total: 46000,
    quantities: { [ticketId(ev, 'General')]: { amount: 2, free: false } },
    nombre_completo: 'Viejo', dni: 1, telefono: '1', email_hash: null, discount_code: null
  } }
  await request(app).post('/webhook/mercadopago').query({ type: 'payment', 'data.id': '5002' })
  await esperar(async () => (await transactionModel.countDocuments()) === 1)
  await esperar(async () => (await tokenModel.countDocuments()) === 2)  //la entrega termina despues de la venta
  assert.equal((await transactionModel.findOne({ paymentId: '5002' }).lean()).montoPagado, 40000)
})
