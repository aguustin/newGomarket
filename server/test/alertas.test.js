import { test, before, after, beforeEach, mock } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, resetDb } from "./helpers.js"

//Etapa 12: avisos al administrador por mail, una vez por caso
const ADMIN = 'admin-alertas@ipass-test.local'
process.env.ADMIN_MAIL = ADMIN
let app, alertas, reembolsos, transactionModel, orderModel, ticketModel, stock
before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  alertas = await import('../lib/alertas.js')
  reembolsos = await import('../lib/reembolsos.js')
  stock = await import('../lib/stock.js')
  transactionModel = (await import('../models/transactionsModel.js')).default
  orderModel = (await import('../models/orderModel.js')).default
  ticketModel = (await import('../models/ticketsModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

const bandeja = async () => (await request(app).get('/dev/mails.json').query({ to: ADMIN })).body
const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)

test('un aviso se manda una sola vez por caso, aunque se repita', async () => {
  assert.equal(await alertas.alertarAdmin('monto', '111', 'cobro 10 y se esperaban 20'), 'enviada')
  assert.equal(await alertas.alertarAdmin('monto', '111', 'cobro 10 y se esperaban 20'), 'repetida')
  assert.equal(await alertas.alertarAdmin('monto', '222', 'otro pago'), 'enviada')
  const mails = await bandeja()
  assert.equal(mails.length, 2)
  assert.match(mails[0].subject, /\[Ipass\] Monto cobrado distinto/)
})

test('el detalle se escapa (no se puede inyectar HTML en el mail)', async () => {
  await alertas.alertarAdmin('errorVenta', '333', '<script>x</script>')
  const [m] = await bandeja()
  assert.ok(!m.html.includes('<script>'))
})

test('CRITICO: reembolso rechazado por MP (revision) avisa al administrador', async () => {
  await transactionModel.create({ prodId: 'p', paymentId: '8101', transaccionId: '8101', montoPagado: 500, reembolsoEstado: 'pendiente' })
  mock.method(reembolsos.mpReembolsos, 'reembolsar', async () => {
    throw Object.assign(new Error('401'), { response: { status: 401, data: { message: 'Unauthorized use of live credentials' } } })
  })
  try {
    assert.equal(await reembolsos.reembolsarPago('8101'), 'revision')
  } finally { mock.restoreAll() }
  const mails = await bandeja()
  assert.equal(mails.length, 1)
  assert.match(mails[0].subject, /Reembolso para revisar/)
  assert.match(mails[0].html, /8101/)
  assert.match(mails[0].html, /live credentials/)
})

test('CRITICO: sobreventa (pago tardio sin stock) avisa al administrador', async () => {
  const ev = await ticketModel.create({ nombreEvento: 'Lleno', tickets: [{ nombreTicket: 'G', precio: 1, cantidad: 0, estado: 1, fechaDeCierre: enUnMes() }] })
  const ticketId = String(ev.tickets[0]._id)
  const orden = await orderModel.create({ prodId: String(ev._id), quantities: { [ticketId]: { amount: 2, free: false } }, total: 2, estado: 'expirada', expiraEn: new Date() })
  await stock.confirmarOrdenPagada(orden._id, '8201')
  const mails = await bandeja()
  assert.equal(mails.length, 1)
  assert.match(mails[0].subject, /Sobreventa/)
  assert.match(mails[0].html, /8201/)
})

test('sin ADMIN_MAIL el aviso queda registrado y no rompe nada', async () => {
  const antes = process.env.ADMIN_MAIL
  delete process.env.ADMIN_MAIL
  try {
    assert.equal(await alertas.alertarAdmin('sobreventa', '999', 'x'), 'sin-destino')
  } finally { process.env.ADMIN_MAIL = antes }
  const alertModel = (await import('../models/alertModel.js')).default
  assert.equal(await alertModel.countDocuments({ clave: 'sobreventa:999' }), 1)
})
