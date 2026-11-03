import { test, before, after, beforeEach, mock } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, resetDb, uniqueMail } from "./helpers.js"

//Etapa 9: entregas confiables (reintentos sin duplicar), control del monto y firma del webhook (modo registrar)
let app, mercadopago, resend, ticketModel, transactionModel, purchaseModel, tokenModel, reintentarPagosPendientes, firmarComoMP
let mpPayments = {}
let fallasMail = 0          //cuantos envios de mail van a fallar
let enviarOriginal

before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  mercadopago = (await import('../lib/mercadopago.js')).default
  ;({ resend } = await import('../lib/resendDomain.js'))
  ticketModel = (await import('../models/ticketsModel.js')).default
  transactionModel = (await import('../models/transactionsModel.js')).default
  purchaseModel = (await import('../models/purchaseModel.js')).default
  tokenModel = (await import('../models/tokenModel.js')).default
  ;({ reintentarPagosPendientes } = await import('../controllers/eventController.js'))
  ;({ firmarComoMP } = await import('../lib/firmaMP.js'))

  mock.method(mercadopago.payment, 'findById', async (id) => {
    const body = mpPayments[String(id)]
    if (!body) throw Object.assign(new Error('Payment not found'), { status: 404 })
    return { body: { currency_id: 'ARS', transaction_amount: body.metadata?.total, ...body } }
  })
  //Falla puntual del proveedor de mail: los primeros `fallasMail` envios devuelven error (como Resend)
  enviarOriginal = resend.emails.send
  mock.method(resend.emails, 'send', async (msg) => {
    if (fallasMail > 0) { fallasMail--; return { data: null, error: { name: 'application_error', message: 'caida simulada' } } }
    return enviarOriginal(msg)
  })
})
after(closeDb)
beforeEach(async () => { mpPayments = {}; fallasMail = 0; await resetDb() })

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)
const crearEvento = () => ticketModel.create({
  userId: 'u1', nombreEvento: 'Evento Entregas', comisionServicio: 15, active: true, fechaInicio: enUnMes(), fechaFin: enUnMes(),
  direccion: 'Calle 1', totalVentas: 0, totalMontoVendido: 0,
  tickets: [{ nombreTicket: 'General', precio: 20000, cantidad: 10, ventas: 0, fechaDeCierre: enUnMes(), estado: 1, limit: 30 }]
})
const pago = (ev, mail, extra = {}) => ({
  status: 'approved', status_detail: 'accredited',
  metadata: { prod_id: ev._id.toString(), nombre_evento: 'Evento Entregas', mail, state: 1, total: 46000, monto_entradas: 40000,
    quantities: { [ev.tickets[0]._id.toString()]: { amount: 2, free: false } }, nombre_completo: 'Comprador', dni: 1, telefono: '1', email_hash: null, discount_code: null },
  ...extra
})
const confirmar = (id) => request(app).post(`/payment_confirm/${id}`)
const mails = async (to) => (await request(app).get('/dev/mails.json').query({ to })).body
const tx = (id) => transactionModel.findOne({ paymentId: id }).lean()
const ventas = async (ev) => (await ticketModel.findById(ev._id).lean()).tickets[0].ventas

test('CRITICO: si el mail falla, la venta queda registrada y la entrega se reintenta sin duplicar la venta', async () => {
  const ev = await crearEvento()
  const mail = uniqueMail('falla-una')
  mpPayments['9001'] = pago(ev, mail)
  fallasMail = 1

  const primero = await confirmar('9001')
  assert.equal(primero.body.procesado, true)
  let t = await tx('9001')
  assert.equal(t.ventaRegistrada, true)
  assert.equal(t.entregado, false)
  assert.equal(t.intentosEntrega, 1)
  assert.match(t.ultimoErrorEntrega, /No se pudo enviar/)
  assert.equal((await mails(mail)).length, 0)

  //Llega otro aviso (o vuelve a la pagina): solo se reintenta la entrega
  const segundo = await confirmar('9001')
  assert.equal(segundo.body.procesado, false, 'la venta no se vuelve a registrar')
  t = await tx('9001')
  assert.equal(t.entregado, true)
  assert.ok(t.entregadoEn)
  assert.equal((await mails(mail)).length, 1)
  assert.equal(await ventas(ev), 2, 'ventas contadas una sola vez')
  assert.equal(await purchaseModel.countDocuments(), 1)
  assert.equal(await transactionModel.countDocuments(), 1)

  //Mas avisos: no se manda otro mail
  await confirmar('9001')
  assert.equal((await mails(mail)).length, 1)
})

test('reintento automatico (cron): toma los pagos con la entrega pendiente', async () => {
  const ev = await crearEvento()
  const mail = uniqueMail('cron')
  mpPayments['9002'] = pago(ev, mail)
  fallasMail = 1
  await confirmar('9002')
  assert.equal((await tx('9002')).entregado, false)

  //Recien creado: el cron espera un minuto antes de reintentar
  assert.equal(await reintentarPagosPendientes(new Date()), 0)
  assert.equal(await reintentarPagosPendientes(new Date(Date.now() + 2 * 60 * 1000)), 1)
  assert.equal((await tx('9002')).entregado, true)
  assert.equal((await mails(mail)).length, 1)
  assert.equal(await reintentarPagosPendientes(new Date(Date.now() + 2 * 60 * 1000)), 0, 'ya no queda nada pendiente')
})

test('despues de 5 intentos fallidos deja de reintentar y queda para revision', async () => {
  const ev = await crearEvento()
  mpPayments['9003'] = pago(ev, uniqueMail('siempre-falla'))
  fallasMail = 100
  for (let i = 0; i < 7; i++) await confirmar('9003')
  const t = await tx('9003')
  assert.equal(t.intentosEntrega, 5)
  assert.equal(t.entregado, false)
  assert.equal(await reintentarPagosPendientes(new Date(Date.now() + 10 * 60 * 1000)), 0)
  assert.equal(await ventas(ev), 2)
})

test('CRITICO: webhook, pagina y reintento al mismo tiempo: un solo mail y una sola venta', async () => {
  const ev = await crearEvento()
  const mail = uniqueMail('concurrente')
  mpPayments['9004'] = pago(ev, mail)
  fallasMail = 1
  await confirmar('9004')  //primera entrega falla
  await transactionModel.updateOne({ paymentId: '9004' }, { $set: { fecha: new Date(Date.now() - 5 * 60 * 1000) } })

  await Promise.all([
    confirmar('9004'), confirmar('9004'),
    request(app).post('/webhook/mercadopago').query({ type: 'payment', 'data.id': '9004' }),
    reintentarPagosPendientes()
  ])
  const fin = Date.now() + 10000
  while (Date.now() < fin && !(await tx('9004')).entregado) await new Promise((r) => setTimeout(r, 200))
  await new Promise((r) => setTimeout(r, 1000))

  assert.equal((await mails(mail)).length, 1)
  assert.equal(await purchaseModel.countDocuments(), 1)
  assert.equal(await ventas(ev), 2)
  assert.equal(await tokenModel.countDocuments(), 4, '2 del intento fallido (nunca enviados) + 2 entregados')
})

test('monto cobrado distinto al calculado (o en otra moneda): no se entregan entradas y queda la alerta', async () => {
  const ev = await crearEvento()
  for (const [id, extra] of [['9005', { transaction_amount: 100 }], ['9006', { currency_id: 'USD' }]]) {
    const mail = uniqueMail('monto')
    mpPayments[id] = pago(ev, mail, extra)
    const res = await confirmar(id)
    assert.equal(res.body.procesado, false)
    const t = await tx(id)
    assert.equal(t.alertaMonto, true)
    assert.notEqual(t.ventaRegistrada, true)
    assert.equal((await mails(mail)).length, 0)
  }
  assert.equal(await ventas(ev), 0)
  assert.equal(await reintentarPagosPendientes(new Date(Date.now() + 10 * 60 * 1000)), 0, 'las alertas no se reintentan')
})

test('transacciones anteriores a la etapa 9 (sin los nuevos campos) se consideran completas', async () => {
  const ev = await crearEvento()
  await transactionModel.collection.insertOne({ prodId: ev._id.toString(), paymentId: '9007', transaccionId: '9007', montoPagado: 40000, fecha: new Date(0) })
  mpPayments['9007'] = pago(ev, uniqueMail('vieja'))
  assert.equal((await confirmar('9007')).body.procesado, false)
  assert.equal(await reintentarPagosPendientes(), 0)
  assert.equal(await ventas(ev), 0, 'no se vuelve a procesar')
})

test('firma del webhook en modo "registrar": con firma valida o invalida el pago se procesa igual', async () => {
  const ev = await crearEvento()
  for (const [id, firmar] of [['9008', true], ['9009', false]]) {
    const mail = uniqueMail('firma')
    mpPayments[id] = pago(ev, mail)
    const headers = { 'x-request-id': `req-${id}`, 'x-signature': firmar ? firmarComoMP({ dataId: id, requestId: `req-${id}` }, process.env.WEBHOOK_SECRET_KEY || 'sin-clave') : 'ts=1,v1=00' }
    assert.equal((await request(app).post('/webhook/mercadopago').set(headers).query({ type: 'payment', 'data.id': id })).status, 200)
    const fin = Date.now() + 10000
    while (Date.now() < fin && (await mails(mail)).length === 0) await new Promise((r) => setTimeout(r, 200))
    assert.equal((await mails(mail)).length, 1)
  }
})
