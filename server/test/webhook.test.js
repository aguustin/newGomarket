import { test, before, after, beforeEach, mock } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, resetDb, uniqueMail } from "./helpers.js"

//Circuito real del webhook (base, QR, mails en la bandeja). Lo unico simulado es la respuesta
//de Mercado Pago a payment.findById, con la misma forma que devuelve el SDK v1 ({ body: {...} }).
let app, mercadopago, ticketModel, transactionModel, purchaseModel, tokenModel, encrypt, hashForSearch
let mpPayments = {}

before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  mercadopago = (await import('../lib/mercadopago.js')).default
  ticketModel = (await import('../models/ticketsModel.js')).default
  transactionModel = (await import('../models/transactionsModel.js')).default
  purchaseModel = (await import('../models/purchaseModel.js')).default
  tokenModel = (await import('../models/tokenModel.js')).default
  ;({ encrypt, hashForSearch } = await import('../controllers/eventController.js'))

  mock.method(mercadopago.payment, 'findById', async (id) => {
    const body = mpPayments[String(id)]
    if (!body) throw Object.assign(new Error('Payment not found'), { status: 404 })
    //Como Mercado Pago: el pago trae lo cobrado y la moneda (por defecto, lo que calculo el servidor)
    return { body: { currency_id: 'ARS', transaction_amount: body.metadata?.total, ...body } }
  })
})
after(closeDb)
beforeEach(async () => { mpPayments = {}; await resetDb() })

const crearEvento = async ({ rrppMail } = {}) => {
  const enUnMes = new Date(Date.now() + 30 * 24 * 3600 * 1000)
  return ticketModel.create({
    userId: 'u1', nombreEvento: 'Evento Test', comisionServicio: 15, porcentajeRRPP: 10,
    fechaInicio: enUnMes, fechaFin: enUnMes, direccion: 'Calle 1', imgEvento: 'https://example.com/i.png',
    totalVentas: 0, totalMontoVendido: 0, prodMail: encrypt('productor@ipass-test.local'),
    tickets: [{ nombreTicket: 'General', precio: 20000, cantidad: 10, ventas: 0, fechaDeCierre: enUnMes, estado: 1, limit: 30 }],
    rrpp: rrppMail ? [{ mail: rrppMail, mailEncriptado: encrypt(rrppMail), mailHash: hashForSearch(rrppMail), ventasRRPP: [], montoCorrespondienteRRPP: 0, montoTotalVendidoRRPP: 0 }] : []
  })
}

//Pago aprobado de 2 entradas de 20.000 + 15% = 46.000, como lo arma /buy en metadata
const pagoAprobado = (evento, mail, extra = {}) => ({
  status: 'approved', status_detail: 'accredited',
  metadata: {
    prod_id: evento._id.toString(), nombre_evento: evento.nombreEvento, mail, state: 1, total: 46000,
    quantities: { [evento.tickets[0]._id.toString()]: { amount: 2, free: false } },
    nombre_completo: 'Comprador Test', dni: 12345678, telefono: '1122334455', email_hash: null, discount_code: null,
    ...extra
  }
})

const webhook = (id, format = 'data') => request(app).post('/webhook/mercadopago')
  .query(format === 'data' ? { type: 'payment', 'data.id': id } : { topic: 'payment', id })

//El webhook responde 200 enseguida y procesa despues: esperar a que termine
const esperar = async (cond, ms = 15000) => {
  const fin = Date.now() + ms
  while (Date.now() < fin) { if (await cond()) return; await new Promise((r) => setTimeout(r, 200)) }
  throw new Error('timeout esperando el procesamiento del webhook')
}
const mailsPara = async (to) => (await request(app).get('/dev/mails.json').query({ to })).body

test('pago aprobado: transaccion, comprador, QR por mail, stock y ventas', async () => {
  const evento = await crearEvento()
  const mail = uniqueMail('comprador')
  mpPayments['1001'] = pagoAprobado(evento, mail)

  assert.equal((await webhook('1001')).status, 200)
  await esperar(async () => (await purchaseModel.countDocuments()) === 1 && (await mailsPara(mail)).length === 1)

  const tx = await transactionModel.findOne({ paymentId: '1001' }).lean()
  assert.equal(tx.montoPagado, 40000, 'lo reembolsable es el total sin el 15% de cargo por servicio')
  assert.equal(await tokenModel.countDocuments(), 2)

  const [mailQR] = await mailsPara(mail)
  assert.match(mailQR.subject, /Tus entradas para Evento Test/)
  assert.equal(mailQR.attachments.length, 2)

  const ev = await ticketModel.findById(evento._id).lean()
  assert.equal(ev.tickets[0].cantidad, 8)
  assert.equal(ev.tickets[0].ventas, 2)
  assert.equal(ev.totalVentas, 2)
  assert.equal(ev.totalMontoVendido, 46000)
})

test('avisos duplicados de MP (ambos formatos) no duplican nada', async () => {
  const evento = await crearEvento()
  const mail = uniqueMail('dup')
  mpPayments['1002'] = pagoAprobado(evento, mail)

  await webhook('1002')
  await esperar(async () => (await mailsPara(mail)).length === 1)
  await webhook('1002')
  await webhook('1002', 'topic')
  await new Promise((r) => setTimeout(r, 1500))

  assert.equal(await transactionModel.countDocuments(), 1)
  assert.equal(await purchaseModel.countDocuments(), 1)
  assert.equal(await tokenModel.countDocuments(), 2)
  assert.equal((await mailsPara(mail)).length, 1)
  assert.equal((await ticketModel.findById(evento._id).lean()).tickets[0].ventas, 2)
})

test('compra con link de RRPP: registra la venta y la comision del RRPP', async () => {
  const rrppMail = uniqueMail('rrpp')
  const evento = await crearEvento({ rrppMail })
  const mail = uniqueMail('comprador-rrpp')
  mpPayments['1003'] = pagoAprobado(evento, mail, { email_hash: hashForSearch(rrppMail) })

  await webhook('1003')
  await esperar(async () => (await purchaseModel.countDocuments()) === 1)
  await esperar(async () => (await ticketModel.findById(evento._id).lean()).rrpp[0].ventasRRPP.length === 1)
  await esperar(async () => (await mailsPara(mail)).length === 1)  //la entrega termina despues de la venta

  const { rrpp: [rrpp] } = await ticketModel.findById(evento._id).lean()
  assert.equal(rrpp.ventasRRPP[0].vendidos, 2)
  assert.equal(rrpp.ventasRRPP[0].total, 40000)
  assert.equal(rrpp.montoTotalVendidoRRPP, 40000)
  assert.equal(rrpp.montoCorrespondienteRRPP, 4000, '10% de 40.000')
})

test('pago no aprobado: no se procesa nada', async () => {
  const evento = await crearEvento()
  mpPayments['1004'] = { ...pagoAprobado(evento, uniqueMail('rech')), status: 'rejected', status_detail: 'cc_rejected_other_reason' }
  assert.equal((await webhook('1004')).status, 200)
  await new Promise((r) => setTimeout(r, 1500))
  assert.equal(await transactionModel.countDocuments(), 0)
  assert.equal(await tokenModel.countDocuments(), 0)
})

const confirmar = (id) => request(app).post(`/payment_confirm/${id}`)

test('confirmacion desde la pagina: procesa el pago aprobado si el webhook nunca llego', async () => {
  const evento = await crearEvento()
  const mail = uniqueMail('sin-webhook')
  mpPayments['2001'] = pagoAprobado(evento, mail)

  const res = await confirmar('2001')
  assert.equal(res.status, 200)
  assert.equal(res.body.status, 'approved')
  assert.equal(res.body.procesado, true)
  assert.equal(res.body.nombreEvento, 'Evento Test')

  //La respuesta llega cuando ya esta todo procesado: no hace falta esperar
  assert.equal(await transactionModel.countDocuments({ paymentId: '2001' }), 1)
  assert.equal(await purchaseModel.countDocuments(), 1)
  assert.equal(await tokenModel.countDocuments(), 2)
  assert.equal((await mailsPara(mail)).length, 1)
  assert.equal((await ticketModel.findById(evento._id).lean()).tickets[0].ventas, 2)
})

test('recargar la pagina de resultado no vuelve a procesar el pago', async () => {
  const evento = await crearEvento()
  const mail = uniqueMail('recarga')
  mpPayments['2002'] = pagoAprobado(evento, mail)

  assert.equal((await confirmar('2002')).body.procesado, true)
  const segunda = await confirmar('2002')
  assert.equal(segunda.body.status, 'approved')
  assert.equal(segunda.body.procesado, false)
  assert.equal(await tokenModel.countDocuments(), 2)
  assert.equal((await mailsPara(mail)).length, 1)
})

test('si el webhook ya proceso el pago, la pagina solo informa', async () => {
  const evento = await crearEvento()
  const mail = uniqueMail('webhook-primero')
  mpPayments['2003'] = pagoAprobado(evento, mail)

  await webhook('2003')
  await esperar(async () => (await purchaseModel.countDocuments()) === 1)
  const res = await confirmar('2003')
  assert.equal(res.body.status, 'approved')
  assert.equal(res.body.procesado, false)
  assert.equal(await transactionModel.countDocuments(), 1)
  assert.equal((await mailsPara(mail)).length, 1)
})

test('webhook y pagina al mismo tiempo: el pago se procesa una sola vez', async () => {
  const evento = await crearEvento()
  const mail = uniqueMail('carrera')
  mpPayments['2004'] = pagoAprobado(evento, mail)

  const [, pagina1, pagina2] = await Promise.all([webhook('2004'), confirmar('2004'), confirmar('2004')])
  await new Promise((r) => setTimeout(r, 2500))  //dar tiempo al webhook, que procesa despues de responder

  assert.equal([pagina1.body.procesado, pagina2.body.procesado].filter(Boolean).length <= 1, true)
  assert.equal(await transactionModel.countDocuments(), 1)
  assert.equal(await purchaseModel.countDocuments(), 1)
  assert.equal(await tokenModel.countDocuments(), 2)
  assert.equal((await mailsPara(mail)).length, 1)
  const ev = await ticketModel.findById(evento._id).lean()
  assert.equal(ev.tickets[0].ventas, 2)
  assert.equal(ev.tickets[0].cantidad, 8)
})

test('confirmacion de un pago pendiente o rechazado: informa y no procesa', async () => {
  const evento = await crearEvento()
  mpPayments['2005'] = { ...pagoAprobado(evento, uniqueMail('pend')), status: 'in_process', status_detail: 'pending_contingency' }
  mpPayments['2006'] = { ...pagoAprobado(evento, uniqueMail('rech')), status: 'rejected', status_detail: 'cc_rejected_other_reason' }

  const pend = await confirmar('2005')
  assert.equal(pend.body.status, 'in_process')
  assert.equal(pend.body.procesado, false)
  const rech = await confirmar('2006')
  assert.equal(rech.body.status, 'rejected')
  assert.equal(rech.body.procesado, false)
  assert.equal(await transactionModel.countDocuments(), 0)
  assert.equal(await tokenModel.countDocuments(), 0)
})

test('confirmacion con id invalido o inexistente', async () => {
  assert.equal((await confirmar('abc')).status, 400)
  assert.equal((await confirmar('1;drop')).status, 400)
  const noExiste = await confirmar('987654')
  assert.equal(noExiste.status, 404)
  assert.equal(await transactionModel.countDocuments(), 0)
})

test('/payment_return redirige siempre al frontend conservando los parametros de MP', async () => {
  const res = await request(app).get('/payment_return').query({ payment_id: '123', status: 'approved', external_reference: 'x' })
  assert.equal(res.status, 302)
  const destino = new URL(res.headers.location)
  assert.equal(destino.origin, new URL(process.env.URL_FRONT_DEV).origin)
  assert.equal(destino.pathname, '/payment_result')
  assert.equal(destino.searchParams.get('payment_id'), '123')
  assert.equal(destino.searchParams.get('status'), 'approved')
})

test('/payment_status devuelve el estado consultado a MP', async () => {
  const evento = await crearEvento()
  mpPayments['1005'] = pagoAprobado(evento, uniqueMail('st'))
  const ok = await request(app).get('/payment_status/1005')
  assert.equal(ok.status, 200)
  assert.equal(ok.body.status, 'approved')
  assert.equal(ok.body.nombreEvento, 'Evento Test')
  assert.equal(ok.body.prodId, evento._id.toString())
  //Solo informa: no procesa el pago
  assert.equal(await transactionModel.countDocuments(), 0)

  assert.equal((await request(app).get('/payment_status/999999')).status, 404)
  assert.equal((await request(app).get('/payment_status/abc')).status, 400)
})
