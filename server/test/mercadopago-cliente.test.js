import { test, mock, afterEach } from "node:test"
import assert from "node:assert/strict"
import axios from "axios"
import mercadopago from "../lib/mercadopago.js"

//Etapa 13: cliente propio de la API de MP (reemplaza al SDK v1). Se simula axios y se revisa
//que cada pedido vaya al endpoint correcto y que las respuestas/errores tengan la forma del SDK.
afterEach(() => mock.restoreAll())

const simular = (fn) => mock.method(axios, 'request', fn)

test('preferences.create: POST /checkout/preferences con token y clave de idempotencia; devuelve { body }', async () => {
  const pedido = simular(async () => ({ status: 201, data: { id: 'pref-1', init_point: 'https://mp/x' } }))
  const res = await mercadopago.preferences.create({ items: [{ title: 'Entrada', unit_price: 100, quantity: 1 }] })
  assert.deepEqual(res, { body: { id: 'pref-1', init_point: 'https://mp/x' }, status: 201 })
  const cfg = pedido.mock.calls[0].arguments[0]
  assert.equal(cfg.method, 'post')
  assert.equal(cfg.baseURL + cfg.url, 'https://api.mercadopago.com/checkout/preferences')
  assert.equal(cfg.data.items[0].title, 'Entrada')
  assert.match(cfg.headers.Authorization, /^Bearer /)
  assert.ok(cfg.headers['X-Idempotency-Key'])
})

test('payment.findById y payment.search: GET a los endpoints de pagos', async () => {
  const pedido = simular(async (cfg) => ({ status: 200, data: cfg.url.endsWith('/search') ? { results: [{ id: 1 }] } : { id: 5001, status: 'approved' } }))
  assert.deepEqual((await mercadopago.payment.findById('5001')).body, { id: 5001, status: 'approved' })
  assert.equal(pedido.mock.calls[0].arguments[0].url, '/v1/payments/5001')

  const busqueda = await mercadopago.payment.search({ qs: { status: 'approved', limit: 100 } })
  assert.deepEqual(busqueda.body.results, [{ id: 1 }])
  assert.deepEqual(pedido.mock.calls[1].arguments[0].params, { status: 'approved', limit: 100 })
})

test('errores: 404 de MP llega con status 404; sin respuesta (caida/timeout) llega con status 0', async () => {
  simular(async () => { const e = new Error('Request failed'); e.response = { status: 404, data: { message: 'Payment not found' } }; throw e })
  await assert.rejects(mercadopago.payment.findById('999'), (e) => e.status === 404 && e.message === 'Payment not found')

  mock.restoreAll()
  simular(async () => { const e = new Error('timeout of 30000ms exceeded'); e.code = 'ECONNABORTED'; throw e })
  await assert.rejects(mercadopago.preferences.create({}), (e) => e.status === 0 && e.cause === 'ECONNABORTED')
})
